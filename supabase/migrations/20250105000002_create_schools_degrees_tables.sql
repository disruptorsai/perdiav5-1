-- Create schools and degrees tables
-- For internal linking and sponsored listing prioritization

-- Schools table (from GetEducated school database)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- School identification
  school_name TEXT NOT NULL,
  school_slug TEXT NOT NULL UNIQUE,

  -- GetEducated URLs (for internal linking - NEVER link to .edu)
  geteducated_url TEXT NOT NULL,           -- /online-schools/school-name/
  official_website TEXT,                   -- School's .edu (for reference only, never link)

  -- Client status
  is_paid_client BOOLEAN DEFAULT false,    -- Paid advertising client
  is_sponsored BOOLEAN DEFAULT false,      -- Shows as "Sponsored Listing"
  has_logo BOOLEAN DEFAULT false,          -- Has logo displayed

  -- School details
  school_type TEXT,                        -- "Private", "Public", "For-Profit"
  accreditation TEXT,                      -- Primary accreditation
  location_city TEXT,
  location_state TEXT,

  -- Program counts
  total_programs INTEGER DEFAULT 0,
  online_programs INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Degrees/Programs table (from GetEducated degree database)
CREATE TABLE IF NOT EXISTS degrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- School relationship
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,               -- Denormalized for quick access

  -- Program identification
  program_name TEXT NOT NULL,
  program_slug TEXT,

  -- Degree classification
  degree_level TEXT NOT NULL,              -- "Associate", "Bachelor", "Master", "Doctorate", "Certificate"
  degree_level_code INTEGER,               -- Code from monetization_levels

  -- Category mapping (links to monetization)
  category TEXT,                           -- Field of study
  category_id INTEGER,                     -- Links to subjects/monetization
  concentration TEXT,                      -- Specific concentration
  concentration_id INTEGER,                -- Links to subjects/monetization

  -- GetEducated URL (for internal linking)
  geteducated_url TEXT,                    -- /online-degrees/level/field/concentration/

  -- Sponsorship status (PRIORITIZE THESE)
  is_sponsored BOOLEAN DEFAULT false,      -- "Sponsored Listing" badge
  has_logo BOOLEAN DEFAULT false,          -- Shows school logo
  sponsorship_tier INTEGER DEFAULT 0,      -- Higher = more priority

  -- Program details
  program_format TEXT,                     -- "100% Online", "Hybrid"
  total_credits INTEGER,
  estimated_duration TEXT,                 -- "2 years", "18 months"

  -- Cost reference (links to ranking_report_entries for actual costs)
  ranking_entry_id UUID REFERENCES ranking_report_entries(id) ON DELETE SET NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for schools
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(school_name);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(school_slug);
CREATE INDEX IF NOT EXISTS idx_schools_is_paid ON schools(is_paid_client);
CREATE INDEX IF NOT EXISTS idx_schools_is_sponsored ON schools(is_sponsored);

-- Create indexes for degrees
CREATE INDEX IF NOT EXISTS idx_degrees_school_id ON degrees(school_id);
CREATE INDEX IF NOT EXISTS idx_degrees_level ON degrees(degree_level);
CREATE INDEX IF NOT EXISTS idx_degrees_category_id ON degrees(category_id);
CREATE INDEX IF NOT EXISTS idx_degrees_concentration_id ON degrees(concentration_id);
CREATE INDEX IF NOT EXISTS idx_degrees_is_sponsored ON degrees(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_degrees_sponsorship_tier ON degrees(sponsorship_tier DESC);

-- Composite index for monetization matching
CREATE INDEX IF NOT EXISTS idx_degrees_monetization ON degrees(category_id, concentration_id, degree_level_code);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE degrees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Anyone can read schools" ON schools
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read degrees" ON degrees
  FOR SELECT TO authenticated USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_degrees_updated_at BEFORE UPDATE ON degrees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table comments
COMMENT ON TABLE schools IS 'GetEducated school database. Use geteducated_url for internal links, NEVER link to official_website (.edu)';
COMMENT ON TABLE degrees IS 'GetEducated degree/program database. Prioritize is_sponsored=true entries in content.';
COMMENT ON COLUMN schools.is_paid_client IS 'School is a paying advertising client - prioritize in content';
COMMENT ON COLUMN degrees.is_sponsored IS 'Program shows "Sponsored Listing" badge - prioritize in content';
COMMENT ON COLUMN degrees.sponsorship_tier IS 'Higher tier = higher priority in lists and recommendations';
