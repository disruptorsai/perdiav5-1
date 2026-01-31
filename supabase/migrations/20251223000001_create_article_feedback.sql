-- Create article_feedback table for editor/reviewer thumbs up/down feedback
-- Per Dec 22, 2025 meeting - enables feedback on articles in editor and library

-- Create the article_feedback table
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_article_feedback_article ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_user ON article_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_type ON article_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_article_feedback_created ON article_feedback(created_at DESC);

-- Create a view for feedback summary by article
CREATE OR REPLACE VIEW article_feedback_summary AS
SELECT
  article_id,
  COUNT(*) FILTER (WHERE feedback_type = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE feedback_type = 'negative') as negative_count,
  COUNT(*) as total_count,
  BOOL_OR(feedback_type = 'negative' AND comment IS NOT NULL) as has_negative_comments
FROM article_feedback
GROUP BY article_id;

-- Create function to get feedback counts for an article
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

-- Create function to get articles with negative feedback that need attention
CREATE OR REPLACE FUNCTION get_articles_needing_attention(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  article_id UUID,
  article_title TEXT,
  negative_count BIGINT,
  negative_comments TEXT[],
  latest_feedback_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    af.article_id,
    a.title,
    COUNT(*) FILTER (WHERE af.feedback_type = 'negative'),
    ARRAY_AGG(af.comment) FILTER (WHERE af.feedback_type = 'negative' AND af.comment IS NOT NULL),
    MAX(af.created_at)
  FROM article_feedback af
  JOIN articles a ON a.id = af.article_id
  WHERE af.feedback_type = 'negative'
  GROUP BY af.article_id, a.title
  HAVING COUNT(*) FILTER (WHERE af.feedback_type = 'negative') > 0
  ORDER BY COUNT(*) FILTER (WHERE af.feedback_type = 'negative') DESC, MAX(af.created_at) DESC
  LIMIT p_limit;
END;
$$;

-- Enable RLS
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exist first for idempotency)
DROP POLICY IF EXISTS "Users can view all article feedback" ON article_feedback;
DROP POLICY IF EXISTS "Users can create article feedback" ON article_feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON article_feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON article_feedback;
DROP POLICY IF EXISTS "Service role full access to article feedback" ON article_feedback;

-- Allow authenticated users to view all feedback
CREATE POLICY "Users can view all article feedback"
  ON article_feedback FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert feedback
CREATE POLICY "Users can create article feedback"
  ON article_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own feedback
CREATE POLICY "Users can update own feedback"
  ON article_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON article_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access to article feedback"
  ON article_feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_article_feedback_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_articles_needing_attention(INTEGER) TO authenticated;

-- Add trigger to update updated_at
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
  FOR EACH ROW
  EXECUTE FUNCTION update_article_feedback_updated_at();
