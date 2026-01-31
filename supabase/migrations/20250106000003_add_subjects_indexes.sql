-- =============================================================================
-- DESCRIPTION: Add additional indexes to subjects table for query optimization
-- TABLES: subjects
-- DEPENDENCIES: 20250105000000_create_subjects_table.sql
--
-- This migration adds additional indexes to improve query performance for
-- common access patterns in the subjects table.
--
-- ROLLBACK:
--   DROP INDEX IF EXISTS idx_subjects_degree_types;
--   DROP INDEX IF EXISTS idx_subjects_active;
--   DROP INDEX IF EXISTS idx_subjects_category_concentration;
--   DROP INDEX IF EXISTS idx_subjects_cip_all;
-- =============================================================================

-- GIN index for degree_types array - enables efficient array containment queries
-- Example query: WHERE degree_types @> ARRAY['Master']
CREATE INDEX IF NOT EXISTS idx_subjects_degree_types ON subjects USING gin(degree_types);

-- Index on is_active for filtering active subjects
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active) WHERE is_active = true;

-- Composite index for common join pattern with monetization_categories
-- This optimizes queries that join subjects with degrees or monetization data
CREATE INDEX IF NOT EXISTS idx_subjects_category_concentration ON subjects(category_id, concentration_id);

-- Index on secondary and tertiary CIP codes for comprehensive CIP lookups
CREATE INDEX IF NOT EXISTS idx_subjects_cip_secondary ON subjects(cip_secondary_code) WHERE cip_secondary_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_cip_third ON subjects(cip_third_code) WHERE cip_third_code IS NOT NULL;

-- Index on lowercase concentration_label for case-insensitive searches
-- Example: WHERE LOWER(concentration_label) = LOWER('accounting')
CREATE INDEX IF NOT EXISTS idx_subjects_concentration_label_lower ON subjects(LOWER(concentration_label));

-- Add column comment for degree_types
COMMENT ON COLUMN subjects.degree_types IS 'Array of degree levels available for this subject. Use @> operator for containment queries.';

-- =============================================================================
-- VERIFY EXISTING INDEXES
-- The following indexes should already exist from the original migration:
-- - idx_subjects_field_of_study (field_of_study_label)
-- - idx_subjects_category_id (category_id)
-- - idx_subjects_concentration_id (concentration_id)
-- - idx_subjects_concentration_label (concentration_label)
-- - idx_subjects_cip_main (cip_main_code)
-- =============================================================================
