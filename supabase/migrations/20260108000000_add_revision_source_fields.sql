-- Migration: Add source fields for revised site articles
-- Purpose: Allow revised articles from geteducated_articles to appear in Review Queue
-- When a site catalog article is revised, a new record is created in the articles table
-- with status 'qa_review' and linked back to the source geteducated_article

-- Add source_ge_article_id to link back to the original catalog article
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS source_ge_article_id UUID REFERENCES geteducated_articles(id) ON DELETE SET NULL;

-- Add is_revision flag to distinguish revised articles from freshly generated ones
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS is_revision BOOLEAN DEFAULT false;

-- Add source_ge_version_id to track which version was used as the source
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS source_ge_version_id UUID;

-- Create index for efficient lookup by source article
CREATE INDEX IF NOT EXISTS idx_articles_source_ge_article_id ON articles(source_ge_article_id);

-- Create index for filtering revisions vs generated
CREATE INDEX IF NOT EXISTS idx_articles_is_revision ON articles(is_revision) WHERE is_revision = true;

-- Add comments for documentation
COMMENT ON COLUMN articles.source_ge_article_id IS 'Reference to the original geteducated_articles record if this is a revision';
COMMENT ON COLUMN articles.is_revision IS 'True if this article is a revision of an existing site catalog article';
COMMENT ON COLUMN articles.source_ge_version_id IS 'Reference to the geteducated_article_versions record that was revised';
