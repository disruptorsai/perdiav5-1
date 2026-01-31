-- Add approved_by_initials column to store reviewer initials for display
-- This provides a quick visual indicator of who approved an article

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'approved_by_initials') THEN
    ALTER TABLE articles ADD COLUMN approved_by_initials TEXT;
  END IF;
END $$;

COMMENT ON COLUMN articles.approved_by_initials IS 'Initials of the person who approved the article for publishing (e.g., "JW", "TH")';

-- Add human_reviewed boolean if not exists (for tracking review status)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'human_reviewed') THEN
    ALTER TABLE articles ADD COLUMN human_reviewed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN articles.human_reviewed IS 'Whether the article has been reviewed by a human before publishing';
