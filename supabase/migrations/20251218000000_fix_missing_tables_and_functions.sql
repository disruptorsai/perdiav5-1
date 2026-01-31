-- ============================================================================
-- MIGRATION: Fix Missing Tables and Functions
-- ============================================================================
-- DESCRIPTION: Creates missing tables and functions that were defined in
--              previous migrations but not applied to Supabase
-- TABLES: idea_feedback_history, ai_learning_sessions, default_author_by_article_type
-- FUNCTIONS: record_idea_feedback, get_feedback_for_learning, mark_feedback_as_trained
-- DEPENDENCIES: content_ideas, auth.users, system_settings
-- DATE: 2025-12-18
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DEFAULT AUTHOR BY ARTICLE TYPE TABLE
-- ============================================================================
-- Per GetEducated spec section 8.2.2: Default Author per Article Type

CREATE TABLE IF NOT EXISTS default_author_by_article_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type TEXT NOT NULL UNIQUE,  -- 'ranking', 'program_list', 'guide', etc.
  default_author_name TEXT NOT NULL,  -- 'Tony Huffman', 'Kayleigh Gilbert', etc.
  description TEXT,                    -- Why this author is default for this type
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE default_author_by_article_type ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Anyone can read default author config" ON default_author_by_article_type;
CREATE POLICY "Anyone can read default author config" ON default_author_by_article_type
  FOR SELECT TO authenticated USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_default_author_article_type ON default_author_by_article_type(article_type);

-- Add trigger for updated_at (if function exists)
DROP TRIGGER IF EXISTS update_default_author_config_updated_at ON default_author_by_article_type;
CREATE TRIGGER update_default_author_config_updated_at BEFORE UPDATE ON default_author_by_article_type
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default author mappings per GetEducated requirements
INSERT INTO default_author_by_article_type (article_type, default_author_name, description) VALUES
  -- Tony Huffman - Ranking landing pages & Best Buy reports (authoritative, data-driven)
  ('ranking', 'Tony Huffman', 'Tony is the face of rankings and ranking-report content'),
  ('comparison', 'Tony Huffman', 'Cost analysis and affordability comparisons'),
  ('analysis', 'Tony Huffman', 'Data-driven analysis pieces'),
  ('landing-page', 'Tony Huffman', 'Ranking landing pages'),

  -- Kayleigh Gilbert - Program lists / degree roundups (detailed, comprehensive)
  ('program_list', 'Kayleigh Gilbert', 'Detailed program breakdowns and degree roundups'),
  ('listicle', 'Kayleigh Gilbert', 'List-based content with rankings'),
  ('career-guide', 'Kayleigh Gilbert', 'Career-focused program guides'),

  -- Sara - Technical education, general guides (accessible, broad)
  ('guide', 'Sara', 'General guides and overviews, accessible explanations'),
  ('explainer', 'Sara', 'Educational explainer content'),
  ('overview', 'Sara', 'Broad topic overviews'),

  -- Charity - Teaching degrees, certification paths (practical, career-focused)
  ('tutorial', 'Charity', 'Step-by-step tutorials and how-to content'),
  ('how-to', 'Charity', 'Practical how-to guides'),
  ('certification', 'Charity', 'Certification pathway content')
ON CONFLICT (article_type) DO UPDATE SET
  default_author_name = EXCLUDED.default_author_name,
  description = EXCLUDED.description,
  is_active = true;

-- Table comments
COMMENT ON TABLE default_author_by_article_type IS 'Maps article types to default primary authors. Per GetEducated spec section 8.2.2.';
COMMENT ON COLUMN default_author_by_article_type.article_type IS 'Content type (ranking, guide, listicle, etc.)';
COMMENT ON COLUMN default_author_by_article_type.default_author_name IS 'Must be one of the 4 approved authors: Tony Huffman, Kayleigh Gilbert, Sara, Charity';


-- ============================================================================
-- 2. IDEA FEEDBACK HISTORY TABLE
-- ============================================================================
-- Track all approval/rejection decisions for AI learning

