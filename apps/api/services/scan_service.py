import asyncio
import uuid
from datetime import datetime
from typing import Optional, AsyncIterator
from supabase import create_client, Client
from config import settings
from services.playwright_service import scan_url, screenshot_to_base64
from services.ai_service import (
    analyze_ui_bugs,
    generate_test_cases,
    generate_bug_report,
    generate_playwright_script,
)
from services.storage_service import upload_screenshot, upload_script
import structlog

logger = structlog.get_logger()

_supabase: Optional[Client] = None


def _friendly_error(e: Exception) -> str:
    """Convert raw exceptions into human-readable messages."""
    msg = str(e).lower()

    if "429" in msg or "resource_exhausted" in msg or "quota" in msg:
        return "AI quota exceeded. The AI service is temporarily rate-limited. Please try again in a few minutes."

    if "retryerror" in msg or "clienterror" in msg:
        return "AI service is unavailable right now. Please wait a moment and try again."

    if "timeout" in msg or "timed out" in msg:
        return "The website took too long to load (>30s). Try a faster or simpler URL."

    if "net::err" in msg or "connection refused" in msg or "name or service not known" in msg:
        return "Could not reach the website. Make sure the URL is publicly accessible."

    if "ssrf" in msg or "not allowed" in msg or "private ip" in msg or "localhost" in msg:
        return "This URL is not allowed to be scanned (localhost or private network)."

    if "invalid input syntax for type uuid" in msg:
        return "Internal data error: AI returned invalid ID format. Please try again."

    if "supabase" in msg or "postgrest" in msg or "pgrst" in msg:
        return "Database error while saving results. Please try again."

    if "playwright" in msg or "browser" in msg or "chromium" in msg:
        return "Browser automation failed. The page may be blocking automated access."

    if "json" in msg or "parse" in msg or "decode" in msg:
        return "AI returned an unexpected response format. Please try again."

    # Fallback — truncate long technical errors
    raw = str(e)
    if len(raw) > 120:
        raw = raw[:120] + "..."
    return f"Scan failed: {raw}"


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase

# SSE progress channels: job_id -> asyncio.Queue
_progress_queues: dict[str, asyncio.Queue] = {}


def _get_queue(job_id: str) -> asyncio.Queue:
    if job_id not in _progress_queues:
        _progress_queues[job_id] = asyncio.Queue()
    return _progress_queues[job_id]


async def stream_progress(job_id: str) -> AsyncIterator[str]:
    """Yield SSE events for job progress."""
    queue = _get_queue(job_id)
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=30)
            yield f"data: {event}\n\n"
            if '"status": "completed"' in event or '"status": "failed"' in event:
                break
        except asyncio.TimeoutError:
            yield "data: {\"ping\": true}\n\n"


async def _emit(job_id: str, step: int, **kwargs) -> None:
    import json
    queue = _get_queue(job_id)
    payload = json.dumps({"step": step, **kwargs})
    await queue.put(payload)


