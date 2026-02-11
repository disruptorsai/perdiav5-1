-- Perdia Content Engine v2.0 - Initial Database Schema
-- Created: January 2025
-- Description: Complete schema for AI-powered content production system

-- Enable UUID extension (using pgcrypto for gen_random_uuid)

-- =====================================================
-- 1. ARTICLE CONTRIBUTORS TABLE (9 Predefined)
-- =====================================================
-- MUST BE CREATED FIRST - Referenced by articles table
CREATE TABLE article_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,

  -- AI Matching Criteria
  expertise_areas TEXT[], -- ["tech", "finance", "gaming"]
  content_types TEXT[], -- ["listicle", "guide", "ranking"]
  writing_style_profile JSONB, -- { tone, complexity_level, sentence_length_preference }

  -- Performance Tracking
  articles_count INTEGER DEFAULT 0,
  average_quality_score DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CLUSTERS TABLE (Hierarchical Topics)
-- =====================================================
-- MUST BE CREATED EARLY - Referenced by content_ideas, keywords, site_articles
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,

  -- Metadata
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. ARTICLES TABLE (Core Content)
-- =====================================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT, -- HTML content
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'drafting', 'refinement', 'qa_review', 'ready_to_publish', 'published')),
  contributor_id UUID REFERENCES article_contributors(id) ON DELETE SET NULL,
  contributor_name TEXT, -- Cached for performance
  word_count INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0, -- 0-100
  risk_flags TEXT[], -- Array of quality issues

  -- SEO Metadata
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  slug TEXT UNIQUE,

  -- Content Structure
  faqs JSONB, -- [{ question, answer }]

  -- Publishing
  wordpress_post_id INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  published_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. CONTENT IDEAS TABLE
-- =====================================================
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  source TEXT CHECK (source IN ('reddit', 'twitter', 'news', 'trends', 'manual', 'ai_generated', 'dataforseo')),
  source_url TEXT,

  -- AI Generation Data
  prompt_used TEXT,
  seed_topics TEXT[],

  -- DataForSEO Integration
  keyword_research_data JSONB, -- { primary_keyword, search_volume, difficulty, competition, cpc, trend, opportunity_score, monthly_searches }

  -- Relationship
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. KEYWORDS TABLE
-- =====================================================
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  intent TEXT CHECK (intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 0 AND 100),

  -- Relationships
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  UNIQUE(keyword, cluster_id)
);

-- =====================================================
-- 6. SITE ARTICLES TABLE (Internal Linking Catalog)
-- =====================================================
CREATE TABLE site_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  topics TEXT[], -- Extracted keywords/topics
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- Link Tracking
  times_linked_to INTEGER DEFAULT 0,
  last_linked_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 7. INTERNAL LINKS TABLE (Link Tracking)
-- =====================================================
-- MUST BE CREATED BEFORE external_links to avoid issues
CREATE TABLE internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  target_site_article_id UUID NOT NULL REFERENCES site_articles(id) ON DELETE CASCADE,

  -- Link Details
  anchor_text TEXT NOT NULL,
  relevance_score DECIMAL(5,2), -- 0-100, how relevant the link is

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. EXTERNAL LINKS TABLE (Citations)
-- =====================================================
CREATE TABLE external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Link Details
  url TEXT NOT NULL,
  anchor_text TEXT,
  domain TEXT,
  is_citation BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. WORDPRESS CONNECTIONS TABLE
-- =====================================================
CREATE TABLE wordpress_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('basic_auth', 'application_password', 'jwt')),

  -- Credentials (encrypted in production)
  username TEXT,
  password TEXT, -- Should be encrypted

  -- Settings
  default_post_status TEXT DEFAULT 'draft' CHECK (default_post_status IN ('draft', 'publish')),
  default_category_id INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_test_at TIMESTAMP WITH TIME ZONE,
  last_test_success BOOLEAN,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 10. ARTICLE REVISIONS TABLE (Editorial Feedback)
-- =====================================================
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Feedback Details
  selected_text TEXT, -- Text that was highlighted
  comment TEXT NOT NULL,
  category TEXT CHECK (category IN ('accuracy', 'clarity', 'tone', 'seo', 'structure', 'style', 'other')),
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor', 'suggestion')),

  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'dismissed')),
  ai_revised BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 11. TRAINING DATA TABLE (AI Learning)
-- =====================================================
CREATE TABLE training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

  -- Before/After Data
  original_content TEXT,
  revised_content TEXT,
  feedback_items JSONB, -- [{ category, comment, severity }]

  -- Learning Insights
  patterns_learned TEXT[], -- Extracted patterns
  impact_score INTEGER CHECK (impact_score BETWEEN 0 AND 100),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  applied_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 12. SHORTCODES TABLE (WordPress Shortcodes)
