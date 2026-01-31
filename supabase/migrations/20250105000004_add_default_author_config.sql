-- Add default author by article type configuration
-- Per GetEducated spec section 8.2.2: Default Author per Article Type (Configurable)

-- Create default_author_by_article_type table
CREATE TABLE IF NOT EXISTS default_author_by_article_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_type TEXT NOT NULL UNIQUE,  -- 'ranking', 'program_list', 'guide', 'explainer', etc.
  default_author_name TEXT NOT NULL,  -- 'Tony Huffman', 'Kayleigh Gilbert', etc.
  description TEXT,                    -- Why this author is default for this type
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE default_author_by_article_type ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Anyone can read default author config" ON default_author_by_article_type
  FOR SELECT TO authenticated USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_default_author_article_type ON default_author_by_article_type(article_type);

-- Seed default author mappings per GetEducated requirements
-- Based on writing samples and historical patterns (spec section 8.2.2)
INSERT INTO default_author_by_article_type (article_type, default_author_name, description) VALUES
  -- Tony Huffman - Ranking landing pages & Best Buy reports (authoritative, data-driven)
  ('ranking', 'Tony Huffman', 'Tony is the face of rankings and ranking-report content'),
  ('comparison', 'Tony Huffman', 'Cost analysis and affordability comparisons'),
  ('analysis', 'Tony Huffman', 'Data-driven analysis pieces'),
  ('landing-page', 'Tony Huffman', 'Ranking landing pages'),

  -- Kayleigh Gilbert - Program lists / degree roundups (detailed, comprehensive)
  ('program_list', 'Kayleigh Gilbert', 'Detailed program breakdowns and degree roundups'),
  ('listicle', 'Kayleigh Gilbert', 'List-based content with rankings'),
  ('career-guide', 'Kayleigh Gilbert', 'Career-focused program guides'),

  -- Sara - Technical education, general guides (accessible, broad)
  ('guide', 'Sara', 'General guides and overviews, accessible explanations'),
  ('explainer', 'Sara', 'Educational explainer content'),
  ('overview', 'Sara', 'Broad topic overviews'),

  -- Charity - Teaching degrees, certification paths (practical, career-focused)
  ('tutorial', 'Charity', 'Step-by-step tutorials and how-to content'),
  ('how-to', 'Charity', 'Practical how-to guides'),
  ('certification', 'Charity', 'Certification pathway content')
ON CONFLICT (article_type) DO UPDATE SET
  default_author_name = EXCLUDED.default_author_name,
  description = EXCLUDED.description,
  is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_default_author_config_updated_at BEFORE UPDATE ON default_author_by_article_type
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table comments
COMMENT ON TABLE default_author_by_article_type IS 'Maps article types to default primary authors. Per GetEducated spec section 8.2.2.';
COMMENT ON COLUMN default_author_by_article_type.article_type IS 'Content type (ranking, guide, listicle, etc.)';
COMMENT ON COLUMN default_author_by_article_type.default_author_name IS 'Must be one of the 4 approved authors: Tony Huffman, Kayleigh Gilbert, Sara, Charity';

-- Add system settings for workflow configuration
INSERT INTO system_settings (key, value, category, description) VALUES
  ('initial_review_required', 'true', 'workflow', 'Human review required for all content in initial phase'),
  ('min_internal_links', '3', 'content', 'Minimum internal links required per article'),
  ('min_external_links', '1', 'content', 'Minimum external citations required per article'),
  ('target_word_count_min', '1500', 'content', 'Minimum target word count'),
  ('target_word_count_max', '2500', 'content', 'Maximum target word count'),
  ('quality_threshold', '80', 'qa', 'Minimum quality score for auto-publish consideration')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  description = EXCLUDED.description;
