-- Add missing columns to content_ideas table for idea discovery feature
-- Created: December 2024

-- Add content_type column
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Add target_keywords column (array of keywords)
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS target_keywords TEXT[];

-- Add search_intent column (without inline CHECK for safer migration)
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS search_intent TEXT;

-- Add trending_reason column
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS trending_reason TEXT;

-- Update source column constraint to include new sources
ALTER TABLE content_ideas DROP CONSTRAINT IF EXISTS content_ideas_source_check;

ALTER TABLE content_ideas
ADD CONSTRAINT content_ideas_source_check
CHECK (source IN ('reddit', 'twitter', 'news', 'trends', 'general', 'manual', 'ai_generated', 'dataforseo'));

-- Add index on content_type for filtering
CREATE INDEX IF NOT EXISTS idx_ideas_content_type ON content_ideas(content_type);

-- Add index on source for filtering
CREATE INDEX IF NOT EXISTS idx_ideas_source ON content_ideas(source);

-- =====================================================
-- GENERATION QUEUE TABLE UPDATES
-- =====================================================

-- Add user_id column to generation_queue for RLS
ALTER TABLE generation_queue
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add article_id column for linking to generated article
ALTER TABLE generation_queue
ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

-- Update RLS policy for generation_queue
DROP POLICY IF EXISTS "Users can view generation queue" ON generation_queue;
DROP POLICY IF EXISTS "Users can view their queue items" ON generation_queue;
DROP POLICY IF EXISTS "Users can insert queue items" ON generation_queue;
DROP POLICY IF EXISTS "Users can update their queue items" ON generation_queue;
DROP POLICY IF EXISTS "Users can delete their queue items" ON generation_queue;

CREATE POLICY "Users can view their queue items"
  ON generation_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert queue items"
  ON generation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their queue items"
  ON generation_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their queue items"
  ON generation_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SYSTEM SETTINGS TABLE UPDATES
-- =====================================================

-- Update RLS policy for system_settings to allow inserts and updates
DROP POLICY IF EXISTS "Authenticated users can view settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON system_settings;

CREATE POLICY "Authenticated users can manage settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
