-- Update contributors to only the 4 approved GetEducated authors
-- CRITICAL: Only these 4 people can be attributed as authors on GetEducated content

-- Add new columns if they don't exist (must happen BEFORE update)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'is_active') THEN
    ALTER TABLE article_contributors ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'author_page_url') THEN
    ALTER TABLE article_contributors ADD COLUMN author_page_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'display_name') THEN
    ALTER TABLE article_contributors ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Mark all existing contributors as inactive (soft delete)
UPDATE article_contributors SET is_active = false WHERE is_active = true;

-- Insert the 4 approved GetEducated authors
-- Based on author samples analysis:
-- - Tony (Kif Samples) - Ranking landing pages, ranking reports - authoritative, data-driven
-- - Kayleigh (Alicia Samples) - LCSW programs, hospitality - detailed rankings, comprehensive
-- - Sara (Danny Samples) - Technical colleges, general guides - broad overviews, accessible
-- - Charity (Julia Samples) - Fast-track teaching, MAT vs MEd - clear, practical, career-focused

INSERT INTO article_contributors (
  name,
  display_name,
  bio,
  expertise_areas,
  content_types,
  writing_style_profile,
  author_page_url,
  is_active
) VALUES
(
  'Tony Huffman',
  'Kif',
  'GetEducated''s executive content lead specializing in ranking reports and cost analysis for online degree programs. Expert in making data-driven education comparisons accessible.',
  ARRAY['rankings', 'cost-analysis', 'online-degrees', 'affordability', 'accreditation'],
  ARRAY['ranking', 'analysis', 'comparison', 'landing-page'],
  '{"tone": "authoritative", "complexity_level": "intermediate", "sentence_length_preference": "medium", "style_notes": "Data-driven, focuses on affordability and accreditation, direct comparisons"}'::jsonb,
  'https://www.geteducated.com/article-contributors/kif/',
  true
),
(
  'Kayleigh Gilbert',
  'Alicia Carrasco',
  'Senior content strategist at GetEducated covering professional licensure programs, healthcare careers, and hospitality management degrees. Specializes in comprehensive program guides.',
  ARRAY['healthcare', 'professional-licensure', 'hospitality', 'social-work', 'program-guides'],
  ARRAY['guide', 'ranking', 'listicle', 'career-guide'],
  '{"tone": "comprehensive", "complexity_level": "intermediate", "sentence_length_preference": "medium", "style_notes": "Detailed program breakdowns, includes tuition and accreditation info, practical career focus"}'::jsonb,
  'https://www.geteducated.com/article-contributors/alicia-carrasco/',
  true
),
(
  'Sara',
  'Daniel Catena',
  'Education content writer at GetEducated focusing on technical education, career pathways, and general degree guidance. Makes complex education topics accessible for all readers.',
  ARRAY['technical-education', 'career-pathways', 'general-degrees', 'online-learning', 'education-guide'],
  ARRAY['guide', 'explainer', 'overview', 'listicle'],
  '{"tone": "accessible", "complexity_level": "beginner", "sentence_length_preference": "short", "style_notes": "Broad overviews, accessible explanations, helps readers understand options"}'::jsonb,
  'https://www.geteducated.com/article-contributors/daniel-catena/',
  true
),
(
  'Charity',
  'Julia Tell',
  'Education specialist at GetEducated covering teaching degrees, certification pathways, and education career transitions. Expert in helping career changers enter the teaching profession.',
  ARRAY['teaching', 'education-degrees', 'certification', 'career-change', 'teacher-licensure'],
  ARRAY['guide', 'comparison', 'how-to', 'career-guide'],
  '{"tone": "supportive", "complexity_level": "beginner", "sentence_length_preference": "medium", "style_notes": "Clear and practical, career-focused, helps readers understand degree differences and certification paths"}'::jsonb,
  'https://www.geteducated.com/article-contributors/julia-tell/',
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  expertise_areas = EXCLUDED.expertise_areas,
  content_types = EXCLUDED.content_types,
  writing_style_profile = EXCLUDED.writing_style_profile,
  author_page_url = EXCLUDED.author_page_url,
  is_active = true;

-- Add comment explaining the author restriction
COMMENT ON TABLE article_contributors IS 'GetEducated approved authors only. CRITICAL: Only Tony, Kayleigh, Sara, and Charity can be attributed as authors. Their display names are used on the site.';
