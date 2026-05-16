import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from supabase import create_client
from datetime import datetime

from config import settings
from middleware.auth import get_current_user

router = APIRouter()
_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

# Static challenge definitions — bugs are revealed after submission
CHALLENGES = {
    "ch1": {
        "id": "ch1",
        "title": "Broken Login Form",
        "bug_ids": ["b1-1", "b1-2", "b1-3", "b1-4", "b1-5"],
        "bugs": [
            {"id": "b1-1", "title": "Submit button disabled after first click"},
            {"id": "b1-2", "title": "Password field shows plain text"},
            {"id": "b1-3", "title": "Error message not cleared on new input"},
            {"id": "b1-4", "title": "No keyboard accessibility on form"},
            {"id": "b1-5", "title": "Missing 'required' validation on email"},
        ],
    },
    "ch2": {
        "id": "ch2",
        "title": "E-commerce Cart Chaos",
        "bug_ids": ["b2-1", "b2-2", "b2-3"],
        "bugs": [
            {"id": "b2-1", "title": "Total price calculation wrong with discount"},
            {"id": "b2-2", "title": "Quantity can go negative"},
            {"id": "b2-3", "title": "Remove item button removes wrong item"},
        ],
    },
}


class SubmitAttemptRequest(BaseModel):
    challenge_id: str
    bugs_found: List[str]  # list of bug titles the player reported
    time_taken: int  # seconds


@router.get("/challenges")
async def list_challenges(user: dict = Depends(get_current_user)):
    return {
        "challenges": [
            {
                "id": c["id"],
                "title": c["title"],
                "bug_count": len(c["bug_ids"]),
            }
            for c in CHALLENGES.values()
        ]
    }


@router.post("/submit")
async def submit_attempt(body: SubmitAttemptRequest, user: dict = Depends(get_current_user)):
    challenge = CHALLENGES.get(body.challenge_id)
    if not challenge:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Challenge not found")

    total_bugs = len(challenge["bug_ids"])
    # Score based on bugs found (fuzzy match on count only for simplicity)
    found_count = min(len(body.bugs_found), total_bugs)
    score = round((found_count / total_bugs) * 100)

    # Save attempt
    _supabase.table("game_attempts").insert({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "challenge_id": body.challenge_id,
        "bugs_found": body.bugs_found,
        "score": score,
        "time_taken": body.time_taken,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    return {
        "score": score,
        "found_count": found_count,
        "total_bugs": total_bugs,
        "all_bugs": challenge["bugs"],  # reveal after submission
    }
