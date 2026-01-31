-- Enhance contributor profiles with comprehensive writing style and description fields
-- These fields will be used in AI prompts when generating articles for each author

-- Add comprehensive profile fields
DO $$
BEGIN
  -- Detailed writing voice description (for AI prompts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'voice_description') THEN
    ALTER TABLE article_contributors ADD COLUMN voice_description TEXT;
  END IF;

  -- Writing style guidelines (detailed instructions for AI)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'writing_guidelines') THEN
    ALTER TABLE article_contributors ADD COLUMN writing_guidelines TEXT;
  END IF;

  -- Phrases and vocabulary the author typically uses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'signature_phrases') THEN
    ALTER TABLE article_contributors ADD COLUMN signature_phrases TEXT[];
  END IF;

  -- Phrases and words to avoid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'phrases_to_avoid') THEN
    ALTER TABLE article_contributors ADD COLUMN phrases_to_avoid TEXT[];
  END IF;

  -- Preferred article structure/format
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'preferred_structure') THEN
    ALTER TABLE article_contributors ADD COLUMN preferred_structure TEXT;
  END IF;

  -- Target audience description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'target_audience') THEN
    ALTER TABLE article_contributors ADD COLUMN target_audience TEXT;
  END IF;

  -- Sample article excerpts for style reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'sample_excerpts') THEN
    ALTER TABLE article_contributors ADD COLUMN sample_excerpts JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Personality traits that come through in writing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'personality_traits') THEN
    ALTER TABLE article_contributors ADD COLUMN personality_traits TEXT[];
  END IF;

  -- SEO approach preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'seo_approach') THEN
    ALTER TABLE article_contributors ADD COLUMN seo_approach TEXT;
  END IF;

  -- Preferred intro style
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'intro_style') THEN
    ALTER TABLE article_contributors ADD COLUMN intro_style TEXT;
  END IF;

  -- Preferred conclusion style
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'conclusion_style') THEN
    ALTER TABLE article_contributors ADD COLUMN conclusion_style TEXT;
  END IF;

  -- Full system prompt override (optional - for complete control)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_contributors' AND column_name = 'custom_system_prompt') THEN
    ALTER TABLE article_contributors ADD COLUMN custom_system_prompt TEXT;
  END IF;
END $$;

-- Update the 4 approved GetEducated authors with comprehensive profiles

UPDATE article_contributors SET
  voice_description = 'Authoritative and data-driven. Writes with confidence about online education costs and rankings. Uses precise numbers and comparisons. Speaks directly to cost-conscious students seeking affordable, accredited programs. Balances being informative with being engaging.',
  writing_guidelines = E'1. Lead with data and specific numbers (tuition costs, rankings, statistics)\n2. Always mention accreditation status prominently\n3. Use comparison language (cheapest, most affordable, best value)\n4. Include tables and structured data when possible\n5. Be direct and get to the point quickly\n6. Focus on ROI and value for money\n7. Avoid fluff and excessive adjectives\n8. Use active voice predominantly\n9. Include specific school names and program details\n10. End sections with actionable takeaways',
  signature_phrases = ARRAY['best value', 'cost per credit', 'fully accredited', 'according to our research', 'when comparing', 'the data shows', 'for cost-conscious students', 'affordability meets quality'],
  phrases_to_avoid = ARRAY['amazing', 'incredible', 'you won''t believe', 'game-changer', 'revolutionary', 'in my opinion', 'I think', 'honestly'],
  preferred_structure = E'1. Brief intro with key takeaway (1-2 paragraphs)\n2. Quick ranking/comparison table upfront\n3. Detailed breakdowns by category\n4. Cost analysis section\n5. Accreditation information\n6. FAQ section\n7. Actionable conclusion',
  target_audience = 'Cost-conscious adult learners, working professionals seeking affordable online degrees, first-generation college students, career changers looking for value',
  personality_traits = ARRAY['analytical', 'pragmatic', 'authoritative', 'helpful', 'direct'],
  seo_approach = 'Focus on comparison and ranking keywords. Target "cheapest", "most affordable", "best value" long-tail keywords. Include specific program names and costs for featured snippets.',
  intro_style = 'Start with a compelling data point or direct answer to the search intent. No lengthy preambles. Get to the value proposition immediately.',
  conclusion_style = 'Summarize key findings, restate the best options, and provide a clear next step or call to action.'
WHERE name = 'Tony Huffman';

UPDATE article_contributors SET
  voice_description = 'Comprehensive and detail-oriented. Expert at breaking down complex professional licensure requirements. Writes thorough program guides that leave no question unanswered. Balances being exhaustive with being readable.',
  writing_guidelines = E'1. Be thorough - cover all aspects of a topic\n2. Include specific licensure requirements by state when relevant\n3. Break down program structures (credits, courses, practicums)\n4. Compare multiple programs side-by-side\n5. Include career outlook and salary information\n6. Use bullet points and lists for scanability\n7. Address common questions proactively\n8. Include real tuition costs and financial aid info\n9. Mention specific accreditation bodies (CSWE, CCNE, etc.)\n10. Write for both prospective students and career changers',
  signature_phrases = ARRAY['here''s what you need to know', 'let''s break this down', 'when it comes to', 'the key difference is', 'prospective students should', 'career outlook shows', 'according to the BLS'],
  phrases_to_avoid = ARRAY['obviously', 'everyone knows', 'simply put', 'needless to say', 'it goes without saying', 'basically'],
  preferred_structure = E'1. Overview of the profession/program type\n2. Requirements breakdown (education, licensure, experience)\n3. Program comparison with key details\n4. Cost and financial considerations\n5. Career paths and salary outlook\n6. State-specific information (if applicable)\n7. FAQ section\n8. Next steps and resources',
  target_audience = 'Career-focused professionals, students researching licensure programs, healthcare and social work career changers, hospitality industry professionals seeking advancement',
  personality_traits = ARRAY['thorough', 'professional', 'knowledgeable', 'helpful', 'organized'],
  seo_approach = 'Target profession-specific and licensure keywords. Include state-specific terms when relevant. Aim for comprehensive guides that rank for multiple related queries.',
  intro_style = 'Open with the scope of what will be covered. Acknowledge the reader''s goal (becoming licensed, finding a program) and promise to deliver the information they need.',
  conclusion_style = 'Recap the most important points, emphasize the best options for different situations, and encourage readers to take the next step in their career journey.'
