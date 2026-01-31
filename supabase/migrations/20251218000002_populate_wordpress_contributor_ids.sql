-- Populate WordPress Article Contributor CPT IDs
-- These IDs are used in wp_postmeta for written_by, edited_by, expert_review_by fields
-- Source: GetEducated WordPress staging environment
-- Updated: December 18, 2025 meeting with Justin

-- Tony Huffman - Rankings, data analysis, affordability content
-- Contributor page: https://www.geteducated.com/article-contributors/tony-huffman/
UPDATE article_contributors SET
  wordpress_contributor_id = 163621,
  contributor_page_url = 'https://www.geteducated.com/article-contributors/tony-huffman/'
WHERE name = 'Tony Huffman';

-- Sara (Sara Raines) - Technical education, degree overviews, career pathways
-- Contributor page pending creation by GetEducated team
UPDATE article_contributors SET
  wordpress_contributor_id = 137186,
  contributor_page_url = NULL  -- Pending creation
WHERE name = 'Sara';

-- Kayleigh Gilbert - Professional programs, healthcare, social work, nursing
-- Contributor page pending creation by GetEducated team
UPDATE article_contributors SET
  wordpress_contributor_id = 163923,
  contributor_page_url = NULL  -- Pending creation
WHERE name = 'Kayleigh Gilbert';

-- Charity - Teaching degrees, education careers
-- NOTE: WordPress Article Contributor CPT needs to be created first
-- Contact Justin to create the contributor in WordPress admin
-- Then update this migration with the ID
-- UPDATE article_contributors SET
--   wordpress_contributor_id = ???,
--   contributor_page_url = NULL
-- WHERE name = 'Charity';

-- Add helpful comment for future reference
COMMENT ON TABLE article_contributors IS
  'Article contributors for GetEducated content. wordpress_contributor_id maps to wp_postmeta written_by field. Updated Dec 2025 per meeting with Justin.';

-- Verify the updates
-- SELECT name, wordpress_contributor_id, contributor_page_url FROM article_contributors;
