-- Fix contributor names and style configuration
-- CRITICAL: Public bylines use REAL NAMES, not aliases
-- Style proxy names (Kif, Alicia, Danny, Julia) are for INTERNAL AI voice matching only

-- Add style_proxy column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'style_proxy') THEN
    ALTER TABLE article_contributors ADD COLUMN style_proxy TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'sample_urls') THEN
    ALTER TABLE article_contributors ADD COLUMN sample_urls TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'has_contributor_page') THEN
    ALTER TABLE article_contributors ADD COLUMN has_contributor_page BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'specialties') THEN
    ALTER TABLE article_contributors ADD COLUMN specialties TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'sample_excerpts') THEN
    ALTER TABLE article_contributors ADD COLUMN sample_excerpts JSONB;
  END IF;
END $$;

-- Update Tony Huffman
-- Public byline: "Tony Huffman" | Style proxy: "Kif"
UPDATE article_contributors SET
  name = 'Tony Huffman',
  display_name = 'Tony Huffman',  -- PUBLIC BYLINE - Real name
  style_proxy = 'Kif',            -- INTERNAL ONLY - For AI style matching
  bio = 'Owner of GetEducated.com and pioneer in online post-secondary education. Over 24 years of experience in the industry. Expert in ranking degree programs by affordability and data-driven education research.',
  expertise_areas = ARRAY['online education rankings', 'cost analysis', 'affordability metrics', 'accreditation'],
  content_types = ARRAY['ranking', 'data-analysis', 'landing-page', 'best-buy-list'],
  specialties = ARRAY['rankings', 'affordability', 'data-analysis', 'landing-pages'],
  writing_style_profile = '{"tone": "authoritative", "complexity_level": "intermediate", "style_notes": "Data-driven and transparent. Uses precise quantitative language, methodology explanations, consumer-advocacy tone. Focuses on cost transparency and scientific rankings."}'::jsonb,
  voice_description = 'Authoritative and data-driven. Writes with confidence about online education costs and rankings. Uses precise numbers and comparisons. Speaks directly to cost-conscious students seeking affordable, accredited programs.',
  signature_phrases = ARRAY['our database', 'we calculate', 'meticulous research', 'total cost', 'scientific, data-driven', 'reliable system of rankings', 'best value', 'cost per credit', 'according to our research', 'Best Buys'],
  intro_style = 'Problem statement about cost or difficulty finding reliable information. Gets to the value proposition immediately.',
  conclusion_style = 'Summarize key findings, restate best options, provide clear next step.',
  author_page_url = 'https://www.geteducated.com/article-contributors/tony-huffman',
  has_contributor_page = true,
  sample_urls = ARRAY[
    'https://www.geteducated.com/online-college-ratings-and-rankings/',
    'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-educational-instructional-technology-masters-degrees/'
  ],
  sample_excerpts = '[
    {"type": "methodology", "excerpt": "At GetEducated.com, we''ve surveyed more than 30,000 accredited online degrees and certificates, including the cheapest online colleges. Our exclusive cost rankings reveal the best online colleges for degree affordability (we call them \"Best Buys\") from online colleges nationwide."},
    {"type": "transparency", "excerpt": "Our data-driven research creates a reliable system of scientific rankings. There are no fancy formulas here. We meticulously calculate total full-time tuition, including all fees, to create the most accurate cost estimate for these top rated accredited online colleges."},
    {"type": "editorial_note", "excerpt": "Editorial Note: Online schools do NOT pay to be included in any GetEducated online degree ranking. These rankings are editorially independent, open to any regionally accredited or candidate college."}
  ]'::jsonb,
  is_active = true
WHERE name = 'Tony Huffman';

