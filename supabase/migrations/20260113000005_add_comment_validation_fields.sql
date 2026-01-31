-- Migration: Add validation fields to article_comments table
-- DESCRIPTION: Adds fields to track AI revision validation status per comment
-- This allows the system to mark comments as "pending_review" when validation fails

-- Add ai_revision_failed column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_comments'
                 AND column_name = 'ai_revision_failed') THEN
    ALTER TABLE article_comments
    ADD COLUMN ai_revision_failed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add validation_details JSONB column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_comments'
                 AND column_name = 'validation_details') THEN
    ALTER TABLE article_comments
    ADD COLUMN validation_details JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add updated_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_comments'
                 AND column_name = 'updated_at') THEN
    ALTER TABLE article_comments
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update status CHECK constraint to include 'pending_review'
-- Note: PostgreSQL doesn't allow altering CHECK constraints directly
-- We need to drop and recreate if it exists
DO $$
BEGIN
  -- Try to drop existing constraint if it exists
  BEGIN
    ALTER TABLE article_comments DROP CONSTRAINT IF EXISTS article_comments_status_check;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- Add new constraint with pending_review status
DO $$
BEGIN
  ALTER TABLE article_comments
  ADD CONSTRAINT article_comments_status_check
  CHECK (status IN ('pending', 'addressed', 'dismissed', 'pending_review'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add index for quick lookup of failed validations
CREATE INDEX IF NOT EXISTS idx_article_comments_ai_failed
ON article_comments(ai_revision_failed)
WHERE ai_revision_failed = TRUE;

-- Add index for pending_review status
CREATE INDEX IF NOT EXISTS idx_article_comments_pending_review
ON article_comments(status)
WHERE status = 'pending_review';

-- Allow any authenticated user to update article comments (shared workspace)
-- This is needed because marking addressed can be done by any user, not just the creator
DROP POLICY IF EXISTS "Users can update their comments" ON article_comments;
CREATE POLICY "Authenticated users can update comments" ON article_comments
  FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Comment on new columns
COMMENT ON COLUMN article_comments.ai_revision_failed IS 'True if AI attempted revision but validation indicated the fix was not applied';
COMMENT ON COLUMN article_comments.validation_details IS 'JSON object with validation status, evidence, and warnings';
COMMENT ON COLUMN article_comments.updated_at IS 'Timestamp of last update';
