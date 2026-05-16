import json
from typing import Optional
from groq import AsyncGroq
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings
from models.report import AIFindingsResponse, AITestCasesResponse, BugReport
import structlog

logger = structlog.get_logger()

_groq: Optional[AsyncGroq] = None
_gemini: Optional[genai.Client] = None

# Gemini for vision (screenshot analysis), Groq for text (cheap + fast)
GEMINI_VISION_MODEL = "gemini-2.0-flash"
GROQ_TEXT_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # fallback vision


def get_groq() -> AsyncGroq:
    global _groq
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.groq_api_key)
    return _groq


def get_gemini() -> genai.Client:
    global _gemini
    if _gemini is None:
        _gemini = genai.Client(api_key=settings.gemini_api_key)
    return _gemini


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]
    return json.loads(text)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_ui_bugs(
    screenshot_b64: str,
    url: str,
    page_title: str,
    dom_context: dict,
    roast_mode: bool = False,
) -> AIFindingsResponse:
    """Vision analysis — tries Gemini first, falls back to Groq Llama 4."""
    roast_instruction = ""
    if roast_mode:
        roast_instruction = (
            'For each finding, add a "roast_comment": a sarcastic but constructive one-liner.'
        )

    prompt = f"""You are a senior QA engineer analyzing a website screenshot.

URL: {url}
Page title: {page_title}
DOM context: {json.dumps(dom_context, ensure_ascii=False)}

Analyze the screenshot and identify UI/UX issues. Focus on:
- Layout and visual hierarchy problems
- Typography issues (readability, contrast)
- Accessibility problems (WCAG violations)
- Usability friction points
- Missing or broken elements
{roast_instruction}

Return ONLY valid JSON, no markdown fences:
{{
  "findings": [
    {{
      "id": "finding-1",
      "category": "layout|typography|color|accessibility|usability|content",
      "title": "short issue title under 60 chars",
      "description": "clear explanation of the issue",
      "severity": "critical|high|medium|low|info",
      "element_hint": "where on page",
      "recommendation": "specific actionable fix",
      "roast_comment": null
    }}
  ],
  "overall_score": 75,
  "summary": "one paragraph executive summary"
}}

Minimum 3 findings, maximum 12."""

    # Use Groq Llama 4 Scout for vision (Gemini quota exhausted)
    groq = get_groq()
    response = await groq.chat.completions.create(
        model=GROQ_VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{screenshot_b64}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    data = _parse_json(response.choices[0].message.content)
    logger.info("vision_groq_ok", url=url)
    return AIFindingsResponse(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_test_cases(
    url: str,
    page_context: dict,
    requirements: Optional[str],
    findings_summary: str,
) -> AITestCasesResponse:
    """Generate structured QA test cases — uses Groq (fast + free)."""
    groq = get_groq()

    prompt = f"""You are a QA engineer generating manual test cases.

Target URL: {url}
Page context: {json.dumps(page_context, ensure_ascii=False)}
Requirements: {requirements or "No specific requirements. Infer from the page."}
UI Issues found: {findings_summary}

Generate test cases covering happy path, negative, UI, and accessibility.

Return ONLY valid JSON, no markdown fences:
{{
  "test_cases": [
    {{
      "id": "tc-001",
      "case_id": "TC-001",
      "title": "descriptive test case title",
      "category": "functional|ui|negative|accessibility|security|usability",
      "priority": "high|medium|low",
      "preconditions": ["User is on the page"],
      "steps": [
        {{"step": 1, "action": "Enter valid email", "expected": "Email accepted"}}
      ],
      "expected_result": "Final expected outcome",
      "test_data": null
    }}
  ]
}}

Generate 8-12 test cases."""

    response = await groq.chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=4096,
    )
    data = _parse_json(response.choices[0].message.content)
    return AITestCasesResponse(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_bug_report(finding: dict, url: str, screenshot_b64: str) -> BugReport:
    """Convert a finding into a formal bug report — uses Groq."""
    groq = get_groq()

    prompt = f"""You are a QA engineer writing a formal bug report.

URL: {url}
Issue: {json.dumps(finding, ensure_ascii=False)}

Return ONLY valid JSON, no markdown fences:
{{
  "title": "concise bug title under 80 chars",
  "environment": "Browser: Chrome/Firefox/Safari, OS: Windows/Mac/Linux",
  "severity": "critical|high|medium|low",
  "priority": "P1|P2|P3|P4",
  "steps_to_reproduce": ["Navigate to {url}", "Observe the issue"],
  "expected_result": "What should happen",
  "actual_result": "What actually happens",
  "impact": "How this affects users",
  "suggested_fix": null
}}"""

    response = await groq.chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1024,
    )
    data = _parse_json(response.choices[0].message.content)
    return BugReport(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_playwright_script(
    url: str, test_cases: list[dict], dom_context: dict
) -> str:
    """Generate Playwright TypeScript script — uses Groq."""
    groq = get_groq()

    prompt = f"""You are a test automation engineer. Generate a complete Playwright TypeScript test file.

Target URL: {url}
DOM hints: {json.dumps(dom_context, ensure_ascii=False)}
Test cases:
{json.dumps(test_cases[:5], indent=2, ensure_ascii=False)}

Requirements:
- Use @playwright/test
- Use getByRole, getByLabel, getByText selectors
- Add meaningful assertions
- Include beforeEach with page.goto
- Use test.describe block

Return ONLY the TypeScript code, no markdown fences."""

    response = await groq.chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def evaluate_interview_answer(question: str, answer: str, level: str) -> dict:
    """Evaluate a QA interview answer — uses Groq."""
    groq = get_groq()

    prompt = f"""You are a senior QA interviewer evaluating a candidate.

Candidate level: {level}
Question: {question}
Answer: {answer}

Return ONLY valid JSON, no markdown fences:
{{
  "score": 7,
  "strengths": ["what was good"],
  "improvements": ["what was missing"],
  "ideal_answer_hints": ["key concepts to mention"],
  "follow_up_question": "natural follow-up question"
}}

Score 0-10. Be honest but constructive."""

    response = await groq.chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1024,
    )
    return _parse_json(response.choices[0].message.content)
