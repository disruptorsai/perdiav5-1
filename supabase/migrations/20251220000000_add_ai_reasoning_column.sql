-- Add AI Reasoning column to articles table
-- Per Dec 18, 2025 meeting with Tony - provides transparency into AI decisions
--
-- This stores the complete AI reasoning log for each generated article:
-- - Topic interpretation and understanding
-- - Contributor selection reasoning and alternatives considered
-- - Monetization category matching logic
-- - Internal link selection criteria
-- - Cost data sources used
-- - Warnings and potential issues detected

-- Add the column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS ai_reasoning JSONB;

-- Add a comment describing the column
COMMENT ON COLUMN articles.ai_reasoning IS 'JSON object containing AI reasoning/thinking output for debugging. Includes: topic_interpretation, contributor_selection, monetization_category, internal_links, cost_data sources, and warnings.';

-- Create an index for searching within reasoning data (useful for debugging patterns)
CREATE INDEX IF NOT EXISTS idx_articles_ai_reasoning ON articles USING gin(ai_reasoning);

-- Optional: Create a view for easier reasoning queries
CREATE OR REPLACE VIEW article_reasoning_summary AS
SELECT
  a.id,
  a.title,
  a.status,
  a.contributor_name,
  a.quality_score,
  a.created_at,
  -- Extract key reasoning elements
  a.ai_reasoning->>'generated_at' as reasoning_generated_at,
  a.ai_reasoning->>'model_used' as model_used,
  jsonb_array_length(COALESCE(a.ai_reasoning->'warnings', '[]'::jsonb)) as warning_count,
  jsonb_array_length(COALESCE(a.ai_reasoning->'data_sources', '[]'::jsonb)) as data_source_count,
  -- Get contributor selection reasoning
  a.ai_reasoning->'decisions'->'contributor_selection'->>'selected' as selected_contributor,
  (a.ai_reasoning->'decisions'->'contributor_selection'->>'score')::int as contributor_match_score,
  a.ai_reasoning->'decisions'->'contributor_selection'->>'reasoning' as contributor_reasoning,
  -- Get monetization reasoning
  a.ai_reasoning->'decisions'->'monetization_category'->>'reasoning' as monetization_reasoning,
  -- Get internal link decisions
  a.ai_reasoning->'decisions'->'internal_links'->>'link_count' as internal_link_count,
  a.ai_reasoning->'decisions'->'internal_links'->>'reasoning' as link_reasoning
FROM articles a
WHERE a.ai_reasoning IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON article_reasoning_summary TO authenticated;
