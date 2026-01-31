-- ============================================================================
-- FIX: Shortcodes table missing is_active column + other bug fixes
-- ============================================================================
-- Date: 2026-01-12
-- Fixes:
-- 1. Add is_active column to shortcodes table (400 errors)
-- 2. Update Claude model reference in settings
-- SAFE TO RE-RUN: Yes (uses IF NOT EXISTS)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD is_active COLUMN TO SHORTCODES TABLE
-- ============================================================================

ALTER TABLE shortcodes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for filtering by is_active
CREATE INDEX IF NOT EXISTS idx_shortcodes_is_active ON shortcodes(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. UPDATE CLAUDE MODEL IN SETTINGS (if exists)
-- ============================================================================

UPDATE system_settings
SET value = 'claude-sonnet-4-20250514'
WHERE key = 'claude_model'
  AND value = 'claude-3-5-sonnet-20250122';

-- ============================================================================
-- 3. ENSURE ai_learning_sessions EXISTS (from consolidated fix)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('idea_generation', 'content_writing', 'title_optimization')),
  feedback_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  feedback_ids UUID[] DEFAULT ARRAY[]::UUID[],
  original_prompt TEXT,
  improved_prompt TEXT,
  improvement_notes TEXT,
  learned_patterns JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active ON ai_learning_sessions(session_type, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON ai_learning_sessions(session_type);

-- RLS Policies for ai_learning_sessions
DROP POLICY IF EXISTS "Users can view all learning sessions" ON ai_learning_sessions;
CREATE POLICY "Users can view all learning sessions"
  ON ai_learning_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create learning sessions" ON ai_learning_sessions;
CREATE POLICY "Users can create learning sessions"
  ON ai_learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update learning sessions" ON ai_learning_sessions;
CREATE POLICY "Users can update learning sessions"
  ON ai_learning_sessions FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to learning sessions" ON ai_learning_sessions;
CREATE POLICY "Service role full access to learning sessions"
  ON ai_learning_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO ARTICLES TABLE
-- ============================================================================

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rules_applied_at TIMESTAMPTZ;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rules_version INTEGER DEFAULT 1;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS quality_issues JSONB DEFAULT '[]'::JSONB;

-- Create index for rules version tracking
CREATE INDEX IF NOT EXISTS idx_articles_rules_version ON articles(rules_version);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run after migration to verify:
-- SELECT
--   'shortcodes.is_active' as check_item,
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shortcodes' AND column_name = 'is_active') as exists
-- UNION ALL SELECT
--   'ai_learning_sessions table',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_learning_sessions');