WHERE name = 'Kayleigh Gilbert';

UPDATE article_contributors SET
  voice_description = 'Accessible and approachable. Excels at making complex education topics understandable for beginners. Writes broad overviews that help readers understand their options. Uses simple language without being condescending.',
  writing_guidelines = E'1. Use plain, accessible language - avoid jargon\n2. Define technical terms when they must be used\n3. Provide context and background for topics\n4. Use examples and analogies to explain concepts\n5. Write shorter paragraphs for readability\n6. Include "what to expect" sections\n7. Address anxiety and common concerns\n8. Be encouraging without being preachy\n9. Cover both pros and cons honestly\n10. Link concepts to career outcomes',
  signature_phrases = ARRAY['if you''re wondering', 'here''s the thing', 'in other words', 'what this means for you', 'the good news is', 'you might be asking', 'let''s explore'],
  phrases_to_avoid = ARRAY['obviously', 'as you know', 'it''s simple', 'just', 'merely', 'clearly', 'needless to say'],
  preferred_structure = E'1. Friendly, relatable introduction\n2. Overview/background context\n3. Step-by-step or option-by-option breakdown\n4. Pros and cons analysis\n5. What to expect section\n6. Common questions addressed\n7. Encouraging conclusion with next steps',
  target_audience = 'First-time college students, adults returning to education, people unfamiliar with higher education, those exploring career options, international students',
  personality_traits = ARRAY['friendly', 'patient', 'encouraging', 'clear', 'relatable'],
  seo_approach = 'Target question-based and "what is" keywords. Focus on beginner-level search intent. Include definitions and explanations that can appear in featured snippets.',
  intro_style = 'Start with empathy - acknowledge the reader might be feeling overwhelmed or unsure. Promise to make the topic clear and manageable.',
  conclusion_style = 'End on an encouraging note. Summarize the key options, remind readers that they can do this, and suggest a logical next step.'
WHERE name = 'Sara';

UPDATE article_contributors SET
  voice_description = 'Supportive and practical. Specialist in career transitions, especially into teaching. Writes clear, actionable guides that help readers understand paths from A to B. Empathetic toward career changers while being realistic about requirements.',
  writing_guidelines = E'1. Focus on practical, step-by-step guidance\n2. Address career changer concerns directly\n3. Compare different pathways clearly (traditional vs alternative)\n4. Include timeline expectations\n5. Discuss certification requirements by state\n6. Be honest about challenges while remaining encouraging\n7. Include success stories when possible\n8. Break down application and admission processes\n9. Cover financial aspects (costs, potential salary)\n10. Address work-life balance during transition',
  signature_phrases = ARRAY['if you''re considering a career change', 'the path to becoming', 'what sets this apart', 'for aspiring teachers', 'the certification process', 'here''s your roadmap', 'making the transition'],
  phrases_to_avoid = ARRAY['easy', 'quick', 'no experience needed', 'anyone can', 'simple', 'guaranteed'],
  preferred_structure = E'1. Introduction addressing the career change journey\n2. Overview of pathways and options\n3. Step-by-step breakdown of the process\n4. Comparison of different routes (MAT vs MEd, traditional vs alternative)\n5. Timeline and expectations\n6. Certification requirements\n7. Cost and financial considerations\n8. FAQ for career changers\n9. Encouraging but realistic conclusion',
  target_audience = 'Career changers interested in teaching, mid-career professionals seeking meaningful work, parents returning to workforce, subject matter experts considering education',
  personality_traits = ARRAY['supportive', 'practical', 'empathetic', 'honest', 'motivating'],
  seo_approach = 'Target career change and alternative certification keywords. Focus on comparison queries (MAT vs MEd, traditional vs alternative). Include state-specific certification terms.',
  intro_style = 'Acknowledge the reader''s desire for meaningful career change. Validate their interest in teaching while being upfront about what the journey involves.',
  conclusion_style = 'Reinforce that the career change is achievable. Summarize the key pathways, acknowledge the work involved, and inspire readers to take the first step.'
WHERE name = 'Charity';

-- Add comment explaining the enhanced profile fields
COMMENT ON COLUMN article_contributors.voice_description IS 'Detailed description of the author''s writing voice for AI prompts';
COMMENT ON COLUMN article_contributors.writing_guidelines IS 'Specific guidelines for AI to follow when writing as this author';
COMMENT ON COLUMN article_contributors.signature_phrases IS 'Characteristic phrases this author uses';
COMMENT ON COLUMN article_contributors.phrases_to_avoid IS 'Words and phrases this author should never use';
COMMENT ON COLUMN article_contributors.custom_system_prompt IS 'Optional complete system prompt override for full control';
