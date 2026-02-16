-- Fix system_settings column names to match application code
-- The initial schema used setting_key/setting_value/setting_type
-- but the app code uses key/value/category
-- Production was already renamed manually; this migration brings branches in sync

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'setting_key') THEN
    ALTER TABLE system_settings RENAME COLUMN setting_key TO key;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'setting_value') THEN
    ALTER TABLE system_settings RENAME COLUMN setting_value TO value;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'setting_type') THEN
    ALTER TABLE system_settings RENAME COLUMN setting_type TO category;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'editable_by') THEN
    ALTER TABLE system_settings DROP COLUMN editable_by;
  END IF;
END $$;
