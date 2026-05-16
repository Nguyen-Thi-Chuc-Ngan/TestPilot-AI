from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from supabase import create_client

from config import settings
from middleware.auth import get_current_user
from services.export_service import generate_markdown_report, generate_html_report

router = APIRouter()
_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


def _get_job_or_404(job_id: str, user_id: str) -> dict:
    result = (
        _supabase.table("scan_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return result.data


@router.get("/{job_id}")
async def get_report(job_id: str, user: dict = Depends(get_current_user)):
    job = _get_job_or_404(job_id, user["user_id"])

    findings = _supabase.table("findings").select("*").eq("job_id", job_id).execute().data or []
    test_cases = _supabase.table("test_cases").select("*").eq("job_id", job_id).execute().data or []
    bug_reports = _supabase.table("bug_reports").select("*").eq("job_id", job_id).execute().data or []
    artifacts = _supabase.table("artifacts").select("*").eq("job_id", job_id).execute().data or []

    return {
        "job": job,
        "findings": findings,
        "test_cases": test_cases,
        "bug_reports": bug_reports,
        "artifacts": artifacts,
    }


@router.get("/{job_id}/export/md")
async def export_markdown(job_id: str, user: dict = Depends(get_current_user)):
    job = _get_job_or_404(job_id, user["user_id"])
    findings = _supabase.table("findings").select("*").eq("job_id", job_id).execute().data or []
    test_cases = _supabase.table("test_cases").select("*").eq("job_id", job_id).execute().data or []
    bug_reports = _supabase.table("bug_reports").select("*").eq("job_id", job_id).execute().data or []

    content = generate_markdown_report(job, findings, test_cases, bug_reports)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=testpilot-report-{job_id[:8]}.md"},
    )


@router.get("/{job_id}/export/html")
async def export_html(job_id: str, user: dict = Depends(get_current_user)):
    job = _get_job_or_404(job_id, user["user_id"])
    findings = _supabase.table("findings").select("*").eq("job_id", job_id).execute().data or []
    test_cases = _supabase.table("test_cases").select("*").eq("job_id", job_id).execute().data or []
    bug_reports = _supabase.table("bug_reports").select("*").eq("job_id", job_id).execute().data or []

    content = generate_html_report(job, findings, test_cases, bug_reports)
    return Response(
        content=content,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=testpilot-report-{job_id[:8]}.html"},
    )
