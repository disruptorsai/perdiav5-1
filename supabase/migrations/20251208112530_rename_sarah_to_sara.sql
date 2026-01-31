-- Migration: Rename contributor "Sarah" to "Sara"
-- Purpose: Correct the spelling of the contributor's name per client requirements
-- Date: 2025-12-08

-- Update the article_contributors table
UPDATE article_contributors
SET
  name = 'Sara',
  display_name = 'Sara'
WHERE name = 'Sarah';

-- Also update any articles that reference the old name in contributor_name field (if any)
UPDATE articles
SET contributor_name = 'Sara'
WHERE contributor_name = 'Sarah';

-- Update the validate_author_byline function to use the correct name
CREATE OR REPLACE FUNCTION validate_author_byline(byline TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  blocked_names TEXT[] := ARRAY[
    'Julia Tell', 'Kif Richmann', 'Alicia Carrasco', 'Daniel Catena',
    'Admin', 'GetEducated', 'Editorial Team',
    'Julia', 'Kif', 'Alicia', 'Danny', 'Daniel'
  ];
  approved_names TEXT[] := ARRAY['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity'];
BEGIN
  -- Check if byline is in blocked list
  IF byline = ANY(blocked_names) THEN
    RETURN FALSE;
  END IF;

  -- Check if byline is in approved list
  IF byline = ANY(approved_names) THEN
    RETURN TRUE;
  END IF;

  -- Unknown byline - reject
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the default_author_by_article_type table
UPDATE default_author_by_article_type
SET default_author_name = 'Sara'
WHERE default_author_name = 'Sarah';

-- Update table comments to reflect the correct name
COMMENT ON COLUMN article_contributors.display_name IS 'PUBLIC BYLINE - Use real name (Tony Huffman, Kayleigh Gilbert, Sara, Charity). NEVER use style proxy names as bylines.';
COMMENT ON TABLE article_contributors IS 'GetEducated approved authors. CRITICAL: Only Tony Huffman, Kayleigh Gilbert, Sara, and Charity can be attributed as authors.';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Successfully renamed contributor Sarah to Sara';
END $$;
