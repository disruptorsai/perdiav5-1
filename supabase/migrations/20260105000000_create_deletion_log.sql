-- Migration: Create deletion_log table for tracking deleted content with reasons
-- This allows soft tracking of deletions even though we do hard deletes

CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- What was deleted
  entity_type TEXT NOT NULL CHECK (entity_type IN ('content_idea', 'article')),
  entity_id UUID NOT NULL,
  entity_title TEXT, -- Store title for reference after deletion

  -- Who and when
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Why - the key reason tracking
  deletion_category TEXT NOT NULL CHECK (deletion_category IN (
    'irrelevant_topic',       -- Topic doesn't fit our content strategy
    'not_monetizable',        -- No monetization potential (space tourism, etc.)
    'duplicate_content',      -- Similar article already exists
    'outdated_information',   -- Information is stale or no longer accurate
    'poor_quality',           -- Quality too low to salvage
    'wrong_audience',         -- Doesn't match target audience
    'compliance_issue',       -- Legal, copyright, or policy concerns
    'test_content',           -- Was just testing, not real content
    'client_request',         -- Client asked us to remove it
    'other'                   -- Other reason (use notes)
  )),
  deletion_reason TEXT,       -- Detailed explanation
  additional_notes TEXT,      -- Any extra context

  -- Metadata snapshot for AI training
  entity_metadata JSONB DEFAULT '{}', -- Store relevant fields for learning

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up deletions by entity
CREATE INDEX IF NOT EXISTS idx_deletion_log_entity ON deletion_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_deletion_log_category ON deletion_log(deletion_category);
CREATE INDEX IF NOT EXISTS idx_deletion_log_deleted_at ON deletion_log(deleted_at DESC);

-- RLS policies
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view deletion log
DROP POLICY IF EXISTS "Users can view deletion log" ON deletion_log;
CREATE POLICY "Users can view deletion log"
  ON deletion_log FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert to deletion log
DROP POLICY IF EXISTS "Users can insert to deletion log" ON deletion_log;
CREATE POLICY "Users can insert to deletion log"
  ON deletion_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE deletion_log IS 'Tracks deleted content with reasons for AI learning and audit trail';
