-- ─── Writing Corrections ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS writing_corrections (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    feature          TEXT NOT NULL,  -- fixer|translator|rewrite|communication
    original_text    TEXT NOT NULL,
    corrected_text   TEXT,
    explanation      TEXT,
    style            TEXT DEFAULT 'Professional QA',
    source_lang      TEXT DEFAULT 'en',  -- en|vi
    professionalism_score INT,           -- 1-10
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corrections_user ON writing_corrections(user_id);
ALTER TABLE writing_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corrections_own" ON writing_corrections FOR ALL USING (auth.uid() = user_id);

-- ─── Vocabulary Progress ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary_progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word         TEXT NOT NULL,
    category     TEXT NOT NULL,
    seen_count   INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    last_seen    TIMESTAMPTZ,
    difficulty   TEXT DEFAULT 'new',  -- new|learning|known
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word)
);
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab_own" ON vocabulary_progress FOR ALL USING (auth.uid() = user_id);

-- ─── English Progress ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS english_progress (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    professionalism_avg  FLOAT DEFAULT 0,
    corrections_count    INT DEFAULT 0,
    words_learned        INT DEFAULT 0,
    streak_days          INT DEFAULT 0,
    last_active          DATE,
    english_level        TEXT DEFAULT 'Beginner QA',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE english_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eng_progress_own" ON english_progress FOR ALL USING (auth.uid() = user_id);
