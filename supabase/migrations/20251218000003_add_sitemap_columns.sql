-- Migration: Add sitemap sync columns to geteducated_articles
-- Date: 2025-12-18
-- Purpose: Support daily sitemap sync and sponsored school detection
-- Source: Technical meeting with Justin (GetEducated Developer)

-- Add new columns for sitemap sync
ALTER TABLE geteducated_articles
ADD COLUMN IF NOT EXISTS lastmod TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sitemap_priority DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS school_priority INTEGER,
ADD COLUMN IF NOT EXISTS is_from_sitemap BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sitemap_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sponsored_school_count INTEGER DEFAULT 0;

-- Create index for efficient queries by lastmod (freshness)
CREATE INDEX IF NOT EXISTS idx_geteducated_articles_lastmod
ON geteducated_articles(lastmod DESC NULLS LAST);

-- Create index for sponsored content queries
CREATE INDEX IF NOT EXISTS idx_geteducated_articles_sponsored
ON geteducated_articles(is_sponsored)
WHERE is_sponsored = true;

-- Create index for content type filtering
CREATE INDEX IF NOT EXISTS idx_geteducated_articles_content_type
ON geteducated_articles(content_type);

-- Create index for stale content filtering
CREATE INDEX IF NOT EXISTS idx_geteducated_articles_stale
ON geteducated_articles(is_stale)
WHERE is_stale = false;

-- Add comment explaining sponsorship logic
COMMENT ON COLUMN geteducated_articles.is_sponsored IS
  'True if page has school logo or school_priority >= 5. Determined by page crawling.';

COMMENT ON COLUMN geteducated_articles.school_priority IS
  'School priority from LD+JSON metadata. Values >= 5 indicate paid clients.';

COMMENT ON COLUMN geteducated_articles.is_from_sitemap IS
  'True if URL was discovered from sitemap sync. Used for stale detection.';

COMMENT ON COLUMN geteducated_articles.is_stale IS
  'True if URL was previously in sitemap but not found in latest sync.';

COMMENT ON COLUMN geteducated_articles.lastmod IS
  'Last modification date from sitemap. Used to prefer fresh content.';
