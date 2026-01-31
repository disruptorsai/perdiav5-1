-- Migration: Add validation tracking fields to articles table
-- Purpose: Support the new content validation system that detects hallucinations,
--          truncation, and other quality issues

-- Add validation tracking columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS validation_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_reasons TEXT[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS validation_risk_level TEXT DEFAULT 'LOW';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add check constraint for risk level
ALTER TABLE articles ADD CONSTRAINT articles_validation_risk_level_check
  CHECK (validation_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Create index for finding articles needing review
CREATE INDEX IF NOT EXISTS idx_articles_requires_review
  ON articles(requires_human_review, validation_risk_level)
  WHERE requires_human_review = TRUE;

-- Create index for filtering by risk level
CREATE INDEX IF NOT EXISTS idx_articles_risk_level
  ON articles(validation_risk_level)
  WHERE validation_risk_level IN ('HIGH', 'CRITICAL');

-- Add comment explaining the fields
COMMENT ON COLUMN articles.validation_flags IS 'JSON array of validation issues found during generation (type, severity, message)';
COMMENT ON COLUMN articles.requires_human_review IS 'Flag indicating article needs human review due to potential hallucinations or other issues';
COMMENT ON COLUMN articles.review_reasons IS 'Array of validation issue types that triggered the review requirement';
COMMENT ON COLUMN articles.validation_risk_level IS 'Overall risk level: LOW, MEDIUM, HIGH, or CRITICAL';
COMMENT ON COLUMN articles.reviewed_by IS 'User who reviewed the article';
COMMENT ON COLUMN articles.reviewed_at IS 'Timestamp when the article was reviewed';
COMMENT ON COLUMN articles.review_notes IS 'Notes from human review';

-- Create a view for articles needing review
CREATE OR REPLACE VIEW articles_needing_review AS
SELECT
  a.id,
  a.title,
  a.status,
  a.validation_risk_level,
  a.review_reasons,
  a.validation_flags,
  a.created_at,
  a.contributor_name,
  ac.name as contributor_display_name
FROM articles a
LEFT JOIN article_contributors ac ON a.contributor_id = ac.id
WHERE a.requires_human_review = TRUE
  AND a.reviewed_at IS NULL
ORDER BY
  CASE a.validation_risk_level
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    ELSE 4
  END,
  a.created_at ASC;

-- Grant access to the view
GRANT SELECT ON articles_needing_review TO authenticated;
