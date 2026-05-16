from typing import Optional
from supabase import create_client, Client
from config import settings
import structlog

logger = structlog.get_logger()

_supabase: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase


async def upload_screenshot(job_id: str, data: bytes, suffix: str = "full") -> str:
    path = f"{job_id}/screenshot_{suffix}.jpg"
    try:
        sb = get_supabase()
        sb.storage.from_(settings.storage_bucket_screenshots).upload(
            path,
            data,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
        public_url = sb.storage.from_(settings.storage_bucket_screenshots).get_public_url(path)
        logger.info("screenshot_uploaded", job_id=job_id, path=path)
        return public_url
    except Exception as e:
        logger.error("screenshot_upload_failed", job_id=job_id, error=str(e))
        raise


async def upload_script(job_id: str, script_content: str) -> str:
    path = f"{job_id}/playwright.spec.ts"
    try:
        sb = get_supabase()
        sb.storage.from_(settings.storage_bucket_reports).upload(
            path,
            script_content.encode("utf-8"),
            file_options={"content-type": "text/plain", "upsert": "true"},
        )
        return sb.storage.from_(settings.storage_bucket_reports).get_public_url(path)
    except Exception as e:
        logger.error("script_upload_failed", job_id=job_id, error=str(e))
        raise


async def upload_report(job_id: str, content: str, fmt: str) -> str:
    content_types = {"md": "text/markdown", "html": "text/html"}
    path = f"{job_id}/report.{fmt}"
    try:
        sb = get_supabase()
        sb.storage.from_(settings.storage_bucket_reports).upload(
            path,
            content.encode("utf-8"),
            file_options={"content-type": content_types.get(fmt, "text/plain"), "upsert": "true"},
        )
        return sb.storage.from_(settings.storage_bucket_reports).get_public_url(path)
    except Exception as e:
        logger.error("report_upload_failed", job_id=job_id, fmt=fmt, error=str(e))
        raise
