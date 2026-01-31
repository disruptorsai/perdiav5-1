-- Article Versions System for GetEducated Catalog
-- Created: January 2025
-- Purpose: Track all versions of articles, starting with original scraped content

-- =====================================================
-- 1. ARTICLE VERSIONS TABLE
-- =====================================================
-- Stores each version of an article's content
CREATE TABLE IF NOT EXISTS geteducated_article_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES geteducated_articles(id) ON DELETE CASCADE,

  -- Version Info
  version_number INTEGER NOT NULL DEFAULT 1,
  version_type TEXT NOT NULL CHECK (version_type IN (
    'original',      -- Initial scraped content
    'ai_revision',   -- AI-generated revision
    'manual_edit',   -- Human manual edit
    'ai_update',     -- AI update (new info, stats, etc.)
    'republished'    -- After pushing to WordPress
  )),

  -- Content Snapshot
  title TEXT NOT NULL,
  meta_description TEXT,
  content_html TEXT,
  content_text TEXT,
  word_count INTEGER DEFAULT 0,

  -- SEO Data
  focus_keyword TEXT,
  heading_structure JSONB,
  faqs JSONB,
  internal_links JSONB,
  external_links JSONB,

  -- Quality Metrics
  quality_score INTEGER,
  readability_score INTEGER,
  seo_score INTEGER,

  -- Revision Metadata
  revision_prompt TEXT,         -- What was asked for in this revision
  revision_notes TEXT,          -- Human notes about changes
  changes_summary TEXT,         -- AI-generated summary of what changed
  ai_model_used TEXT,           -- Which AI model generated this version

  -- Author Attribution
  revised_by TEXT,              -- Who initiated the revision (user email or 'system')
  contributor_id UUID,          -- If new author assigned

  -- Status
  is_current BOOLEAN DEFAULT FALSE,  -- Is this the live version?
  is_published BOOLEAN DEFAULT FALSE, -- Has this been pushed to WordPress?
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. REVISION QUEUE TABLE
-- =====================================================
-- Queue for articles pending AI revision
CREATE TABLE IF NOT EXISTS geteducated_revision_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES geteducated_articles(id) ON DELETE CASCADE,

  -- Revision Request
  revision_type TEXT NOT NULL CHECK (revision_type IN (
    'full_rewrite',      -- Complete rewrite from scratch
    'refresh',           -- Update stats, add new info
    'seo_optimize',      -- Improve SEO elements
    'add_sections',      -- Add specific sections
    'improve_quality',   -- Improve quality score
    'update_links',      -- Update internal/external links
    'custom'             -- Custom instructions
  )),

  -- Instructions
  instructions TEXT,            -- Custom instructions for AI
  target_word_count INTEGER,    -- Target word count if different
  target_contributor_id UUID,   -- If specific author style needed

  -- Priority & Scheduling
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),  -- 1 = highest
  scheduled_for TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )),

  -- Processing Info
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result_version_id UUID REFERENCES geteducated_article_versions(id),

  -- User Info
  requested_by TEXT NOT NULL,   -- User email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. UPDATE MAIN ARTICLES TABLE
