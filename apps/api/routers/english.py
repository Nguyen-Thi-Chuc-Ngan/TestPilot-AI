import uuid, json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import create_client, Client
from groq import AsyncGroq
from config import settings
from middleware.auth import get_current_user

router = APIRouter()
_sb: Optional[Client] = None
_groq: Optional[AsyncGroq] = None

def get_sb() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _sb

def get_groq() -> AsyncGroq:
    global _groq
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.groq_api_key)
    return _groq

def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"): text = "\n".join(text.split("\n")[1:-1]).strip()
    s, e = text.find("{"), text.rfind("}") + 1
    return json.loads(text[s:e]) if s != -1 else {}


# ─── Fix / Rewrite ────────────────────────────────────────────────────────────

class FixRequest(BaseModel):
    text: str
    style: str = "Professional QA"   # Simple|Professional QA|Corporate Jira|Senior QA
    feature: str = "fixer"           # fixer|translator|rewrite|communication
    context: str = "bug_report"      # bug_report|testcase|comment|meeting|slack

@router.post("/fix")
async def fix_writing(body: FixRequest, user: dict = Depends(get_current_user)):
    """Core AI feature: fix/translate/rewrite QA English."""
    client = get_groq()

    style_desc = {
        "Simple":         "Clear, simple English. Short sentences. Easy to understand.",
        "Professional QA":"Standard QA engineering English. Technical but readable.",
        "Corporate Jira": "Formal corporate style. Suitable for Jira tickets and reports.",
        "Senior QA":      "Concise, precise, authoritative. Used by senior QA engineers.",
    }.get(body.style, "Professional QA English")

    context_desc = {
        "bug_report":  "bug report or defect description",
        "testcase":    "test case description or expected result",
        "comment":     "Jira comment or Slack message",
        "meeting":     "meeting note or standup update",
        "slack":       "professional Slack or team message",
    }.get(body.context, "QA document")

    prompt = f"""You are a senior QA writing coach helping testers write better professional English.

Input text (may be Vietnamese, broken English, or informal):
"{body.text}"

Context: This is a {context_desc}.
Target style: {style_desc}

Rewrite this into professional QA English. Then explain the improvements.

Return ONLY valid JSON (no markdown):
{{
  "original": "{body.text}",
  "rewritten": "the improved professional version",
  "professionalism_score": 8,
  "improvements": [
    "Replaced 'out app' with 'crashes' — more technical and precise",
    "Added article 'The' before 'application'",
    "Changed passive construction to active voice"
  ],
  "vocabulary_tips": [
    {{"word": "crash", "meaning": "app suddenly stops working", "example": "The app crashes when input is empty"}},
    {{"word": "reproduce", "meaning": "make the bug happen again", "example": "The issue is difficult to reproduce"}}
  ],
  "grammar_notes": "Brief grammar explanation if applicable",
  "tone_note": "Note about professional tone improvement"
}}"""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1024,
    )
    result = _parse_json(response.choices[0].message.content)

    # Save to DB
    score = result.get("professionalism_score", 5)
    get_sb().table("writing_corrections").insert({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "feature": body.feature,
        "original_text": body.text,
        "corrected_text": result.get("rewritten", ""),
        "explanation": json.dumps(result.get("improvements", [])),
        "style": body.style,
        "professionalism_score": score,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    # Update progress
    _update_progress(user["user_id"], score)
    return result


def _update_progress(user_id: str, score: int):
    try:
        sb = get_sb()
        prog = sb.table("english_progress").select("*").eq("user_id", user_id).single().execute().data
        now = datetime.utcnow().isoformat()
        if prog:
            new_avg = round((prog["professionalism_avg"] * prog["corrections_count"] + score) / (prog["corrections_count"] + 1), 1)
            new_level = _get_level(new_avg, prog["corrections_count"] + 1)
            sb.table("english_progress").update({
                "professionalism_avg": new_avg,
                "corrections_count": prog["corrections_count"] + 1,
                "english_level": new_level,
                "updated_at": now,
            }).eq("user_id", user_id).execute()
        else:
            sb.table("english_progress").insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "professionalism_avg": score,
                "corrections_count": 1,
                "english_level": "Beginner QA",
                "created_at": now,
                "updated_at": now,
            }).execute()
    except Exception:
        pass


def _get_level(avg: float, count: int) -> str:
    if count < 5:    return "Beginner QA"
    if avg >= 8.5:   return "Senior QA Writer"
    if avg >= 7.0:   return "Professional QA"
    if avg >= 5.5:   return "Intermediate QA"
    return "Developing QA"


# ─── History ──────────────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(user: dict = Depends(get_current_user)):
    result = get_sb().table("writing_corrections").select("*").eq("user_id", user["user_id"]).order("created_at", desc=True).limit(20).execute()
    return result.data or []


@router.get("/progress")
async def get_progress(user: dict = Depends(get_current_user)):
    prog = get_sb().table("english_progress").select("*").eq("user_id", user["user_id"]).single().execute().data
    return prog or {"professionalism_avg": 0, "corrections_count": 0, "english_level": "Beginner QA", "words_learned": 0}


# ─── Vocabulary Quiz ──────────────────────────────────────────────────────────

class VocabResult(BaseModel):
    word: str
    category: str
    correct: bool

@router.post("/vocab/record")
async def record_vocab(body: VocabResult, user: dict = Depends(get_current_user)):
    sb = get_sb()
    existing = sb.table("vocabulary_progress").select("*").eq("user_id", user["user_id"]).eq("word", body.word).single().execute().data
    now = datetime.utcnow().isoformat()
    if existing:
        new_correct = existing["correct_count"] + (1 if body.correct else 0)
        new_seen    = existing["seen_count"] + 1
        difficulty  = "known" if new_correct >= 3 else "learning" if new_seen >= 2 else "new"
        sb.table("vocabulary_progress").update({"seen_count": new_seen, "correct_count": new_correct, "difficulty": difficulty, "last_seen": now}).eq("id", existing["id"]).execute()
    else:
        sb.table("vocabulary_progress").insert({"id": str(uuid.uuid4()), "user_id": user["user_id"], "word": body.word, "category": body.category, "seen_count": 1, "correct_count": 1 if body.correct else 0, "last_seen": now, "created_at": now}).execute()
    return {"ok": True}
