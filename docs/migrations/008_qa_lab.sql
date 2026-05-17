-- ─── Challenge Runs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_runs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mode             TEXT NOT NULL,       -- bug_hunt|battle|panic|regression|exploratory
    template_id      TEXT NOT NULL,       -- login|checkout|dashboard|qr_app|profile
    difficulty       TEXT DEFAULT 'Junior QA',
    injected_bugs    JSONB DEFAULT '[]',  -- list of bug objects with id/type/severity
    found_bugs       JSONB DEFAULT '[]',  -- bugs user reported
    score            INT DEFAULT 0,
    max_score        INT DEFAULT 0,
    time_taken       INT DEFAULT 0,       -- seconds
    ai_feedback      TEXT,
    completed        BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_user ON challenge_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_mode ON challenge_runs(mode);
ALTER TABLE challenge_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runs_own" ON challenge_runs FOR ALL USING (auth.uid() = user_id);

-- ─── Daily Missions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_missions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    missions     JSONB NOT NULL DEFAULT '[]',  -- [{id, title, target, current, completed}]
    xp_earned    INT DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, mission_date)
);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_own" ON daily_missions FOR ALL USING (auth.uid() = user_id);

-- ─── Player Progress ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_progress (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    total_xp      INT DEFAULT 0,
    qa_rank       TEXT DEFAULT 'QA Novice',
    streak_days   INT DEFAULT 0,
    last_played   DATE,
    runs_completed INT DEFAULT 0,
    bugs_found    INT DEFAULT 0,
    accuracy_avg  FLOAT DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own" ON player_progress FOR ALL USING (auth.uid() = user_id);
