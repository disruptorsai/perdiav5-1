-- Migration: Create dev_feedback table for developer feedback system
-- Allows users to submit bugs, questions, suggestions while using the app
-- This is for app/UX feedback to the developer, NOT article content feedback

CREATE TABLE IF NOT EXISTS dev_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who submitted the feedback
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context capture (auto-filled by the app)
  page_path TEXT NOT NULL,                    -- e.g., '/review', '/editor/abc123'
  page_title TEXT,                            -- Human-readable page name
  browser_info TEXT,                          -- User agent for debugging

  -- Feedback content
  category TEXT NOT NULL CHECK (category IN (
    'bug',              -- Something is broken
    'question',         -- How do I do X?
    'suggestion',       -- Feature request or improvement idea
    'confusion',        -- UI/UX is unclear
    'other'             -- Miscellaneous feedback
  )),
  message TEXT NOT NULL,                      -- The actual feedback content

  -- Workflow status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Not yet reviewed by developer
    'reviewed',         -- Developer has seen it
    'resolved',         -- Issue addressed or question answered
    'wont_fix'          -- Acknowledged but won't act on
  )),

  -- Developer response fields
  developer_notes TEXT,                       -- Dev can add context/response
  resolved_at TIMESTAMPTZ,                    -- When marked resolved
  resolved_by UUID REFERENCES auth.users(id), -- Who resolved it

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_dev_feedback_user ON dev_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_feedback_status ON dev_feedback(status);
CREATE INDEX IF NOT EXISTS idx_dev_feedback_category ON dev_feedback(category);
CREATE INDEX IF NOT EXISTS idx_dev_feedback_page ON dev_feedback(page_path);
CREATE INDEX IF NOT EXISTS idx_dev_feedback_created ON dev_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dev_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- All authenticated users can view all feedback (transparency)
DROP POLICY IF EXISTS "Users can view all dev feedback" ON dev_feedback;
CREATE POLICY "Users can view all dev feedback"
  ON dev_feedback FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own feedback
DROP POLICY IF EXISTS "Users can create dev feedback" ON dev_feedback;
CREATE POLICY "Users can create dev feedback"
  ON dev_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can update feedback (for status changes, dev notes)
DROP POLICY IF EXISTS "Users can update dev feedback" ON dev_feedback;
CREATE POLICY "Users can update dev feedback"
  ON dev_feedback FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users can only delete their own feedback
DROP POLICY IF EXISTS "Users can delete own feedback" ON dev_feedback;
CREATE POLICY "Users can delete own feedback"
  ON dev_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (for edge functions, cron jobs)
DROP POLICY IF EXISTS "Service role full access to dev feedback" ON dev_feedback;
CREATE POLICY "Service role full access to dev feedback"
  ON dev_feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dev_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dev_feedback_updated_at ON dev_feedback;
CREATE TRIGGER dev_feedback_updated_at
  BEFORE UPDATE ON dev_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_feedback_updated_at();

-- Table comment for documentation
COMMENT ON TABLE dev_feedback IS 'User feedback for the development team - bugs, questions, suggestions, and UI confusion reports';
