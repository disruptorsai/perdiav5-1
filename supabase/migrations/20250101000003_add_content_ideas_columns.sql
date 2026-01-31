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

-- Check if columns need to be renamed or added
-- This handles both fresh installs and migrations from existing schema

-- First, try to add the new columns (in case they don't exist at all)
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS setting_key TEXT;

ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS setting_value JSONB;

ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS setting_type TEXT;

ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS editable_by TEXT DEFAULT 'admin';

-- If 'key' column exists, copy data to setting_key and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'key'
  ) THEN
    UPDATE system_settings SET setting_key = key WHERE setting_key IS NULL;
    ALTER TABLE system_settings DROP COLUMN key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'value'
  ) THEN
    UPDATE system_settings SET setting_value = to_jsonb(value) WHERE setting_value IS NULL;
    ALTER TABLE system_settings DROP COLUMN value;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'category'
  ) THEN
    UPDATE system_settings SET setting_type = category WHERE setting_type IS NULL;
    ALTER TABLE system_settings DROP COLUMN category;
  END IF;
END $$;

-- Make setting_key NOT NULL and UNIQUE if not already
ALTER TABLE system_settings
ALTER COLUMN setting_key SET NOT NULL;

-- Drop existing unique constraint if it exists
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_key_key;
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_key_key;

-- Add unique constraint on setting_key
ALTER TABLE system_settings
ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);

-- Update RLS policy for system_settings to allow inserts and updates
DROP POLICY IF EXISTS "Authenticated users can view settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON system_settings;

CREATE POLICY "Authenticated users can manage settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
