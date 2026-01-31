-- Add WordPress Article Contributor CPT ID mapping
-- GetEducated uses a custom "Article Contributors" post type for author attribution
-- These IDs map to the wp_postmeta keys: written_by, edited_by, expert_review_by

-- Add WordPress contributor ID field
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'wordpress_contributor_id') THEN
    ALTER TABLE article_contributors ADD COLUMN wordpress_contributor_id INTEGER;
  END IF;

  -- Also add a contributor page URL field (links to GetEducated contributor pages)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'contributor_page_url') THEN
    ALTER TABLE article_contributors ADD COLUMN contributor_page_url TEXT;
  END IF;
END $$;

-- Add comments explaining the fields
COMMENT ON COLUMN article_contributors.wordpress_contributor_id IS
  'WordPress Article Contributor CPT post ID - used for written_by, edited_by, expert_review_by meta';
COMMENT ON COLUMN article_contributors.contributor_page_url IS
  'Public contributor profile page URL on GetEducated.com';

-- Update Tony Huffman with known contributor page
-- NOTE: WordPress IDs need to be set manually after creating contributors in WP admin
UPDATE article_contributors SET
  contributor_page_url = 'https://www.geteducated.com/article-contributors/tony-huffman/'
WHERE name = 'Tony Huffman';

-- Placeholder updates for other contributors (URLs to be filled when pages are created)
-- Kayleigh Gilbert - pending contributor page creation
-- Sara - pending contributor page creation
-- Charity - pending contributor page creation

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contributors_wordpress_id
  ON article_contributors(wordpress_contributor_id)
  WHERE wordpress_contributor_id IS NOT NULL;
