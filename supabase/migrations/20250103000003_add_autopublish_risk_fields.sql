-- Add auto-publish and risk assessment fields to articles table
-- These support the human-in-the-loop workflow with eventual automation

-- Add autopublish_deadline column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'autopublish_deadline') THEN
    ALTER TABLE articles ADD COLUMN autopublish_deadline TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add risk_level column (LOW, MEDIUM, HIGH, CRITICAL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'risk_level') THEN
    ALTER TABLE articles ADD COLUMN risk_level TEXT DEFAULT 'LOW'
      CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
  END IF;
END $$;

-- Add reviewed_at timestamp to track when article was last reviewed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'reviewed_at') THEN
    ALTER TABLE articles ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add reviewed_by to track who reviewed the article
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'reviewed_by') THEN
    ALTER TABLE articles ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add link_compliance_issues to store detected link problems
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'link_compliance_issues') THEN
    ALTER TABLE articles ADD COLUMN link_compliance_issues JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index on autopublish_deadline for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_articles_autopublish_deadline
  ON articles(autopublish_deadline)
  WHERE autopublish_deadline IS NOT NULL AND status = 'ready_to_publish';

-- Create index on risk_level for filtering
CREATE INDEX IF NOT EXISTS idx_articles_risk_level ON articles(risk_level);

-- Add GetEducated-specific settings to system_settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('approved_authors_only', '"true"'::jsonb, 'geteducated', 'Only allow the 4 approved GetEducated authors'),
  ('block_edu_links', '"true"'::jsonb, 'geteducated', 'Block direct links to .edu school websites'),
  ('block_competitor_links', '"true"'::jsonb, 'geteducated', 'Block links to competitor sites'),
  ('require_ranking_cost_data', '"true"'::jsonb, 'geteducated', 'Require cost data from GetEducated ranking reports only'),
  ('auto_publish_enabled', '"false"'::jsonb, 'geteducated', 'Enable auto-publish after review deadline'),
  ('auto_publish_days', '"5"'::jsonb, 'geteducated', 'Days before auto-publish if not reviewed'),
  ('block_high_risk_publish', '"true"'::jsonb, 'geteducated', 'Block publishing of HIGH or CRITICAL risk articles')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description;

-- Add comment explaining the auto-publish workflow
COMMENT ON COLUMN articles.autopublish_deadline IS 'Timestamp when article will auto-publish if not manually reviewed. Set when article reaches ready_to_publish status.';
COMMENT ON COLUMN articles.risk_level IS 'Risk assessment level: LOW (auto-publishable), MEDIUM (review recommended), HIGH (review required), CRITICAL (publish blocked)';
