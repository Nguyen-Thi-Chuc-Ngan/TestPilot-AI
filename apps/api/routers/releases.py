import uuid, json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from config import settings
from middleware.auth import get_current_user

router = APIRouter()
_sb: Optional[Client] = None


def get_sb() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _sb


class ReleaseCreate(BaseModel):
    release_version: str
    project_name: Optional[str] = None
    client: Optional[str] = None
    sprint: Optional[str] = None
    environment: Optional[str] = None
    summary_notes: Optional[str] = None


@router.get("")
async def list_releases(user: dict = Depends(get_current_user)):
    result = get_sb().table("release_summaries").select("*").eq("user_id", user["user_id"]).order("created_at", desc=True).execute()
    return result.data or []


@router.post("", status_code=201)
async def create_release(body: ReleaseCreate, user: dict = Depends(get_current_user)):
    """Auto-calculate stats from bugs + testcases for this project/version."""
    sb = get_sb()
    now = datetime.utcnow().isoformat()

    # Count bugs
    bugs_result = sb.table("bugs").select("severity, status, retest_status").eq("user_id", user["user_id"])
    if body.project_name:
        bugs_result = bugs_result.eq("project_name", body.project_name)
    if body.release_version:
        bugs_result = bugs_result.eq("release_version", body.release_version)
    bugs = bugs_result.execute().data or []

    open_bugs     = len([b for b in bugs if b["status"] not in ("Closed", "Rejected")])
    critical_bugs = len([b for b in bugs if b["severity"] == "Critical" and b["status"] not in ("Closed", "Rejected")])
    high_bugs     = len([b for b in bugs if b["severity"] == "Major"    and b["status"] not in ("Closed", "Rejected")])
    retest_pending = len([b for b in bugs if b.get("retest_status") == "Pending"])

    # Determine risk
    if critical_bugs > 0:       risk = "Critical"
    elif high_bugs > 2:         risk = "High"
    elif open_bugs > 5:         risk = "Medium"
    else:                       risk = "Low"

    if critical_bugs > 0 or (open_bugs > 3 and risk in ("High","Critical")):
        signoff = "Not Ready"
    elif open_bugs > 0 or retest_pending > 0:
        signoff = "Release with Risk"
    else:
        signoff = "Ready"

    data = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        **body.model_dump(),
        "open_bugs": open_bugs,
        "critical_bugs": critical_bugs,
        "high_bugs": high_bugs,
        "retest_pending": retest_pending,
        "risk_level": risk,
        "signoff_status": signoff,
        "created_at": now,
        "updated_at": now,
    }
    result = sb.table("release_summaries").insert(data).execute()
    return result.data[0] if result.data else data


@router.post("/{release_id}/ai-summary")
async def ai_release_summary(release_id: str, user: dict = Depends(get_current_user)):
    from groq import AsyncGroq

    release = get_sb().table("release_summaries").select("*").eq("id", release_id).eq("user_id", user["user_id"]).single().execute().data
    if not release:
        raise HTTPException(404, "Release not found")

    client = AsyncGroq(api_key=settings.groq_api_key)
    prompt = f"""You are a QA lead writing a release summary for stakeholders.

Release: {release.get('release_version')}
Project: {release.get('project_name', 'Unknown')}
Environment: {release.get('environment', 'Staging')}

Test Results:
- Total cases: {release.get('total_cases', 0)}
- Passed: {release.get('passed', 0)}
- Failed: {release.get('failed', 0)}
- Blocked: {release.get('blocked', 0)}
- Not Run: {release.get('not_run', 0)}

Bug Status:
- Open bugs: {release.get('open_bugs', 0)}
- Critical bugs: {release.get('critical_bugs', 0)}
- High bugs: {release.get('high_bugs', 0)}
- Pending retest: {release.get('retest_pending', 0)}

Risk Level: {release.get('risk_level')}
Sign-off: {release.get('signoff_status')}

Notes: {release.get('summary_notes', 'None')}

Write a concise, professional 3-4 paragraph release summary for a non-technical stakeholder.
Include: overall status, key issues, recommendation, and next steps.
End with a clear Go/No-Go recommendation."""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800,
    )
    summary = response.choices[0].message.content.strip()

    # Save AI summary
    get_sb().table("release_summaries").update({"ai_summary": summary, "updated_at": datetime.utcnow().isoformat()}).eq("id", release_id).execute()
    return {"summary": summary}


@router.delete("/{release_id}")
async def delete_release(release_id: str, user: dict = Depends(get_current_user)):
    get_sb().table("release_summaries").delete().eq("id", release_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}
