-- Migration: Add content_type column to articles table
-- Purpose: Store the type of content (guide, listicle, ranking, etc.) for each article
-- This column was being used in the UI but was missing from the database schema

-- Add content_type column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'guide';

-- Add check constraint for valid content types
-- Matches the options in the ArticleEditor component
ALTER TABLE articles
ADD CONSTRAINT articles_content_type_check
CHECK (content_type IN ('guide', 'listicle', 'ranking', 'explainer', 'review', 'tutorial'));

-- Create index for filtering by content type
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);

-- Add comment explaining the field
COMMENT ON COLUMN articles.content_type IS 'Type of content: guide, listicle, ranking, explainer, review, or tutorial';
