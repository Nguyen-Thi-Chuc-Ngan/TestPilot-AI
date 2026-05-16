# TestPilot AI — CLAUDE.md

## Project Overview
AI-powered QA Testing Platform. Monorepo với Next.js frontend + FastAPI backend + Gemini AI + Supabase.

## Stack
- **Frontend**: Next.js 14 App Router, TypeScript, TailwindCSS, shadcn/ui — `apps/web/`
- **Backend**: FastAPI Python 3.14, Pydantic v2 — `apps/api/`
- **AI**: Google Gemini 2.0 Flash (vision + text) via `google-genai` SDK
- **DB/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage)
- **Automation**: Playwright (crawl + screenshot)

## Dev Commands

### Frontend
```bash
cd apps/web
pnpm dev          # port 3000
pnpm type-check   # TypeScript check
pnpm lint
```

### Backend
```bash
cd apps/api
uvicorn main:app --reload --port 8000
python -m pytest tests/ -v
```

### Root
```bash
pnpm install      # install all workspaces
pnpm dev:web      # frontend only
```

## Key Files
- `apps/api/services/ai_service.py` — tất cả AI calls (Gemini)
- `apps/api/services/scan_service.py` — scan pipeline orchestrator
- `apps/api/services/playwright_service.py` — browser automation
- `apps/api/middleware/auth.py` — Supabase JWT verification
- `apps/web/src/components/scan/scan-form.tsx` — scan UI
- `apps/web/src/components/report/report-tabs.tsx` — report viewer
- `docs/migrations/001_initial_schema.sql` — DB schema

## Environment Files
- `apps/api/.env` — backend secrets (Supabase + Gemini)
- `apps/web/.env.local` — frontend public keys (Supabase anon only)

## Important Decisions
- Supabase anon key phải dạng `eyJ...` (JWT), không phải `sb_publishable_...`
- AI SDK: dùng `google-genai` (mới), KHÔNG dùng `google-generativeai` (deprecated)
- Supabase Python: dùng version `2.4.6`, version mới hơn kéo `pyiceberg` không tương thích Python 3.14
- Supabase client init phải lazy (không init ở module level) để tránh crash khi chưa có `.env`
- Model: `gemini-1.5-flash` cho cả vision và text (2.0-flash free tier quá hạn chế)

## DB Schema (9 tables)
`profiles`, `projects`, `scan_jobs`, `findings`, `test_cases`, `bug_reports`, `artifacts`, `interview_sessions`, `game_attempts`

## API Endpoints
- `POST /api/scan` — tạo scan job
- `GET /api/scan/{id}` — job status
- `GET /api/scan/{id}/stream` — SSE progress
- `GET /api/report/{id}` — full report
- `GET /api/report/{id}/export/md` — export Markdown
- `GET /api/report/{id}/export/html` — export HTML
- `POST /api/interview/evaluate` — AI grade answer
- `GET /api/game/challenges` — list game challenges
