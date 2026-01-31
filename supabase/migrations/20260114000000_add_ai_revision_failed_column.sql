-- Migration: Add ai_revision_failed column to article_comments
-- DESCRIPTION: Adds optional column to track failed AI revision attempts on comments
-- This resolves the "Could not find 'ai_revision_failed' column" schema cache error
-- TABLES: article_comments
-- DEPENDENCIES: article_comments table must exist

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_comments'
    AND column_name = 'ai_revision_failed'
  ) THEN
    ALTER TABLE article_comments
    ADD COLUMN ai_revision_failed BOOLEAN DEFAULT FALSE;

    COMMENT ON COLUMN article_comments.ai_revision_failed IS
      'Tracks if AI revision failed for this comment. Used for error handling and retry logic.';
  END IF;
END $$;

-- Also add optional error_message column for debugging
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_comments'
    AND column_name = 'ai_revision_error'
  ) THEN
    ALTER TABLE article_comments
    ADD COLUMN ai_revision_error TEXT;

    COMMENT ON COLUMN article_comments.ai_revision_error IS
      'Stores error message if AI revision failed for this comment.';
  END IF;
END $$;

-- Create index for quick lookup of failed revisions
CREATE INDEX IF NOT EXISTS idx_article_comments_ai_revision_failed
ON article_comments(ai_revision_failed)
WHERE ai_revision_failed = true;
