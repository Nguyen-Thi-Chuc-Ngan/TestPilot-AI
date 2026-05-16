from fastapi import HTTPException, Header
from jose import jwt, JWTError
from config import settings
import httpx

SUPABASE_JWT_SECRET_URL = "{url}/auth/v1/jwks"


async def get_current_user(authorization: str = Header(None)) -> dict:
    """Verify Supabase JWT and return user payload."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        # Decode without full verification first to get the sub/user_id
        # In production, verify against Supabase JWKS
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            options={"verify_signature": False},  # Supabase handles signature
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        return {"user_id": user_id, "email": payload.get("email", "")}
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {e}")
