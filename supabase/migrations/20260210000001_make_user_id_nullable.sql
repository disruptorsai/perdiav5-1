-- Make user_id nullable for development (no authentication required)
-- This allows creating content without a valid auth.users entry

-- Drop foreign key constraints that reference auth.users
-- We need to handle this carefully since the constraint may have different names

-- For content_ideas table
DO $$ BEGIN
  ALTER TABLE content_ideas DROP CONSTRAINT IF EXISTS content_ideas_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE content_ideas ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For articles table
DO $$ BEGIN
  ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE articles ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For generation_queue table
DO $$ BEGIN
  ALTER TABLE generation_queue DROP CONSTRAINT IF EXISTS generation_queue_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE generation_queue ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For ai_learning_sessions table
DO $$ BEGIN
  ALTER TABLE ai_learning_sessions DROP CONSTRAINT IF EXISTS ai_learning_sessions_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE ai_learning_sessions ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For idea_feedback_history table
DO $$ BEGIN
  ALTER TABLE idea_feedback_history DROP CONSTRAINT IF EXISTS idea_feedback_history_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE idea_feedback_history ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For article_feedback table
DO $$ BEGIN
  ALTER TABLE article_feedback DROP CONSTRAINT IF EXISTS article_feedback_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE article_feedback ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For dev_feedback table
DO $$ BEGIN
  ALTER TABLE dev_feedback DROP CONSTRAINT IF EXISTS dev_feedback_submitted_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE dev_feedback ALTER COLUMN submitted_by DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For deletion_log table
DO $$ BEGIN
  ALTER TABLE deletion_log DROP CONSTRAINT IF EXISTS deletion_log_deleted_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE deletion_log ALTER COLUMN deleted_by DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For article_comments table
DO $$ BEGIN
  ALTER TABLE article_comments DROP CONSTRAINT IF EXISTS article_comments_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE article_comments ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- For ai_revisions table
DO $$ BEGIN
  ALTER TABLE ai_revisions DROP CONSTRAINT IF EXISTS ai_revisions_requested_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE ai_revisions ALTER COLUMN requested_by DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
