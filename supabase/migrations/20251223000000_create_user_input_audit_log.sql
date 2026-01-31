-- User Input Audit Log
-- Centralized, immutable log of ALL user-entered text (comments, revisions, settings, feedback)
-- Purpose: Backup/recovery of user input in case of data loss

-- Create enum for input types (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_input_type') THEN
    CREATE TYPE user_input_type AS ENUM (
      'article_comment',        -- Comments on article text
      'revision_request',       -- Revision instructions/notes
      'revision_feedback',      -- Feedback on AI revisions
      'idea_feedback',          -- Content idea feedback/rejection reasons
      'setting_change',         -- System setting modifications with notes
      'quality_note',           -- Quality review notes
      'publish_note',           -- Notes added during publishing
      'general_note',           -- Any other user-entered text
      'version_note',           -- Notes on article versions
      'contributor_note'        -- Notes on contributor assignments
    );
  END IF;
END $$;

-- Main audit log table
CREATE TABLE IF NOT EXISTS user_input_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was entered
  input_type user_input_type NOT NULL,
  input_text TEXT NOT NULL,                    -- The actual user text (never truncated)
  input_context JSONB DEFAULT '{}',            -- Additional context (selected_text, category, severity, etc.)

  -- Where it came from
  source_table TEXT,                           -- e.g., 'article_comments', 'ai_revisions', 'content_ideas'
  source_record_id UUID,                       -- ID of the record in source table

  -- Related entities
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,

  -- Who and when
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT,                             -- Cached for easy querying if user deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For searching
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(input_text, ''))
  ) STORED
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_input_audit_user ON user_input_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_input_audit_type ON user_input_audit_log(input_type);
CREATE INDEX IF NOT EXISTS idx_user_input_audit_created ON user_input_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_input_audit_article ON user_input_audit_log(article_id) WHERE article_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_input_audit_idea ON user_input_audit_log(idea_id) WHERE idea_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_input_audit_source ON user_input_audit_log(source_table, source_record_id);
CREATE INDEX IF NOT EXISTS idx_user_input_audit_search ON user_input_audit_log USING gin(search_vector);

-- Enable RLS
ALTER TABLE user_input_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own input logs" ON user_input_audit_log;
DROP POLICY IF EXISTS "Users can insert own input logs" ON user_input_audit_log;

-- Users can view their own logs
CREATE POLICY "Users can view own input logs"
  ON user_input_audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own logs
CREATE POLICY "Users can insert own input logs"
  ON user_input_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- CRITICAL: No UPDATE or DELETE policies
-- This table is APPEND-ONLY / IMMUTABLE
-- Even the user cannot delete their own entries (this is a backup log)

