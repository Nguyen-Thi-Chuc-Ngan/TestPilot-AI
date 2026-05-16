from datetime import datetime


def generate_markdown_report(job: dict, findings: list, test_cases: list, bug_reports: list) -> str:
    """Generate a Markdown-formatted QA report."""
    lines = [
        f"# QA Report — {job.get('url', '')}",
        f"",
        f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  ",
        f"**Mode:** {job.get('mode', 'full')}  ",
        f"**Status:** {job.get('status', '')}",
        f"",
        f"---",
        f"",
    ]

    # Findings section
    lines += ["## UI/UX Findings", ""]
    if findings:
        for f in findings:
            sev = f.get("severity", "info").upper()
            lines += [
                f"### [{sev}] {f.get('title', '')}",
                f"",
                f"**Category:** {f.get('category', '')}  ",
                f"**Location:** {f.get('element_hint', 'N/A')}",
                f"",
                f.get("description", ""),
                f"",
                f"> **Recommendation:** {f.get('recommendation', 'N/A')}",
                f"",
            ]
    else:
        lines += ["_No findings._", ""]

    # Test cases
    lines += ["---", "", "## Test Cases", ""]
    if test_cases:
        for tc in test_cases:
            lines += [
                f"### {tc.get('case_id', '')} — {tc.get('title', '')}",
                f"",
                f"**Priority:** {tc.get('priority', '')} | **Category:** {tc.get('category', '')}",
                f"",
            ]
            preconditions = tc.get("preconditions", [])
            if preconditions:
                lines += ["**Preconditions:**"]
                for p in preconditions:
                    lines += [f"- {p}"]
                lines += [""]

            steps = tc.get("steps", [])
            if steps:
                lines += ["**Steps:**"]
                for s in steps:
                    lines += [f"{s.get('step', '')}. **Action:** {s.get('action', '')} → **Expected:** {s.get('expected', '')}"]
                lines += [""]

            lines += [
                f"**Expected Result:** {tc.get('expected_result', '')}",
                f"",
            ]
    else:
        lines += ["_No test cases._", ""]

    # Bug reports
    lines += ["---", "", "## Bug Reports", ""]
    if bug_reports:
        for br in bug_reports:
            lines += [
                f"### {br.get('title', '')}",
                f"",
                f"**Severity:** {br.get('severity', '')} | **Priority:** {br.get('priority', '')}",
                f"",
                f"**Steps to Reproduce:**",
            ]
            for step in br.get("steps_to_reproduce", []):
                lines += [f"1. {step}"]
            lines += [
                f"",
                f"**Expected:** {br.get('expected_result', '')}  ",
                f"**Actual:** {br.get('actual_result', '')}",
                f"",
                f"**Impact:** {br.get('impact', '')}",
                f"",
            ]
    else:
        lines += ["_No bug reports._", ""]

    return "\n".join(lines)


def generate_html_report(job: dict, findings: list, test_cases: list, bug_reports: list) -> str:
    """Generate an HTML-formatted QA report with basic styling."""
    md_content = generate_markdown_report(job, findings, test_cases, bug_reports)

    severity_colors = {
        "CRITICAL": "#dc2626",
        "HIGH": "#ea580c",
        "MEDIUM": "#d97706",
        "LOW": "#2563eb",
        "INFO": "#6b7280",
    }

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Report — {job.get('url', '')}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; color: #111; }}
  h1 {{ font-size: 1.75rem; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; }}
  h2 {{ font-size: 1.25rem; margin-top: 2rem; color: #4338ca; }}
  h3 {{ font-size: 1rem; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }}
  .critical {{ background: #fee2e2; color: #dc2626; }}
  .high {{ background: #ffedd5; color: #ea580c; }}
  .medium {{ background: #fef9c3; color: #d97706; }}
  .low {{ background: #dbeafe; color: #2563eb; }}
  .info {{ background: #f3f4f6; color: #6b7280; }}
  .finding {{ border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 0.75rem 0; }}
  .recommendation {{ background: #f0f9ff; border-left: 3px solid #6366f1; padding: 0.5rem 0.75rem; margin-top: 0.5rem; font-size: 0.875rem; }}
  table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; }}
  th, td {{ text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; }}
  th {{ background: #f9fafb; font-weight: 600; }}
  footer {{ margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #6b7280; }}
</style>
</head>
<body>
<h1>QA Report</h1>
<p><strong>URL:</strong> <a href="{job.get('url', '')}">{job.get('url', '')}</a></p>
<p><strong>Generated:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
<p><strong>Mode:</strong> {job.get('mode', 'full')}</p>

<h2>Findings ({len(findings)})</h2>
{''.join(f"""
<div class="finding">
  <span class="badge {f.get('severity','info')}">{f.get('severity','info').upper()}</span>
  <strong style="margin-left:8px">{f.get('title','')}</strong>
  <p>{f.get('description','')}</p>
  {'<div class="recommendation"><strong>Fix:</strong> ' + f.get('recommendation','') + '</div>' if f.get('recommendation') else ''}
</div>""" for f in findings)}

<h2>Test Cases ({len(test_cases)})</h2>
<table>
<thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Category</th></tr></thead>
<tbody>
{''.join(f"<tr><td>{tc.get('case_id','')}</td><td>{tc.get('title','')}</td><td>{tc.get('priority','')}</td><td>{tc.get('category','')}</td></tr>" for tc in test_cases)}
</tbody>
</table>

<h2>Bug Reports ({len(bug_reports)})</h2>
{''.join(f"""
<div class="finding">
  <span class="badge {br.get('severity','low')}">{br.get('severity','low').upper()}</span>
  <span class="badge" style="background:#f3f4f6;color:#374151;margin-left:4px">{br.get('priority','P3')}</span>
  <strong style="margin-left:8px">{br.get('title','')}</strong>
  <p><em>Impact:</em> {br.get('impact','')}</p>
</div>""" for br in bug_reports)}

<footer>Generated by TestPilot AI — <a href="https://github.com/testpilot-ai">github.com/testpilot-ai</a></footer>
</body>
</html>"""
