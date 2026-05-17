-- Battle sessions
CREATE TABLE IF NOT EXISTS battle_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    human_bugs   TEXT[] DEFAULT '{}',
    ai_bugs      TEXT[] DEFAULT '{}',
    human_score  INT DEFAULT 0,
    ai_score     INT DEFAULT 0,
    time_taken   INT DEFAULT 0,
    winner       TEXT DEFAULT 'ai',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_sessions_user ON battle_sessions(user_id);
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_own" ON battle_sessions FOR ALL USING (auth.uid() = user_id);

-- Panic sessions
CREATE TABLE IF NOT EXISTS panic_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scenario_id  TEXT NOT NULL,
    answer       JSONB DEFAULT '{}',
    score        INT DEFAULT 0,
    feedback     JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panic_sessions_user ON panic_sessions(user_id);
ALTER TABLE panic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "panic_own" ON panic_sessions FOR ALL USING (auth.uid() = user_id);
