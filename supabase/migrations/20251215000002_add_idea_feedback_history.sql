-- Add idea_feedback_history table to track all approval/rejection decisions
-- This enables AI learning from user decisions

-- Create the feedback history table
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

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_feedback_history_idea ON idea_feedback_history(idea_id);
CREATE INDEX idx_feedback_history_decision ON idea_feedback_history(decision);
CREATE INDEX idx_feedback_history_category ON idea_feedback_history(rejection_category) WHERE rejection_category IS NOT NULL;
CREATE INDEX idx_feedback_history_decided_at ON idea_feedback_history(decided_at DESC);
CREATE INDEX idx_feedback_history_training ON idea_feedback_history(used_for_training) WHERE used_for_training = FALSE;

-- Create ai_learning_sessions table to track prompt improvement attempts
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active learning sessions
CREATE INDEX idx_learning_sessions_active ON ai_learning_sessions(session_type, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_learning_sessions_type ON ai_learning_sessions(session_type);

-- Add column to content_ideas for tracking generation context
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS generation_session_id UUID REFERENCES ai_learning_sessions(id);

-- Create view for feedback analytics
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

-- Create function to record feedback (creates history and updates idea)
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

-- Create function to get unprocessed feedback for AI learning
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

-- Create function to mark feedback as used for training
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

-- RLS Policies
ALTER TABLE idea_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all feedback history
CREATE POLICY "Users can view all feedback history"
  ON idea_feedback_history FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert feedback
CREATE POLICY "Users can create feedback"
  ON idea_feedback_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access to feedback"
  ON idea_feedback_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Learning sessions policies
CREATE POLICY "Users can view all learning sessions"
  ON ai_learning_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create learning sessions"
  ON ai_learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update learning sessions"
  ON ai_learning_sessions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access to learning sessions"
  ON ai_learning_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_idea_feedback(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_for_learning(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_feedback_as_trained(UUID[], UUID) TO authenticated;
