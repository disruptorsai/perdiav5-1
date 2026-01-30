-- QA Testing System Tables
-- Supports the self-evolving QA system that learns from Slack issues

-- Table: qa_issues
-- Tracks issues reported from Slack, user feedback, and other sources
CREATE TABLE IF NOT EXISTS qa_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'slack', -- slack, user_feedback, automated
  reporter TEXT,
  description TEXT NOT NULL,
  raw_message TEXT, -- Original message JSON
  category TEXT NOT NULL, -- ISSUE_CATEGORIES enum value
  secondary_categories TEXT[], -- Other related categories
  confidence DECIMAL(3,2), -- Categorization confidence 0-1
  test_parameters JSONB, -- Extracted test data { exampleUrls, exampleText, searchTerms }
  channel TEXT, -- Slack channel name
  reported_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new', -- new, acknowledged, test_created, fixed, closed
  status_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index for querying by category and status
CREATE INDEX IF NOT EXISTS idx_qa_issues_category ON qa_issues(category);
CREATE INDEX IF NOT EXISTS idx_qa_issues_status ON qa_issues(status);
CREATE INDEX IF NOT EXISTS idx_qa_issues_created ON qa_issues(created_at DESC);

-- Table: qa_test_runs
-- Stores results of QA test suite runs
CREATE TABLE IF NOT EXISTS qa_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  pass_rate DECIMAL(5,2), -- Percentage
  status TEXT NOT NULL, -- passed, warning, failed, critical
  report TEXT, -- Full markdown report
  suites JSONB, -- Detailed suite results
  recommendations JSONB, -- Array of recommendations
  triggered_by TEXT DEFAULT 'manual', -- manual, post_commit, slack_agent, scheduled
  commit_hash TEXT, -- Git commit if triggered by post-commit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying test runs by date
CREATE INDEX IF NOT EXISTS idx_qa_test_runs_timestamp ON qa_test_runs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_qa_test_runs_status ON qa_test_runs(status);

-- Table: qa_test_cases
-- Stores dynamically generated test cases
CREATE TABLE IF NOT EXISTS qa_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  test_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  assertions JSONB, -- Array of assertion strings
  test_data JSONB, -- Test-specific data (urls, text samples, etc.)
  issue_count INTEGER DEFAULT 0, -- Number of issues that led to this test
  last_issue_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index for querying active test cases
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_category ON qa_test_cases(category);
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_enabled ON qa_test_cases(enabled) WHERE enabled = true;

-- View: qa_issue_summary
-- Provides quick stats for the QA dashboard
CREATE OR REPLACE VIEW qa_issue_summary AS
SELECT
  category,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_issue,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days
FROM qa_issues
GROUP BY category, status
ORDER BY count DESC;

-- View: qa_test_trends
-- Shows test pass rate trends over time
CREATE OR REPLACE VIEW qa_test_trends AS
SELECT
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as runs,
  AVG(pass_rate) as avg_pass_rate,
  SUM(failed) as total_failed,
  SUM(passed) as total_passed
FROM qa_test_runs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;

-- RLS Policies (if needed)
-- For now, allow all authenticated users to read/write QA data
ALTER TABLE qa_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_cases ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON qa_issues
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON qa_test_runs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON qa_test_cases
  FOR ALL USING (true) WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE qa_issues IS 'Tracks issues reported from Slack and other sources for the self-evolving QA system';
COMMENT ON TABLE qa_test_runs IS 'Stores results of QA test suite runs';
COMMENT ON TABLE qa_test_cases IS 'Dynamically generated test cases based on reported issues';
