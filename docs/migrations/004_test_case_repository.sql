-- ─── Test Suites ─────────────────────────────────────────────────────────────
-- A suite = one uploaded Excel/CSV file, belongs to a project
CREATE TABLE IF NOT EXISTS test_suites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    module          TEXT,
    version         INT NOT NULL DEFAULT 1,
    original_file   TEXT,              -- original filename
    file_url        TEXT,              -- Supabase Storage URL
    total_cases     INT DEFAULT 0,
    status_summary  JSONB DEFAULT '{}', -- {passed:N, failed:N, ...}
    archived_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_suites_user    ON test_suites(user_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_project ON test_suites(project_id);

ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suites_own" ON test_suites FOR ALL USING (auth.uid() = user_id);

-- ─── Test Case Rows ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_case_rows (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id             UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Core identification
    tc_id                TEXT,
    module               TEXT,
    feature              TEXT,
    requirement_id       TEXT,

    -- Classification
    test_type            TEXT DEFAULT 'Functional',
    priority             TEXT DEFAULT 'Medium',
    severity             TEXT DEFAULT 'Minor',
    automation_status    TEXT DEFAULT 'Manual',

    -- Test case content
    precondition         TEXT,
    description          TEXT NOT NULL,
    steps                TEXT,         -- free text or JSON steps array
    test_data            TEXT,
    expected_result      TEXT,

    -- Execution tracking
    actual_result        TEXT,
    status               TEXT DEFAULT 'Not Run',
    bug_id               TEXT,
    environment          TEXT,
    browser              TEXT,
    platform             TEXT,
    executed_by          TEXT,
    execution_date       DATE,
    dev_owner            TEXT,
    dev_fixed            BOOLEAN DEFAULT FALSE,
    notes                TEXT,
    tags                 TEXT[],

    -- AI-enhanced fields
    ai_suggestions       TEXT,
    risk_score           INT,           -- 1-10
    coverage_gap         TEXT,
    duplicate_probability FLOAT,        -- 0.0-1.0
    weakness_reason      TEXT,

    -- Metadata
    row_order            INT DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT status_check CHECK (status IN ('Not Run','Passed','Failed','Blocked','Retest','Skipped')),
    CONSTRAINT priority_check CHECK (priority IN ('Critical','High','Medium','Low')),
    CONSTRAINT severity_check CHECK (severity IN ('Critical','Major','Minor','Trivial'))
);

CREATE INDEX IF NOT EXISTS idx_tc_rows_suite   ON test_case_rows(suite_id);
CREATE INDEX IF NOT EXISTS idx_tc_rows_user    ON test_case_rows(user_id);
CREATE INDEX IF NOT EXISTS idx_tc_rows_status  ON test_case_rows(status);
CREATE INDEX IF NOT EXISTS idx_tc_rows_tc_id   ON test_case_rows(tc_id);

ALTER TABLE test_case_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_rows_own" ON test_case_rows FOR ALL USING (auth.uid() = user_id);

-- ─── AI Analysis Cache ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tc_ai_analysis (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id     UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    result       JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tc_ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_analysis_own" ON tc_ai_analysis FOR ALL USING (auth.uid() = user_id);
