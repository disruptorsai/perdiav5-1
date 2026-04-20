-- Migration: Add article editing lock functionality
-- Purpose: Prevent concurrent editing conflicts (F-06)
-- Created: February 2026

-- Add editing lock columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS editing_locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS editing_locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS editing_lock_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient lock queries
CREATE INDEX IF NOT EXISTS idx_articles_editing_lock
ON articles(editing_locked_by)
WHERE editing_locked_by IS NOT NULL;

-- Function to acquire an editing lock
CREATE OR REPLACE FUNCTION acquire_article_lock(
  p_article_id UUID,
  p_user_id UUID,
  p_lock_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  locked_by UUID,
  locked_by_email TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_current_lock_user UUID;
  v_current_lock_expires TIMESTAMP WITH TIME ZONE;
  v_lock_user_email TEXT;
BEGIN
  -- Get current lock status
  SELECT
    editing_locked_by,
    editing_lock_expires_at
  INTO v_current_lock_user, v_current_lock_expires
  FROM articles
  WHERE id = p_article_id;

  -- Check if article exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      'Article not found'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TIMESTAMP WITH TIME ZONE,
      NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Check if already locked by someone else (and not expired)
  IF v_current_lock_user IS NOT NULL
     AND v_current_lock_user != p_user_id
     AND v_current_lock_expires > NOW() THEN

    -- Get the email of the user who has the lock
    SELECT email INTO v_lock_user_email
    FROM auth.users WHERE id = v_current_lock_user;

    RETURN QUERY SELECT
      FALSE,
      'Article is currently being edited by another user'::TEXT,
      v_current_lock_user,
      COALESCE(v_lock_user_email, 'Unknown user')::TEXT,
      (SELECT editing_locked_at FROM articles WHERE id = p_article_id),
      v_current_lock_expires;
    RETURN;
  END IF;

  -- Acquire the lock
  UPDATE articles
  SET
    editing_locked_by = p_user_id,
    editing_locked_at = NOW(),
    editing_lock_expires_at = NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_article_id;

  -- Return success
  RETURN QUERY SELECT
    TRUE,
    'Lock acquired successfully'::TEXT,
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id)::TEXT,
    NOW(),
    NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release an editing lock
CREATE OR REPLACE FUNCTION release_article_lock(
  p_article_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_current_lock_user UUID;
BEGIN
  -- Get current lock
  SELECT editing_locked_by INTO v_current_lock_user
  FROM articles WHERE id = p_article_id;

  -- Check if we own the lock
  IF v_current_lock_user IS NULL THEN
    RETURN QUERY SELECT TRUE, 'No lock to release'::TEXT;
    RETURN;
  END IF;

  IF v_current_lock_user != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You do not own this lock'::TEXT;
    RETURN;
  END IF;

  -- Release the lock
  UPDATE articles
  SET
    editing_locked_by = NULL,
    editing_locked_at = NULL,
    editing_lock_expires_at = NULL,
    updated_at = NOW()
  WHERE id = p_article_id;

  RETURN QUERY SELECT TRUE, 'Lock released successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend an editing lock
CREATE OR REPLACE FUNCTION extend_article_lock(
  p_article_id UUID,
  p_user_id UUID,
  p_additional_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_current_lock_user UUID;
  v_new_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current lock
  SELECT editing_locked_by INTO v_current_lock_user
  FROM articles WHERE id = p_article_id;

  -- Check if we own the lock
  IF v_current_lock_user IS NULL OR v_current_lock_user != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You do not own this lock'::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- Extend the lock
  v_new_expires := NOW() + (p_additional_minutes || ' minutes')::INTERVAL;

  UPDATE articles
  SET
    editing_lock_expires_at = v_new_expires,
    updated_at = NOW()
  WHERE id = p_article_id;

  RETURN QUERY SELECT TRUE, 'Lock extended successfully'::TEXT, v_new_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION acquire_article_lock(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION release_article_lock(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_article_lock(UUID, UUID, INTEGER) TO authenticated;

-- Comment on columns
COMMENT ON COLUMN articles.editing_locked_by IS 'User ID of who is currently editing this article';
COMMENT ON COLUMN articles.editing_locked_at IS 'When the editing lock was acquired';
COMMENT ON COLUMN articles.editing_lock_expires_at IS 'When the editing lock expires automatically';
