-- Create ai_revisions table for AI Training workflow
-- As per GetEducated spec section 8.4: AI Training & Revision Log
-- This table tracks all AI revisions triggered by human feedback for training purposes

CREATE TABLE IF NOT EXISTS ai_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Article reference
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Version tracking
  previous_version TEXT NOT NULL,      -- Article body before revision
  revised_version TEXT NOT NULL,       -- Article body after AI revision

  -- Feedback context
  comments_snapshot JSONB DEFAULT '[]'::jsonb,  -- All comments present when revision ran

  -- Who triggered this revision
  triggered_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Training configuration
  include_in_training BOOLEAN DEFAULT true,  -- Can toggle off if revision not representative

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: track which AI model was used
  model_used TEXT DEFAULT 'claude-sonnet-4',
  revision_type TEXT DEFAULT 'feedback'  -- 'feedback', 'auto_fix', 'humanize', 'quality_improvement'
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_revisions_article_id ON ai_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_triggered_by ON ai_revisions(triggered_by_user);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_created_at ON ai_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_include_training ON ai_revisions(include_in_training) WHERE include_in_training = true;

-- Enable RLS
ALTER TABLE ai_revisions ENABLE ROW LEVEL SECURITY;

-- Users can view revisions for articles they own
CREATE POLICY "Users can view their article revisions" ON ai_revisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = ai_revisions.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Users can create revisions for their own articles
CREATE POLICY "Users can create revisions for their articles" ON ai_revisions
  FOR INSERT TO authenticated
  WITH CHECK (
    triggered_by_user = auth.uid()
    AND EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = ai_revisions.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Users can update training flag on their revisions
CREATE POLICY "Users can update their revisions" ON ai_revisions
  FOR UPDATE TO authenticated
  USING (triggered_by_user = auth.uid())
  WITH CHECK (triggered_by_user = auth.uid());

-- Table comments
COMMENT ON TABLE ai_revisions IS 'Tracks AI revisions triggered by editorial feedback. Used for AI training and improvement. Per GetEducated spec section 8.4.';
COMMENT ON COLUMN ai_revisions.previous_version IS 'Article content before AI revision';
COMMENT ON COLUMN ai_revisions.revised_version IS 'Article content after AI revision';
COMMENT ON COLUMN ai_revisions.comments_snapshot IS 'JSON array of comments that were present when revision was triggered';
COMMENT ON COLUMN ai_revisions.include_in_training IS 'Whether to include this revision in AI training data. Default true per Kayleigh requirements.';

-- Create view for AI training data export
CREATE OR REPLACE VIEW ai_training_export AS
SELECT
  ar.id,
  ar.article_id,
  a.title AS article_title,
  ar.previous_version,
  ar.revised_version,
  ar.comments_snapshot,
  ar.revision_type,
  ar.model_used,
  ar.created_at,
  u.email AS triggered_by_email
FROM ai_revisions ar
JOIN articles a ON a.id = ar.article_id
LEFT JOIN auth.users u ON u.id = ar.triggered_by_user
WHERE ar.include_in_training = true
ORDER BY ar.created_at DESC;

-- Grant access to authenticated users for the view
GRANT SELECT ON ai_training_export TO authenticated;
