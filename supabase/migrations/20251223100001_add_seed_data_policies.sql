-- DESCRIPTION: Add RLS policies to allow service role to seed reference data
-- TABLES: monetization_categories, monetization_levels, subjects, system_settings
-- DEPENDENCIES: Base table creation migrations
-- CREATED: 2025-12-23
-- PURPOSE: Allow service role and authenticated users to populate reference data tables

BEGIN;

-- ============================================================================
-- MONETIZATION_CATEGORIES - Add INSERT/UPDATE policies
-- ============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert monetization categories" ON monetization_categories;
DROP POLICY IF EXISTS "Service role can update monetization categories" ON monetization_categories;
DROP POLICY IF EXISTS "Authenticated can insert monetization categories" ON monetization_categories;

-- Service role can insert/update monetization categories
CREATE POLICY "Service role can insert monetization categories"
  ON monetization_categories FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update monetization categories"
  ON monetization_categories FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Allow any authenticated user to insert (for admin seeding from UI)
CREATE POLICY "Authenticated can insert monetization categories"
  ON monetization_categories FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- MONETIZATION_LEVELS - Add INSERT/UPDATE policies
-- ============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert monetization levels" ON monetization_levels;
DROP POLICY IF EXISTS "Service role can update monetization levels" ON monetization_levels;
DROP POLICY IF EXISTS "Authenticated can insert monetization levels" ON monetization_levels;

-- Service role can insert/update monetization levels
CREATE POLICY "Service role can insert monetization levels"
  ON monetization_levels FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update monetization levels"
  ON monetization_levels FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Allow any authenticated user to insert (for admin seeding from UI)
CREATE POLICY "Authenticated can insert monetization levels"
  ON monetization_levels FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- SUBJECTS - Add INSERT/UPDATE policies
-- ============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert subjects" ON subjects;
DROP POLICY IF EXISTS "Service role can update subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated can insert subjects" ON subjects;

-- Service role insert
CREATE POLICY "Service role can insert subjects"
  ON subjects FOR INSERT TO service_role WITH CHECK (true);

-- Service role update
CREATE POLICY "Service role can update subjects"
  ON subjects FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Authenticated insert
CREATE POLICY "Authenticated can insert subjects"
  ON subjects FOR INSERT TO authenticated WITH CHECK (true);

COMMIT;

-- ROLLBACK PROCEDURE:
-- DROP POLICY IF EXISTS "Service role can insert monetization categories" ON monetization_categories;
-- DROP POLICY IF EXISTS "Service role can update monetization categories" ON monetization_categories;
-- DROP POLICY IF EXISTS "Authenticated can insert monetization categories" ON monetization_categories;
-- DROP POLICY IF EXISTS "Service role can insert monetization levels" ON monetization_levels;
-- DROP POLICY IF EXISTS "Service role can update monetization levels" ON monetization_levels;
-- DROP POLICY IF EXISTS "Authenticated can insert monetization levels" ON monetization_levels;
-- DROP POLICY IF EXISTS "Service role can insert subjects" ON subjects;
-- DROP POLICY IF EXISTS "Service role can update subjects" ON subjects;
-- DROP POLICY IF EXISTS "Authenticated can insert subjects" ON subjects;