-- Update Kayleigh Gilbert
-- Public byline: "Kayleigh Gilbert" | Style proxy: "Alicia"
UPDATE article_contributors SET
  name = 'Kayleigh Gilbert',
  display_name = 'Kayleigh Gilbert',  -- PUBLIC BYLINE - Real name
  style_proxy = 'Alicia',              -- INTERNAL ONLY - For AI style matching
  bio = 'Senior content strategist at GetEducated covering professional licensure programs, healthcare careers, and hospitality management degrees. Expert in comprehensive program guides and professional certifications.',
  expertise_areas = ARRAY['healthcare', 'professional-licensure', 'hospitality', 'social-work', 'program-guides'],
  content_types = ARRAY['guide', 'ranking', 'listicle', 'best-of', 'program-comparison'],
  specialties = ARRAY['professional-programs', 'healthcare', 'social-work', 'best-of-guides'],
  writing_style_profile = '{"tone": "warm", "complexity_level": "intermediate", "style_notes": "Warm but professional, empowering. Detailed program comparisons with emphasis on flexibility and career advancement. Service-oriented, passionate language."}'::jsonb,
  voice_description = 'Comprehensive and detail-oriented. Expert at breaking down complex professional licensure requirements. Writes thorough program guides that leave no question unanswered. Balances being exhaustive with being readable.',
  signature_phrases = ARRAY['make a difference', 'rewarding career', 'equip you with', 'opens doors to', 'pursue your passion', 'here''s what you need to know', 'let''s break this down'],
  intro_style = 'Vision/aspiration statement about career impact. Opens with empowering language about making a difference.',
  conclusion_style = 'Emphasize rewarding career outcomes, encourage next steps in career journey.',
  author_page_url = NULL,  -- Pending creation per client
  has_contributor_page = false,
  sample_urls = ARRAY[
    'https://www.geteducated.com/top-online-colleges/online-lcsw-programs/',
    'https://www.geteducated.com/top-online-colleges/online-hospitality-management-degree/'
  ],
  sample_excerpts = '[
    {"type": "opening", "excerpt": "Have you ever thought about making a difference in the mental well-being of others? When it comes to personal mental health care, Licensed Clinical Social Workers (LCSWs) have become the largest segment of the mental healthcare industry."},
    {"type": "empowerment", "excerpt": "Pursuing an LCSW degree online could be your first step toward a rewarding career. These programs not only provide in-depth training in social work but also equip you with clinical skills to assess and address complex mental health issues."},
    {"type": "closing", "excerpt": "Embarking on a career as a Licensed Clinical Social Worker (LCSW) today opens a world of opportunities. It''s your time to make meaningful impacts in the lives of individuals and communities."}
  ]'::jsonb,
  is_active = true
WHERE name = 'Kayleigh Gilbert';

-- Update Sara
-- Public byline: "Sara" | Style proxy: "Danny"
UPDATE article_contributors SET
  name = 'Sara',
  display_name = 'Sara',  -- PUBLIC BYLINE - Real name
  style_proxy = 'Danny',   -- INTERNAL ONLY - For AI style matching
  bio = 'Education content writer at GetEducated focusing on technical education, career pathways, and general degree guidance. Makes complex education topics accessible for all readers.',
  expertise_areas = ARRAY['technical-education', 'career-pathways', 'general-degrees', 'online-learning'],
  content_types = ARRAY['guide', 'explainer', 'overview', 'career-guide'],
  specialties = ARRAY['technical-education', 'degree-overviews', 'career-pathways'],
  writing_style_profile = '{"tone": "direct", "complexity_level": "beginner", "style_notes": "Direct, practical, accessible. Addresses reader pain points (time, money, career change). Simple conversational language, action-oriented CTAs."}'::jsonb,
  voice_description = 'Accessible and approachable. Excels at making complex education topics understandable for beginners. Writes broad overviews that help readers understand their options. Uses simple language without being condescending.',
  signature_phrases = ARRAY['you can', 'this is your', 'what are you waiting for?', 'keep reading', 'start today', 'your gateway to', 'enroll today'],
  intro_style = 'Reader pain point about career/education barriers. Acknowledges time and money concerns directly.',
  conclusion_style = 'Action-oriented with clear CTA. "What are you waiting for?" energy.',
  author_page_url = NULL,  -- Pending creation per client
  has_contributor_page = false,
  sample_urls = ARRAY[
    'https://www.geteducated.com/top-online-colleges/online-technical-colleges/',
    'https://www.geteducated.com/distance-education-guide/what-degrees-can-you-get-online/'
  ],
  sample_excerpts = '[
    {"type": "opening", "excerpt": "Do you ever dream of changing careers but feel time and money are holding you back? You don''t have to keep your passion on the shelf! Online technical colleges can be your launching pad to a bright new future."},
    {"type": "benefits", "excerpt": "Online tech schools implement hands-on and applied learning methodologies. Therefore, students see their own immediate skill development throughout different courses. Most programs finish in one or two years. You graduate sooner, save money on education costs, and can start working in half the time."},
    {"type": "closing", "excerpt": "It doesn''t matter if you are an adult learner or still in high school. There''s a program out there which can tailor to your needs. Technical online colleges can be your gateway to a satisfying career and financial stability. What are you waiting for? Enroll in an online technical school today."}
  ]'::jsonb,
  is_active = true