-- =====================================================
CREATE TABLE shortcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Usage Tracking
  times_used INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 13. GENERATION QUEUE TABLE (Automation)
-- =====================================================
CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_idea_id UUID NOT NULL REFERENCES content_ideas(id) ON DELETE CASCADE,

  -- Queue Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,

  -- Progress Tracking
  current_stage TEXT, -- 'drafting', 'humanizing', 'quality_check', etc.
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  error_message TEXT,

  -- Results
  generated_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 14. SYSTEM SETTINGS TABLE (Configuration)
-- =====================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT, -- 'ai', 'seo', 'wordpress', 'automation', 'geteducated'
  description TEXT,
  editable_by TEXT DEFAULT 'admin',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Articles
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_contributor ON articles(contributor_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_user ON articles(user_id);

-- Content Ideas
CREATE INDEX idx_ideas_status ON content_ideas(status);
CREATE INDEX idx_ideas_cluster ON content_ideas(cluster_id);
CREATE INDEX idx_ideas_user ON content_ideas(user_id);

-- Keywords
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);

-- Site Articles
CREATE INDEX idx_site_articles_topics ON site_articles USING gin(topics);
CREATE INDEX idx_site_articles_cluster ON site_articles(cluster_id);

-- Internal Links
CREATE INDEX idx_internal_links_source ON internal_links(source_article_id);
CREATE INDEX idx_internal_links_target ON internal_links(target_site_article_id);

-- External Links
CREATE INDEX idx_external_links_article ON external_links(article_id);

-- Generation Queue
CREATE INDEX idx_queue_status ON generation_queue(status);
CREATE INDEX idx_queue_priority ON generation_queue(priority DESC);
CREATE INDEX idx_queue_created ON generation_queue(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributors_updated_at BEFORE UPDATE ON article_contributors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clusters_updated_at BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_articles_updated_at BEFORE UPDATE ON site_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wordpress_updated_at BEFORE UPDATE ON wordpress_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortcodes_updated_at BEFORE UPDATE ON shortcodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Articles: Users can only access their own articles
CREATE POLICY "Users can view their own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Content Ideas: Users can only access their own ideas
CREATE POLICY "Users can view their own ideas"
  ON content_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas"
  ON content_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
  ON content_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON content_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Contributors: Public read, no write (managed by seeds)
CREATE POLICY "Anyone can view contributors"
  ON article_contributors FOR SELECT
  USING (true);

-- Clusters: Users can manage their own clusters
CREATE POLICY "Users can view their own clusters"
  ON clusters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clusters"
  ON clusters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clusters"
  ON clusters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clusters"
  ON clusters FOR DELETE
  USING (auth.uid() = user_id);

-- Keywords: Users can manage their own keywords
CREATE POLICY "Users can view their own keywords"
  ON keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
  ON keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON keywords FOR DELETE
  USING (auth.uid() = user_id);

-- Site Articles: Users can manage their own site articles
CREATE POLICY "Users can view their own site articles"
  ON site_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own site articles"
  ON site_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own site articles"
  ON site_articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own site articles"
  ON site_articles FOR DELETE
  USING (auth.uid() = user_id);

-- WordPress Connections: Users can manage their own connections
CREATE POLICY "Users can view their own connections"
  ON wordpress_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON wordpress_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON wordpress_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON wordpress_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Article Revisions: Users can view/create revisions for their articles
CREATE POLICY "Users can view revisions for their articles"
  ON article_revisions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_revisions.article_id
    AND articles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create revisions"
  ON article_revisions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Training Data: Users can manage their own training data
CREATE POLICY "Users can view their own training data"
  ON training_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training data"
  ON training_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training data"
  ON training_data FOR UPDATE
  USING (auth.uid() = user_id);

-- Internal/External Links: Read access for article owners
CREATE POLICY "Users can view links for their articles"
  ON internal_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = internal_links.source_article_id
    AND articles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert links for their articles"
  ON internal_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = internal_links.source_article_id
    AND articles.user_id = auth.uid()
  ));

CREATE POLICY "Users can view external links for their articles"
  ON external_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = external_links.article_id
    AND articles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert external links"
  ON external_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = external_links.article_id
    AND articles.user_id = auth.uid()
  ));

-- Shortcodes: Users can manage their own shortcodes
CREATE POLICY "Users can view their own shortcodes"
  ON shortcodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shortcodes"
  ON shortcodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shortcodes"
  ON shortcodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shortcodes"
  ON shortcodes FOR DELETE
  USING (auth.uid() = user_id);

-- Generation Queue: View only (managed by system)
CREATE POLICY "Users can view generation queue"
  ON generation_queue FOR SELECT
  USING (true);

-- System Settings: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view settings"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated');
