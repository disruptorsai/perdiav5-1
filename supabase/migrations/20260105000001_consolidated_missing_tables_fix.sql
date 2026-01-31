-- ============================================================================
-- CONSOLIDATED FIX: Missing Tables and Columns
-- ============================================================================
-- This migration consolidates all missing database objects that are causing
-- 406 and 400 errors in the application.
--
-- FIXES:
-- 1. ai_learning_sessions table (406 errors)
-- 2. idea_feedback_history table (406 errors)
-- 3. article_feedback table (406 errors)
-- 4. Missing columns on content_ideas (400 errors on insert)
-- 5. All related RLS policies and functions
--
-- DATE: 2026-01-05
-- SAFE TO RE-RUN: Yes (uses IF NOT EXISTS throughout)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENSURE update_updated_at_column FUNCTION EXISTS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CONTENT_IDEAS - ADD MISSING COLUMNS
-- ============================================================================

-- Feedback columns
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS feedback_score INTEGER DEFAULT 0;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS rejection_category TEXT;

-- Add check constraint for rejection_category if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_ideas_rejection_category_check'
  ) THEN
    ALTER TABLE content_ideas
    ADD CONSTRAINT content_ideas_rejection_category_check
    CHECK (rejection_category IS NULL OR rejection_category IN (
      'off_topic', 'duplicate', 'low_quality', 'wrong_audience',
      'not_actionable', 'competitive', 'outdated', 'other'
    ));
  END IF;
END $$;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS feedback_notes TEXT;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Content type and keywords columns
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS content_type TEXT;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS target_keywords TEXT[];

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS search_intent TEXT;

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS trending_reason TEXT;

-- Create indexes for content_ideas
CREATE INDEX IF NOT EXISTS idx_ideas_feedback_score ON content_ideas(feedback_score);
CREATE INDEX IF NOT EXISTS idx_ideas_rejection_category ON content_ideas(rejection_category) WHERE rejection_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ideas_content_type ON content_ideas(content_type);
CREATE INDEX IF NOT EXISTS idx_ideas_source ON content_ideas(source);

-- ============================================================================
-- 3. AI_LEARNING_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session metadata
  session_type TEXT NOT NULL CHECK (session_type IN ('idea_generation', 'content_writing', 'title_optimization')),

  -- Feedback used in this session
  feedback_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,

  -- What feedback was included
  feedback_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- The improved prompt/configuration generated
  original_prompt TEXT,
  improved_prompt TEXT,
  improvement_notes TEXT,

  -- Patterns learned
  learned_patterns JSONB DEFAULT '{}'::JSONB,

  -- Application status
  is_active BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ai_learning_sessions
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active ON ai_learning_sessions(session_type, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON ai_learning_sessions(session_type);

-- Now add the foreign key column to content_ideas (after ai_learning_sessions exists)
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS generation_session_id UUID REFERENCES ai_learning_sessions(id);

-- ============================================================================
-- 4. IDEA_FEEDBACK_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idea_feedback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,

  -- Decision data
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'thumbs_up', 'thumbs_down')),

  -- For rejections: detailed categorization
  rejection_category TEXT CHECK (rejection_category IS NULL OR rejection_category IN (
    'off_topic', 'duplicate', 'low_quality', 'wrong_audience',
    'not_actionable', 'competitive', 'outdated', 'other'
  )),
  rejection_reason TEXT,

  -- Idea snapshot at time of decision (for AI learning)
  idea_title TEXT NOT NULL,
  idea_description TEXT,
  idea_source TEXT,
  idea_content_type TEXT,
  idea_keywords TEXT[],

  -- Additional context
  feedback_notes TEXT,

  -- Audit fields
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ DEFAULT NOW(),

  -- AI learning status
  used_for_training BOOLEAN DEFAULT FALSE,
  training_batch_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for idea_feedback_history
CREATE INDEX IF NOT EXISTS idx_feedback_history_idea ON idea_feedback_history(idea_id);
CREATE INDEX IF NOT EXISTS idx_feedback_history_decision ON idea_feedback_history(decision);
CREATE INDEX IF NOT EXISTS idx_feedback_history_category ON idea_feedback_history(rejection_category) WHERE rejection_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_history_decided_at ON idea_feedback_history(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_history_training ON idea_feedback_history(used_for_training) WHERE used_for_training = FALSE;

-- ============================================================================
-- 5. ARTICLE_FEEDBACK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback type: positive (thumbs up) or negative (thumbs down)
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),

  -- Optional comment for negative feedback
  comment TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one feedback per user per article
  UNIQUE(article_id, user_id)
);

