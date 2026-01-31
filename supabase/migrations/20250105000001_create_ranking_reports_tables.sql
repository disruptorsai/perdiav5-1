-- Create ranking reports tables for cost data
-- Stores cost information from GetEducated ranking reports
-- This is the ONLY approved source for tuition/cost data

-- Main ranking reports table (report metadata)
CREATE TABLE IF NOT EXISTS ranking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report identification
  report_url TEXT NOT NULL UNIQUE,
  report_title TEXT NOT NULL,
  report_slug TEXT,

  -- Classification
  degree_level TEXT,                       -- "Master", "Bachelor", etc.
  field_of_study TEXT,                     -- "Business", "Education", etc.
  category_id INTEGER,                     -- Links to subjects.category_id
  concentration_id INTEGER,                -- Links to subjects.concentration_id

  -- Report metadata
  total_programs INTEGER DEFAULT 0,
  last_crawled_at TIMESTAMPTZ,
  crawl_status TEXT DEFAULT 'pending',     -- 'pending', 'crawling', 'completed', 'failed'

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual program entries from ranking reports
CREATE TABLE IF NOT EXISTS ranking_report_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent report
  report_id UUID NOT NULL REFERENCES ranking_reports(id) ON DELETE CASCADE,

  -- School and program info
  school_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  degree_level TEXT,

  -- Cost data (THE CRITICAL FIELDS)
  total_cost DECIMAL(10,2),                -- Total cost including all fees
  in_state_cost DECIMAL(10,2),             -- In-state tuition
  out_of_state_cost DECIMAL(10,2),         -- Out-of-state tuition
  cost_per_credit DECIMAL(8,2),            -- Per credit hour cost
  total_credits INTEGER,                   -- Total credits required

  -- Rankings
  rank_position INTEGER,                   -- Position in ranking list
  best_buy_rank INTEGER,                   -- Best Buy ranking if applicable

  -- Accreditation
  accreditation TEXT,                      -- Primary accreditation body
  accreditation_details TEXT[],            -- All accreditations

  -- GetEducated links (for internal linking)
  geteducated_school_url TEXT,             -- /online-schools/school-name/
  geteducated_program_url TEXT,            -- /online-degrees/level/field/concentration/

  -- Additional data
  program_format TEXT,                     -- "100% Online", "Hybrid", etc.
  is_sponsored BOOLEAN DEFAULT false,      -- Is this a sponsored/paid listing?
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ranking_reports
CREATE INDEX IF NOT EXISTS idx_ranking_reports_degree_level ON ranking_reports(degree_level);
CREATE INDEX IF NOT EXISTS idx_ranking_reports_field ON ranking_reports(field_of_study);
CREATE INDEX IF NOT EXISTS idx_ranking_reports_category ON ranking_reports(category_id);
CREATE INDEX IF NOT EXISTS idx_ranking_reports_crawl_status ON ranking_reports(crawl_status);

-- Create indexes for ranking_report_entries
CREATE INDEX IF NOT EXISTS idx_rre_report_id ON ranking_report_entries(report_id);
CREATE INDEX IF NOT EXISTS idx_rre_school_name ON ranking_report_entries(school_name);
CREATE INDEX IF NOT EXISTS idx_rre_degree_level ON ranking_report_entries(degree_level);
CREATE INDEX IF NOT EXISTS idx_rre_total_cost ON ranking_report_entries(total_cost);
CREATE INDEX IF NOT EXISTS idx_rre_is_sponsored ON ranking_report_entries(is_sponsored);

-- Enable RLS
ALTER TABLE ranking_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_report_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Anyone can read ranking reports" ON ranking_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read ranking report entries" ON ranking_report_entries
  FOR SELECT TO authenticated USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_ranking_reports_updated_at BEFORE UPDATE ON ranking_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ranking_report_entries_updated_at BEFORE UPDATE ON ranking_report_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table comments
COMMENT ON TABLE ranking_reports IS 'GetEducated ranking report metadata. Source: https://www.geteducated.com/online-college-ratings-and-rankings/';
COMMENT ON TABLE ranking_report_entries IS 'Individual program entries from ranking reports. THE ONLY APPROVED SOURCE FOR COST DATA.';
COMMENT ON COLUMN ranking_report_entries.total_cost IS 'Total cost of enrollment including all mandatory fees - AUTHORITATIVE SOURCE';
COMMENT ON COLUMN ranking_report_entries.in_state_cost IS 'In-state tuition when applicable';
COMMENT ON COLUMN ranking_report_entries.out_of_state_cost IS 'Out-of-state tuition when applicable';
