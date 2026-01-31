-- ============================================================================
-- MIGRATION: Fix System Settings RLS Policies
-- ============================================================================
-- DESCRIPTION: Adds missing RLS policies for system_settings table
-- ISSUE: 403 errors when trying to read/write system_settings
-- DATE: 2025-12-18
-- ============================================================================

-- Enable RLS on system_settings (if not already enabled)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated users can insert system settings" ON system_settings;
DROP POLICY IF EXISTS "Service role full access to system settings" ON system_settings;

-- Allow all authenticated users to read settings
CREATE POLICY "Authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert settings (for upsert operations)
CREATE POLICY "Authenticated users can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access to system settings"
  ON system_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also grant to anon for public reads if needed (optional)
DROP POLICY IF EXISTS "Anonymous can read system settings" ON system_settings;
CREATE POLICY "Anonymous can read system settings"
  ON system_settings FOR SELECT
  TO anon
  USING (true);

-- Add comment
COMMENT ON TABLE system_settings IS 'Global system configuration settings. RLS enabled with full access for authenticated users.';
