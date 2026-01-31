# Content Rules Settings System - Implementation Plan

**Created:** 2025-12-17
**Purpose:** Allow Tony to view, edit, and version-control all content generation rules

---

## Overview

Create a comprehensive settings page where Tony can:
1. View and edit all hard rules, guidelines, tone/voice settings
2. See each step of the generation pipeline and toggle them on/off
3. Edit any field values
4. See version history of all changes
5. Restore previous versions

---

## Database Schema

### New Tables

```sql
-- ============================================================================
-- CONTENT RULES CONFIGURATION
-- Stores the current active configuration with version tracking
-- ============================================================================
CREATE TABLE content_rules_config (
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
-- VERSION HISTORY
-- Complete snapshots of every configuration change
-- ============================================================================
CREATE TABLE content_rules_history (
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

-- Indexes
CREATE INDEX idx_content_rules_history_config ON content_rules_history(config_id);
CREATE INDEX idx_content_rules_history_version ON content_rules_history(version DESC);
CREATE INDEX idx_content_rules_config_active ON content_rules_config(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE content_rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rules_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read content rules config" ON content_rules_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update content rules config" ON content_rules_config
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert content rules config" ON content_rules_config
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read content rules history" ON content_rules_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert content rules history" ON content_rules_history
  FOR INSERT TO authenticated WITH CHECK (true);
```

---

## Configuration Structure

### 1. Hard Rules (`hard_rules` JSONB)

These are non-negotiable rules that BLOCK publishing if violated.

```json
{
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
      "niche.com"
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
      { "domain": "cacrep.org", "description": "CACREP Accreditation" }
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
}
```

### 2. Guidelines (`guidelines` JSONB)

These are soft rules that generate warnings but don't block publishing.

```json
{
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
}
```

### 3. Tone & Voice (`tone_voice` JSONB)

```json
{
  "overall_style": {
    "tone": "conversational, natural, empathetic",
    "formality": "professional but approachable",
    "perspective": "second person (you/your)",
    "target_audience": "Prospective online students considering their education options"
  },
  "banned_phrases": [
    "In today's digital age",
    "In conclusion",
    "It's important to note that",
    "Delve into",
    "Dive deep",
    "At the end of the day",
    "Game changer",
    "Revolutionary",
    "Cutting-edge",
    "Unlock your potential",
    "Take the next step",
    "At the end of the day"
  ],
  "preferred_phrases": [
    "According to GetEducated's research",
    "Based on BLS data",
    "Many accredited online programs"
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
}
```

### 4. Pipeline Steps (`pipeline_steps` JSONB)

```json
[
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
      "chunk_on_headings": true
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
]
```

### 5. Author-Content Mapping (`author_content_mapping` JSONB)

```json
{
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
}
```

### 6. Shortcode Rules (`shortcode_rules` JSONB)

```json
{
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
}
```

---

## UI Design

### Page Structure

```
/settings → Content Rules Tab (new)

┌─────────────────────────────────────────────────────────────────┐
│  Content Generation Rules                                        │
│  Configure how articles are generated, reviewed, and published   │
├─────────────────────────────────────────────────────────────────┤
│  [Hard Rules] [Guidelines] [Tone & Voice] [Pipeline] [Authors]   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  < Current Tab Content >                                    │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Version History                                    [Expand] │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │  v12 • Dec 17, 2025 • Tony Huffman • "Added new banned..."  │ │
│  │  v11 • Dec 15, 2025 • Will Welsh • "Fixed shortcode rules"  │ │
│  │  v10 • Dec 10, 2025 • System • "Initial configuration"      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Save Changes]                               [Discard Changes]   │
└─────────────────────────────────────────────────────────────────┘
```

