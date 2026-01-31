-- GetEducated.com Site Catalog - Comprehensive Schema
-- Created: January 2025
-- Purpose: Store full site content for AI training, internal linking, and article rewriting

-- =====================================================
-- 1. GETEDUCATED AUTHORS TABLE
-- =====================================================
-- Store author/contributor information from GetEducated
CREATE TABLE IF NOT EXISTS geteducated_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE, -- URL slug (e.g., "kayleigh-gilbert")
  title TEXT, -- "Online Education Expert"
  credentials TEXT, -- "MS"
  bio TEXT,
  expertise_areas TEXT[], -- Areas of expertise
  linkedin_url TEXT,
  profile_url TEXT, -- Full URL to author page
  articles_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GETEDUCATED CATEGORIES TABLE
-- =====================================================
-- Hierarchical categories for content organization
CREATE TABLE IF NOT EXISTS geteducated_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  parent_id UUID REFERENCES geteducated_categories(id) ON DELETE SET NULL,
  description TEXT,
  url TEXT, -- Category page URL
  article_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. GETEDUCATED TAGS TABLE
-- =====================================================
-- Tags for content classification
CREATE TABLE IF NOT EXISTS geteducated_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. GETEDUCATED ARTICLES TABLE (Main Catalog)
-- =====================================================
-- Comprehensive article storage for training and linking
CREATE TABLE IF NOT EXISTS geteducated_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core Content
  url TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  excerpt TEXT,
  content_html TEXT, -- Full HTML content
  content_text TEXT, -- Plain text content (for training)
  word_count INTEGER DEFAULT 0,

  -- Content Type Classification
  content_type TEXT CHECK (content_type IN (
    'ranking', 'guide', 'career', 'blog',
    'degree_category', 'school_profile',
    'scholarship', 'how_to', 'listicle', 'explainer', 'other'
  )),

  -- Author Information
  author_id UUID REFERENCES geteducated_authors(id) ON DELETE SET NULL,
  author_name TEXT, -- Cached for performance

  -- Dates
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Structure Analysis (for AI training)
  heading_structure JSONB, -- { h1: [...], h2: [...], h3: [...] }
  faqs JSONB, -- [{ question, answer }]
  internal_links JSONB, -- [{ url, anchor_text }]
  external_links JSONB, -- [{ url, anchor_text, domain }]

  -- SEO Data
  focus_keyword TEXT,
  featured_image_url TEXT,
  schema_data JSONB, -- Structured data from page

  -- Topics for Internal Linking Algorithm
  topics TEXT[], -- Extracted topics/keywords
  primary_topic TEXT, -- Main topic of the article
  degree_level TEXT, -- associate, bachelors, masters, doctorate, certificate
  subject_area TEXT, -- business, nursing, education, etc.

  -- Metrics
  times_linked_to INTEGER DEFAULT 0, -- How many times we've linked to this
  last_linked_at TIMESTAMP WITH TIME ZONE,
  relevance_score INTEGER DEFAULT 0, -- Computed relevance for linking

  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- Whether article still exists
  needs_rewrite BOOLEAN DEFAULT FALSE, -- Flagged for rewriting
  rewrite_priority INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ARTICLE-CATEGORY JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS geteducated_article_categories (
  article_id UUID NOT NULL REFERENCES geteducated_articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES geteducated_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- =====================================================
-- 6. ARTICLE-TAG JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS geteducated_article_tags (
  article_id UUID NOT NULL REFERENCES geteducated_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES geteducated_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- =====================================================
-- 7. GETEDUCATED SCHOOLS TABLE
-- =====================================================
-- School/institution profiles
CREATE TABLE IF NOT EXISTS geteducated_schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  url TEXT UNIQUE, -- GetEducated profile URL
  official_website TEXT, -- School's actual website
  description TEXT,
  location TEXT, -- City, State
  school_type TEXT, -- public, private, community, etc.
  accreditation TEXT[],
  featured_image_url TEXT,

  -- Metrics
  program_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. GETEDUCATED DEGREE PROGRAMS TABLE
-- =====================================================
-- Individual degree program listings
CREATE TABLE IF NOT EXISTS geteducated_degree_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT,

  -- Classification
  degree_level TEXT CHECK (degree_level IN (
    'certificate', 'diploma', 'associate', 'bachelors',
    'masters', 'doctorate', 'post_graduate_certificate'
  )),
  subject_area TEXT, -- nursing, business, education, etc.
  subject_subcategory TEXT,

  -- School Relationship
  school_id UUID REFERENCES geteducated_schools(id) ON DELETE SET NULL,
  school_name TEXT, -- Cached

  -- Cost Data (from rankings)
  total_cost DECIMAL(10,2),
  cost_per_credit DECIMAL(8,2),
  estimated_credits INTEGER,

  -- Accreditation
  accreditation TEXT[],
  is_aacsb BOOLEAN DEFAULT FALSE, -- For business programs
  is_caep BOOLEAN DEFAULT FALSE, -- For education programs
  is_ccne BOOLEAN DEFAULT FALSE, -- For nursing programs

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. DEGREE CATEGORY PAGES TABLE
-- =====================================================
-- Degree category landing pages (e.g., /online-degrees/masters/business/)
CREATE TABLE IF NOT EXISTS geteducated_degree_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content_html TEXT,
  content_text TEXT,

  -- Classification
  degree_level TEXT,
  subject_area TEXT,

  -- Metrics
  program_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. WRITING STYLE SAMPLES TABLE
-- =====================================================
-- Curated samples for AI style training
CREATE TABLE IF NOT EXISTS geteducated_style_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES geteducated_articles(id) ON DELETE CASCADE,

  -- Sample Content
  sample_type TEXT CHECK (sample_type IN (
    'introduction', 'conclusion', 'faq', 'ranking_entry',
    'career_description', 'program_description', 'cta', 'transition'
  )),
  content TEXT NOT NULL,
  context TEXT, -- What this sample demonstrates

  -- Quality
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT, -- Why this is a good/bad example

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Articles
CREATE INDEX IF NOT EXISTS idx_ge_articles_url ON geteducated_articles(url);
CREATE INDEX IF NOT EXISTS idx_ge_articles_content_type ON geteducated_articles(content_type);
CREATE INDEX IF NOT EXISTS idx_ge_articles_topics ON geteducated_articles USING gin(topics);
CREATE INDEX IF NOT EXISTS idx_ge_articles_subject ON geteducated_articles(subject_area);
CREATE INDEX IF NOT EXISTS idx_ge_articles_degree ON geteducated_articles(degree_level);
CREATE INDEX IF NOT EXISTS idx_ge_articles_author ON geteducated_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_ge_articles_published ON geteducated_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ge_articles_linked ON geteducated_articles(times_linked_to);

-- Full text search on content
CREATE INDEX IF NOT EXISTS idx_ge_articles_title_search ON geteducated_articles USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_ge_articles_content_search ON geteducated_articles USING gin(to_tsvector('english', COALESCE(content_text, '')));

-- Categories and Tags
CREATE INDEX IF NOT EXISTS idx_ge_categories_parent ON geteducated_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_ge_tags_name ON geteducated_tags(name);

-- Schools and Programs
CREATE INDEX IF NOT EXISTS idx_ge_schools_name ON geteducated_schools(name);
CREATE INDEX IF NOT EXISTS idx_ge_programs_school ON geteducated_degree_programs(school_id);
CREATE INDEX IF NOT EXISTS idx_ge_programs_level ON geteducated_degree_programs(degree_level);
CREATE INDEX IF NOT EXISTS idx_ge_programs_subject ON geteducated_degree_programs(subject_area);

-- Junction tables
CREATE INDEX IF NOT EXISTS idx_ge_article_cats_article ON geteducated_article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_ge_article_cats_cat ON geteducated_article_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_ge_article_tags_article ON geteducated_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_ge_article_tags_tag ON geteducated_article_tags(tag_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_ge_authors_updated_at BEFORE UPDATE ON geteducated_authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ge_categories_updated_at BEFORE UPDATE ON geteducated_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ge_schools_updated_at BEFORE UPDATE ON geteducated_schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ge_programs_updated_at BEFORE UPDATE ON geteducated_degree_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ge_degree_cats_updated_at BEFORE UPDATE ON geteducated_degree_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS (these are reference tables, public read access)
ALTER TABLE geteducated_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_degree_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_degree_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE geteducated_style_samples ENABLE ROW LEVEL SECURITY;

-- Public read access for all authenticated users (reference data)
CREATE POLICY "Authenticated users can view authors" ON geteducated_authors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view categories" ON geteducated_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view tags" ON geteducated_tags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view articles" ON geteducated_articles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view article_categories" ON geteducated_article_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view article_tags" ON geteducated_article_tags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view schools" ON geteducated_schools
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view programs" ON geteducated_degree_programs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view degree_categories" ON geteducated_degree_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view style_samples" ON geteducated_style_samples
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS FOR INTERNAL LINKING
-- =====================================================

-- Function to find relevant articles for internal linking
CREATE OR REPLACE FUNCTION find_relevant_ge_articles(
  search_topics TEXT[],
  search_subject TEXT DEFAULT NULL,
  search_degree_level TEXT DEFAULT NULL,
  exclude_urls TEXT[] DEFAULT '{}',
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  topics TEXT[],
  subject_area TEXT,
  degree_level TEXT,
  relevance_score BIGINT,
  times_linked_to INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.url,
    a.title,
    a.topics,
    a.subject_area,
    a.degree_level,
    (
      -- Score based on topic overlap
      (SELECT COUNT(*) FROM unnest(search_topics) st WHERE st = ANY(a.topics)) * 10 +
      -- Bonus for subject match
      CASE WHEN search_subject IS NOT NULL AND a.subject_area = search_subject THEN 20 ELSE 0 END +
      -- Bonus for degree level match
      CASE WHEN search_degree_level IS NOT NULL AND a.degree_level = search_degree_level THEN 15 ELSE 0 END
    )::BIGINT as relevance_score,
    a.times_linked_to
  FROM geteducated_articles a
  WHERE
    a.is_active = TRUE
    AND a.url != ALL(exclude_urls)
    AND (
      -- Must have some topic overlap OR subject match
      a.topics && search_topics
      OR (search_subject IS NOT NULL AND a.subject_area = search_subject)
    )
  ORDER BY
    relevance_score DESC,
    a.times_linked_to ASC -- Prefer less-linked articles
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update link count
CREATE OR REPLACE FUNCTION increment_article_link_count(article_url TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE geteducated_articles
  SET
    times_linked_to = times_linked_to + 1,
    last_linked_at = NOW()
  WHERE url = article_url;
END;
$$ LANGUAGE plpgsql;
