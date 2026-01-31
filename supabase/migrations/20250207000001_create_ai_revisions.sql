-- Migration: Create ai_revisions table
-- DESCRIPTION: Creates the ai_revisions table for AI Training workflow
-- TABLES: ai_revisions, ai_training_export (view)
-- DEPENDENCIES: articles table must exist

-- Create ai_revisions table for AI Training workflow
CREATE TABLE IF NOT EXISTS ai_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  previous_version TEXT NOT NULL,
  revised_version TEXT NOT NULL,
  comments_snapshot JSONB DEFAULT '[]'::jsonb,
  triggered_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  include_in_training BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  model_used TEXT DEFAULT 'claude-sonnet-4',
  revision_type TEXT DEFAULT 'feedback'
);

CREATE INDEX IF NOT EXISTS idx_ai_revisions_article_id ON ai_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_triggered_by ON ai_revisions(triggered_by_user);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_created_at ON ai_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_revisions_include_training ON ai_revisions(include_in_training) WHERE include_in_training = true;

ALTER TABLE ai_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their article revisions" ON ai_revisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = ai_revisions.article_id
      AND articles.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can update their revisions" ON ai_revisions
  FOR UPDATE TO authenticated
  USING (triggered_by_user = auth.uid())
  WITH CHECK (triggered_by_user = auth.uid());

COMMENT ON TABLE ai_revisions IS 'Tracks AI revisions triggered by editorial feedback. Used for AI training and improvement.';

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

GRANT SELECT ON ai_training_export TO authenticated;
