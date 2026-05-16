-- TestPilot AI — Initial Schema
-- Run this in your Supabase SQL editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    plan         TEXT NOT NULL DEFAULT 'free',
    scans_used   INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'display_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    base_url   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Scan Jobs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_jobs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    requirements TEXT,
    mode         TEXT NOT NULL DEFAULT 'full',
    roast_mode   BOOLEAN NOT NULL DEFAULT FALSE,
    status       TEXT NOT NULL DEFAULT 'queued',
    error_msg    TEXT,
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT scan_jobs_mode_check CHECK (mode IN ('full', 'bug_hunt', 'test_case_only')),
    CONSTRAINT scan_jobs_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_user_id ON scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_created_at ON scan_jobs(created_at DESC);

-- ─── Findings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS findings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id         UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    category       TEXT,
    title          TEXT NOT NULL,
    description    TEXT,
    severity       TEXT,
    element_hint   TEXT,
    recommendation TEXT,
    roast_comment  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT findings_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info'))
);

CREATE INDEX IF NOT EXISTS idx_findings_job_id ON findings(job_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- ─── Test Cases ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    case_id         TEXT,
    title           TEXT,
    category        TEXT,
    priority        TEXT,
    preconditions   JSONB NOT NULL DEFAULT '[]',
    steps           JSONB NOT NULL DEFAULT '[]',
    expected_result TEXT,
    test_data       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_job_id ON test_cases(job_id);

-- ─── Bug Reports ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bug_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    finding_id          UUID REFERENCES findings(id) ON DELETE SET NULL,
    title               TEXT,
    severity            TEXT,
    priority            TEXT,
    steps_to_reproduce  JSONB NOT NULL DEFAULT '[]',
    expected_result     TEXT,
    actual_result       TEXT,
    impact              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_job_id ON bug_reports(job_id);

-- ─── Artifacts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifacts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    storage_path TEXT,
    public_url   TEXT,
    size_bytes   INT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_job_id ON artifacts(job_id);

-- ─── Interview Sessions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question   TEXT,
    answer     TEXT,
    score      INT,
    feedback   JSONB,
    level      TEXT DEFAULT 'junior',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);

-- ─── Game Attempts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    bugs_found   JSONB NOT NULL DEFAULT '[]',
    score        INT NOT NULL DEFAULT 0,
    time_taken   INT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_attempts_user_id ON game_attempts(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Scan jobs: users see only their own
CREATE POLICY "scan_jobs_own" ON scan_jobs FOR ALL USING (auth.uid() = user_id);

-- Related tables: access through scan_jobs ownership
CREATE POLICY "findings_own" ON findings FOR ALL
    USING (job_id IN (SELECT id FROM scan_jobs WHERE user_id = auth.uid()));

CREATE POLICY "test_cases_own" ON test_cases FOR ALL
    USING (job_id IN (SELECT id FROM scan_jobs WHERE user_id = auth.uid()));

CREATE POLICY "bug_reports_own" ON bug_reports FOR ALL
    USING (job_id IN (SELECT id FROM scan_jobs WHERE user_id = auth.uid()));

CREATE POLICY "artifacts_own" ON artifacts FOR ALL
    USING (job_id IN (SELECT id FROM scan_jobs WHERE user_id = auth.uid()));

CREATE POLICY "interview_sessions_own" ON interview_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "game_attempts_own" ON game_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);
