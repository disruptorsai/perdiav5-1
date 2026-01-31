-- ============================================================
-- FIX MIGRATION RECORDS
-- ============================================================
-- Run this SQL in the Supabase Dashboard SQL Editor to insert
-- missing migration records into the schema_migrations table.
--
-- This makes the database aware of migrations that were already
-- applied manually but not tracked in schema_migrations.
-- ============================================================

-- First, check the current state
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;

-- Insert all missing migration records
-- The schema_migrations table typically has: version (text), name (text), statements (text[])
-- We're inserting with empty statements since the migrations were already applied

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20250101000001', '20250101000001_seed_contributors', ARRAY[]::text[]),
  ('20250101000002', '20250101000002_seed_settings', ARRAY[]::text[]),
  ('20250101000003', '20250101000003_add_auto_publish_fields', ARRAY[]::text[]),
  ('20250103000000', '20250103000000_add_monetization_tables', ARRAY[]::text[]),
  ('20250103000001', '20250103000001_seed_monetization_data', ARRAY[]::text[]),
  ('20250103000002', '20250103000002_update_contributors_geteducated', ARRAY[]::text[]),
  ('20250103000003', '20250103000003_add_degree_levels', ARRAY[]::text[]),
  ('20250105000000', '20250105000000_create_subjects_table', ARRAY[]::text[]),
  ('20250105000001', '20250105000001_create_ranking_reports_tables', ARRAY[]::text[]),
  ('20250105000002', '20250105000002_seed_subjects_data', ARRAY[]::text[]),
  ('20250105000003', '20250105000003_seed_ranking_reports', ARRAY[]::text[]),
  ('20250105000004', '20250105000004_seed_ranking_report_entries', ARRAY[]::text[]),
  ('20250106000000', '20250106000000_fix_article_constraints', ARRAY[]::text[]),
  ('20250106000001', '20250106000001_fix_content_ideas_contributor_fk', ARRAY[]::text[]),
  ('20250106000002', '20250106000002_add_shortcode_tracking', ARRAY[]::text[]),
  ('20250106000003', '20250106000003_add_content_ideas_metadata', ARRAY[]::text[]),
  ('20250107000000', '20250107000000_geteducated_site_catalog', ARRAY[]::text[]),
  ('20250107000001', '20250107000001_seed_geteducated_catalog', ARRAY[]::text[]),
  ('20250108000000', '20250108000000_article_versions_system', ARRAY[]::text[]),
  ('20250108000001', '20250108000001_enhance_contributor_profiles', ARRAY[]::text[]),
  ('20250109000000', '20250109000000_add_ai_revision_tracking', ARRAY[]::text[]),
  ('20250110000000', '20250110000000_add_generation_logs', ARRAY[]::text[]),
  ('20250111000000', '20250111000000_add_chart_animation_settings', ARRAY[]::text[]),
  ('20250113000000', '20250113000000_add_wordpress_connections', ARRAY[]::text[]),
  ('20250114000000', '20250114000000_enhance_ai_revisions_context', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;

-- Verify the insertions
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
