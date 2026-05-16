# TestPilot AI

> **AI-Powered QA Testing Platform** — Enter any URL and get AI-generated test cases, bug reports, and Playwright automation scripts in under 60 seconds.

[![CI](https://github.com/your-username/testpilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/testpilot-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What It Does

TestPilot AI takes a URL, crawls it with Playwright, analyzes the screenshots with Gemini Vision, and produces a full QA report in one click. Built as a portfolio project to showcase real-world QA and AI engineering skills.

## Key Features

| Feature | Description |
|---|---|
| **AI Bug Hunter** | Gemini Vision scans screenshots and surfaces UI/UX issues with severity ratings |
| **Test Case Generator** | Structured QA test cases (ID, steps, expected results) ready for Jira |
| **Smart Bug Report** | Severity-classified, P1–P4 bug reports with steps to reproduce |
| **Automation Script** | Runnable Playwright TypeScript tests auto-generated from test cases |
| **AI Roast Mode** | Toggle savage-but-constructive UX feedback from the AI |
| **Game Testing Arena** | Find bugs in intentionally broken mini apps and earn scores |
| **Interview Trainer** | Practice QA interviews with AI-graded feedback |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| Backend | FastAPI, Python 3.11, Pydantic v2 |
| AI | Google Gemini 1.5 Pro (vision) + Gemini Flash (text) |
| Automation | Playwright (crawling + E2E tests) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel (frontend) + Fly.io (backend) + Supabase |

## Architecture

```
Browser → Next.js (App Router)
            │ REST + SSE
            ▼
         FastAPI Backend
            ├── Playwright Worker (crawl + screenshot)
            ├── Gemini Vision (UI analysis)
            ├── Gemini Flash (test gen, bug report, script)
            └── Supabase (PostgreSQL + Storage)
```

## Getting Started

### Prerequisites
- Node.js 20+, pnpm 9+
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### 1. Clone and install

```bash
git clone https://github.com/your-username/testpilot-ai
cd testpilot-ai
pnpm install
```

### 2. Set up environment variables

```bash
# Frontend
cp apps/web/.env.local.example apps/web/.env.local

# Backend
cp apps/api/.env.example apps/api/.env
```

Fill in your Supabase URL, anon key, service role key, and Gemini API key.

### 3. Set up the database

Open your Supabase project → SQL Editor → paste and run:
```
docs/migrations/001_initial_schema.sql
```

### 4. Set up Supabase Storage

Create two public buckets in your Supabase Storage:
- `screenshots`
- `reports`

### 5. Run development servers

```bash
# Terminal 1 — Frontend
pnpm dev:web

# Terminal 2 — Backend
cd apps/api
pip install -r requirements-dev.txt
playwright install chromium
uvicorn main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000)

## Running Tests

```bash
# Backend unit tests
cd apps/api && pytest tests/ -v

# Frontend type check + lint
cd apps/web && pnpm type-check && pnpm lint

# E2E tests
cd apps/web && pnpm test:e2e
```

## Demo

The `demo-site/` directory contains a static webpage with **26 intentional bugs** (accessibility, layout, form, logic) to test the scanner against.

Serve it locally:
```bash
cd demo-site && python -m http.server 8080
# Then scan http://localhost:8080 — wait, localhost is blocked!
# Use: npx serve demo-site and scan the ngrok URL, or deploy to GitHub Pages
```

## API Documentation

FastAPI auto-generates Swagger UI at: `http://localhost:8000/docs`

## Project Structure

```
testpilot-ai/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── demo-site/        # Static site with intentional bugs
├── docs/
│   ├── migrations/   # SQL migration files
│   └── github-issues.md
├── .github/workflows/
└── docker-compose.yml
```

## Roadmap

- [x] Core scan pipeline (Playwright + Gemini)
- [x] UI Bug Hunter
- [x] Test Case Generator
- [x] Smart Bug Report
- [x] Automation Script Generator
- [x] AI Roast Mode
- [x] Game Testing Arena
- [x] AI Interview Trainer
- [x] Export Markdown/HTML
- [ ] PDF export
- [ ] Public shareable report links
- [ ] Scan comparison (delta reports)
- [ ] Team workspace

## License

MIT © 2024 TestPilot AI
# TestPilot-AI
