-- Migration: Fix article_comments RLS for shared workspace
-- Purpose: Update RLS policies to match the shared workspace model
-- The original policies restricted access to article owner only, but we need shared access

-- Drop existing user-isolated policies
DROP POLICY IF EXISTS "Users can view article comments" ON article_comments;
DROP POLICY IF EXISTS "Users can create comments" ON article_comments;
DROP POLICY IF EXISTS "Users can update their comments" ON article_comments;
DROP POLICY IF EXISTS "Users can delete their pending comments" ON article_comments;

-- Create new shared workspace policies
-- All authenticated users can view all comments
CREATE POLICY "Authenticated users can view all comments"
  ON article_comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON article_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update comments
CREATE POLICY "Authenticated users can update comments"
  ON article_comments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- All authenticated users can delete pending comments
CREATE POLICY "Authenticated users can delete comments"
  ON article_comments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can view all comments" ON article_comments IS
  'Shared workspace: all authenticated users can view all article comments.';

-- =====================================================
-- Also fix ai_revisions RLS for shared workspace
-- =====================================================

-- Drop existing user-isolated policies
DROP POLICY IF EXISTS "Users can view their article revisions" ON ai_revisions;
DROP POLICY IF EXISTS "Users can create revisions for their articles" ON ai_revisions;
DROP POLICY IF EXISTS "Users can update their revisions" ON ai_revisions;

-- Create new shared workspace policies
CREATE POLICY "Authenticated users can view all ai_revisions"
  ON ai_revisions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create ai_revisions"
  ON ai_revisions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ai_revisions"
  ON ai_revisions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ai_revisions"
  ON ai_revisions FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can view all ai_revisions" ON ai_revisions IS
  'Shared workspace: all authenticated users can view all AI revisions.';
