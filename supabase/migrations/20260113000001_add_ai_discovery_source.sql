-- Migration: Add 'ai_discovery' to content_ideas source check constraint
-- Issue: AI Idea Discovery shows "Found 12 monetizable ideas" but "Saved 0 new ideas"
-- Cause: ContentIdeas.jsx line 365 uses 'ai_discovery' as fallback source, but this
--        value is not in the database CHECK constraint, causing all inserts to fail
--        silently (caught by try/catch but not visible to user)

-- Drop the existing constraint
ALTER TABLE content_ideas DROP CONSTRAINT IF EXISTS content_ideas_source_check;

-- Add updated constraint including 'ai_discovery'
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
  -- From idea discovery features
  'sponsored_listing',    -- From sponsored school listings
  'ai_from_sponsored',    -- AI-generated ideas from sponsored content
  'research',             -- From research/discovery tools
  'article',              -- Created from existing articles
  'keyword_research',     -- From keyword research tool
  -- NEW: From AI-powered discovery modal
  'ai_discovery'          -- From AI Idea Discovery (monetization-first mode)
));

-- Update column comment
COMMENT ON COLUMN content_ideas.source IS 'Source of the content idea: reddit, twitter, news, trends, general, manual, ai_generated, dataforseo, sponsored_listing, ai_from_sponsored, research, article, keyword_research, ai_discovery';
