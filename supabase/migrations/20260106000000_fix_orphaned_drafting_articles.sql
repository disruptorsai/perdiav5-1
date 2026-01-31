-- Migration: Fix orphaned articles stuck in 'drafting' status
-- Issue: Tony generated 3 articles but they're stuck in 'drafting' status
-- which doesn't appear in Review Queue. Update them to 'qa_review'.

-- Update all articles in 'drafting' status to 'qa_review'
UPDATE articles
SET status = 'qa_review',
    updated_at = NOW()
WHERE status = 'drafting';

-- Add comment documenting the fix
COMMENT ON TABLE articles IS 'Articles table - Note: As of 2026-01-06, articles are created with qa_review status (not drafting) so they appear in Review Queue immediately';
