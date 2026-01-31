-- =====================================================
-- Add Monetization Scoring to Content Ideas
-- =====================================================
-- Tony's Concern: "content with very little focus on content we can monetize"
--
-- This migration adds monetization potential scoring to content ideas,
-- allowing editors to see at a glance which ideas have high revenue potential.
--
-- The scoring is based on matching idea topics to paid school categories/degrees.

-- Add monetization scoring columns to content_ideas
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS monetization_score INTEGER DEFAULT 0
  CHECK (monetization_score >= 0 AND monetization_score <= 100),
ADD COLUMN IF NOT EXISTS monetization_confidence TEXT DEFAULT 'unscored'
  CHECK (monetization_confidence IN ('unscored', 'low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS monetization_category_id INTEGER,
ADD COLUMN IF NOT EXISTS monetization_concentration_id INTEGER,
ADD COLUMN IF NOT EXISTS monetization_degree_level TEXT,
ADD COLUMN IF NOT EXISTS monetization_matched_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering/sorting by monetization
CREATE INDEX IF NOT EXISTS idx_ideas_monetization_score ON content_ideas(monetization_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_monetization_confidence ON content_ideas(monetization_confidence);

-- Add foreign keys to monetization tables (if they exist)
-- Note: These are optional references, not strict foreign keys
-- because not all ideas will have matching categories

-- Comments for documentation
COMMENT ON COLUMN content_ideas.monetization_score IS 'Score 0-100 indicating monetization potential based on matching to paid degree programs';
COMMENT ON COLUMN content_ideas.monetization_confidence IS 'Confidence level of the monetization match: low, medium, high, or unscored';
COMMENT ON COLUMN content_ideas.monetization_category_id IS 'Matched category ID from monetization_categories table';
COMMENT ON COLUMN content_ideas.monetization_concentration_id IS 'Matched concentration ID from monetization_categories table';
COMMENT ON COLUMN content_ideas.monetization_degree_level IS 'Detected degree level (Associate, Bachelor, Master, Doctorate, Certificate)';
COMMENT ON COLUMN content_ideas.monetization_matched_at IS 'Timestamp when monetization scoring was performed';

-- Create a function to calculate monetization score for an idea
-- This can be called manually or via trigger
CREATE OR REPLACE FUNCTION calculate_idea_monetization_score(idea_title TEXT, idea_description TEXT)
RETURNS TABLE (
  score INTEGER,
  confidence TEXT,
  category_id INTEGER,
  concentration_id INTEGER,
  degree_level TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  topic_lower TEXT;
  best_match RECORD;
  match_score INTEGER := 0;
  final_score INTEGER := 0;
BEGIN
  -- Combine title and description for matching
  topic_lower := LOWER(COALESCE(idea_title, '') || ' ' || COALESCE(idea_description, ''));

  -- Find best matching category
  SELECT
    mc.category_id,
    mc.concentration_id,
    mc.category,
    mc.concentration,
    -- Calculate match score (raw, may exceed 100)
    (
      CASE WHEN topic_lower LIKE '%' || LOWER(mc.concentration) || '%' THEN 60 ELSE 0 END +
      CASE WHEN topic_lower LIKE '%' || LOWER(mc.category) || '%' THEN 40 ELSE 0 END
    ) AS calc_score
  INTO best_match
  FROM monetization_categories mc
  WHERE mc.is_active = true
  ORDER BY calc_score DESC, mc.concentration ASC
  LIMIT 1;

  IF best_match IS NULL OR best_match.calc_score = 0 THEN
    RETURN QUERY SELECT 0::INTEGER, 'low'::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Cap score at 100
  match_score := LEAST(best_match.calc_score, 100);

  -- Determine confidence level
  IF match_score >= 75 THEN
    confidence := 'high';
  ELSIF match_score >= 40 THEN
    confidence := 'medium';
  ELSE
    confidence := 'low';
  END IF;

  -- Detect degree level from topic
  degree_level := CASE
    WHEN topic_lower ~ '(doctorate|doctoral|ph\.?d|edd|dba|dnp|doctor)' THEN 'Doctorate'
    WHEN topic_lower ~ '(master|mba|msn|m\.s\.n|med|m\.ed|mpa|mph|msw)' THEN 'Master'
    WHEN topic_lower ~ '(bachelor|b\.a\.|b\.s\.|bba|bsn)' THEN 'Bachelor'
    WHEN topic_lower ~ '(associate|a\.a\.|a\.s\.|aas)' THEN 'Associate'
    WHEN topic_lower ~ '(certificate|certification|endorsement)' THEN 'Certificate'
    ELSE NULL
  END;

  RETURN QUERY SELECT
    match_score::INTEGER,
    confidence::TEXT,
    best_match.category_id::INTEGER,
    best_match.concentration_id::INTEGER,
    degree_level::TEXT;
END;
$$;

-- Create a trigger function to auto-score ideas on insert/update
CREATE OR REPLACE FUNCTION trigger_score_idea_monetization()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  scoring RECORD;
BEGIN
  -- Only score if title or description changed (or new row)
  IF TG_OP = 'INSERT' OR
     NEW.title IS DISTINCT FROM OLD.title OR
     NEW.description IS DISTINCT FROM OLD.description THEN

    SELECT * INTO scoring
    FROM calculate_idea_monetization_score(NEW.title, NEW.description);

    NEW.monetization_score := scoring.score;
    NEW.monetization_confidence := scoring.confidence;
    NEW.monetization_category_id := scoring.category_id;
    NEW.monetization_concentration_id := scoring.concentration_id;
    NEW.monetization_degree_level := scoring.degree_level;
    NEW.monetization_matched_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on content_ideas table
DROP TRIGGER IF EXISTS tr_score_idea_monetization ON content_ideas;
CREATE TRIGGER tr_score_idea_monetization
  BEFORE INSERT OR UPDATE ON content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_score_idea_monetization();

-- Backfill existing ideas with monetization scores
DO $$
DECLARE
  idea_record RECORD;
  scoring RECORD;
BEGIN
  FOR idea_record IN SELECT id, title, description FROM content_ideas WHERE monetization_score = 0 OR monetization_score IS NULL LOOP
    SELECT * INTO scoring FROM calculate_idea_monetization_score(idea_record.title, idea_record.description);

    UPDATE content_ideas SET
      monetization_score = scoring.score,
      monetization_confidence = scoring.confidence,
      monetization_category_id = scoring.category_id,
      monetization_concentration_id = scoring.concentration_id,
      monetization_degree_level = scoring.degree_level,
      monetization_matched_at = NOW()
    WHERE id = idea_record.id;
  END LOOP;

  RAISE NOTICE 'Backfilled monetization scores for existing ideas';
END;
$$;
