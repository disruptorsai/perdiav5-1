-- Disable RLS for article_revisions table
-- This was missed in the previous RLS disable migration

DO $$ BEGIN
  ALTER TABLE article_revisions DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