### Tab: Hard Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  HARD RULES                                                      │
│  These rules BLOCK publishing if violated                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 APPROVED AUTHORS                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ☑ Tony Huffman (style: Kif)                    [Edit]   │   │
│  │  ☑ Kayleigh Gilbert (style: Alicia)             [Edit]   │   │
│  │  ☑ Sara (style: Danny)                          [Edit]   │   │
│  │  ☑ Charity (style: Julia)                       [Edit]   │   │
│  │                                        [+ Add Author]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ☑ Require author assignment before publishing                   │
│  ☑ Only allow approved authors                                   │
│                                                                   │
│  🔗 BLOCKED DOMAINS                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  onlineu.com                                    [×]       │   │
│  │  usnews.com                                     [×]       │   │
│  │  affordablecollegesonline.com                   [×]       │   │
│  │  bestcolleges.com                               [×]       │   │
│  │                                   [+ Add Domain]          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ☑ Block all .edu links                                          │
│  ☑ Block competitor links                                        │
│                                                                   │
│  ✅ ALLOWED EXTERNAL SOURCES                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  bls.gov         Bureau of Labor Statistics     [×]       │   │
│  │  nces.ed.gov     National Center for Ed Stats   [×]       │   │
│  │  ed.gov          Department of Education        [×]       │   │
│  │                                   [+ Add Source]          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Tab: Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  GENERATION PIPELINE                                             │
│  Configure and toggle each step of the article generation process│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Drag to reorder • Toggle to enable/disable                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  1. Draft Generation (Grok)                    [ON]  ⚙ │   │
│  │     Generate initial article draft with Grok AI          │   │
│  │     Provider: grok-3 • Required                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  2. Contributor Assignment                     [ON]  ⚙ │   │
│  │     Automatically assign best-matching author            │   │
│  │     Provider: internal • Required                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  3. Humanization (StealthGPT)                  [ON]  ⚙ │   │
│  │     Rewrite to bypass AI detection                       │   │
│  │     Provider: stealthgpt → claude (fallback)             │   │
│  │     ┌─────────────────────────────────────────────────┐  │   │
│  │     │  Tone: [College ▼]                              │  │   │
│  │     │  Mode: [High ▼]                                 │  │   │
│  │     │  Detector: [GPTZero ▼]                          │  │   │
│  │     └─────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  4. Internal Linking                           [ON]  ⚙ │   │
│  │     Add contextual links to GetEducated articles         │   │
│  │     Provider: claude                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ... more steps ...                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Version History Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  VERSION HISTORY                                     [Collapse]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ● v12 (Current)                                                 │
│    Dec 17, 2025 at 3:45 PM • Tony Huffman                        │
│    "Added new banned phrases, updated quality thresholds"        │
│    Changes: tone_voice.banned_phrases (+3), guidelines.quality   │
│                                                    [View Diff]   │
│                                                                   │
│  ○ v11                                                           │
│    Dec 15, 2025 at 10:20 AM • Will Welsh                         │
│    "Fixed shortcode rules after Tony's feedback"                 │
│    Changes: shortcode_rules (complete rewrite)                   │
│                                      [View Diff] [Restore]       │
│                                                                   │
│  ○ v10                                                           │
│    Dec 10, 2025 at 2:00 PM • System                              │
│    "Initial configuration"                                       │
│    Changes: Initial setup                                        │
│                                      [View Diff] [Restore]       │
│                                                                   │
│  [Load More...]                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## React Query Hooks

```javascript
// src/hooks/useContentRulesConfig.js

// Get active configuration
export function useContentRulesConfig() {
  return useQuery({
    queryKey: ['content-rules-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()
      if (error) throw error
      return data
    },
  })
}

// Update configuration (creates new version)
export function useUpdateContentRulesConfig() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ updates, changeSummary }) => {
      // 1. Get current config
      const { data: current } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      // 2. Save current to history
      await supabase.from('content_rules_history').insert({
        config_id: current.id,
        version: current.version,
        version_name: current.version_name,
        hard_rules: current.hard_rules,
        guidelines: current.guidelines,
        tone_voice: current.tone_voice,
        pipeline_steps: current.pipeline_steps,
        author_content_mapping: current.author_content_mapping,
        shortcode_rules: current.shortcode_rules,
        change_type: 'update',
        change_summary: changeSummary,
        changed_by: user?.email || 'unknown',
      })

      // 3. Update config with new version
      const { data, error } = await supabase
        .from('content_rules_config')
        .update({
          ...updates,
          version: current.version + 1,
          updated_by: user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rules-config'] })
      queryClient.invalidateQueries({ queryKey: ['content-rules-history'] })
    },
  })
}

// Get version history
export function useContentRulesHistory(limit = 20) {
  return useQuery({
    queryKey: ['content-rules-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_rules_history')
        .select('*')
        .order('version', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

// Restore to a previous version
export function useRestoreContentRulesVersion() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ historyId }) => {
      // 1. Get the history record to restore
      const { data: historyRecord } = await supabase
        .from('content_rules_history')
        .select('*')
        .eq('id', historyId)
        .single()

      // 2. Get current config
      const { data: current } = await supabase
        .from('content_rules_config')
        .select('*')
        .eq('is_active', true)
        .single()

      // 3. Save current to history before restore
      await supabase.from('content_rules_history').insert({
        config_id: current.id,
        version: current.version,
        hard_rules: current.hard_rules,
        guidelines: current.guidelines,
        tone_voice: current.tone_voice,
        pipeline_steps: current.pipeline_steps,
        author_content_mapping: current.author_content_mapping,
        shortcode_rules: current.shortcode_rules,
        change_type: 'restore',
        change_summary: `Restored from version ${historyRecord.version}`,
        changed_by: user?.email || 'unknown',
      })

      // 4. Update config with restored values
      const { data, error } = await supabase
        .from('content_rules_config')
        .update({
          hard_rules: historyRecord.hard_rules,
          guidelines: historyRecord.guidelines,
          tone_voice: historyRecord.tone_voice,
          pipeline_steps: historyRecord.pipeline_steps,
          author_content_mapping: historyRecord.author_content_mapping,
          shortcode_rules: historyRecord.shortcode_rules,
          version: current.version + 1,
          version_name: `Restored from v${historyRecord.version}`,
          updated_by: user?.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-rules-config'] })
      queryClient.invalidateQueries({ queryKey: ['content-rules-history'] })
    },
  })
}
```

