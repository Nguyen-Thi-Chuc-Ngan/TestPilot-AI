from fastapi import HTTPException, Header
from supabase import create_client, Client
from config import settings
from typing import Optional

_supabase: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
    return _supabase


async def get_current_user(authorization: str = Header(None)) -> dict:
    """Verify Supabase JWT by calling Supabase's own auth endpoint."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        # Let Supabase verify the token — most reliable approach
        sb = get_supabase()
        response = sb.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": str(user.id), "email": user.email or ""}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {e}")