CREATE TABLE IF NOT EXISTS idea_feedback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,

  -- Decision data
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'thumbs_up', 'thumbs_down')),

  -- For rejections: detailed categorization
  rejection_category TEXT CHECK (rejection_category IN (
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_feedback_history_idea ON idea_feedback_history(idea_id);
CREATE INDEX IF NOT EXISTS idx_feedback_history_decision ON idea_feedback_history(decision);
CREATE INDEX IF NOT EXISTS idx_feedback_history_category ON idea_feedback_history(rejection_category) WHERE rejection_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_history_decided_at ON idea_feedback_history(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_history_training ON idea_feedback_history(used_for_training) WHERE used_for_training = FALSE;


-- ============================================================================
-- 3. AI LEARNING SESSIONS TABLE
-- ============================================================================
-- Track prompt improvement attempts

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
  -- Example structure:
  -- {
  --   "avoid_topics": ["topic1", "topic2"],
  --   "preferred_content_types": ["guide", "career_guide"],
  --   "good_title_patterns": ["How to...", "Best..."],
  --   "bad_title_patterns": ["...", "..."],
  --   "preferred_sources": ["reddit", "trends"],
  --   "keyword_preferences": {...}
  -- }

  -- Application status
  is_active BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for active learning sessions
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active ON ai_learning_sessions(session_type, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON ai_learning_sessions(session_type);


-- ============================================================================
-- 4. UPDATE CONTENT_IDEAS TABLE
-- ============================================================================
-- Add column for tracking generation context

ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS generation_session_id UUID REFERENCES ai_learning_sessions(id);


-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE idea_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Idea Feedback History policies
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

-- Learning sessions policies
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
-- 6. FUNCTIONS
-- ============================================================================

-- Function to record feedback (creates history and updates idea)
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
  -- Get current user
  v_user_id := auth.uid();

  -- Get idea details for snapshot
  SELECT title, description, source, content_type, target_keywords
  INTO v_idea
  FROM content_ideas
  WHERE id = p_idea_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idea not found: %', p_idea_id;
  END IF;

  -- Insert feedback history record
  INSERT INTO idea_feedback_history (
    idea_id,
    decision,
    rejection_category,
    rejection_reason,
    idea_title,
    idea_description,
    idea_source,
    idea_content_type,
    idea_keywords,
    feedback_notes,
    decided_by
  ) VALUES (
    p_idea_id,
    p_decision,
    p_rejection_category,
    p_rejection_reason,
    v_idea.title,
    v_idea.description,
    v_idea.source,
    v_idea.content_type,
    v_idea.target_keywords,
    p_feedback_notes,
    v_user_id
  )
  RETURNING id INTO v_history_id;

  -- Update the idea based on decision type
  IF p_decision = 'approved' THEN
    UPDATE content_ideas
    SET
      status = 'approved',
      feedback_score = COALESCE(feedback_score, 0) + 1,
      feedback_notes = p_feedback_notes,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'rejected' THEN
    UPDATE content_ideas
    SET
      status = 'rejected',
      feedback_score = COALESCE(feedback_score, 0) - 1,
      rejection_category = p_rejection_category,
      rejection_reason = p_rejection_reason,
      feedback_notes = p_feedback_notes,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'thumbs_up' THEN
    UPDATE content_ideas
    SET
      feedback_score = COALESCE(feedback_score, 0) + 1,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  ELSIF p_decision = 'thumbs_down' THEN
    UPDATE content_ideas
    SET
      feedback_score = COALESCE(feedback_score, 0) - 1,
      reviewed_by = v_user_id,
      reviewed_at = NOW()
    WHERE id = p_idea_id;
  END IF;

  RETURN v_history_id;
END;
$$;

-- Function to get unprocessed feedback for AI learning
CREATE OR REPLACE FUNCTION get_feedback_for_learning(
  p_limit INTEGER DEFAULT 100
)
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
    h.id,
    h.decision,
    h.rejection_category,
    h.rejection_reason,
    h.idea_title,
    h.idea_description,
    h.idea_source,
    h.idea_content_type,
    h.idea_keywords,
    h.feedback_notes,
    h.decided_at
  FROM idea_feedback_history h
  WHERE h.used_for_training = FALSE
  ORDER BY h.decided_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to mark feedback as used for training
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
  SET
    used_for_training = TRUE,
    training_batch_id = p_session_id
  WHERE id = ANY(p_feedback_ids)
  AND used_for_training = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION record_idea_feedback(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_for_learning(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_feedback_as_trained(UUID[], UUID) TO authenticated;


-- ============================================================================
-- 8. OPTIONAL: ADD SYSTEM SETTINGS FOR WORKFLOW
-- ============================================================================

INSERT INTO system_settings (key, value, category, description) VALUES
  ('initial_review_required', 'true', 'workflow', 'Human review required for all content in initial phase'),
  ('min_internal_links', '3', 'content', 'Minimum internal links required per article'),
  ('min_external_links', '1', 'content', 'Minimum external citations required per article'),
  ('target_word_count_min', '1500', 'content', 'Minimum target word count'),
  ('target_word_count_max', '2500', 'content', 'Maximum target word count'),
  ('quality_threshold', '80', 'qa', 'Minimum quality score for auto-publish consideration')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  description = EXCLUDED.description;


-- ============================================================================
-- 9. CREATE VIEW FOR FEEDBACK ANALYTICS
-- ============================================================================

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


COMMIT;

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP VIEW IF EXISTS idea_feedback_analytics;
-- DROP FUNCTION IF EXISTS mark_feedback_as_trained(UUID[], UUID);
-- DROP FUNCTION IF EXISTS get_feedback_for_learning(INTEGER);
-- DROP FUNCTION IF EXISTS record_idea_feedback(UUID, TEXT, TEXT, TEXT, TEXT);
-- ALTER TABLE content_ideas DROP COLUMN IF EXISTS generation_session_id;
-- DROP TABLE IF EXISTS ai_learning_sessions;
-- DROP TABLE IF EXISTS idea_feedback_history;
-- DROP TABLE IF EXISTS default_author_by_article_type;
-- DELETE FROM system_settings WHERE key IN (
--   'initial_review_required', 'min_internal_links', 'min_external_links',
--   'target_word_count_min', 'target_word_count_max', 'quality_threshold'
-- );
-- ============================================================================
