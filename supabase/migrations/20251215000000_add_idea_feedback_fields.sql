-- =====================================================
-- Add Feedback Fields to Content Ideas Table
-- =====================================================
-- This migration adds support for:
-- 1. Quick thumbs up/down feedback on ideas
-- 2. Rejection reason for training the AI idea generator
-- 3. Feedback history tracking

-- Add feedback columns to content_ideas
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS feedback_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_category TEXT
  CHECK (rejection_category IN (
    'off_topic',           -- Not relevant to GetEducated's content areas
    'duplicate',           -- Similar idea already exists or article exists
    'low_quality',         -- Poorly formed idea, unclear topic
    'wrong_audience',      -- Doesn't match target audience
    'not_actionable',      -- Can't be turned into useful content
    'competitive',         -- Topic dominated by competitors
    'outdated',            -- Topic no longer relevant
    'other'                -- Custom reason provided
  )),
ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering by feedback
CREATE INDEX IF NOT EXISTS idx_ideas_feedback_score ON content_ideas(feedback_score);
CREATE INDEX IF NOT EXISTS idx_ideas_rejection_category ON content_ideas(rejection_category) WHERE rejection_category IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN content_ideas.feedback_score IS 'Cumulative feedback score: +1 for thumbs up, -1 for thumbs down';
COMMENT ON COLUMN content_ideas.rejection_reason IS 'Detailed explanation of why the idea was rejected (for AI training)';
COMMENT ON COLUMN content_ideas.rejection_category IS 'Categorized rejection reason for analytics and AI training';
COMMENT ON COLUMN content_ideas.feedback_notes IS 'Additional notes about the idea quality or suggested improvements';
COMMENT ON COLUMN content_ideas.reviewed_by IS 'User who last reviewed/provided feedback on this idea';
COMMENT ON COLUMN content_ideas.reviewed_at IS 'Timestamp of last review/feedback action';