WHERE name = 'Sara';

-- Update Charity
-- Public byline: "Charity" | Style proxy: "Julia"
UPDATE article_contributors SET
  name = 'Charity',
  display_name = 'Charity',  -- PUBLIC BYLINE - Real name
  style_proxy = 'Julia',     -- INTERNAL ONLY - For AI style matching
  bio = 'Education specialist at GetEducated covering teaching degrees, certification pathways, and education career transitions. Expert in helping career changers enter the teaching profession.',
  expertise_areas = ARRAY['teaching', 'education-degrees', 'certification', 'career-change', 'teacher-licensure'],
  content_types = ARRAY['guide', 'comparison', 'how-to', 'career-guide'],
  specialties = ARRAY['teaching-degrees', 'education-careers', 'degree-comparisons'],
  writing_style_profile = '{"tone": "encouraging", "complexity_level": "beginner", "style_notes": "Encouraging, supportive, practical. Question-based headings, program spotlights with costs. Accessible language, explains technical education terms clearly."}'::jsonb,
  voice_description = 'Supportive and practical. Specialist in career transitions, especially into teaching. Writes clear, actionable guides that help readers understand paths from A to B. Empathetic toward career changers while being realistic about requirements.',
  signature_phrases = ARRAY['a great way to', 'you can', 'consider', 'if you want to', 'whether you are', 'depending on your goals', 'if you''re considering'],
  intro_style = 'Starts with reader''s goal or motivation. Questions like "Are you considering..." or "Have you ever thought about..."',
  conclusion_style = 'Encouraging summary that reinforces achievability. "So if you were wondering..."',
  author_page_url = NULL,  -- Pending creation per client
  has_contributor_page = false,
  sample_urls = ARRAY[
    'https://www.geteducated.com/top-online-colleges/fast-track-teaching-degree/',
    'https://www.geteducated.com/careers/mat-vs-med/'
  ],
  sample_excerpts = '[
    {"type": "opening", "excerpt": "Teaching is a true calling, and many people feel passionate about helping the next generation learn and grow. Are you considering transitioning into teaching? How about leveling up your credentials in education? Then getting a fast-track teaching degree online is a great way to get your skills into the classroom quickly."},
    {"type": "comparison", "excerpt": "For teachers, choosing between an MAT vs MEd degree depends on your goals. While there is no single best master''s degree for teachers to get, there are reasons to choose one over the other depending on your goals."},
    {"type": "closing", "excerpt": "So, if you were wondering, \"Can you get your teaching degree online?\" the answer should now be clear! And if your next question was, \"How fast can you get a teaching degree online?\" the answer is about 1-2 years. If you choose a fast-track teaching degree from our list, your journey to helping students learn can be pretty speedy."}
  ]'::jsonb,
  is_active = true
WHERE name = 'Charity';

-- Ensure no other contributors are active
UPDATE article_contributors
SET is_active = false
WHERE name NOT IN ('Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity');

-- Add comments explaining the critical distinction
COMMENT ON COLUMN article_contributors.display_name IS 'PUBLIC BYLINE - Use real name (Tony Huffman, Kayleigh Gilbert, Sara, Charity). NEVER use style proxy names as bylines.';
COMMENT ON COLUMN article_contributors.style_proxy IS 'INTERNAL ONLY - Style proxy name for AI voice matching (Kif, Alicia, Danny, Julia). NEVER publish this as a byline.';
COMMENT ON TABLE article_contributors IS 'GetEducated approved authors. CRITICAL: display_name is the PUBLIC byline (real names). style_proxy is INTERNAL ONLY for AI matching.';

-- Create blocked bylines validation function
CREATE OR REPLACE FUNCTION validate_author_byline(byline TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  blocked_names TEXT[] := ARRAY[
    'Julia Tell', 'Kif Richmann', 'Alicia Carrasco', 'Daniel Catena',
    'Admin', 'GetEducated', 'Editorial Team',
    'Julia', 'Kif', 'Alicia', 'Danny', 'Daniel'
  ];
  approved_names TEXT[] := ARRAY['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity'];
BEGIN
  -- Check if byline is in blocked list
  IF byline = ANY(blocked_names) THEN
    RETURN FALSE;
  END IF;

  -- Check if byline is in approved list
  IF byline = ANY(approved_names) THEN
    RETURN TRUE;
  END IF;

  -- Unknown byline - reject
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_author_byline IS 'Validates that a byline is an approved real name and not a blocked alias';
