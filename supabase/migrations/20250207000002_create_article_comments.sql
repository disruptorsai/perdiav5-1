-- Migration: Create article_comments table
-- DESCRIPTION: Creates the article_comments table for granular text selection feedback
-- TABLES: article_comments, pending_article_comments (view)
-- DEPENDENCIES: articles table and ai_revisions table must exist

CREATE TABLE IF NOT EXISTS article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL,
  selection_start INTEGER,
  selection_end INTEGER,
  category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'minor',
  feedback TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  addressed_at TIMESTAMPTZ,
  addressed_by_revision UUID REFERENCES ai_revisions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_severity ON article_comments(severity);

ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view article comments" ON article_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_comments.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments" ON article_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_comments.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their comments" ON article_comments
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their pending comments" ON article_comments
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND status = 'pending');

COMMENT ON TABLE article_comments IS 'Granular text selection comments for editorial feedback.';

CREATE OR REPLACE VIEW pending_article_comments AS
SELECT
  ac.*,
  a.title AS article_title,
  u.email AS created_by_email
FROM article_comments ac
JOIN articles a ON a.id = ac.article_id
LEFT JOIN auth.users u ON u.id = ac.created_by
WHERE ac.status = 'pending'
ORDER BY ac.created_at DESC;

GRANT SELECT ON pending_article_comments TO authenticated;
