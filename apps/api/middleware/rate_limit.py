import time
from collections import defaultdict
from fastapi import HTTPException
from config import settings

# In-memory store — replace with Redis in production
_scan_counts: dict[str, list[float]] = defaultdict(list)


def check_scan_rate_limit(user_id: str) -> None:
    """Allow max N scans per hour per user."""
    now = time.time()
    window = 3600  # 1 hour
    limit = settings.max_scans_per_hour

    # Clean old timestamps
    _scan_counts[user_id] = [t for t in _scan_counts[user_id] if now - t < window]

    if len(_scan_counts[user_id]) >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {limit} scans per hour. Try again later.",
        )

    _scan_counts[user_id].append(now)
