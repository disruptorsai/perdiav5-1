-- Perdia v5 - Shared Workspace RLS Migration
-- Created: January 2025
-- Description: Updates RLS policies to allow all authenticated users to access shared data
-- Purpose: Convert from multi-tenant (user-isolated) to shared workspace model
-- User tracking: user_id is kept for audit/attribution but no longer used for data isolation

-- =====================================================
-- DROP EXISTING USER-ISOLATED POLICIES
-- =====================================================

-- Articles
DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;

-- Content Ideas
DROP POLICY IF EXISTS "Users can view their own ideas" ON content_ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas" ON content_ideas;
DROP POLICY IF EXISTS "Users can update their own ideas" ON content_ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON content_ideas;

-- Clusters
DROP POLICY IF EXISTS "Users can view their own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can insert their own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can update their own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can delete their own clusters" ON clusters;

-- Keywords
DROP POLICY IF EXISTS "Users can view their own keywords" ON keywords;
DROP POLICY IF EXISTS "Users can insert their own keywords" ON keywords;
DROP POLICY IF EXISTS "Users can delete their own keywords" ON keywords;

-- Site Articles
DROP POLICY IF EXISTS "Users can view their own site articles" ON site_articles;
DROP POLICY IF EXISTS "Users can insert their own site articles" ON site_articles;
DROP POLICY IF EXISTS "Users can update their own site articles" ON site_articles;
DROP POLICY IF EXISTS "Users can delete their own site articles" ON site_articles;

-- WordPress Connections
DROP POLICY IF EXISTS "Users can view their own connections" ON wordpress_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON wordpress_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON wordpress_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON wordpress_connections;

-- Article Revisions
DROP POLICY IF EXISTS "Users can view revisions for their articles" ON article_revisions;
DROP POLICY IF EXISTS "Users can create revisions" ON article_revisions;

-- Training Data
DROP POLICY IF EXISTS "Users can view their own training data" ON training_data;
DROP POLICY IF EXISTS "Users can insert their own training data" ON training_data;
DROP POLICY IF EXISTS "Users can update their own training data" ON training_data;

-- Internal Links
DROP POLICY IF EXISTS "Users can view links for their articles" ON internal_links;
DROP POLICY IF EXISTS "Users can insert links for their articles" ON internal_links;

-- External Links
DROP POLICY IF EXISTS "Users can view external links for their articles" ON external_links;
DROP POLICY IF EXISTS "Users can insert external links" ON external_links;

-- Shortcodes
DROP POLICY IF EXISTS "Users can view their own shortcodes" ON shortcodes;
DROP POLICY IF EXISTS "Users can insert their own shortcodes" ON shortcodes;
DROP POLICY IF EXISTS "Users can update their own shortcodes" ON shortcodes;
DROP POLICY IF EXISTS "Users can delete their own shortcodes" ON shortcodes;

-- =====================================================
-- CREATE NEW SHARED WORKSPACE POLICIES
-- All authenticated users can access all data
-- user_id is retained for audit/attribution purposes
-- =====================================================

-- Articles: All authenticated users can access all articles
CREATE POLICY "Authenticated users can view all articles"
  ON articles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update articles"
  ON articles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete articles"
  ON articles FOR DELETE
  USING (auth.role() = 'authenticated');

-- Content Ideas: All authenticated users can access all ideas
CREATE POLICY "Authenticated users can view all ideas"
  ON content_ideas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert ideas"
  ON content_ideas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ideas"
  ON content_ideas FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ideas"
  ON content_ideas FOR DELETE
  USING (auth.role() = 'authenticated');

-- Clusters: All authenticated users can manage clusters
CREATE POLICY "Authenticated users can view all clusters"
  ON clusters FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clusters"
  ON clusters FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clusters"
  ON clusters FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clusters"
  ON clusters FOR DELETE
  USING (auth.role() = 'authenticated');

-- Keywords: All authenticated users can manage keywords
CREATE POLICY "Authenticated users can view all keywords"
  ON keywords FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert keywords"
  ON keywords FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete keywords"
  ON keywords FOR DELETE
  USING (auth.role() = 'authenticated');

-- Site Articles: All authenticated users can manage site articles
CREATE POLICY "Authenticated users can view all site articles"
  ON site_articles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert site articles"
  ON site_articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update site articles"
  ON site_articles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete site articles"
  ON site_articles FOR DELETE
  USING (auth.role() = 'authenticated');

-- WordPress Connections: All authenticated users can manage connections
CREATE POLICY "Authenticated users can view all connections"
  ON wordpress_connections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert connections"
  ON wordpress_connections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update connections"
  ON wordpress_connections FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete connections"
  ON wordpress_connections FOR DELETE
  USING (auth.role() = 'authenticated');

-- Article Revisions: All authenticated users can view/create revisions
CREATE POLICY "Authenticated users can view all revisions"
  ON article_revisions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create revisions"
  ON article_revisions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update revisions"
  ON article_revisions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Training Data: All authenticated users can manage training data
CREATE POLICY "Authenticated users can view all training data"
  ON training_data FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert training data"
  ON training_data FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update training data"
  ON training_data FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Internal Links: All authenticated users can manage internal links
CREATE POLICY "Authenticated users can view all internal links"
  ON internal_links FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert internal links"
  ON internal_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete internal links"
  ON internal_links FOR DELETE
  USING (auth.role() = 'authenticated');

-- External Links: All authenticated users can manage external links
CREATE POLICY "Authenticated users can view all external links"
  ON external_links FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert external links"
  ON external_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete external links"
  ON external_links FOR DELETE
  USING (auth.role() = 'authenticated');

-- Shortcodes: All authenticated users can manage shortcodes
CREATE POLICY "Authenticated users can view all shortcodes"
  ON shortcodes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert shortcodes"
  ON shortcodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update shortcodes"
  ON shortcodes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete shortcodes"
  ON shortcodes FOR DELETE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- Add created_by and updated_by columns for audit trail
-- These track WHO made changes, not for access control
-- =====================================================

-- Add updated_by to articles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE articles ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add updated_by to content_ideas if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON POLICY "Authenticated users can view all articles" ON articles IS
  'Shared workspace: all authenticated users can view all articles. user_id tracks creator for attribution.';

COMMENT ON POLICY "Authenticated users can view all ideas" ON content_ideas IS
  'Shared workspace: all authenticated users can view all content ideas. user_id tracks creator for attribution.';
