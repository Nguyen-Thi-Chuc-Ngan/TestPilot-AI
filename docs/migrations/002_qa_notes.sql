-- QA Notes table
CREATE TABLE IF NOT EXISTS qa_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT DEFAULT '',
    tags       TEXT[] DEFAULT '{}',
    pinned     BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_notes_user_id ON qa_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_notes_pinned  ON qa_notes(pinned);

ALTER TABLE qa_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_notes_own" ON qa_notes FOR ALL USING (auth.uid() = user_id);
