-- DESCRIPTION: Creates view for paid school degrees used by ideaDiscoveryService
-- DEPENDENCIES: schools, degrees tables must exist
-- PURPOSE: Enables monetization context to show degree counts per paid school

-- Drop if exists (for re-running)
DROP VIEW IF EXISTS paid_school_degrees;

-- Create the view joining degrees with their schools
CREATE OR REPLACE VIEW paid_school_degrees AS
SELECT
  d.id,
  d.school_id,
  s.school_name,
  d.program_name,
  d.degree_level,
  d.degree_level_code,
  d.is_sponsored,
  s.is_paid_client,
  s.school_slug
FROM degrees d
JOIN schools s ON d.school_id = s.id
WHERE d.is_sponsored = true
  AND s.is_paid_client = true
  AND d.is_active = true
  AND s.is_active = true;

-- Grant access to authenticated users
GRANT SELECT ON paid_school_degrees TO authenticated;

-- Also grant to anon for public access if needed
GRANT SELECT ON paid_school_degrees TO anon;

COMMENT ON VIEW paid_school_degrees IS 'Sponsored degrees from paid client schools - used for monetization context in idea discovery';
