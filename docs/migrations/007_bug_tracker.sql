-- ─── Bugs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bugs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Identification
    bug_id          TEXT,               -- e.g. BUG-001
    title           TEXT NOT NULL,
    description     TEXT,

    -- Classification
    severity        TEXT DEFAULT 'Minor',   -- Critical|Major|Minor|Trivial
    priority        TEXT DEFAULT 'Medium',  -- Critical|High|Medium|Low
    status          TEXT DEFAULT 'Open',    -- Open|In Progress|Ready for Retest|Verified|Closed|Rejected|Cannot Reproduce
    retest_status   TEXT DEFAULT 'Not Needed', -- Pending|Passed Retest|Failed Retest|Not Needed

    -- Context
    project_name    TEXT,
    client          TEXT,
    module          TEXT,
    feature         TEXT,
    environment     TEXT,
    platform        TEXT,
    browser         TEXT,
    release_version TEXT,
    fix_version     TEXT,

    -- People
    assigned_dev    TEXT,
    qa_owner        TEXT,

    -- Content
    steps           TEXT,
    expected_result TEXT,
    actual_result   TEXT,
    notes           TEXT,

    -- Links
    linked_tc_id    TEXT,   -- linked test case TC_ID

    -- Timestamps
    dev_fixed_date  DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bugs_user     ON bugs(user_id);
CREATE INDEX IF NOT EXISTS idx_bugs_status   ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_bug_id   ON bugs(bug_id);

ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bugs_own" ON bugs FOR ALL USING (auth.uid() = user_id);

-- ─── Evidence Files ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_files (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bug_id       UUID REFERENCES bugs(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    file_url     TEXT NOT NULL,
    file_type    TEXT DEFAULT 'screenshot',  -- screenshot|video|log|har|api_response|other
    file_size    INT,
    project_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_user   ON evidence_files(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_bug    ON evidence_files(bug_id);

ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_own" ON evidence_files FOR ALL USING (auth.uid() = user_id);

-- ─── Release Summaries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS release_summaries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    release_version     TEXT NOT NULL,
    project_name        TEXT,
    client              TEXT,
    sprint              TEXT,
    environment         TEXT,
    total_cases         INT DEFAULT 0,
    passed              INT DEFAULT 0,
    failed              INT DEFAULT 0,
    blocked             INT DEFAULT 0,
    not_run             INT DEFAULT 0,
    open_bugs           INT DEFAULT 0,
    critical_bugs       INT DEFAULT 0,
    high_bugs           INT DEFAULT 0,
    retest_pending      INT DEFAULT 0,
    risk_level          TEXT DEFAULT 'Medium',  -- Low|Medium|High|Critical
    signoff_status      TEXT DEFAULT 'Not Ready', -- Ready|Release with Risk|Not Ready
    summary_notes       TEXT,
    ai_summary          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE release_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "releases_own" ON release_summaries FOR ALL USING (auth.uid() = user_id);
