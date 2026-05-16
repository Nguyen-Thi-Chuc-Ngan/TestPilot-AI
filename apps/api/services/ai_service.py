import json
import base64
from typing import Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings
from models.report import AIFindingsResponse, AITestCasesResponse, BugReport
import structlog

logger = structlog.get_logger()

genai.configure(api_key=settings.gemini_api_key)

# Models
VISION_MODEL = "gemini-1.5-pro"
TEXT_MODEL = "gemini-1.5-flash"  # cheaper for text-only tasks


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
    model = genai.GenerativeModel(VISION_MODEL)

    roast_instruction = ""
    if roast_mode:
        roast_instruction = """
For each finding, also add a "roast_comment" field with a sarcastic but
constructive one-liner about the issue. Keep it workplace-appropriate.
"""

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
- Mobile responsiveness hints
{roast_instruction}

Return ONLY valid JSON matching this exact schema:
{{
  "findings": [
    {{
      "id": "finding-1",
      "category": "layout|typography|color|accessibility|usability|content",
      "title": "short issue title under 60 chars",
      "description": "clear explanation of what is wrong and why it matters to users",
      "severity": "critical|high|medium|low|info",
      "element_hint": "describe where on page (e.g. 'top navigation', 'hero section')",
      "recommendation": "specific actionable fix",
      "roast_comment": "optional sarcastic one-liner only if roast_mode"
    }}
  ],
  "overall_score": 75,
  "summary": "one paragraph executive summary of UI quality"
}}

Minimum 3 findings, maximum 15. Be specific and actionable."""

    image_part = {
        "mime_type": "image/jpeg",
        "data": screenshot_b64,
    }

    response = await model.generate_content_async([prompt, image_part])
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
    model = genai.GenerativeModel(TEXT_MODEL)

    prompt = f"""You are a QA engineer generating manual test cases.

Target URL: {url}
Page context: {json.dumps(page_context, ensure_ascii=False)}
Requirements: {requirements or "No specific requirements provided. Infer from the page."}
UI Issues found: {findings_summary}

Generate comprehensive test cases covering:
- Happy path / positive flows
- Negative test cases (invalid input, edge cases)
- UI/visual verification
- Accessibility checks
- Cross-browser hints

Return ONLY valid JSON:
{{
  "test_cases": [
    {{
      "id": "uuid-string",
      "case_id": "TC-001",
      "title": "descriptive test case title",
      "category": "functional|ui|negative|accessibility|security|usability",
      "priority": "high|medium|low",
      "preconditions": ["User is on the login page", "Browser is Chrome latest"],
      "steps": [
        {{"step": 1, "action": "Enter valid email in email field", "expected": "Email is accepted without error"}}
      ],
      "expected_result": "Final expected outcome of the test",
      "test_data": "optional test data e.g. email: test@example.com"
    }}
  ]
}}

Generate 8-15 test cases. Each step must have both action and expected result."""

    response = await model.generate_content_async(prompt)
    data = _parse_json(response.text)
    return AITestCasesResponse(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_bug_report(finding: dict, url: str, screenshot_b64: str) -> BugReport:
    """Convert a finding into a formal bug report."""
    model = genai.GenerativeModel(VISION_MODEL)

    prompt = f"""You are a QA engineer writing a formal bug report for the development team.

URL: {url}
Issue: {json.dumps(finding, ensure_ascii=False)}

Write a professional bug report. Return ONLY valid JSON:
{{
  "title": "concise bug title under 80 chars",
  "environment": "Browser: Chrome/Firefox/Safari, OS: Windows/Mac/Linux",
  "severity": "critical|high|medium|low",
  "priority": "P1|P2|P3|P4",
  "steps_to_reproduce": [
    "1. Navigate to {url}",
    "2. Look at [specific element]",
    "3. Observe [the problem]"
  ],
  "expected_result": "What should happen according to design/requirements",
  "actual_result": "What actually happens (the bug)",
  "impact": "How this affects users or business",
  "suggested_fix": "Optional technical suggestion for developers"
}}"""

    image_part = {"mime_type": "image/jpeg", "data": screenshot_b64}
    response = await model.generate_content_async([prompt, image_part])
    data = _parse_json(response.text)
    return BugReport(**data)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_playwright_script(
    url: str, test_cases: list[dict], dom_context: dict
) -> str:
    """Generate a runnable Playwright TypeScript test script."""
    model = genai.GenerativeModel(TEXT_MODEL)

    # Only pass top 5 test cases to avoid token limits
    selected_cases = test_cases[:5]

    prompt = f"""You are a test automation engineer. Generate a complete Playwright TypeScript test file.

Target URL: {url}
DOM hints: {json.dumps(dom_context, ensure_ascii=False)}
Test cases to automate:
{json.dumps(selected_cases, indent=2, ensure_ascii=False)}

Requirements:
- Use @playwright/test
- Use modern selector strategies (getByRole, getByLabel, getByText preferred over CSS selectors)
- Add meaningful assertions
- Include beforeEach with page.goto
- Use test.describe block
- Add brief comments only for non-obvious steps
- Handle async/await correctly

Return ONLY the TypeScript code. No markdown fences, no explanation."""

    response = await model.generate_content_async(prompt)
    return response.text.strip()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
async def evaluate_interview_answer(
    question: str, answer: str, level: str
) -> dict:
    """Evaluate a QA interview answer and return structured feedback."""
    model = genai.GenerativeModel(TEXT_MODEL)

    prompt = f"""You are a senior QA interviewer at a top tech company evaluating a candidate.

Candidate level: {level} (junior|mid|senior)
Question: {question}
Candidate's answer: {answer}

Evaluate the answer based on: accuracy, completeness, practical experience, communication clarity.
Adjust expectations to the stated level.

Return ONLY valid JSON:
{{
  "score": 7,
  "strengths": ["what the candidate got right"],
  "improvements": ["what was missing or incorrect"],
  "ideal_answer_hints": ["key concepts that a {level} should mention"],
  "follow_up_question": "a natural follow-up an interviewer would ask"
}}

Score from 0-10. Be honest but constructive."""

    response = await model.generate_content_async(prompt)
    return _parse_json(response.text)
