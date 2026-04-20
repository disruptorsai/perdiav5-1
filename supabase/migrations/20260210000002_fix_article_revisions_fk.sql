-- Fix article_revisions table - remove foreign key constraint on created_by
-- This allows creating revisions without a valid auth.users entry

-- Drop the foreign key constraint
DO $$ BEGIN
  ALTER TABLE article_revisions DROP CONSTRAINT IF EXISTS article_revisions_created_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Make created_by nullable (it should already be nullable based on ON DELETE SET NULL, but just in case)
DO $$ BEGIN
  ALTER TABLE article_revisions ALTER COLUMN created_by DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
