import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal, Optional
from supabase import create_client, Client
from datetime import datetime

from config import settings
from middleware.auth import get_current_user
from services.ai_service import evaluate_interview_answer

router = APIRouter()
_supabase: Optional[Client] = None

def get_sb() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase


class EvaluateRequest(BaseModel):
    question_id: str
    question: str
    answer: str
    level: Literal["junior", "mid", "senior"] = "junior"


@router.get("/questions")
async def get_questions(user: dict = Depends(get_current_user)):
    """Return the built-in question bank."""
    return {
        "questions": [
            {"id": "q1", "question": "What is the difference between severity and priority?", "category": "fundamentals"},
            {"id": "q2", "question": "Describe your process for writing a test case from scratch.", "category": "test-design"},
            {"id": "q3", "question": "How do you prioritize testing when time is limited before a release?", "category": "strategy"},
            {"id": "q4", "question": "What is boundary value analysis and when would you use it?", "category": "techniques"},
            {"id": "q5", "question": "How would you thoroughly test a login form?", "category": "practical"},
            {"id": "q6", "question": "Explain the difference between black-box and white-box testing.", "category": "fundamentals"},
            {"id": "q7", "question": "How do you approach regression testing when features change frequently?", "category": "strategy"},
            {"id": "q8", "question": "What makes a good bug report?", "category": "fundamentals"},
            {"id": "q9", "question": "How would you test an API endpoint?", "category": "api-testing"},
            {"id": "q10", "question": "Describe a time you found a critical bug late in the release cycle. How did you handle it?", "category": "behavioral"},
        ]
    }


@router.post("/evaluate")
async def evaluate_answer(body: EvaluateRequest, user: dict = Depends(get_current_user)):
    feedback = await evaluate_interview_answer(body.question, body.answer, body.level)

    # Save session for history
    get_sb().table("interview_sessions").insert({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "question": body.question,
        "answer": body.answer,
        "score": feedback.get("score", 0),
        "feedback": feedback,
        "level": body.level,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    return feedback


