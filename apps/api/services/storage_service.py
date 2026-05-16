import uuid
from supabase import create_client
from config import settings
import structlog

logger = structlog.get_logger()

_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


async def upload_screenshot(job_id: str, data: bytes, suffix: str = "full") -> str:
    """Upload screenshot to Supabase Storage and return public URL."""
    path = f"{job_id}/screenshot_{suffix}.jpg"
    try:
        _supabase.storage.from_(settings.storage_bucket_screenshots).upload(
            path,
            data,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
        public_url = _supabase.storage.from_(settings.storage_bucket_screenshots).get_public_url(path)
        logger.info("screenshot_uploaded", job_id=job_id, path=path)
        return public_url
    except Exception as e:
        logger.error("screenshot_upload_failed", job_id=job_id, error=str(e))
        raise


async def upload_script(job_id: str, script_content: str) -> str:
    """Upload Playwright script text and return public URL."""
    path = f"{job_id}/playwright.spec.ts"
    try:
        _supabase.storage.from_(settings.storage_bucket_reports).upload(
            path,
            script_content.encode("utf-8"),
            file_options={"content-type": "text/plain", "upsert": "true"},
        )
        public_url = _supabase.storage.from_(settings.storage_bucket_reports).get_public_url(path)
        return public_url
    except Exception as e:
        logger.error("script_upload_failed", job_id=job_id, error=str(e))
        raise


async def upload_report(job_id: str, content: str, fmt: str) -> str:
    """Upload exported report (md or html) and return public URL."""
    content_types = {"md": "text/markdown", "html": "text/html"}
    path = f"{job_id}/report.{fmt}"
    try:
        _supabase.storage.from_(settings.storage_bucket_reports).upload(
            path,
            content.encode("utf-8"),
            file_options={"content-type": content_types.get(fmt, "text/plain"), "upsert": "true"},
        )
        return _supabase.storage.from_(settings.storage_bucket_reports).get_public_url(path)
    except Exception as e:
        logger.error("report_upload_failed", job_id=job_id, fmt=fmt, error=str(e))
        raise
