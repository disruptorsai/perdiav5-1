-- Create article_comments table for granular text selection feedback
-- This enables the commenting workflow where editors highlight text and add structured feedback

CREATE TABLE IF NOT EXISTS article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Article reference
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- The selected text that was highlighted
  selected_text TEXT NOT NULL,

  -- Position info for re-highlighting (optional, for more precise tracking)
  selection_start INTEGER,
  selection_end INTEGER,

  -- Structured feedback
  category TEXT NOT NULL DEFAULT 'general',  -- accuracy, tone, seo, structure, grammar, general
  severity TEXT NOT NULL DEFAULT 'minor',    -- minor, moderate, major, critical
  feedback TEXT NOT NULL,                     -- The actual feedback/instruction

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',     -- pending, addressed, dismissed

  -- Who created this comment
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  addressed_at TIMESTAMPTZ,

  -- Link to the AI revision that addressed this (if any)
  addressed_by_revision UUID REFERENCES ai_revisions(id) ON DELETE SET NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_severity ON article_comments(severity);

-- Enable RLS
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for articles they have access to
CREATE POLICY "Users can view article comments" ON article_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_comments.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Users can create comments for their own articles
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

-- Users can update their own comments
CREATE POLICY "Users can update their comments" ON article_comments
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own pending comments
CREATE POLICY "Users can delete their pending comments" ON article_comments
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND status = 'pending');

-- Table comments
COMMENT ON TABLE article_comments IS 'Granular text selection comments for editorial feedback. These feed into AI revision requests.';
COMMENT ON COLUMN article_comments.selected_text IS 'The exact text that was highlighted by the editor';
COMMENT ON COLUMN article_comments.category IS 'Feedback category: accuracy, tone, seo, structure, grammar, general';
COMMENT ON COLUMN article_comments.severity IS 'Feedback severity: minor (blue), moderate (yellow), major (orange), critical (red)';
COMMENT ON COLUMN article_comments.feedback IS 'The specific feedback or revision instruction';
COMMENT ON COLUMN article_comments.status IS 'pending = awaiting AI revision, addressed = processed by AI, dismissed = manually dismissed';

-- Create a view for pending comments by article
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
