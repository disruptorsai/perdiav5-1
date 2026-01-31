-- =====================================================
-- Add monetization_category TEXT column to content_ideas
-- =====================================================
-- The existing migration (20251217000002) added monetization_category_id (INTEGER)
-- but the code also uses monetization_category (TEXT) to store the category name
-- for display purposes. This column was missing.

-- Add the monetization_category column for storing category name as text
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS monetization_category TEXT;

-- Add comment
COMMENT ON COLUMN content_ideas.monetization_category IS 'Human-readable category name for display (e.g., "Business", "Healthcare", "Education")';

-- Create index for filtering by category name
CREATE INDEX IF NOT EXISTS idx_ideas_monetization_category ON content_ideas(monetization_category);