async def create_scan_job(
    user_id: str,
    url: str,
    requirements: Optional[str],
    mode: str,
    roast_mode: bool,
) -> str:
    job_id = str(uuid.uuid4())
    get_supabase().table("scan_jobs").insert({
        "id": job_id,
        "user_id": user_id,
        "url": url,
        "requirements": requirements,
        "mode": mode,
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return job_id


async def run_scan_job(
    job_id: str,
    url: str,
    requirements: Optional[str],
    mode: str,
    roast_mode: bool,
) -> None:
    """Full scan pipeline â€” runs in background."""
    import json

    async def update_status(status: str, **kwargs):
        get_supabase().table("scan_jobs").update({"status": status, **kwargs}).eq("id", job_id).execute()

    try:
        await update_status("running", started_at=datetime.utcnow().isoformat())
        await _emit(job_id, 0)

        # Step 1: Playwright scan
        await _emit(job_id, 1)
        scan_result = await scan_url(url)

        if scan_result.error:
            await update_status("failed", error_msg=scan_result.error)
            await _emit(job_id, -1, status="failed", error=scan_result.error)
            return

        # Step 2: Upload screenshots
        await _emit(job_id, 2)
        viewport_b64 = screenshot_to_base64(scan_result.screenshot_viewport)
        full_url = await upload_screenshot(job_id, scan_result.screenshot_full, "full")
        viewport_url = await upload_screenshot(job_id, scan_result.screenshot_viewport, "viewport")

        # Save screenshot artifacts
        for art_type, art_url in [("full_page", full_url), ("screenshot", viewport_url)]:
            get_supabase().table("artifacts").insert({
                "id": str(uuid.uuid4()),
                "job_id": job_id,
                "type": art_type,
                "public_url": art_url,
                "created_at": datetime.utcnow().isoformat(),
            }).execute()

        # Step 3: AI UI Bug Hunter
        await _emit(job_id, 3)
        findings_response = None
        if mode in ("full", "bug_hunt"):
            findings_response = await analyze_ui_bugs(
                viewport_b64,
                url,
                scan_result.page_title,
                scan_result.dom_context,
                roast_mode=roast_mode,
            )
            for f in findings_response.findings:
                get_supabase().table("findings").insert({
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "category": f.category,
                    "title": f.title,
                    "description": f.description,
                    "severity": f.severity,
                    "element_hint": f.element_hint,
                    "recommendation": f.recommendation,
                    "roast_comment": f.roast_comment,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()

        # Step 4: Test Case Generator
        await _emit(job_id, 4)
        test_cases_response = None
        if mode in ("full", "test_case_only"):
            findings_summary = (
                "\n".join([f"- {f.severity}: {f.title}" for f in findings_response.findings])
                if findings_response
                else "No UI findings"
            )
            test_cases_response = await generate_test_cases(
                url, scan_result.dom_context, requirements, findings_summary
            )
            for tc in test_cases_response.test_cases:
                get_supabase().table("test_cases").insert({
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "case_id": tc.case_id,
                    "title": tc.title,
                    "category": tc.category,
                    "priority": tc.priority,
                    "preconditions": tc.preconditions,
                    "steps": [s.model_dump() for s in tc.steps],
                    "expected_result": tc.expected_result,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()

        # Step 5: Bug Reports (one per finding, capped at 5)
        await _emit(job_id, 5)
        if mode == "full" and findings_response:
            top_findings = [
                f for f in findings_response.findings if f.severity in ("critical", "high", "medium")
            ][:5]
            for f in top_findings:
                try:
                    bug_report = await generate_bug_report(f.model_dump(), url, viewport_b64)
                    get_supabase().table("bug_reports").insert({
                        "id": str(uuid.uuid4()),
                        "job_id": job_id,
                        "finding_id": f.id,
                        "title": bug_report.title,
                        "severity": bug_report.severity,
                        "priority": bug_report.priority,
                        "steps_to_reproduce": bug_report.steps_to_reproduce,
                        "expected_result": bug_report.expected_result,
                        "actual_result": bug_report.actual_result,
                        "impact": bug_report.impact,
                        "created_at": datetime.utcnow().isoformat(),
                    }).execute()
                except Exception as e:
                    logger.warning("bug_report_failed", finding_id=f.id, error=str(e))

        # Step 6: Playwright Script
        await _emit(job_id, 6)
        if mode == "full" and test_cases_response:
            tc_dicts = [tc.model_dump() for tc in test_cases_response.test_cases]
            script = await generate_playwright_script(url, tc_dicts, scan_result.dom_context)
            script_url = await upload_script(job_id, script)
            get_supabase().table("artifacts").insert({
                "id": str(uuid.uuid4()),
                "job_id": job_id,
                "type": "script",
                "public_url": script_url,
                "created_at": datetime.utcnow().isoformat(),
            }).execute()

        # Done
        await _emit(job_id, 7, status="completed")
        await update_status("completed", completed_at=datetime.utcnow().isoformat())
        logger.info("scan_completed", job_id=job_id, url=url)

    except Exception as e:
        import traceback
        logger.error("scan_failed", job_id=job_id, error=str(e), traceback=traceback.format_exc())
        friendly = _friendly_error(e)
        get_supabase().table("scan_jobs").update({
            "status": "failed",
            "error_msg": friendly,
        }).eq("id", job_id).execute()
        await _emit(job_id, -1, status="failed", error=friendly)
    finally:
        _progress_queues.pop(job_id, None)

