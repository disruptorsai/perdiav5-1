-- Migration: Create geteducated_schools table for school name validation
-- Purpose: Store known school names to validate against AI-generated content
--          and prevent fabricated school names from being published

-- Add missing columns to existing geteducated_schools table
-- (The table was created in 20250107000000_geteducated_site_catalog.sql)
ALTER TABLE geteducated_schools ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE geteducated_schools ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE geteducated_schools ADD COLUMN IF NOT EXISTS is_accredited BOOLEAN DEFAULT TRUE;
ALTER TABLE geteducated_schools ADD COLUMN IF NOT EXISTS times_mentioned INTEGER DEFAULT 0;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_geteducated_schools_name
  ON geteducated_schools(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_geteducated_schools_slug
  ON geteducated_schools(slug);

-- Create GIN index for aliases array search (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'geteducated_schools' AND column_name = 'aliases'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_geteducated_schools_aliases
      ON geteducated_schools USING GIN(aliases);
  END IF;
END $$;

-- Full-text search index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_geteducated_schools_name_fts
  ON geteducated_schools USING GIN(to_tsvector('english', name));

-- Add comments
COMMENT ON TABLE geteducated_schools IS 'Known schools in GetEducated database for validating AI-generated content';
COMMENT ON COLUMN geteducated_schools.aliases IS 'Alternative names for the school (e.g., "ASU" for "Arizona State University")';
COMMENT ON COLUMN geteducated_schools.times_mentioned IS 'Count of times this school has been mentioned in generated articles';

-- RLS policies
ALTER TABLE geteducated_schools ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to geteducated_schools"
  ON geteducated_schools FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to geteducated_schools"
  ON geteducated_schools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to search for a school by name (with fuzzy matching)
CREATE OR REPLACE FUNCTION find_school_by_name(search_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  url TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Exact name match
  SELECT s.id, s.name, s.slug, s.url, 'exact'::TEXT as match_type
  FROM geteducated_schools s
  WHERE LOWER(s.name) = LOWER(search_name)

  UNION ALL

  -- Alias match
  SELECT s.id, s.name, s.slug, s.url, 'alias'::TEXT as match_type
  FROM geteducated_schools s
  WHERE LOWER(search_name) = ANY(SELECT LOWER(unnest(s.aliases)))

  UNION ALL

  -- Partial match (name contains search term or vice versa)
  SELECT s.id, s.name, s.slug, s.url, 'partial'::TEXT as match_type
  FROM geteducated_schools s
  WHERE LOWER(s.name) LIKE '%' || LOWER(search_name) || '%'
    OR LOWER(search_name) LIKE '%' || LOWER(s.name) || '%'

  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to increment mention count
CREATE OR REPLACE FUNCTION increment_school_mention(school_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE geteducated_schools
  SET times_mentioned = times_mentioned + 1,
      updated_at = NOW()
  WHERE LOWER(name) = LOWER(school_name)
     OR LOWER(school_name) = ANY(SELECT LOWER(unnest(aliases)));
END;
$$ LANGUAGE plpgsql;

-- Seed initial school data from ranking_report_entries (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ranking_report_entries') THEN
    INSERT INTO geteducated_schools (name, slug, url)
    SELECT DISTINCT
      rre.school_name,
      LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(rre.school_name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )),
      'https://www.geteducated.com/online-schools/' ||
      LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(rre.school_name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )) || '/'
    FROM ranking_report_entries rre
    WHERE rre.school_name IS NOT NULL
      AND LENGTH(rre.school_name) > 3
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Also seed from schools table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schools') THEN
    INSERT INTO geteducated_schools (name, slug, url)
    SELECT DISTINCT
      s.school_name,
      s.school_slug,
      COALESCE(s.geteducated_url, 'https://www.geteducated.com/online-schools/' || s.school_slug || '/')
    FROM schools s
    WHERE s.school_name IS NOT NULL
      AND LENGTH(s.school_name) > 3
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
