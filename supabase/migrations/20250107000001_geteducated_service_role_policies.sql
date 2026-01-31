-- GetEducated.com Site Catalog - Service Role Policies
-- Created: January 2025
-- Purpose: Allow service role to manage GetEducated reference data (for import scripts)
--
-- DESCRIPTION: Adds INSERT/UPDATE/DELETE policies for the service_role on all
-- geteducated_* tables. These tables are reference data that should be readable
-- by authenticated users but only writable via service role (backend scripts).
--
-- DEPENDENCIES: 20250107000000_geteducated_site_catalog.sql

-- geteducated_authors
CREATE POLICY "Service role can insert authors" ON geteducated_authors
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update authors" ON geteducated_authors
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete authors" ON geteducated_authors
  FOR DELETE TO service_role USING (true);

-- geteducated_categories
CREATE POLICY "Service role can insert categories" ON geteducated_categories
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update categories" ON geteducated_categories
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete categories" ON geteducated_categories
  FOR DELETE TO service_role USING (true);

-- geteducated_tags
CREATE POLICY "Service role can insert tags" ON geteducated_tags
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update tags" ON geteducated_tags
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete tags" ON geteducated_tags
  FOR DELETE TO service_role USING (true);

-- geteducated_articles
CREATE POLICY "Service role can insert articles" ON geteducated_articles
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update articles" ON geteducated_articles
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete articles" ON geteducated_articles
  FOR DELETE TO service_role USING (true);

-- geteducated_article_categories
CREATE POLICY "Service role can insert article_categories" ON geteducated_article_categories
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update article_categories" ON geteducated_article_categories
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete article_categories" ON geteducated_article_categories
  FOR DELETE TO service_role USING (true);

-- geteducated_article_tags
CREATE POLICY "Service role can insert article_tags" ON geteducated_article_tags
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update article_tags" ON geteducated_article_tags
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete article_tags" ON geteducated_article_tags
  FOR DELETE TO service_role USING (true);

-- geteducated_schools
CREATE POLICY "Service role can insert schools" ON geteducated_schools
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update schools" ON geteducated_schools
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete schools" ON geteducated_schools
  FOR DELETE TO service_role USING (true);

-- geteducated_degree_programs
CREATE POLICY "Service role can insert programs" ON geteducated_degree_programs
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update programs" ON geteducated_degree_programs
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete programs" ON geteducated_degree_programs
  FOR DELETE TO service_role USING (true);

-- geteducated_degree_categories
CREATE POLICY "Service role can insert degree_categories" ON geteducated_degree_categories
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update degree_categories" ON geteducated_degree_categories
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete degree_categories" ON geteducated_degree_categories
  FOR DELETE TO service_role USING (true);

-- geteducated_style_samples
CREATE POLICY "Service role can insert style_samples" ON geteducated_style_samples
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update style_samples" ON geteducated_style_samples
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete style_samples" ON geteducated_style_samples
  FOR DELETE TO service_role USING (true);

-- ROLLBACK (if needed):
-- DROP POLICY "Service role can insert authors" ON geteducated_authors;
-- DROP POLICY "Service role can update authors" ON geteducated_authors;
-- DROP POLICY "Service role can delete authors" ON geteducated_authors;
-- ... (repeat for all tables)
