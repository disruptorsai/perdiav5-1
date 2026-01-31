-- Migration: Enhance ai_revisions table
-- DESCRIPTION: Adds additional columns for context, rollback, and quality tracking
-- TABLES: ai_revisions (alter), ai_training_summary (view)
-- DEPENDENCIES: ai_revisions table must exist

ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS article_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS prompt_used TEXT;
ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS applied BOOLEAN DEFAULT true;
ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ;
ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS rolled_back_by UUID REFERENCES auth.users(id);
ALTER TABLE ai_revisions ADD COLUMN IF NOT EXISTS quality_delta JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_revisions_applied ON ai_revisions(applied) WHERE applied = true;
CREATE INDEX IF NOT EXISTS idx_ai_revisions_rolled_back ON ai_revisions(rolled_back_at) WHERE rolled_back_at IS NOT NULL;

COMMENT ON COLUMN ai_revisions.article_context IS 'JSON context: title, focus_keyword, content_type, contributor info, word counts';
COMMENT ON COLUMN ai_revisions.prompt_used IS 'The actual AI prompt used for this revision';
COMMENT ON COLUMN ai_revisions.applied IS 'Whether revision is currently applied';
COMMENT ON COLUMN ai_revisions.rolled_back_at IS 'Timestamp when revision was rolled back';
COMMENT ON COLUMN ai_revisions.rolled_back_by IS 'User who rolled back the revision';
COMMENT ON COLUMN ai_revisions.quality_delta IS 'Quality score change: {before, after, improvement}';

CREATE OR REPLACE VIEW ai_training_summary AS
SELECT
  ar.id,
  ar.article_id,
  a.title,
  ar.revision_type,
  ar.model_used,
  ar.applied,
  ar.rolled_back_at,
  ar.include_in_training,
  jsonb_array_length(COALESCE(ar.comments_snapshot, '[]'::jsonb)) AS comment_count,
  ar.quality_delta,
  ar.article_context,
  ar.created_at
FROM ai_revisions ar
JOIN articles a ON a.id = ar.article_id
ORDER BY ar.created_at DESC;

GRANT SELECT ON ai_training_summary TO authenticated;

CREATE POLICY "Users can delete their revisions" ON ai_revisions
  FOR DELETE TO authenticated
  USING (triggered_by_user = auth.uid());