-- View for easy querying with formatted output
CREATE OR REPLACE VIEW user_input_audit_summary AS
SELECT
  uial.id,
  uial.input_type,
  uial.input_text,
  uial.input_context,
  uial.source_table,
  uial.article_id,
  a.title AS article_title,
  uial.idea_id,
  ci.title AS idea_title,
  uial.user_email,
  uial.created_at,
  to_char(uial.created_at, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date
FROM user_input_audit_log uial
LEFT JOIN articles a ON uial.article_id = a.id
LEFT JOIN content_ideas ci ON uial.idea_id = ci.id
ORDER BY uial.created_at DESC;

-- Grant access to view
GRANT SELECT ON user_input_audit_summary TO authenticated;

-- Function to log user input (can be called from triggers or application code)
CREATE OR REPLACE FUNCTION log_user_input(
  p_input_type user_input_type,
  p_input_text TEXT,
  p_input_context JSONB DEFAULT '{}',
  p_source_table TEXT DEFAULT NULL,
  p_source_record_id UUID DEFAULT NULL,
  p_article_id UUID DEFAULT NULL,
  p_idea_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get user email for caching
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Insert the log entry
  INSERT INTO user_input_audit_log (
    input_type,
    input_text,
    input_context,
    source_table,
    source_record_id,
    article_id,
    idea_id,
    user_id,
    user_email
  ) VALUES (
    p_input_type,
    p_input_text,
    p_input_context,
    p_source_table,
    p_source_record_id,
    p_article_id,
    p_idea_id,
    auth.uid(),
    v_user_email
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for article_comments
CREATE OR REPLACE FUNCTION log_article_comment() RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_input(
    'article_comment'::user_input_type,
    NEW.feedback,
    jsonb_build_object(
      'selected_text', NEW.selected_text,
      'category', NEW.category,
      'severity', NEW.severity,
      'selection_start', NEW.selection_start,
      'selection_end', NEW.selection_end
    ),
    'article_comments',
    NEW.id,
    NEW.article_id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for article_comments
DROP TRIGGER IF EXISTS trg_log_article_comment ON article_comments;
CREATE TRIGGER trg_log_article_comment
  AFTER INSERT ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_article_comment();

-- Trigger function for ai_revisions (captures the prompt/instructions)
CREATE OR REPLACE FUNCTION log_ai_revision() RETURNS TRIGGER AS $$
BEGIN
  -- Log the revision request with context
  PERFORM log_user_input(
    'revision_request'::user_input_type,
    COALESCE(NEW.prompt_used, 'No prompt captured'),
    jsonb_build_object(
      'revision_type', NEW.revision_type,
      'model_used', NEW.model_used,
      'comments_snapshot', NEW.comments_snapshot,
      'article_context', NEW.article_context
    ),
    'ai_revisions',
    NEW.id,
    NEW.article_id,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ai_revisions
DROP TRIGGER IF EXISTS trg_log_ai_revision ON ai_revisions;
CREATE TRIGGER trg_log_ai_revision
  AFTER INSERT ON ai_revisions
  FOR EACH ROW
  EXECUTE FUNCTION log_ai_revision();

-- Trigger function for content_ideas feedback
CREATE OR REPLACE FUNCTION log_idea_feedback() RETURNS TRIGGER AS $$
BEGIN
  -- Only log if there's actual feedback text
  IF NEW.feedback_notes IS NOT NULL AND NEW.feedback_notes != '' THEN
    PERFORM log_user_input(
      'idea_feedback'::user_input_type,
      NEW.feedback_notes,
      jsonb_build_object(
        'feedback_score', NEW.feedback_score,
        'rejection_category', NEW.rejection_category,
        'rejection_reason', NEW.rejection_reason
      ),
      'content_ideas',
      NEW.id,
      NULL,
      NEW.id
    );
  END IF;

  -- Also log rejection reason if provided
  IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' AND
     (OLD.rejection_reason IS NULL OR OLD.rejection_reason != NEW.rejection_reason) THEN
    PERFORM log_user_input(
      'idea_feedback'::user_input_type,
      NEW.rejection_reason,
      jsonb_build_object(
        'type', 'rejection_reason',
        'rejection_category', NEW.rejection_category
      ),
      'content_ideas',
      NEW.id,
      NULL,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for content_ideas
DROP TRIGGER IF EXISTS trg_log_idea_feedback ON content_ideas;
CREATE TRIGGER trg_log_idea_feedback
  AFTER UPDATE ON content_ideas
  FOR EACH ROW
  WHEN (
    (NEW.feedback_notes IS DISTINCT FROM OLD.feedback_notes) OR
    (NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason)
  )
  EXECUTE FUNCTION log_idea_feedback();

-- Trigger function for geteducated_article_versions
CREATE OR REPLACE FUNCTION log_version_note() RETURNS TRIGGER AS $$
BEGIN
  -- Log revision notes
  IF NEW.revision_notes IS NOT NULL AND NEW.revision_notes != '' THEN
    PERFORM log_user_input(
      'version_note'::user_input_type,
      NEW.revision_notes,
      jsonb_build_object(
        'version_number', NEW.version_number,
        'version_type', NEW.version_type,
        'revision_prompt', NEW.revision_prompt
      ),
      'geteducated_article_versions',
      NEW.id,
      NEW.article_id,
      NULL
    );
  END IF;

  -- Log revision prompt if different from notes
  IF NEW.revision_prompt IS NOT NULL AND NEW.revision_prompt != '' AND
     NEW.revision_prompt IS DISTINCT FROM NEW.revision_notes THEN
    PERFORM log_user_input(
      'revision_request'::user_input_type,
      NEW.revision_prompt,
      jsonb_build_object(
        'version_number', NEW.version_number,
        'version_type', NEW.version_type
      ),
      'geteducated_article_versions',
      NEW.id,
      NEW.article_id,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for geteducated_article_versions
DROP TRIGGER IF EXISTS trg_log_version_note ON geteducated_article_versions;
CREATE TRIGGER trg_log_version_note
  AFTER INSERT ON geteducated_article_versions
  FOR EACH ROW
  EXECUTE FUNCTION log_version_note();

-- Comment explaining the immutability
COMMENT ON TABLE user_input_audit_log IS
'Immutable audit log of ALL user-entered text. This table has no UPDATE/DELETE policies.
Purpose: Backup and recovery of user comments, revision notes, feedback, and other text input.
Every piece of user-entered text is captured here automatically via triggers.';
