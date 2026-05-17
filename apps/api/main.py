import asyncio
import sys

# Python 3.14+ on Windows: ProactorEventLoop is now the default,
# no need to set policy. For older versions keep it as fallback.
if sys.platform == "win32" and sys.version_info < (3, 14):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from config import settings
from routers import scan, report, interview, game, testcases, bugs, releases

logger = structlog.get_logger()

app = FastAPI(
    title="TestPilot AI API",
    description="AI-Powered QA Testing Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(report.router, prefix="/api/report", tags=["report"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(game.router, prefix="/api/game", tags=["game"])
app.include_router(testcases.router, prefix="/api/testcases", tags=["testcases"])
app.include_router(bugs.router,      prefix="/api/bugs",      tags=["bugs"])
app.include_router(releases.router,  prefix="/api/releases",  tags=["releases"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/me")
async def me():
    """Placeholder — real auth via middleware."""
    return {"message": "auth handled by middleware"}