-- Create indexes for article_feedback
CREATE INDEX IF NOT EXISTS idx_article_feedback_article ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_user ON article_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_type ON article_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_article_feedback_created ON article_feedback(created_at DESC);

-- ============================================================================
-- 6. DEFAULT_AUTHOR_BY_ARTICLE_TYPE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS default_author_by_article_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type TEXT NOT NULL UNIQUE,
  default_author_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_default_author_article_type ON default_author_by_article_type(article_type);

-- ============================================================================
-- 7. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE ai_learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_author_by_article_type ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES - AI_LEARNING_SESSIONS
-- ============================================================================

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

DROP POLICY IF EXISTS "Users can delete learning sessions" ON ai_learning_sessions;
CREATE POLICY "Users can delete learning sessions"
  ON ai_learning_sessions FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to learning sessions" ON ai_learning_sessions;
CREATE POLICY "Service role full access to learning sessions"
  ON ai_learning_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. RLS POLICIES - IDEA_FEEDBACK_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all feedback history" ON idea_feedback_history;
CREATE POLICY "Users can view all feedback history"
  ON idea_feedback_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create feedback" ON idea_feedback_history;
CREATE POLICY "Users can create feedback"
  ON idea_feedback_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update feedback" ON idea_feedback_history;
CREATE POLICY "Users can update feedback"
  ON idea_feedback_history FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access to feedback" ON idea_feedback_history;
CREATE POLICY "Service role full access to feedback"
  ON idea_feedback_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 10. RLS POLICIES - ARTICLE_FEEDBACK
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all article feedback" ON article_feedback;
CREATE POLICY "Users can view all article feedback"
  ON article_feedback FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create article feedback" ON article_feedback;
CREATE POLICY "Users can create article feedback"
  ON article_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedback" ON article_feedback;
CREATE POLICY "Users can update own feedback"
  ON article_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedback" ON article_feedback;
CREATE POLICY "Users can delete own feedback"
  ON article_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to article feedback" ON article_feedback;
CREATE POLICY "Service role full access to article feedback"
  ON article_feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 11. RLS POLICIES - DEFAULT_AUTHOR_BY_ARTICLE_TYPE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read default author config" ON default_author_by_article_type;
CREATE POLICY "Anyone can read default author config"
  ON default_author_by_article_type FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 12. VIEWS
-- ============================================================================

-- Article feedback summary view
CREATE OR REPLACE VIEW article_feedback_summary AS
SELECT
  article_id,
  COUNT(*) FILTER (WHERE feedback_type = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE feedback_type = 'negative') as negative_count,
  COUNT(*) as total_count,
  BOOL_OR(feedback_type = 'negative' AND comment IS NOT NULL) as has_negative_comments
FROM article_feedback
GROUP BY article_id;

-- Idea feedback analytics view
CREATE OR REPLACE VIEW idea_feedback_analytics AS
SELECT
  decision,
  rejection_category,
  idea_source,
  idea_content_type,
  COUNT(*) as count,
  DATE_TRUNC('day', decided_at) as decision_date
FROM idea_feedback_history
GROUP BY decision, rejection_category, idea_source, idea_content_type, DATE_TRUNC('day', decided_at)
ORDER BY decision_date DESC;

-- ============================================================================
-- 13. HELPER FUNCTIONS
-- ============================================================================

