-- Migration: Add Missing Foreign Key Constraint
-- Created: 2026-01-14
-- Purpose: Add FK constraint for articles.source_ge_version_id
--
-- Issue Addressed:
-- - Missing FK constraint: articles.source_ge_version_id → geteducated_article_versions
--   (column was added in 20260108000000 but without FK constraint)
--
-- NOTE: Previous analysis incorrectly assumed columns existed:
-- - ai_revisions.applied does NOT exist (status is 'pending', 'approved', 'rejected', 'applied')
-- - ai_revisions.rolled_back_at does NOT exist
-- - shortcodes.article_id does NOT exist (shortcodes is a lookup table)
-- - ai_revisions.article_id index ALREADY exists in original migration

-- ============================================================================
-- Add Foreign Key: articles.source_ge_version_id → geteducated_article_versions
-- ============================================================================
-- This ensures referential integrity when articles are created from GE article versions
-- ON DELETE SET NULL allows version deletion without orphaning articles

DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_articles_source_ge_version'
    AND table_name = 'articles'
  ) THEN
    ALTER TABLE articles
    ADD CONSTRAINT fk_articles_source_ge_version
    FOREIGN KEY (source_ge_version_id)
    REFERENCES geteducated_article_versions(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Added FK constraint fk_articles_source_ge_version';
  ELSE
    RAISE NOTICE 'FK constraint fk_articles_source_ge_version already exists';
  END IF;
END $$;

-- ============================================================================
-- Verification Query (for manual verification after migration)
-- ============================================================================
-- Run this to verify the FK constraint:
/*
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'articles'
  AND tc.constraint_name = 'fk_articles_source_ge_version';
*/