---

## File Structure

```
src/
├── hooks/
│   └── useContentRulesConfig.js          # New: React Query hooks
├── pages/
│   └── Settings.jsx                       # Modified: Add new tab
├── components/
│   └── settings/
│       └── content-rules/
│           ├── ContentRulesTab.jsx        # Main tab container
│           ├── HardRulesSection.jsx       # Hard rules editor
│           ├── GuidelinesSection.jsx      # Guidelines editor
│           ├── ToneVoiceSection.jsx       # Tone & voice editor
│           ├── PipelineSection.jsx        # Pipeline step editor
│           ├── AuthorMappingSection.jsx   # Author-content mapping
│           ├── ShortcodeRulesSection.jsx  # Shortcode configuration
│           ├── VersionHistoryPanel.jsx    # Version history & restore
│           ├── DomainListEditor.jsx       # Reusable domain list UI
│           ├── PhraseListEditor.jsx       # Reusable phrase list UI
│           └── PipelineStepCard.jsx       # Individual pipeline step
└── services/
    └── contentRulesService.js             # New: Helper functions

supabase/
└── migrations/
    └── 20251217000000_content_rules_config.sql  # New migration
```

---

## Implementation Order

### Phase 1: Database & Hooks (Day 1)
1. Create database migration
2. Create seed data with current hardcoded values
3. Create React Query hooks
4. Test hooks in isolation

### Phase 2: Basic UI (Day 1-2)
1. Create ContentRulesTab component
2. Add tab to Settings page
3. Create read-only display of all sections
4. Add version history panel (read-only)

### Phase 3: Editing UI (Day 2-3)
1. Create editable forms for each section
2. Add save/discard functionality
3. Add validation
4. Create reusable list editors (domains, phrases)

### Phase 4: Pipeline Editor (Day 3)
1. Create pipeline step cards
2. Add toggle functionality
3. Add step configuration modals
4. Add drag-to-reorder (optional)

### Phase 5: Version History (Day 3-4)
1. Add diff viewing
2. Add restore functionality
3. Add confirmation dialogs
4. Add change summary input

### Phase 6: Integration (Day 4)
1. Update generation service to read from config
2. Update validation services to read from config
3. Update AI prompts to use config values
4. Test end-to-end

---

## Migration of Existing Hardcoded Values

The following hardcoded values need to be migrated to the new config:

| Current Location | Config Section | Config Key |
|-----------------|----------------|------------|
| `useContributors.js` | hard_rules | authors.approved_authors |
| `linkValidator.js` | hard_rules | links.blocked_domains |
| `linkValidator.js` | hard_rules | external_sources.allowed_domains |
| `grokClient.js` | tone_voice | banned_phrases |
| `grokClient.js` | tone_voice | content_focus |
| `generationService.js` | pipeline_steps | All steps |
| `prePublishValidation.js` | guidelines | quality settings |
| `shortcodeService.js` | shortcode_rules | allowed_shortcodes |

---

## Questions for Discussion

1. **Read-only vs Edit Mode:** Should the page default to read-only with an "Edit" button, or always be editable?

2. **Permissions:** Should all users be able to edit, or only certain roles?

3. **Real-time Updates:** Should changes apply immediately to in-progress articles, or only new ones?

4. **Export/Import:** Should there be functionality to export/import configurations (for backup or staging)?

5. **Approval Workflow:** Should changes require approval before going live?

---

## Next Steps

1. Review this plan and confirm approach
2. Create database migration
3. Begin UI implementation
