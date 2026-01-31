-- =====================================================
-- MIGRATION: Enhance Keywords Table for Research Feature
-- =====================================================
-- DESCRIPTION: Adds columns and indexes to support the keyword research
--              feature with DataForSEO integration, starring/favoriting,
--              article generation queue, and opportunity scoring.
--
-- TABLES AFFECTED: keywords
--
-- DEPENDENCIES:
--   - 20250101000000_initial_schema.sql (creates keywords table)
--   - 20250110000000_shared_workspace_rls.sql (shared workspace policies)
--
-- NEW COLUMNS:
--   - is_starred: Boolean flag for favoriting high-priority keywords
--   - is_queued: Boolean flag for keywords scheduled for article generation
--   - queued_at: Timestamp when keyword was added to generation queue
--   - queue_expires_at: Timestamp when keyword should be removed from queue
--   - opportunity_score: Calculated score (0-100) from DataForSEO metrics
--   - trend: Keyword search trend direction (rising/stable/declining)
--   - cpc: Cost per click from DataForSEO
--   - competition_level: Competition classification (LOW/MEDIUM/HIGH)
--   - monthly_searches: JSONB array of monthly search volume data
--   - source: Where the keyword came from (manual/dataforseo/catalog_analysis)
--   - last_researched_at: When DataForSEO data was last fetched
--   - updated_at: Standard timestamp for tracking modifications
--
-- NEW INDEXES:
--   - idx_keywords_is_starred: For filtering starred keywords
--   - idx_keywords_is_queued: For filtering queued keywords
--   - idx_keywords_opportunity_score: For sorting by opportunity
--   - idx_keywords_source: For filtering by source
--   - idx_keywords_user_id: For user-based queries (standard pattern)
--
-- ROLLBACK: See bottom of file for rollback SQL
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD NEW COLUMNS TO KEYWORDS TABLE
-- =====================================================

-- Starring/Favoriting
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN keywords.is_starred IS
  'Flag for favoriting high-priority keywords for easy filtering';

-- Article Generation Queue
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS is_queued BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN keywords.is_queued IS
  'Flag indicating keyword is scheduled for article generation';

ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;

COMMENT ON COLUMN keywords.queued_at IS
  'Timestamp when keyword was added to the generation queue';

ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS queue_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN keywords.queue_expires_at IS
  'Timestamp when keyword should be automatically removed from queue';

-- Opportunity Scoring (DataForSEO derived)
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 100);

COMMENT ON COLUMN keywords.opportunity_score IS
  'Calculated opportunity score (0-100) based on search volume, difficulty, and competition';

-- Trend Analysis
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS trend TEXT CHECK (trend IN ('rising', 'stable', 'declining'));

COMMENT ON COLUMN keywords.trend IS
  'Search trend direction based on monthly search volume changes';

-- Cost Per Click (for monetization potential)
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS cpc DECIMAL(10,2);

COMMENT ON COLUMN keywords.cpc IS
  'Cost per click in USD from DataForSEO, indicates monetization potential';

-- Competition Level
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS competition_level TEXT CHECK (competition_level IN ('LOW', 'MEDIUM', 'HIGH'));

COMMENT ON COLUMN keywords.competition_level IS
  'Categorical competition level from DataForSEO';

-- Monthly Search Data (JSONB array for trend visualization)
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS monthly_searches JSONB;

COMMENT ON COLUMN keywords.monthly_searches IS
  'JSONB array of monthly search volume data, e.g., [{month: "2024-01", volume: 1500}, ...]';

-- Source Tracking
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'dataforseo', 'catalog_analysis'));

COMMENT ON COLUMN keywords.source IS
  'Origin of keyword: manual entry, DataForSEO API, or catalog analysis';

-- Research Timestamp
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS last_researched_at TIMESTAMPTZ;

COMMENT ON COLUMN keywords.last_researched_at IS
  'Timestamp when DataForSEO data was last fetched for this keyword';

-- Standard updated_at timestamp (missing from original schema)
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN keywords.updated_at IS
  'Standard timestamp for tracking when keyword record was last modified';