-- =====================================================
-- Add version tracking fields to main table
ALTER TABLE geteducated_articles
  ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES geteducated_article_versions(id),
  ADD COLUMN IF NOT EXISTS version_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_revised_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revision_status TEXT DEFAULT 'original' CHECK (revision_status IN (
    'original',         -- Never revised
    'queued',           -- In revision queue
    'processing',       -- Currently being revised
    'revised',          -- Has been revised
    'needs_review'      -- Revision needs human review
  ));

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ge_versions_article ON geteducated_article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_ge_versions_current ON geteducated_article_versions(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_ge_versions_type ON geteducated_article_versions(version_type);
CREATE INDEX IF NOT EXISTS idx_ge_versions_created ON geteducated_article_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ge_revision_queue_status ON geteducated_revision_queue(status);
CREATE INDEX IF NOT EXISTS idx_ge_revision_queue_priority ON geteducated_revision_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_ge_revision_queue_scheduled ON geteducated_revision_queue(scheduled_for) WHERE status = 'pending';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE geteducated_article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_revision_queue ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view versions
CREATE POLICY "Authenticated users can view versions" ON geteducated_article_versions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can insert versions
CREATE POLICY "Authenticated users can insert versions" ON geteducated_article_versions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update versions
CREATE POLICY "Authenticated users can update versions" ON geteducated_article_versions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can manage revision queue
CREATE POLICY "Authenticated users can view queue" ON geteducated_revision_queue
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert queue" ON geteducated_revision_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update queue" ON geteducated_revision_queue
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete queue" ON geteducated_revision_queue
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create initial version from existing article
CREATE OR REPLACE FUNCTION create_original_version(p_article_id UUID)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_article RECORD;
BEGIN
  -- Get article data
  SELECT * INTO v_article FROM geteducated_articles WHERE id = p_article_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article not found: %', p_article_id;
  END IF;

  -- Check if original version already exists
  SELECT id INTO v_version_id
  FROM geteducated_article_versions
  WHERE article_id = p_article_id AND version_type = 'original';

  IF FOUND THEN
    RETURN v_version_id;
  END IF;

  -- Create the original version
  INSERT INTO geteducated_article_versions (
    article_id,
    version_number,
    version_type,
    title,
    meta_description,
    content_html,
    content_text,
    word_count,
    focus_keyword,
    heading_structure,
    faqs,
    internal_links,
    external_links,
    is_current,
    revised_by,
    created_at
  ) VALUES (
    p_article_id,
    1,
    'original',
    v_article.title,
    v_article.meta_description,
    v_article.content_html,
    v_article.content_text,
    v_article.word_count,
    v_article.focus_keyword,
    v_article.heading_structure,
    v_article.faqs,
    v_article.internal_links,
    v_article.external_links,
    TRUE,
    'system',
    COALESCE(v_article.scraped_at, NOW())
  )
  RETURNING id INTO v_version_id;

  -- Update article with version reference
  UPDATE geteducated_articles
  SET
    current_version_id = v_version_id,
    version_count = 1
  WHERE id = p_article_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create new version
CREATE OR REPLACE FUNCTION create_article_version(
  p_article_id UUID,
  p_version_type TEXT,
  p_title TEXT,
  p_meta_description TEXT,
  p_content_html TEXT,
  p_content_text TEXT,
  p_word_count INTEGER,
  p_revision_notes TEXT DEFAULT NULL,
  p_changes_summary TEXT DEFAULT NULL,
  p_ai_model_used TEXT DEFAULT NULL,
  p_revised_by TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM geteducated_article_versions
  WHERE article_id = p_article_id;

  -- Set all existing versions to not current
  UPDATE geteducated_article_versions
  SET is_current = FALSE
  WHERE article_id = p_article_id;

  -- Create new version
  INSERT INTO geteducated_article_versions (
    article_id,
    version_number,
    version_type,
    title,
    meta_description,
    content_html,
    content_text,
    word_count,
    revision_notes,
    changes_summary,
    ai_model_used,
    revised_by,
    is_current
  ) VALUES (
    p_article_id,
    v_version_number,
    p_version_type,
    p_title,
    p_meta_description,
    p_content_html,
    p_content_text,
    p_word_count,
    p_revision_notes,
    p_changes_summary,
    p_ai_model_used,
    p_revised_by,
    TRUE
  )
  RETURNING id INTO v_version_id;

  -- Update article
  UPDATE geteducated_articles
  SET
    current_version_id = v_version_id,
    version_count = v_version_number,
    last_revised_at = NOW(),
    revision_status = 'revised',
    -- Also update the main content
    title = p_title,
    meta_description = p_meta_description,
    content_html = p_content_html,
    content_text = p_content_text,
    word_count = p_word_count
  WHERE id = p_article_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get version history
CREATE OR REPLACE FUNCTION get_article_versions(p_article_id UUID)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  version_type TEXT,
  title TEXT,
  word_count INTEGER,
  is_current BOOLEAN,
  is_published BOOLEAN,
  changes_summary TEXT,
  revised_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.version_number,
    v.version_type,
    v.title,
    v.word_count,
    v.is_current,
    v.is_published,
    v.changes_summary,
    v.revised_by,
    v.created_at
  FROM geteducated_article_versions v
  WHERE v.article_id = p_article_id
  ORDER BY v.version_number DESC;
END;
$$ LANGUAGE plpgsql;
