-- Migration: Fix content_type CHECK constraint for BERT pages
-- Date: 2026-01-13
-- Purpose: Allow all content types returned by sitemapService.categorizeUrl()
--
-- ISSUE: The geteducated_articles.content_type CHECK constraint only allows:
--   'ranking', 'guide', 'career', 'blog', 'degree_category', 'school_profile',
--   'scholarship', 'how_to', 'listicle', 'explainer', 'other'
--
-- But sitemapService.categorizeUrl() returns these additional types:
--   'degree_directory', 'contributor', 'category', 'subject',
--   'accreditation', 'resource', 'financial_aid', 'degree_type', 'page', 'school_page'
--
-- This causes BERT pages (contributor, category, subject) and other page types
-- to fail validation during sitemap sync upserts.
--
-- SOLUTION: Drop and recreate the CHECK constraint with all valid content types.

-- Step 1: Drop the existing constraint
-- Using DO block for idempotence (won't fail if constraint doesn't exist)
DO $$
BEGIN
  ALTER TABLE geteducated_articles
  DROP CONSTRAINT IF EXISTS geteducated_articles_content_type_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Step 2: Add new constraint with all content types
ALTER TABLE geteducated_articles
ADD CONSTRAINT geteducated_articles_content_type_check
CHECK (content_type IN (
  -- Original types from initial schema
  'ranking',
  'guide',
  'career',
  'blog',
  'degree_category',
  'school_profile',
  'scholarship',
  'how_to',
  'listicle',
  'explainer',
  'other',
  -- New types from sitemapService.categorizeUrl()
  'degree_directory',   -- /online-degrees/ pages
  'contributor',        -- /article-contributors/ (BERT pages)
  'category',           -- /category/ archive pages (BERT pages)
  'subject',            -- /subject/ area pages (BERT pages)
  'accreditation',      -- /accreditation/ info pages
  'resource',           -- /resources/ pages
  'financial_aid',      -- /financial-aid/ and /scholarships/ pages
  'degree_type',        -- /degree-* pages
  'page',               -- Default fallback type
  'school_page'         -- /online-schools/ pages
));

-- Add comment explaining the full list
COMMENT ON COLUMN geteducated_articles.content_type IS
  'Content type classification. BERT pages use: contributor, category, subject. '
  'Monetizable types: ranking, degree_directory, school_profile, subject, listicle, degree_type, school_page. '
  'All types: ranking, guide, career, blog, degree_category, school_profile, scholarship, '
  'how_to, listicle, explainer, other, degree_directory, contributor, category, subject, '
  'accreditation, resource, financial_aid, degree_type, page, school_page.';

-- ROLLBACK (if needed):
-- ALTER TABLE geteducated_articles DROP CONSTRAINT geteducated_articles_content_type_check;
-- ALTER TABLE geteducated_articles ADD CONSTRAINT geteducated_articles_content_type_check
--   CHECK (content_type IN ('ranking', 'guide', 'career', 'blog', 'degree_category', 'school_profile', 'scholarship', 'how_to', 'listicle', 'explainer', 'other'));
