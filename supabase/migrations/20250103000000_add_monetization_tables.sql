-- Add monetization categories table for GetEducated shortcode system
-- This stores the category/concentration/level mapping for monetization shortcodes

-- Monetization Categories (from GetEducated's degree database)
CREATE TABLE IF NOT EXISTS monetization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,           -- "Field of Study" e.g., "Business", "Education"
  category_id INTEGER NOT NULL,     -- Category code from spreadsheet
  concentration TEXT NOT NULL,      -- Subject/concentration e.g., "Accounting", "MBA"
  concentration_id INTEGER NOT NULL, -- Concentration code from spreadsheet
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, concentration_id)
);

-- Monetization Levels (degree levels for shortcodes)
CREATE TABLE IF NOT EXISTS monetization_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name TEXT NOT NULL UNIQUE,  -- "Associate", "Bachelor", "Master", etc.
  level_code INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article monetization placements (tracks which monetization is used in each article)
CREATE TABLE IF NOT EXISTS article_monetization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES monetization_categories(id),
  level_id UUID REFERENCES monetization_levels(id),
  position_in_article TEXT DEFAULT 'after_intro', -- 'after_intro', 'mid_content', 'pre_conclusion'
  shortcode_output TEXT,            -- The actual shortcode that was generated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE monetization_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetization_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_monetization ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read categories and levels
CREATE POLICY "Anyone can read monetization categories" ON monetization_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read monetization levels" ON monetization_levels
  FOR SELECT TO authenticated USING (true);

-- Users can manage their own article monetization
CREATE POLICY "Users can manage their article monetization" ON article_monetization
  FOR ALL TO authenticated
  USING (article_id IN (SELECT id FROM articles WHERE user_id = auth.uid()))
  WITH CHECK (article_id IN (SELECT id FROM articles WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monetization_categories_category_id ON monetization_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_monetization_categories_concentration_id ON monetization_categories(concentration_id);
CREATE INDEX IF NOT EXISTS idx_article_monetization_article_id ON article_monetization(article_id);

COMMENT ON TABLE monetization_categories IS 'GetEducated degree categories and concentrations for monetization shortcodes';
COMMENT ON TABLE monetization_levels IS 'Degree levels (Associate, Bachelor, Master, etc.) for shortcodes';
COMMENT ON TABLE article_monetization IS 'Tracks which monetization shortcodes are placed in each article';
