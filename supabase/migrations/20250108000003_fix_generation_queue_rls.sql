-- =====================================================
-- FIX GENERATION QUEUE RLS POLICIES
-- =====================================================
-- The generation_queue table has RLS enabled but no policies defined.
-- This migration adds a user_id column and proper RLS policies.

-- Add user_id column to generation_queue
ALTER TABLE generation_queue
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from related content_ideas (if any existing rows)
UPDATE generation_queue gq
SET user_id = ci.user_id
FROM content_ideas ci
WHERE gq.content_idea_id = ci.id
AND gq.user_id IS NULL;

-- Create RLS policies for generation_queue
-- Users can view their own queue items
CREATE POLICY "Users can view their own queue items"
  ON generation_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own queue items
CREATE POLICY "Users can insert their own queue items"
  ON generation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own queue items
CREATE POLICY "Users can update their own queue items"
  ON generation_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own queue items
CREATE POLICY "Users can delete their own queue items"
  ON generation_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_queue_user ON generation_queue(user_id);
