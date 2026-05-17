"""AI analysis for test case quality, coverage gaps, and missing scenarios."""
import json
from groq import AsyncGroq
from config import settings
import structlog

logger = structlog.get_logger()

_groq = None


def get_groq() -> AsyncGroq:
    global _groq
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.groq_api_key)
    return _groq


def _cases_summary(cases: list[dict]) -> str:
    """Summarize test cases for the prompt — avoid token overflow."""
    lines = []
    for c in cases[:40]:  # cap at 40 cases
        lines.append(
            f"- [{c.get('tc_id','')}] {c.get('description','')} "
            f"| type={c.get('test_type','')} priority={c.get('priority','')} "
            f"status={c.get('status','')} expected={str(c.get('expected_result',''))[:80]}"
        )
    return "\n".join(lines)


async def analyze_test_cases(cases: list[dict], module: str, feature: str) -> dict:
    """Analyze a test suite for quality issues, gaps, and automation candidates."""
    client = get_groq()
    summary = _cases_summary(cases)

    prompt = f"""You are a senior QA engineer reviewing a test suite.

Module: {module or "Unknown"}
Feature: {feature or "Unknown"}
Total cases: {len(cases)}

Test cases:
{summary}

Analyze this test suite and return ONLY valid JSON (no markdown fences):
{{
  "overall_quality_score": 72,
  "weak_cases": [
    {{
      "tc_id": "TC-001",
      "reason": "Expected result is too vague — says 'works correctly' without specific criteria"
    }}
  ],
  "duplicates": [
    {{
      "tc_ids": ["TC-005", "TC-012"],
      "reason": "Both test the same login with valid credentials scenario"
    }}
  ],
  "missing_scenarios": [
    "No negative test for SQL injection in login form",
    "Missing accessibility test for keyboard navigation",
    "No boundary value test for password maximum length"
  ],
  "coverage_gaps": [
    "API testing not covered",
    "Mobile viewport not tested",
    "Error handling for network timeout missing"
  ],
  "automation_candidates": [
    {{
      "tc_id": "TC-002",
      "reason": "Repetitive smoke test — ideal for Playwright automation",
      "framework": "Playwright"
    }}
  ],
  "risk_assessment": {{
    "high_risk_areas": ["Payment flow has only 2 test cases — insufficient coverage"],
    "overall_risk": "Medium"
  }},
  "recommendations": [
    "Add at least 3 negative test cases for the login form",
    "Improve expected results to be specific and measurable",
    "Consider automating the 4 smoke test cases"
  ]
}}

Be specific. Reference actual TC_IDs where possible."""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2048,
    )

    text = response.choices[0].message.content.strip()
    # Extract JSON
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]
    return json.loads(text)


async def generate_missing_cases(cases: list[dict], module: str, feature: str, requirements: str = "") -> list[dict]:
    """Generate additional test cases to fill identified gaps."""
    client = get_groq()
    summary = _cases_summary(cases)

    existing_types = list({c.get("test_type", "Functional") for c in cases})

    prompt = f"""You are a senior QA engineer generating additional test cases.

Module: {module or "Unknown"}
Feature: {feature or "Unknown"}
Requirements: {requirements or "Not provided"}
Existing test types covered: {", ".join(existing_types)}

Existing cases (for context, avoid duplicates):
{summary}

Generate 5-8 NEW test cases that fill coverage gaps. Focus on:
- Negative / error cases
- Boundary value cases
- Accessibility cases
- Edge cases not currently covered

Return ONLY valid JSON (no markdown fences):
{{
  "new_test_cases": [
    {{
      "tc_id": "TC-AI-001",
      "test_type": "Negative",
      "priority": "High",
      "severity": "Major",
      "precondition": "User is on the login page",
      "description": "Verify login fails with SQL injection in email field",
      "steps": "1. Enter: ' OR 1=1-- in email field\\n2. Enter any password\\n3. Click Login",
      "test_data": "Email: ' OR 1=1--  Password: anything",
      "expected_result": "Login is rejected. No database error exposed to user.",
      "automation_status": "Candidate for Automation",
      "tags": ["security", "negative", "ai-generated"]
    }}
  ]
}}"""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=3000,
    )

    text = response.choices[0].message.content.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]
    data = json.loads(text)
    return data.get("new_test_cases", [])