-- Function to record feedback
CREATE OR REPLACE FUNCTION record_idea_feedback(
  p_idea_id UUID,
  p_decision TEXT,
  p_rejection_category TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_feedback_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_idea RECORD;
  v_history_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT title, description, source, content_type, target_keywords
  INTO v_idea
  FROM content_ideas
  WHERE id = p_idea_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idea not found: %', p_idea_id;
  END IF;

  INSERT INTO idea_feedback_history (
    idea_id, decision, rejection_category, rejection_reason,
    idea_title, idea_description, idea_source, idea_content_type, idea_keywords,
    feedback_notes, decided_by
  ) VALUES (
    p_idea_id, p_decision, p_rejection_category, p_rejection_reason,
    v_idea.title, v_idea.description, v_idea.source, v_idea.content_type, v_idea.target_keywords,
    p_feedback_notes, v_user_id
  )
  RETURNING id INTO v_history_id;

  IF p_decision = 'approved' THEN
    UPDATE content_ideas SET
      status = 'approved',
      feedback_score = COALESCE(feedback_score, 0) + 1,
      feedback_notes = p_feedback_notes,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'rejected' THEN
    UPDATE content_ideas SET
      status = 'rejected',
      feedback_score = COALESCE(feedback_score, 0) - 1,
      rejection_category = p_rejection_category,
      rejection_reason = p_rejection_reason,
      feedback_notes = p_feedback_notes,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'thumbs_up' THEN
    UPDATE content_ideas SET
      feedback_score = COALESCE(feedback_score, 0) + 1,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'thumbs_down' THEN
    UPDATE content_ideas SET
      feedback_score = COALESCE(feedback_score, 0) - 1,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  END IF;

  RETURN v_history_id;
END;
$$;

-- Function to get article feedback counts
CREATE OR REPLACE FUNCTION get_article_feedback_counts(p_article_id UUID)
RETURNS TABLE (
  positive INTEGER,
  negative INTEGER,
  total INTEGER,
  has_negative_comments BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE feedback_type = 'positive')::INTEGER,
    COUNT(*) FILTER (WHERE feedback_type = 'negative')::INTEGER,
    COUNT(*)::INTEGER,
    BOOL_OR(feedback_type = 'negative' AND comment IS NOT NULL)
  FROM article_feedback
  WHERE article_id = p_article_id;
END;
$$;

-- Function to get unprocessed feedback for AI learning
CREATE OR REPLACE FUNCTION get_feedback_for_learning(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  decision TEXT,
  rejection_category TEXT,
  rejection_reason TEXT,
  idea_title TEXT,
  idea_description TEXT,
  idea_source TEXT,
  idea_content_type TEXT,
  idea_keywords TEXT[],
  feedback_notes TEXT,
  decided_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id, h.decision, h.rejection_category, h.rejection_reason,
    h.idea_title, h.idea_description, h.idea_source, h.idea_content_type, h.idea_keywords,
    h.feedback_notes, h.decided_at
  FROM idea_feedback_history h
  WHERE h.used_for_training = FALSE
  ORDER BY h.decided_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to mark feedback as trained
CREATE OR REPLACE FUNCTION mark_feedback_as_trained(
  p_feedback_ids UUID[],
  p_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE idea_feedback_history
  SET used_for_training = TRUE, training_batch_id = p_session_id
  WHERE id = ANY(p_feedback_ids) AND used_for_training = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 14. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION record_idea_feedback(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_article_feedback_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_for_learning(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_feedback_as_trained(UUID[], UUID) TO authenticated;

-- ============================================================================
-- 15. SEED DEFAULT AUTHOR MAPPINGS
-- ============================================================================

INSERT INTO default_author_by_article_type (article_type, default_author_name, description) VALUES
  ('ranking', 'Tony Huffman', 'Tony is the face of rankings and ranking-report content'),
  ('comparison', 'Tony Huffman', 'Cost analysis and affordability comparisons'),
  ('analysis', 'Tony Huffman', 'Data-driven analysis pieces'),
  ('landing-page', 'Tony Huffman', 'Ranking landing pages'),
  ('program_list', 'Kayleigh Gilbert', 'Detailed program breakdowns and degree roundups'),
  ('listicle', 'Kayleigh Gilbert', 'List-based content with rankings'),
  ('career-guide', 'Kayleigh Gilbert', 'Career-focused program guides'),
  ('guide', 'Sara', 'General guides and overviews'),
  ('explainer', 'Sara', 'Educational explainer content'),
  ('overview', 'Sara', 'Broad topic overviews'),
  ('tutorial', 'Charity', 'Step-by-step tutorials'),
  ('how-to', 'Charity', 'Practical how-to guides'),
  ('certification', 'Charity', 'Certification pathway content')
ON CONFLICT (article_type) DO UPDATE SET
  default_author_name = EXCLUDED.default_author_name,
  description = EXCLUDED.description,
  is_active = true;

-- ============================================================================
-- 16. TRIGGERS
-- ============================================================================

-- Trigger for default_author_by_article_type updated_at
DROP TRIGGER IF EXISTS update_default_author_config_updated_at ON default_author_by_article_type;
CREATE TRIGGER update_default_author_config_updated_at
  BEFORE UPDATE ON default_author_by_article_type
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for article_feedback updated_at
CREATE OR REPLACE FUNCTION update_article_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_feedback_updated_at ON article_feedback;
CREATE TRIGGER article_feedback_updated_at
  BEFORE UPDATE ON article_feedback
  FOR EACH ROW EXECUTE FUNCTION update_article_feedback_updated_at();

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY - Run this after migration to verify everything exists
-- ============================================================================
-- SELECT
--   'ai_learning_sessions' as table_name,
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_learning_sessions') as exists
-- UNION ALL SELECT
--   'idea_feedback_history',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'idea_feedback_history')
-- UNION ALL SELECT
--   'article_feedback',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_feedback')
-- UNION ALL SELECT
--   'default_author_by_article_type',
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'default_author_by_article_type');
-- ============================================================================
