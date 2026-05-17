-- Add execution workflow fields to test_case_rows
ALTER TABLE test_case_rows
  ADD COLUMN IF NOT EXISTS dev_status     TEXT DEFAULT 'Open',
  ADD COLUMN IF NOT EXISTS retest_status  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_owner       TEXT,
  ADD COLUMN IF NOT EXISTS assigned_dev   TEXT,
  ADD COLUMN IF NOT EXISTS sprint         TEXT,
  ADD COLUMN IF NOT EXISTS environment    TEXT,
  ADD COLUMN IF NOT EXISTS platform       TEXT,
  ADD COLUMN IF NOT EXISTS version        TEXT,
  ADD COLUMN IF NOT EXISTS client         TEXT,
  ADD COLUMN IF NOT EXISTS evidence_urls  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activity_log   JSONB  DEFAULT '[]';

-- Add metadata fields to test_suites
ALTER TABLE test_suites
  ADD COLUMN IF NOT EXISTS client         TEXT,
  ADD COLUMN IF NOT EXISTS sprint         TEXT,
  ADD COLUMN IF NOT EXISTS environment    TEXT,
  ADD COLUMN IF NOT EXISTS platform       TEXT,
  ADD COLUMN IF NOT EXISTS release_version TEXT,
  ADD COLUMN IF NOT EXISTS qa_owner       TEXT;
