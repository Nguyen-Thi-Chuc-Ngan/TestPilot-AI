#!/usr/bin/env python3
"""
Simple local test harness for the Claude skill files.
- Loads `.claude/rtk_claude_skill_v2.md` as system instruction.
- Loads a sample input from `tests/fixtures/sample_input_bug_report.json`.
- Builds the payload that would be sent to Claude.
- Prints the payload and a mocked response that matches `tests/fixtures/expected_output_bug_report.json`.

Run locally: python scripts/claude_skill_test.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL_PATH = ROOT / '.claude' / 'rtk_claude_skill_v2.md'
INPUT_FIXTURE = ROOT / 'tests' / 'fixtures' / 'sample_input_bug_report.json'
EXPECTED = ROOT / 'tests' / 'fixtures' / 'expected_output_bug_report.json'


def load_file(p: Path) -> str:
    return p.read_text(encoding='utf-8')


def build_payload(system: str, user_prompt: str):
    # Example payload structure for a Claude-like chat API
    payload = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 500,
        "temperature": 0.0
    }
    return payload


def mock_claude_response():
    # Return expected output as if Claude followed the skill
    return json.loads(load_file(EXPECTED))


if __name__ == '__main__':
    system = load_file(SKILL_PATH)
    fixture = json.loads(load_file(INPUT_FIXTURE))
    user_prompt = fixture['user_prompt'] + '\nArtifacts: ' + ','.join(fixture.get('evidence_refs', []))

    payload = build_payload(system, user_prompt)
    print('\n--- Prepared payload to send to Claude (print only) ---\n')
    print(json.dumps(payload, indent=2)[:4000])

    print('\n--- Mocked Claude response (parsed) ---\n')
    response = mock_claude_response()
    print(json.dumps(response, indent=2))

    print('\n--- Quick validation: schema type check ---\n')
    if response.get('type') == 'bug_report':
        print('OK: Received bug_report structure')
    else:
        print('ERROR: Unexpected type', response.get('type'))
