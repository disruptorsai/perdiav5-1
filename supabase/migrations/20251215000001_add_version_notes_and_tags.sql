-- Add version notes and tags to geteducated_article_versions
-- This enables users to annotate versions with notes and tags for easy identification

-- Add notes column for free-form annotations
ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Add tags column as an array of predefined tags
ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add starred/pinned flag for important versions
ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;

-- Add comparison_baseline flag to mark a version as the baseline for comparison
ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT FALSE;

-- Add rollback tracking
ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE geteducated_article_versions
ADD COLUMN IF NOT EXISTS rolled_back_by TEXT DEFAULT NULL;

-- Create index for efficient tag searches
CREATE INDEX IF NOT EXISTS idx_geteducated_versions_tags
ON geteducated_article_versions USING GIN (tags);

-- Create index for starred versions
CREATE INDEX IF NOT EXISTS idx_geteducated_versions_starred
ON geteducated_article_versions (article_id, is_starred)
WHERE is_starred = TRUE;

-- Function to update version notes
CREATE OR REPLACE FUNCTION update_version_notes(
  p_version_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE geteducated_article_versions
  SET notes = p_notes
  WHERE id = p_version_id;

  RETURN FOUND;
END;
$$;

-- Function to add a tag to a version
CREATE OR REPLACE FUNCTION add_version_tag(
  p_version_id UUID,
  p_tag TEXT
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_tags TEXT[];
BEGIN
  UPDATE geteducated_article_versions
  SET tags = array_append(
    array_remove(tags, p_tag), -- Remove if exists first (avoid duplicates)
    p_tag
  )
  WHERE id = p_version_id
  RETURNING tags INTO result_tags;

  RETURN result_tags;
END;
$$;

-- Function to remove a tag from a version
CREATE OR REPLACE FUNCTION remove_version_tag(
  p_version_id UUID,
  p_tag TEXT
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_tags TEXT[];
BEGIN
  UPDATE geteducated_article_versions
  SET tags = array_remove(tags, p_tag)
  WHERE id = p_version_id
  RETURNING tags INTO result_tags;

  RETURN result_tags;
END;
$$;

-- Function to toggle starred status
CREATE OR REPLACE FUNCTION toggle_version_starred(
  p_version_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_starred BOOLEAN;
BEGIN
  UPDATE geteducated_article_versions
  SET is_starred = NOT COALESCE(is_starred, FALSE)
  WHERE id = p_version_id
  RETURNING is_starred INTO new_starred;

  RETURN new_starred;
END;
$$;

-- Function to set baseline version (only one per article)
CREATE OR REPLACE FUNCTION set_version_as_baseline(
  p_article_id UUID,
  p_version_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing baseline for this article
  UPDATE geteducated_article_versions
  SET is_baseline = FALSE
  WHERE article_id = p_article_id AND is_baseline = TRUE;

  -- Set new baseline
  UPDATE geteducated_article_versions
  SET is_baseline = TRUE
  WHERE id = p_version_id AND article_id = p_article_id;

  RETURN FOUND;
END;
$$;

-- Add similar columns to ai_revisions table for training data management
ALTER TABLE ai_revisions
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

ALTER TABLE ai_revisions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE ai_revisions
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;

-- Create index for ai_revisions tags
CREATE INDEX IF NOT EXISTS idx_ai_revisions_tags
ON ai_revisions USING GIN (tags);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_version_notes(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_version_tag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_version_tag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_version_starred(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_version_as_baseline(UUID, UUID) TO authenticated;
