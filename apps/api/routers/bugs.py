import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client, Client
from config import settings
from middleware.auth import get_current_user
from services.ai_service import evaluate_interview_answer  # reuse Groq client

router = APIRouter()
_sb: Optional[Client] = None


def get_sb() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _sb


def _next_bug_id(user_id: str) -> str:
    result = get_sb().table("bugs").select("bug_id").eq("user_id", user_id).order("created_at", desc=True).limit(100).execute()
    ids = [r["bug_id"] for r in (result.data or []) if r.get("bug_id") and r["bug_id"].startswith("BUG-")]
    nums = []
    for bid in ids:
        try:
            nums.append(int(bid.split("-")[1]))
        except Exception:
            pass
    next_num = max(nums) + 1 if nums else 1
    return f"BUG-{next_num:03d}"


class BugCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "Minor"
    priority: str = "Medium"
    status: str = "Open"
    project_name: Optional[str] = None
    client: Optional[str] = None
    module: Optional[str] = None
    feature: Optional[str] = None
    environment: Optional[str] = None
    platform: Optional[str] = None
    browser: Optional[str] = None
    release_version: Optional[str] = None
    assigned_dev: Optional[str] = None
    qa_owner: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    notes: Optional[str] = None
    linked_tc_id: Optional[str] = None


class BugUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    retest_status: Optional[str] = None
    assigned_dev: Optional[str] = None
    notes: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    fix_version: Optional[str] = None
    dev_fixed_date: Optional[str] = None
    module: Optional[str] = None
    environment: Optional[str] = None
    release_version: Optional[str] = None


@router.get("")
async def list_bugs(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    project_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    q = get_sb().table("bugs").select("*").eq("user_id", user["user_id"]).is_("archived_at", "null")
    if status:       q = q.eq("status", status)
    if severity:     q = q.eq("severity", severity)
    if project_name: q = q.eq("project_name", project_name)
    result = q.order("created_at", desc=True).execute()
    bugs = result.data or []
    if search:
        s = search.lower()
        bugs = [b for b in bugs if s in (b.get("title") or "").lower()
                or s in (b.get("bug_id") or "").lower()
                or s in (b.get("module") or "").lower()]
    return bugs


@router.post("", status_code=201)
async def create_bug(body: BugCreate, user: dict = Depends(get_current_user)):
    now = datetime.utcnow().isoformat()
    bug_id = _next_bug_id(user["user_id"])
    data = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "bug_id": bug_id,
        **{k: v for k, v in body.model_dump().items() if v is not None},
        "created_at": now,
        "updated_at": now,
    }
    result = get_sb().table("bugs").insert(data).execute()
    return result.data[0] if result.data else data


@router.get("/{bug_id}")
async def get_bug(bug_id: str, user: dict = Depends(get_current_user)):
    result = get_sb().table("bugs").select("*").eq("id", bug_id).eq("user_id", user["user_id"]).single().execute()
    if not result.data:
        raise HTTPException(404, "Bug not found")
    return result.data


@router.patch("/{bug_id}")
async def update_bug(bug_id: str, body: BugUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.utcnow().isoformat()
    get_sb().table("bugs").update(data).eq("id", bug_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@router.delete("/{bug_id}")
async def delete_bug(bug_id: str, user: dict = Depends(get_current_user)):
    get_sb().table("bugs").delete().eq("id", bug_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@router.post("/{bug_id}/ai-rewrite")
async def ai_rewrite_bug(bug_id: str, user: dict = Depends(get_current_user)):
    """Use AI to rewrite bug report professionally."""
    from groq import AsyncGroq
    import json

    bug = get_sb().table("bugs").select("*").eq("id", bug_id).eq("user_id", user["user_id"]).single().execute().data
    if not bug:
        raise HTTPException(404, "Bug not found")

    client = AsyncGroq(api_key=settings.groq_api_key)
    prompt = f"""You are a senior QA engineer. Rewrite this bug report professionally and clearly.

Current bug:
Title: {bug.get('title', '')}
Steps: {bug.get('steps', '')}
Expected: {bug.get('expected_result', '')}
Actual: {bug.get('actual_result', '')}
Severity: {bug.get('severity', '')}

Return ONLY valid JSON (no markdown):
{{
  "title": "clear professional bug title",
  "steps": "1. Step one\\n2. Step two\\n3. Step three",
  "expected_result": "clear expected result",
  "actual_result": "clear actual result",
  "suggested_severity": "Critical|Major|Minor|Trivial",
  "suggested_priority": "Critical|High|Medium|Low"
}}"""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1024,
    )
    text = response.choices[0].message.content.strip()
    start, end = text.find("{"), text.rfind("}") + 1
    return json.loads(text[start:end]) if start != -1 else {"error": "AI parse failed"}