-- =====================================================
-- 2. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger function if it doesn't exist (reuse pattern from other tables)
CREATE OR REPLACE FUNCTION update_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_keywords_updated_at ON keywords;

-- Create trigger
CREATE TRIGGER trigger_update_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_keywords_updated_at();

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for filtering starred keywords (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_keywords_is_starred
  ON keywords (is_starred)
  WHERE is_starred = TRUE;

COMMENT ON INDEX idx_keywords_is_starred IS
  'Partial index for efficiently querying starred/favorited keywords';

-- Index for filtering queued keywords (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_keywords_is_queued
  ON keywords (is_queued)
  WHERE is_queued = TRUE;

COMMENT ON INDEX idx_keywords_is_queued IS
  'Partial index for efficiently querying keywords in the generation queue';

-- Index for sorting by opportunity score (desc for top opportunities first)
CREATE INDEX IF NOT EXISTS idx_keywords_opportunity_score
  ON keywords (opportunity_score DESC NULLS LAST);

COMMENT ON INDEX idx_keywords_opportunity_score IS
  'Index for sorting keywords by opportunity score (highest first)';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_keywords_source
  ON keywords (source);

COMMENT ON INDEX idx_keywords_source IS
  'Index for filtering keywords by their source (manual, dataforseo, catalog_analysis)';

-- Index on user_id (standard pattern, may already exist)
CREATE INDEX IF NOT EXISTS idx_keywords_user_id
  ON keywords (user_id);

COMMENT ON INDEX idx_keywords_user_id IS
  'Standard index on user_id for audit trail queries';

-- Composite index for common query pattern: source + opportunity
CREATE INDEX IF NOT EXISTS idx_keywords_source_opportunity
  ON keywords (source, opportunity_score DESC NULLS LAST);

COMMENT ON INDEX idx_keywords_source_opportunity IS
  'Composite index for filtering by source and sorting by opportunity';

-- Index on cluster_id (foreign key, should be indexed)
CREATE INDEX IF NOT EXISTS idx_keywords_cluster_id
  ON keywords (cluster_id);

COMMENT ON INDEX idx_keywords_cluster_id IS
  'Index on cluster_id foreign key for join performance';

-- =====================================================
-- 4. ADD MISSING UPDATE POLICY FOR KEYWORDS
-- =====================================================
-- The shared workspace migration (20250110000000) only created
-- SELECT, INSERT, DELETE policies for keywords but missed UPDATE

-- Drop if exists for idempotency
DROP POLICY IF EXISTS "Authenticated users can update keywords" ON keywords;

-- Create UPDATE policy to match other shared workspace policies
CREATE POLICY "Authenticated users can update keywords"
  ON keywords FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can update keywords" ON keywords IS
  'Shared workspace: all authenticated users can update keywords for starring, queuing, etc.';

COMMIT;

-- =====================================================
-- ROLLBACK PROCEDURE
-- =====================================================
-- To rollback this migration, run the following SQL:
--
-- BEGIN;
--
-- -- Drop the UPDATE policy
-- DROP POLICY IF EXISTS "Authenticated users can update keywords" ON keywords;
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_keywords_is_starred;
-- DROP INDEX IF EXISTS idx_keywords_is_queued;
-- DROP INDEX IF EXISTS idx_keywords_opportunity_score;
-- DROP INDEX IF EXISTS idx_keywords_source;
-- DROP INDEX IF EXISTS idx_keywords_user_id;
-- DROP INDEX IF EXISTS idx_keywords_source_opportunity;
-- DROP INDEX IF EXISTS idx_keywords_cluster_id;
--
-- -- Drop trigger
-- DROP TRIGGER IF EXISTS trigger_update_keywords_updated_at ON keywords;
-- DROP FUNCTION IF EXISTS update_keywords_updated_at();
--
-- -- Remove columns (in reverse order of addition)
-- ALTER TABLE keywords DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS last_researched_at;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS source;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS monthly_searches;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS competition_level;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS cpc;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS trend;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS opportunity_score;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS queue_expires_at;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS queued_at;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS is_queued;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS is_starred;
--
-- COMMIT;
-- =====================================================
