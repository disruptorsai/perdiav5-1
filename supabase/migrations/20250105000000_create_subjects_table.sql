-- Create subjects table for CIP code mapping
-- Maps article topics to Category ID, Concentration ID, and IPEDS CIP codes
-- Based on School_Degree Category_Subject Organization - IPEDS.xlsx workbook

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Field of Study / Category
  field_of_study_label TEXT NOT NULL,     -- "Arts & Liberal Arts", "Business", etc.
  category_id INTEGER NOT NULL,            -- Category code from spreadsheet

  -- Concentration / Subject
  concentration_id INTEGER NOT NULL,       -- Concentration code from spreadsheet
  concentration_label TEXT NOT NULL,       -- "Anthropology", "Accounting", etc.

  -- Degree types available
  degree_types TEXT[],                     -- ["Associate", "Bachelor", "Master", "Doctorate"]

  -- Primary CIP Code
  cip_main_code TEXT,                      -- "45.0201"
  cip_main_title TEXT,                     -- "Anthropology"

  -- Secondary CIP Code
  cip_secondary_code TEXT,
  cip_secondary_title TEXT,

  -- Tertiary CIP Code
  cip_third_code TEXT,
  cip_third_title TEXT,

  -- Description from IPEDS
  degree_description TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on category + concentration
  UNIQUE(category_id, concentration_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subjects_field_of_study ON subjects(field_of_study_label);
CREATE INDEX IF NOT EXISTS idx_subjects_category_id ON subjects(category_id);
CREATE INDEX IF NOT EXISTS idx_subjects_concentration_id ON subjects(concentration_id);
CREATE INDEX IF NOT EXISTS idx_subjects_concentration_label ON subjects(concentration_label);
CREATE INDEX IF NOT EXISTS idx_subjects_cip_main ON subjects(cip_main_code);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read subjects
CREATE POLICY "Anyone can read subjects" ON subjects
  FOR SELECT TO authenticated USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE subjects IS 'IPEDS CIP code mapping for article topics. Links content to monetization categories.';
COMMENT ON COLUMN subjects.field_of_study_label IS 'High-level field of study (e.g., Business, Education)';
COMMENT ON COLUMN subjects.category_id IS 'Numeric ID for the field of study category';
COMMENT ON COLUMN subjects.concentration_id IS 'Numeric ID for the specific concentration/major';
COMMENT ON COLUMN subjects.concentration_label IS 'Human-readable name of the concentration';
COMMENT ON COLUMN subjects.cip_main_code IS 'Primary IPEDS CIP code (e.g., 45.0201)';
