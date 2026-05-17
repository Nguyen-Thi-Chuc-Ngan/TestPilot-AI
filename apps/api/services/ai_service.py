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
    """Robustly extract JSON from model output."""
    text = text.strip()
    # Strip markdown fences
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]).strip()
    # Extract first complete JSON object
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in response")
    # Find matching closing brace
    depth = 0
    end = -1
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        raise ValueError("Incomplete JSON object in response")
    return json.loads(text[start:end])


def _sanitize_finding(f: dict) -> dict:
    """Ensure finding has all required fields with valid values."""
    valid_severities = {"critical", "high", "medium", "low", "info"}
    valid_categories = {"layout", "typography", "color", "accessibility", "usability", "content"}
    return {
        "id": str(f.get("id", f"finding-{id(f)}")),
        "category": f.get("category", "usability") if f.get("category") in valid_categories else "usability",
        "title": str(f.get("title", "Untitled issue"))[:200],
        "description": str(f.get("description", "")),
        "severity": f.get("severity", "medium") if f.get("severity") in valid_severities else "medium",
        "element_hint": f.get("element_hint") or f.get("location") or None,
        "recommendation": f.get("recommendation") or f.get("fix") or None,
        "roast_comment": f.get("roast_comment") or None,
    }


def _sanitize_test_case(tc: dict, idx: int) -> dict:
    """Ensure test case has all required fields."""
    import uuid
    steps_raw = tc.get("steps", [])
    steps = []
    for i, s in enumerate(steps_raw):
        if isinstance(s, dict):
            steps.append({"step": s.get("step", i+1), "action": str(s.get("action", "")), "expected": str(s.get("expected", ""))})
        elif isinstance(s, str):
            steps.append({"step": i+1, "action": s, "expected": ""})
    return {
        "id": str(tc.get("id", str(uuid.uuid4()))),
        "case_id": str(tc.get("case_id", f"TC-{idx+1:03d}")),
        "title": str(tc.get("title", f"Test case {idx+1}"))[:200],
        "category": tc.get("category", "functional"),
        "priority": tc.get("priority", "medium") if tc.get("priority") in {"high","medium","low"} else "medium",
        "preconditions": [str(p) for p in tc.get("preconditions", [])],
        "steps": steps,
        "expected_result": str(tc.get("expected_result", "")),
        "test_data": json.dumps(tc["test_data"]) if isinstance(tc.get("test_data"), (dict, list)) else (tc.get("test_data") or None),
    }


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
    # Sanitize findings to avoid ValidationError from malformed AI output
    raw_findings = data.get("findings", [])
    sanitized = [_sanitize_finding(f) for f in raw_findings if isinstance(f, dict)]
    return AIFindingsResponse(
        findings=sanitized,  # type: ignore[arg-type]
        overall_score=int(data.get("overall_score", 50)),
        summary=str(data.get("summary", "")),
    )


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
    raw_tcs = data.get("test_cases", [])
    sanitized_tcs = [_sanitize_test_case(tc, i) for i, tc in enumerate(raw_tcs) if isinstance(tc, dict)]
    return AITestCasesResponse(test_cases=sanitized_tcs)  # type: ignore[arg-type]


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
