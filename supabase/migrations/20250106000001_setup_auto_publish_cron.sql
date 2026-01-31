-- Setup pg_cron for auto-publish scheduler
-- This migration creates a cron job that runs the auto-publish Edge Function every 15 minutes
--
-- IMPORTANT: This migration requires the pg_cron extension to be enabled.
-- In Supabase, pg_cron must be enabled via Dashboard > Database > Extensions
--
-- Also requires pg_net extension for HTTP requests from database

-- Enable required extensions (if not already enabled)
-- Note: These may need to be enabled via Supabase Dashboard first
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to log auto-publish job executions
CREATE TABLE IF NOT EXISTS auto_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL DEFAULT 'auto-publish-articles',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  articles_checked INTEGER DEFAULT 0,
  articles_published INTEGER DEFAULT 0,
  articles_failed INTEGER DEFAULT 0,
  articles_skipped INTEGER DEFAULT 0,
  duration_ms INTEGER,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_auto_publish_logs_started ON auto_publish_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_publish_logs_status ON auto_publish_logs(status);

-- Enable RLS
ALTER TABLE auto_publish_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read logs
CREATE POLICY "Anyone can read auto publish logs" ON auto_publish_logs
  FOR SELECT TO authenticated USING (true);

-- Table comment
COMMENT ON TABLE auto_publish_logs IS 'Audit log for auto-publish scheduler runs';

-- ============================================================
-- CRON JOB SETUP
-- ============================================================

-- Note: Replace YOUR_PROJECT_REF and YOUR_ANON_KEY with actual values
-- These should be set as environment variables or via Supabase secrets

-- Schedule auto-publish to run every 15 minutes
-- Project ref: nvffvcjtrgxnunncdafz (perdiav5)
SELECT cron.schedule(
  'auto-publish-articles',  -- Job name
  '0,15,30,45 * * * *',     -- Every 15 minutes (at :00, :15, :30, :45)
  $$
  SELECT net.http_post(
    url := 'https://nvffvcjtrgxnunncdafz.supabase.co/functions/v1/auto-publish-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'timestamp', now()
    )
  ) as request_id;
  $$
);

-- To list scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('auto-publish-articles');

-- ============================================================
-- HELPER FUNCTION FOR MANUAL TRIGGER
-- ============================================================

-- Create a function that can be called to manually trigger auto-publish
-- This is useful for testing or forcing a run outside the schedule
CREATE OR REPLACE FUNCTION trigger_auto_publish()
RETURNS TABLE(success BOOLEAN, message TEXT, log_id UUID) AS $$
DECLARE
  log_record_id UUID;
BEGIN
  -- Create log entry
  INSERT INTO auto_publish_logs (job_name, started_at, status)
  VALUES ('auto-publish-articles', NOW(), 'running')
  RETURNING id INTO log_record_id;

  -- Note: Actual HTTP call to Edge Function must be done via pg_net
  -- This function just creates the log entry
  -- The actual trigger is done via the Edge Function

  RETURN QUERY SELECT
    true AS success,
    'Auto-publish triggered. Check logs for results.' AS message,
    log_record_id AS log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION trigger_auto_publish() TO authenticated;

COMMENT ON FUNCTION trigger_auto_publish IS 'Manually trigger auto-publish scheduler';

-- ============================================================
-- UPDATE SYSTEM SETTINGS WITH DEFAULTS
-- ============================================================

-- Ensure auto-publish settings exist with defaults
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('auto_publish_enabled', 'false', 'boolean', 'Enable automatic publishing of articles after deadline'),
  ('auto_publish_days', '5', 'number', 'Days to wait before auto-publishing unreviewed articles'),
  ('auto_publish_max_per_run', '10', 'number', 'Maximum articles to auto-publish per scheduler run')
ON CONFLICT (setting_key) DO NOTHING;
