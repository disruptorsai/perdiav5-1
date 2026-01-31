-- =====================================================
-- Migration: Add Selected Version to GetEducated Articles
-- Created: December 10, 2025
-- =====================================================
-- DESCRIPTION:
--   Adds selected_version_id column to geteducated_articles table.
--   This allows users to select a specific revision for preview/review
--   without affecting the "current" (live) version.
--
-- TABLES AFFECTED:
--   - geteducated_articles (ALTER)
--
-- DEPENDENCIES:
--   - 20250107000000_geteducated_site_catalog.sql (geteducated_articles table)
--   - 20250108000000_article_versions_system.sql (geteducated_article_versions table)
--
-- CONCEPT:
--   - current_version_id: The "live" version published on WordPress
--   - selected_version_id: The version user is currently viewing/editing (for preview/review)
--   - When selected_version_id is NULL, UI should default to current_version_id behavior
--
-- ROLLBACK:
--   ALTER TABLE geteducated_articles DROP COLUMN IF EXISTS selected_version_id;
--   DROP INDEX IF EXISTS idx_ge_articles_selected_version;
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD SELECTED VERSION COLUMN
-- =====================================================
-- Add the selected_version_id column to track which version the user has selected
-- for preview/review (separate from the current/live version)

ALTER TABLE geteducated_articles
  ADD COLUMN IF NOT EXISTS selected_version_id UUID REFERENCES geteducated_article_versions(id) ON DELETE SET NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN geteducated_articles.selected_version_id IS
  'The version currently selected for preview/review. If NULL, defaults to current_version_id. This is separate from current_version_id which represents the live/published version.';

-- =====================================================
-- 2. CREATE INDEX FOR PERFORMANCE
-- =====================================================
-- Index for efficient joins when loading selected version data

CREATE INDEX IF NOT EXISTS idx_ge_articles_selected_version
  ON geteducated_articles(selected_version_id)
  WHERE selected_version_id IS NOT NULL;

-- =====================================================
-- 3. UPDATE RLS POLICIES (if needed)
-- =====================================================
-- The existing RLS policies on geteducated_articles already allow authenticated
-- users to view articles. We need to ensure UPDATE policies exist for this column.

-- Check if update policy exists and create if not
DO $$
BEGIN
  -- Try to create an UPDATE policy if one doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'geteducated_articles'
    AND policyname = 'Authenticated users can update articles'
  ) THEN
    CREATE POLICY "Authenticated users can update articles"
      ON geteducated_articles
      FOR UPDATE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =====================================================
-- 4. HELPER FUNCTION: Select a Version for Review
-- =====================================================
-- Function to safely select a version for preview/review

CREATE OR REPLACE FUNCTION select_article_version(
  p_article_id UUID,
  p_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_version_exists BOOLEAN;
BEGIN
  -- Verify the version exists and belongs to this article
  SELECT EXISTS(
    SELECT 1
    FROM geteducated_article_versions
    WHERE id = p_version_id
    AND article_id = p_article_id
  ) INTO v_version_exists;

  IF NOT v_version_exists THEN
    RAISE EXCEPTION 'Version % does not exist for article %', p_version_id, p_article_id;
  END IF;

  -- Update the selected version
  UPDATE geteducated_articles
  SET selected_version_id = p_version_id
  WHERE id = p_article_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. HELPER FUNCTION: Clear Version Selection
-- =====================================================
-- Function to clear the selected version (revert to current)

CREATE OR REPLACE FUNCTION clear_selected_version(p_article_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE geteducated_articles
  SET selected_version_id = NULL
  WHERE id = p_article_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. HELPER FUNCTION: Get Effective Version
-- =====================================================
-- Returns the version to display (selected if set, otherwise current)

CREATE OR REPLACE FUNCTION get_effective_version_id(p_article_id UUID)
RETURNS UUID AS $$
DECLARE
  v_article RECORD;
BEGIN
  SELECT selected_version_id, current_version_id
  INTO v_article
  FROM geteducated_articles
  WHERE id = p_article_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Return selected version if set, otherwise current version
  RETURN COALESCE(v_article.selected_version_id, v_article.current_version_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VIEW: Articles with Effective Version
-- =====================================================
-- Convenient view that joins articles with their effective version

CREATE OR REPLACE VIEW geteducated_articles_with_effective_version AS
SELECT
  a.*,
  COALESCE(a.selected_version_id, a.current_version_id) AS effective_version_id,
  CASE
    WHEN a.selected_version_id IS NOT NULL THEN 'selected'
    ELSE 'current'
  END AS version_source,
  v.version_number AS effective_version_number,
  v.version_type AS effective_version_type,
  v.title AS effective_title,
  v.meta_description AS effective_meta_description,
  v.content_html AS effective_content_html,
  v.content_text AS effective_content_text,
  v.word_count AS effective_word_count,
  v.quality_score AS effective_quality_score,
  v.is_published AS effective_is_published,
  v.created_at AS effective_version_created_at
FROM geteducated_articles a
LEFT JOIN geteducated_article_versions v
  ON v.id = COALESCE(a.selected_version_id, a.current_version_id);

-- Grant access to the view
GRANT SELECT ON geteducated_articles_with_effective_version TO authenticated;

COMMIT;
