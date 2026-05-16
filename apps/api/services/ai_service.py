import json
from typing import Optional
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings
from models.report import AIFindingsResponse, AITestCasesResponse, BugReport
import structlog

logger = structlog.get_logger()

_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


VISION_MODEL = "gemini-2.0-flash"
TEXT_MODEL = "gemini-2.0-flash"


def _parse_json(text: str) -> dict:
    """Extract JSON from model output — handles markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])
    return json.loads(text)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_ui_bugs(
    screenshot_b64: str,
    url: str,
    page_title: str,
    dom_context: dict,
    roast_mode: bool = False,
) -> AIFindingsResponse:
    """Use Gemini Vision to find UI/UX issues in a screenshot."""
    client = get_client()

    roast_instruction = ""
    if roast_mode:
        roast_instruction = (
            'For each finding, also add a "roast_comment" field with a sarcastic but '
            "constructive one-liner about the issue. Keep it workplace-appropriate."
        )

    prompt = f"""You are a senior QA engineer analyzing a website screenshot.

URL: {url}
Page title: {page_title}
DOM context: {json.dumps(dom_context, ensure_ascii=False)}

Analyze the screenshot and identify UI/UX issues. Focus on:
- Layout and visual hierarchy problems
- Typography issues (readability, contrast, sizing)
- Color and accessibility problems (WCAG violations)
- Usability friction points
- Missing or broken elements
{roast_instruction}

Return ONLY valid JSON matching this exact schema (no markdown fences):
{{
  "findings": [
    {{
      "id": "finding-1",
      "category": "layout|typography|color|accessibility|usability|content",
      "title": "short issue title under 60 chars",
      "description": "clear explanation of what is wrong and why it matters",
      "severity": "critical|high|medium|low|info",
      "element_hint": "where on the page",
      "recommendation": "specific actionable fix",
      "roast_comment": null
    }}
  ],
  "overall_score": 75,
  "summary": "one paragraph executive summary"
}}

Minimum 3 findings, maximum 15. Be specific and actionable."""

    import base64
    image_bytes = base64.b64decode(screenshot_b64)

    response = await client.aio.models.generate_content(
        model=VISION_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
    )
    data = _parse_json(response.text)
    return AIFindingsResponse(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_test_cases(
    url: str,
    page_context: dict,
    requirements: Optional[str],
    findings_summary: str,
) -> AITestCasesResponse:
    """Generate structured QA test cases from page context and findings."""
    client = get_client()

    prompt = f"""You are a QA engineer generating manual test cases.

Target URL: {url}
Page context: {json.dumps(page_context, ensure_ascii=False)}
Requirements: {requirements or "No specific requirements provided. Infer from the page."}
UI Issues found: {findings_summary}

Generate comprehensive test cases covering happy path, negative, UI, and accessibility.

Return ONLY valid JSON (no markdown fences):
{{
  "test_cases": [
    {{
      "id": "uuid-string",
      "case_id": "TC-001",
      "title": "descriptive test case title",
      "category": "functional|ui|negative|accessibility|security|usability",
      "priority": "high|medium|low",
      "preconditions": ["User is on the login page"],
      "steps": [
        {{"step": 1, "action": "Enter valid email", "expected": "Email accepted without error"}}
      ],
      "expected_result": "Final expected outcome",
      "test_data": null
    }}
  ]
}}

Generate 8-15 test cases."""

    response = await client.aio.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
    )
    data = _parse_json(response.text)
    return AITestCasesResponse(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_bug_report(finding: dict, url: str, screenshot_b64: str) -> BugReport:
    """Convert a finding into a formal bug report."""
    client = get_client()

    import base64
    image_bytes = base64.b64decode(screenshot_b64)

    prompt = f"""You are a QA engineer writing a formal bug report.

URL: {url}
Issue: {json.dumps(finding, ensure_ascii=False)}

Return ONLY valid JSON (no markdown fences):
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

    response = await client.aio.models.generate_content(
        model=VISION_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
    )
    data = _parse_json(response.text)
    return BugReport(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_playwright_script(
    url: str, test_cases: list[dict], dom_context: dict
) -> str:
    """Generate a runnable Playwright TypeScript test script."""
    client = get_client()

    selected_cases = test_cases[:5]

    prompt = f"""You are a test automation engineer. Generate a complete Playwright TypeScript test file.

Target URL: {url}
DOM hints: {json.dumps(dom_context, ensure_ascii=False)}
Test cases:
{json.dumps(selected_cases, indent=2, ensure_ascii=False)}

Requirements:
- Use @playwright/test
- Use getByRole, getByLabel, getByText selectors where possible
- Add meaningful assertions
- Include beforeEach with page.goto
- Use test.describe block

Return ONLY the TypeScript code. No markdown fences, no explanation."""

    response = await client.aio.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
    )
    return response.text.strip()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def evaluate_interview_answer(question: str, answer: str, level: str) -> dict:
    """Evaluate a QA interview answer and return structured feedback."""
    client = get_client()

    prompt = f"""You are a senior QA interviewer evaluating a candidate.

Candidate level: {level}
Question: {question}
Answer: {answer}

Return ONLY valid JSON (no markdown fences):
{{
  "score": 7,
  "strengths": ["what was good"],
  "improvements": ["what was missing"],
  "ideal_answer_hints": ["key concepts to mention"],
  "follow_up_question": "natural follow-up question"
}}

Score 0-10. Be honest but constructive."""

    response = await client.aio.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
    )
    return _parse_json(response.text)
