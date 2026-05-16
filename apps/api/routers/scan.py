import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from supabase import create_client

from config import settings
from middleware.auth import get_current_user
from middleware.rate_limit import check_scan_rate_limit
from models.scan import ScanRequest, ScanJobResponse, ScanStatusResponse
from services.scan_service import create_scan_job, run_scan_job, stream_progress

router = APIRouter()
_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("", response_model=ScanJobResponse, status_code=201)
async def start_scan(
    body: ScanRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    check_scan_rate_limit(user["user_id"])

    job_id = await create_scan_job(
        user_id=user["user_id"],
        url=body.url,
        requirements=body.requirements,
        mode=body.mode.value,
        roast_mode=body.roast_mode,
    )

    background_tasks.add_task(
        run_scan_job,
        job_id=job_id,
        url=body.url,
        requirements=body.requirements,
        mode=body.mode.value,
        roast_mode=body.roast_mode,
    )

    return ScanJobResponse(
        job_id=job_id,
        status="queued",
        url=body.url,
        created_at="",
    )


@router.get("/{job_id}", response_model=ScanStatusResponse)
async def get_scan_status(job_id: str, user: dict = Depends(get_current_user)):
    result = (
        _supabase.table("scan_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user["user_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Scan job not found")

    job = result.data
    return ScanStatusResponse(
        job_id=job["id"],
        status=job["status"],
        url=job["url"],
        error_msg=job.get("error_msg"),
        created_at=job["created_at"],
        completed_at=job.get("completed_at"),
    )


@router.get("/{job_id}/stream")
async def stream_scan(job_id: str, user: dict = Depends(get_current_user)):
    """SSE endpoint for real-time scan progress updates."""
    # Verify ownership
    result = (
        _supabase.table("scan_jobs")
        .select("id")
        .eq("id", job_id)
        .eq("user_id", user["user_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Scan job not found")

    return StreamingResponse(
        stream_progress(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
