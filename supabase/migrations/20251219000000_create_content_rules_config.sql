-- ============================================================================
-- CONTENT RULES CONFIGURATION SYSTEM
-- Allows Tony to view, edit, and version-control all content generation rules
-- Created: 2025-12-19
-- ============================================================================

-- ============================================================================
-- TABLE: content_rules_config
-- Stores the current active configuration with version tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_rules_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,
  version_name TEXT, -- Optional friendly name like "Initial Setup" or "Post Tony Feedback"

  -- Configuration sections (JSONB for flexibility)
  hard_rules JSONB NOT NULL DEFAULT '{}',
  guidelines JSONB NOT NULL DEFAULT '{}',
  tone_voice JSONB NOT NULL DEFAULT '{}',
  pipeline_steps JSONB NOT NULL DEFAULT '[]',
  author_content_mapping JSONB NOT NULL DEFAULT '{}',
  shortcode_rules JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  is_active BOOLEAN DEFAULT true, -- Only one config should be active
  updated_by TEXT, -- User who made the change (email or name)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: content_rules_history
-- Complete snapshots of every configuration change
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_rules_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES content_rules_config(id) ON DELETE CASCADE,

  -- Version info
  version INTEGER NOT NULL,
  version_name TEXT,

  -- Complete snapshot at this version
  hard_rules JSONB NOT NULL,
  guidelines JSONB NOT NULL,
  tone_voice JSONB NOT NULL,
  pipeline_steps JSONB NOT NULL,
  author_content_mapping JSONB NOT NULL,
  shortcode_rules JSONB NOT NULL,

  -- Change tracking
  change_type TEXT NOT NULL, -- 'create', 'update', 'restore'
  change_summary TEXT, -- Human-readable summary of what changed
  changes_diff JSONB, -- Specific fields that changed
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_content_rules_history_config ON content_rules_history(config_id);
CREATE INDEX IF NOT EXISTS idx_content_rules_history_version ON content_rules_history(version DESC);
CREATE INDEX IF NOT EXISTS idx_content_rules_config_active ON content_rules_config(is_active) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE content_rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rules_history ENABLE ROW LEVEL SECURITY;

