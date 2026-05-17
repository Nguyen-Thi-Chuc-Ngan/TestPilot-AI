-- ─── QA Todos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_todos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    priority     TEXT DEFAULT 'Medium',  -- Critical|High|Medium|Low
    status       TEXT DEFAULT 'Todo',    -- Todo|In Progress|Waiting Dev|Waiting QA|Done|Blocked
    due_date     DATE,
    linked_bug   TEXT,
    notes        TEXT,
    est_hours    FLOAT,
    actual_hours FLOAT,
    project_name TEXT,
    pinned       BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE qa_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_own" ON qa_todos FOR ALL USING (auth.uid() = user_id);

-- ─── Daily QA Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    tested       TEXT,   -- what was tested
    bugs_found   TEXT,
    blockers     TEXT,
    pending      TEXT,
    notes        TEXT,
    mood         TEXT DEFAULT 'normal', -- good|normal|stressed
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_own" ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- ─── Scratchpad (single pad per user, auto-save) ──────────────────────────────
CREATE TABLE IF NOT EXISTS scratchpad (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    content      TEXT DEFAULT '',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE scratchpad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scratch_own" ON scratchpad FOR ALL USING (auth.uid() = user_id);

-- ─── QA Checklists ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_checklists (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    category     TEXT DEFAULT 'General', -- Smoke|Regression|Release|Accessibility|API|General
    items        JSONB NOT NULL DEFAULT '[]', -- [{id, text, checked}]
    is_template  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE qa_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_own" ON qa_checklists FOR ALL USING (auth.uid() = user_id);
