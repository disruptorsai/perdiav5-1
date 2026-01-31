-- Migration: Expand content_ideas source check constraint
-- Issue: Tony reported error "new row for relation 'content_ideas' violates check constraint 'content_ideas_source_check'"
-- Cause: New source values added in code but not in database constraint

-- Drop the existing constraint
ALTER TABLE content_ideas DROP CONSTRAINT IF EXISTS content_ideas_source_check;

-- Add updated constraint with all source values used in the codebase
ALTER TABLE content_ideas
ADD CONSTRAINT content_ideas_source_check
CHECK (source IN (
  -- Original sources
  'reddit',
  'twitter',
  'news',
  'trends',
  'general',
  'manual',
  'ai_generated',
  'dataforseo',
  -- New sources from idea discovery features
  'sponsored_listing',    -- From sponsored school listings
  'ai_from_sponsored',    -- AI-generated ideas from sponsored content
  'research',             -- From research/discovery tools
  'article',              -- Created from existing articles
  'keyword_research'      -- From keyword research tool
));

-- Add comment documenting the source types
COMMENT ON COLUMN content_ideas.source IS 'Source of the content idea: reddit, twitter, news, trends, general, manual, ai_generated, dataforseo, sponsored_listing, ai_from_sponsored, research, article, keyword_research';