-- Policies for content_rules_config
DROP POLICY IF EXISTS "Authenticated users can read content rules config" ON content_rules_config;
CREATE POLICY "Authenticated users can read content rules config" ON content_rules_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can update content rules config" ON content_rules_config;
CREATE POLICY "Authenticated users can update content rules config" ON content_rules_config
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert content rules config" ON content_rules_config;
CREATE POLICY "Authenticated users can insert content rules config" ON content_rules_config
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for content_rules_history
DROP POLICY IF EXISTS "Authenticated users can read content rules history" ON content_rules_history;
CREATE POLICY "Authenticated users can read content rules history" ON content_rules_history
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert content rules history" ON content_rules_history;
CREATE POLICY "Authenticated users can insert content rules history" ON content_rules_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Service role policies for Edge Functions
DROP POLICY IF EXISTS "Service role full access to content rules config" ON content_rules_config;
CREATE POLICY "Service role full access to content rules config" ON content_rules_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to content rules history" ON content_rules_history;
CREATE POLICY "Service role full access to content rules history" ON content_rules_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA: Initial configuration based on current hardcoded values
-- ============================================================================
INSERT INTO content_rules_config (
  version,
  version_name,
  hard_rules,
  guidelines,
  tone_voice,
  pipeline_steps,
  author_content_mapping,
  shortcode_rules,
  is_active,
  updated_by
) VALUES (
  1,
  'Initial Setup - GetEducated Configuration',

  -- hard_rules
  '{
    "authors": {
      "approved_authors": [
        { "name": "Tony Huffman", "style_proxy": "Kif", "active": true },
        { "name": "Kayleigh Gilbert", "style_proxy": "Alicia", "active": true },
        { "name": "Sara", "style_proxy": "Danny", "active": true },
        { "name": "Charity", "style_proxy": "Julia", "active": true }
      ],
      "require_author_assignment": true,
      "enforce_approved_only": true
    },
    "links": {
      "blocked_domains": [
        "onlineu.com",
        "usnews.com",
        "affordablecollegesonline.com",
        "collegeaffordabilityguide.org",
        "bestcolleges.com",
        "niche.com",
        "forbes.com/advisor/education",
        "intelligent.com",
        "educationdynamics.com",
        "collegechoice.net",
        "thebestschools.org",
        "accreditedschoolsonline.org",
        "guidetoonlineschools.com",
        "onlinecolleges.net",
        "onlinedegrees.com",
        "collegeatlas.org",
        "edumed.org"
      ],
      "blocked_patterns": [".edu"],
      "block_edu_links": true,
      "block_competitor_links": true
    },
    "external_sources": {
      "allowed_domains": [
        { "domain": "bls.gov", "description": "Bureau of Labor Statistics" },
        { "domain": "nces.ed.gov", "description": "National Center for Education Statistics" },
        { "domain": "ed.gov", "description": "Department of Education" },
        { "domain": "aacsb.edu", "description": "AACSB Accreditation" },
        { "domain": "abet.org", "description": "ABET Accreditation" },
        { "domain": "cacrep.org", "description": "CACREP Accreditation" },
        { "domain": "aacn.nche.edu", "description": "American Association of Colleges of Nursing" },
        { "domain": "cswe.org", "description": "Council on Social Work Education" },
        { "domain": "nasba.org", "description": "State Boards of Accountancy" },
        { "domain": "chea.org", "description": "Council for Higher Education Accreditation" },
        { "domain": "deac.org", "description": "Distance Education Accrediting Commission" },
        { "domain": "census.gov", "description": "US Census Bureau" },
        { "domain": "dol.gov", "description": "Department of Labor" },
        { "domain": "opm.gov", "description": "Office of Personnel Management" },
        { "domain": "hhs.gov", "description": "Health and Human Services" },
        { "domain": "cdc.gov", "description": "Centers for Disease Control" },
        { "domain": "nih.gov", "description": "National Institutes of Health" },
        { "domain": "nsf.gov", "description": "National Science Foundation" }
      ],
      "require_whitelist": true
    },
    "monetization": {
      "require_monetization_shortcode": true,
      "block_unknown_shortcodes": true,
      "block_legacy_shortcodes": true
    },
    "publishing": {
      "require_human_review": true,
      "block_high_risk": true,
      "block_critical_risk": true
    }
  }'::jsonb,

  -- guidelines
  '{
    "word_count": {
      "minimum": 1500,
      "target": 2000,
      "maximum": 2500,
      "warning_below": 1500,
      "warning_above": 2500
    },
    "structure": {
      "min_h2_headings": 3,
      "max_h2_headings": 8,
      "min_h3_headings": 0,
      "require_intro_paragraph": true,
      "require_conclusion": true
    },
    "faqs": {
      "minimum": 3,
      "target": 5,
      "require_complete_answers": true
    },
    "links": {
      "internal_links_min": 3,
      "internal_links_target": 5,
      "external_citations_min": 2,
      "external_citations_max": 5
    },
    "quality": {
      "minimum_score_to_publish": 70,
      "minimum_score_auto_publish": 80,
      "target_score": 85,
      "max_avg_sentence_length": 25
    },
    "readability": {
      "target_grade_level": "college",
      "max_paragraph_length": 150,
      "vary_sentence_length": true
    }
  }'::jsonb,

  -- tone_voice
  '{
    "overall_style": {
      "tone": "conversational, natural, empathetic",
      "formality": "professional but approachable",
      "perspective": "second person (you/your)",
      "target_audience": "Prospective online students considering their education options"
    },
    "banned_phrases": [
      "In today''s digital age",
      "In conclusion",
      "It''s important to note that",
      "Delve into",
      "Dive deep",
      "At the end of the day",
      "Game changer",
      "Revolutionary",
      "Cutting-edge",
      "Unlock your potential",
      "Take the next step",
      "First and foremost",
      "Needless to say",
      "It goes without saying",
      "In this article",
      "Without further ado",
      "Let''s dive in",
      "As we all know",
      "In today''s world",
      "In this day and age"
    ],
    "preferred_phrases": [
      "According to GetEducated''s research",
      "Based on BLS data",
      "Many accredited online programs",
      "Our rankings show",
      "GetEducated''s analysis found"
    ],
    "sentence_style": {
      "vary_length": true,
      "short_punchy_mixed_with_explanatory": true,
      "avoid_passive_voice": true,
      "max_consecutive_short_sentences": 3
    },
    "content_focus": [
      "Always relevant to ONLINE students",
      "Emphasize affordability and value",
      "Highlight flexibility for working adults",
      "Focus on career outcomes and ROI",
      "Discuss accreditation importance",
      "Help readers make informed decisions"
    ],
    "anti_hallucination": {
      "never_fabricate_statistics": true,
      "never_fabricate_studies": true,
      "never_fabricate_school_names": true,
      "never_fabricate_legislation": true,
      "use_hedging_language": true,
      "hedging_examples": [
        "Many students find that...",
        "Research suggests that...",
        "Industry data indicates..."
      ]
    }
  }'::jsonb,

  -- pipeline_steps
  '[
    {
      "id": "idea_generation",
      "name": "Idea Generation",
      "description": "Generate content ideas from seed topics or trending searches",
      "enabled": true,
      "required": false,
      "provider": "grok",
      "order": 1,
      "config": {
        "use_web_context": true,
        "prioritize_monetizable": true
      }
    },
    {
      "id": "draft_generation",
      "name": "Draft Generation",
      "description": "Generate initial article draft with Grok AI",
      "enabled": true,
      "required": true,
      "provider": "grok",
      "order": 2,
      "config": {
        "model": "grok-3",
        "temperature": 0.8,
        "max_tokens": 12000
      }
    },
    {
      "id": "contributor_assignment",
      "name": "Contributor Assignment",
      "description": "Automatically assign the best-matching author based on topic and expertise",
      "enabled": true,
      "required": true,
      "provider": "internal",
      "order": 3,
      "config": {
        "scoring_weights": {
          "expertise_match": 50,
          "content_type_match": 30,
          "keyword_match": 20
        }
      }
    },
    {
      "id": "humanization",
      "name": "Humanization (StealthGPT)",
      "description": "Rewrite content to bypass AI detection tools like GPTZero and Turnitin",
      "enabled": true,
      "required": false,
      "provider": "stealthgpt",
      "fallback_provider": "claude",
      "order": 4,
      "config": {
        "tone": "College",
        "mode": "High",
        "detector": "gptzero",
        "chunk_on_headings": true,
        "business": true
      }
    },
    {
      "id": "internal_linking",
      "name": "Internal Linking",
      "description": "Add contextual links to other GetEducated articles",
      "enabled": true,
      "required": false,
      "provider": "claude",
      "order": 5,
      "config": {
        "max_links": 5,
        "min_relevance_score": 20,
        "prefer_underlinked_articles": true
      }
    },
    {
      "id": "monetization_insertion",
      "name": "Monetization Insertion",
      "description": "Add degree table shortcodes based on topic-to-category matching",
      "enabled": true,
      "required": true,
      "provider": "internal",
      "order": 6,
      "config": {
        "shortcode_positions": ["after_intro", "mid_content"],
        "include_qdf_widget": true
      }
    },
    {
      "id": "quality_scoring",
      "name": "Quality Scoring",
      "description": "Calculate quality metrics and identify issues",
      "enabled": true,
      "required": true,
      "provider": "internal",
      "order": 7,
      "config": {
        "weights": {
          "word_count": 15,
          "internal_links": 15,
          "external_links": 10,
          "faqs": 10,
          "headings": 10,
          "readability": 10
        }
      }
    },
    {
      "id": "pre_publish_validation",
      "name": "Pre-Publish Validation",
      "description": "Final validation checks before publishing to WordPress",
      "enabled": true,
      "required": true,
      "provider": "internal",
      "order": 8,
      "config": {
        "validate_author": true,
        "validate_links": true,
        "validate_shortcodes": true,
        "validate_risk": true
      }
    }
  ]'::jsonb,

  -- author_content_mapping
  '{
    "Tony Huffman": {
      "expertise_areas": ["rankings", "data analysis", "affordability", "best buy lists", "cost comparisons"],
      "content_types": ["ranking", "listicle", "data-driven"],
      "keywords": ["affordable", "cheapest", "best value", "cost", "ranking", "top"]
    },
    "Kayleigh Gilbert": {
      "expertise_areas": ["professional programs", "healthcare", "social work", "nursing", "best-of guides"],
      "content_types": ["guide", "career overview", "program comparison"],
      "keywords": ["nursing", "healthcare", "social work", "counseling", "psychology", "professional"]
    },
    "Sara": {
      "expertise_areas": ["technical education", "degree overviews", "career pathways", "STEM"],
      "content_types": ["explainer", "pathway guide", "degree overview"],
      "keywords": ["technology", "engineering", "computer science", "IT", "technical", "stem"]
    },
    "Charity": {
      "expertise_areas": ["teaching degrees", "education careers", "degree comparisons", "K-12"],
      "content_types": ["comparison", "career guide", "education focused"],
      "keywords": ["teaching", "education", "teacher", "K-12", "elementary", "secondary", "certification"]
    }
  }'::jsonb,

  -- shortcode_rules
  '{
    "allowed_shortcodes": [
      {
        "tag": "su_ge-picks",
        "description": "Degree table/picks display",
        "required_params": ["category", "concentration"],
        "optional_params": ["level", "header", "cta-button", "cta-url"]
      },
      {
        "tag": "su_ge-cta",
        "description": "Link shortcode (school, degree, internal, external)",
        "required_params": ["type"],
        "optional_params": ["cta-copy", "school", "degree", "url", "target"]
      },
      {
        "tag": "su_ge-qdf",
        "description": "Quick Degree Find widget",
        "required_params": ["type"],
        "optional_params": ["header"]
      }
    ],
    "legacy_shortcodes_blocked": [
      "degree_table",
      "degree_offer",
      "ge_monetization",
      "ge_internal_link",
      "ge_external_cited"
    ],
    "monetization_required": true,
    "monetization_positions": {
      "primary": "after_intro",
      "secondary": "mid_content",
      "optional": "pre_conclusion"
    }
  }'::jsonb,

  true, -- is_active
  'System' -- updated_by
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTION: Get active content rules config
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_content_rules()
RETURNS content_rules_config AS $$
DECLARE
  config content_rules_config;
BEGIN
  SELECT * INTO config FROM content_rules_config WHERE is_active = true LIMIT 1;
  RETURN config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_content_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_rules_updated_at ON content_rules_config;
CREATE TRIGGER trigger_content_rules_updated_at
  BEFORE UPDATE ON content_rules_config
  FOR EACH ROW
  EXECUTE FUNCTION update_content_rules_timestamp();

-- ============================================================================
-- Create initial history record
-- ============================================================================
INSERT INTO content_rules_history (
  config_id,
  version,
  version_name,
  hard_rules,
  guidelines,
  tone_voice,
  pipeline_steps,
  author_content_mapping,
  shortcode_rules,
  change_type,
  change_summary,
  changed_by
)
SELECT
  id,
  version,
  version_name,
  hard_rules,
  guidelines,
  tone_voice,
  pipeline_steps,
  author_content_mapping,
  shortcode_rules,
  'create',
  'Initial configuration created from hardcoded values',
  'System'
FROM content_rules_config
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_active_content_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_content_rules() TO service_role;
