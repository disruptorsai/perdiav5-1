-- Add validation columns to article_revisions table
-- Per GetEducated issue report - tracks whether AI actually addressed feedback

-- Add validation status column (addressed, failed, partial, pending_review, unknown)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_revisions'
                 AND column_name = 'ai_validation_status') THEN
    ALTER TABLE article_revisions
    ADD COLUMN ai_validation_status TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add validation evidence (what the validator found)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_revisions'
                 AND column_name = 'ai_validation_evidence') THEN
    ALTER TABLE article_revisions
    ADD COLUMN ai_validation_evidence TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add validation warnings (issues that need manual review)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_revisions'
                 AND column_name = 'ai_validation_warnings') THEN
    ALTER TABLE article_revisions
    ADD COLUMN ai_validation_warnings TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add flag for AI revision failure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'article_revisions'
                 AND column_name = 'ai_revision_failed') THEN
    ALTER TABLE article_revisions
    ADD COLUMN ai_revision_failed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add 'pending_review' to status CHECK constraint if not already present
-- First drop existing constraint, then add new one
DO $$
BEGIN
  -- Try to drop existing constraint
  BEGIN
    ALTER TABLE article_revisions DROP CONSTRAINT IF EXISTS article_revisions_status_check;
  EXCEPTION WHEN others THEN
    NULL;
  END;

  -- Add updated constraint with pending_review status
  BEGIN
    ALTER TABLE article_revisions
    ADD CONSTRAINT article_revisions_status_check
    CHECK (status IN ('pending', 'addressed', 'rejected', 'pending_review'));
  EXCEPTION WHEN others THEN
    -- Constraint might already exist with correct values
    NULL;
  END;
END $$;

-- Add index for quick lookup of failed revisions
CREATE INDEX IF NOT EXISTS idx_article_revisions_validation_status
ON article_revisions(ai_validation_status)
WHERE ai_validation_status IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN article_revisions.ai_validation_status IS 'Validation status from revision validator: addressed, failed, partial, unknown';
COMMENT ON COLUMN article_revisions.ai_validation_evidence IS 'Evidence collected by validator showing what changed';
COMMENT ON COLUMN article_revisions.ai_validation_warnings IS 'Warnings from validator about potential issues';
COMMENT ON COLUMN article_revisions.ai_revision_failed IS 'True if AI attempted revision but validation failed';
