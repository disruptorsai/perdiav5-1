# Multi-Tenant AI Content Engine - Product Requirements Document

**Version:** 1.0
**Date:** December 9, 2025
**Status:** Draft for Review
**Based on:** Perdia v5 Analysis (GetEducated.com Implementation)

---

## Executive Summary

This document outlines the transformation of Perdia v5 (a single-tenant AI content production system built for GetEducated.com) into a multi-tenant SaaS platform that enables any client to create their own customized AI content engine. The new system will maintain all core functionality while abstracting client-specific elements into configurable components.

**Core Value Proposition:** Clients upload their writing samples, configure their brand voice, define their content rules, and get a fully-functional AI content production system that writes in THEIR voice for THEIR audience.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Client-Specific Elements to Abstract](#2-client-specific-elements-to-abstract)
3. [Multi-Tenant Architecture](#3-multi-tenant-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [Client Onboarding Workflow](#5-client-onboarding-workflow)
6. [Core Features (Retained)](#6-core-features-retained)
7. [New Features (Enhancements)](#7-new-features-enhancements)
8. [Configuration System](#8-configuration-system)
9. [API & Integration Layer](#9-api--integration-layer)
10. [Security & Isolation](#10-security--isolation)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Migration Strategy](#12-migration-strategy)
13. [Implementation Phases](#13-implementation-phases)
14. [Success Metrics](#14-success-metrics)

---

## 1. Current State Analysis

### 1.1 What Perdia v5 Does

Perdia is an AI-powered content production system that automates the creation of SEO-optimized articles through a multi-stage pipeline:

```
Content Idea → Cost Data RAG → Author Assignment → Grok Draft →
StealthGPT Humanization → Internal Linking → Quality Scoring →
Auto-Fix Loop → WordPress Publishing
```

**Core Capabilities:**
- Two-pass AI generation (Grok for drafting, StealthGPT/Claude for humanization)
- Automatic author assignment with voice matching
- AI detection bypass (StealthGPT integration)
- Internal linking from site catalog (1000+ articles)
- Quality assurance with auto-fix loop (up to 3 attempts)
- Pre-publish validation with risk assessment
- WordPress one-click publishing
- Kanban workflow management
- Editorial feedback and revision tracking
- AI learning from revisions (training data collection)

### 1.2 Technology Stack (Retained)

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite | Keep as-is |
| Styling | Tailwind CSS 4.1 | Keep as-is |
| State Management | TanStack React Query | Keep as-is |
| Database | Supabase (PostgreSQL) | Extend for multi-tenancy |
| Auth | Supabase Auth | Extend for org-based access |
| Rich Text | TipTap | Keep as-is |
| AI - Draft | xAI Grok | Configurable per client |
| AI - Humanize | StealthGPT / Claude | Configurable per client |
| Publishing | WordPress REST API | Configurable per client |
| Edge Functions | Supabase Functions | Extend for isolation |

### 1.3 Current Limitations for Multi-Tenancy

1. **Hardcoded Client Identity:** "Perdia", "GetEducated" throughout codebase
2. **Fixed Author Set:** Only 4 approved authors with hardcoded names
3. **Domain-Specific Rules:** Education-focused link rules, competitor blocks
4. **Single Database:** No tenant isolation
5. **Fixed Monetization:** 155 education-specific categories
6. **Static Site Catalog:** GetEducated articles only
7. **Hardcoded API Keys:** Client-side exposure in dev mode

---

## 2. Client-Specific Elements to Abstract

### 2.1 Critical - Must Remove/Generalize

| Element | Current Value | New Approach |
|---------|--------------|--------------|
| App Branding | "Perdia" | `tenant.app_name` |
| Client Name | "GetEducated" | `tenant.company_name` |
| Authors | Tony, Kayleigh, Sara, Charity | `tenant.contributors[]` |
| Author Proxies | Kif, Alicia, Danny, Julia | `contributor.style_proxy` |
| Blocked Bylines | Julia Tell, Kif Richmann, etc. | `tenant.blocked_bylines[]` |
| Site Domain | geteducated.com | `tenant.primary_domain` |
| Competitor Domains | onlineu.com, usnews.com, etc. | `tenant.blocked_domains[]` |
| Allowed Domains | bls.gov, ed.gov, etc. | `tenant.allowed_domains[]` |
| Monetization Categories | 155 education pairs | `tenant.monetization_categories[]` |
| Degree Levels | 13 education levels | `tenant.content_levels[]` |
| Subject Mapping | CIP codes | `tenant.subject_taxonomy[]` |
| WordPress Webhook | n8n webhook URL | `tenant.publishing_config` |
| API Keys | Grok, Claude, StealthGPT | `tenant.api_keys{}` (encrypted) |

### 2.2 Database Tables to Rename/Abstract

| Current Table | New Table | Notes |
|---------------|-----------|-------|
| `geteducated_articles` | `site_catalog` | Add `tenant_id` |
| `geteducated_authors` | `catalog_authors` | Add `tenant_id` |
| `geteducated_categories` | `catalog_categories` | Add `tenant_id` |
| `geteducated_tags` | `catalog_tags` | Add `tenant_id` |
| `geteducated_article_versions` | `catalog_versions` | Add `tenant_id` |
| `geteducated_revision_queue` | `revision_queue` | Add `tenant_id` |

### 2.3 Code Files Requiring Changes

**High Priority (Core Logic):**
- `src/hooks/useContributors.js` - Remove hardcoded APPROVED_AUTHORS
- `src/services/generationService.js` - Parameterize all rules
- `src/services/validation/linkValidator.js` - Dynamic domain rules
- `src/services/ai/grokClient.js` - Dynamic prompts
- `src/services/ai/claudeClient.js` - Dynamic prompts
- `src/services/publishService.js` - Dynamic endpoints

**Medium Priority (UI/Branding):**
- `src/components/layout/MainLayout.jsx` - Dynamic branding
- `src/App.jsx` - Dynamic loading message
- `src/pages/Settings.jsx` - Tenant-aware settings

**Lower Priority (Documentation):**
- `docs/v5-updates/*` - Remove or generalize
- `CLAUDE.md` - Create template version

### 2.4 Files to Create Fresh (Not Migrate)

| Purpose | Reason |
|---------|--------|
| Client onboarding wizard | New feature |
| Tenant management dashboard | New feature |
| Writing sample upload/analysis | New feature |
| Voice extraction AI | New feature |
| Domain rule builder UI | New feature |
| Monetization category builder | New feature |
| White-label theming | New feature |

---

## 3. Multi-Tenant Architecture

### 3.1 Tenancy Model: **Shared Database with Row-Level Isolation**

**Rationale:**
- Lower infrastructure cost than separate databases per tenant
- Simpler deployments and migrations
- PostgreSQL RLS provides strong isolation
- Supabase supports this pattern natively

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED INFRASTRUCTURE                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React SPA) - White-labeled per tenant            │
│  └── Tenant context loaded at login                         │
├─────────────────────────────────────────────────────────────┤
│  Supabase Backend (Shared)                                  │
│  ├── Auth: Organization-based with roles                    │
│  ├── Database: Shared with tenant_id on all tables          │
│  ├── RLS: Policies filter by tenant_id                      │
│  ├── Storage: Tenant-isolated buckets                       │
│  └── Edge Functions: Tenant-aware processing                │
├─────────────────────────────────────────────────────────────┤
│  External APIs (Per-Tenant Keys)                            │
│  ├── OpenAI/Grok/Claude (tenant API keys)                   │
│  ├── StealthGPT (tenant API key)                            │
│  ├── DataForSEO (tenant credentials)                        │
│  └── WordPress (tenant site credentials)                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tenant Hierarchy

```
Organization (Tenant)
├── Users (with roles: admin, editor, writer, viewer)
├── Contributors (writing personas)
├── Content (articles, ideas, clusters)
├── Site Catalog (internal linking sources)
├── Configuration (rules, domains, categories)
├── Integrations (WordPress, APIs)
└── Branding (logo, colors, app name)
```

### 3.3 Data Isolation Strategy

**Row-Level Security (RLS) Pattern:**
```sql
-- Every tenant-scoped table gets:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON table_name
FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

**Tenant Context Injection:**
```javascript
// On login, user's tenant_id is added to JWT claims
// All Supabase queries automatically filtered by RLS
const { data } = await supabase
  .from('articles')
  .select('*')
// RLS automatically adds: WHERE tenant_id = current_user_tenant_id
```

### 3.4 Cross-Tenant Operations (Admin Only)

For platform administrators:
- Tenant management dashboard
- Usage analytics across tenants
- Billing and subscription management
- Platform-wide settings

---

## 4. Database Schema Design

### 4.1 New Core Tables

```sql
-- Organizations (Tenants)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Branding
  app_name TEXT DEFAULT 'Content Engine',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',

  -- Configuration
  primary_domain TEXT,
  allowed_domains TEXT[] DEFAULT '{}',
  blocked_domains TEXT[] DEFAULT '{}',
  blocked_bylines TEXT[] DEFAULT '{}',

  -- Subscription
  plan TEXT DEFAULT 'starter', -- starter, pro, enterprise
  articles_limit INTEGER DEFAULT 100,
  articles_used INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Users (extends Supabase auth.users)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tenant_id UUID REFERENCES tenants NOT NULL,
  role TEXT DEFAULT 'editor', -- admin, editor, writer, viewer
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, tenant_id)
);

-- Tenant API Keys (encrypted at rest)
CREATE TABLE tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,
  service TEXT NOT NULL, -- grok, claude, stealthgpt, dataforseo, wordpress
  encrypted_key TEXT NOT NULL, -- pgcrypto encrypted
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Contributors (Authors)
CREATE TABLE tenant_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,

  -- Identity
  name TEXT NOT NULL,
  display_name TEXT NOT NULL, -- Public byline
  style_proxy TEXT, -- Internal AI reference name
  avatar_url TEXT,
  bio TEXT,

  -- Voice Profile (populated from writing samples)
  voice_description TEXT,
  writing_guidelines TEXT,
  signature_phrases TEXT[],
  phrases_to_avoid TEXT[],
  target_audience TEXT,
  preferred_structure TEXT,
  intro_style TEXT,
  conclusion_style TEXT,
  seo_approach TEXT,
  personality_traits TEXT[],

  -- Sample Articles
  sample_excerpts JSONB DEFAULT '[]',

  -- Matching Criteria
  expertise_areas TEXT[] DEFAULT '{}',
  content_types TEXT[] DEFAULT '{}',
  topic_keywords TEXT[] DEFAULT '{}',

  -- Stats
  articles_count INTEGER DEFAULT 0,
  average_quality_score NUMERIC DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Monetization Categories
CREATE TABLE tenant_monetization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,
  category TEXT NOT NULL,
  category_id TEXT NOT NULL,
  sub_category TEXT,
  sub_category_id TEXT,
  shortcode_template TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Tenant Content Levels (replaces degree_levels)
CREATE TABLE tenant_content_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Tenant Site Catalog (for internal linking)
CREATE TABLE tenant_site_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,

  -- Content
  url TEXT NOT NULL,
  slug TEXT,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT,

  -- Metadata
  topics TEXT[] DEFAULT '{}',
  author_name TEXT,
  published_at TIMESTAMPTZ,

  -- Linking Stats
  times_linked_to INTEGER DEFAULT 0,
  relevance_score NUMERIC DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Writing Samples (for voice analysis)
CREATE TABLE tenant_writing_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,
  contributor_id UUID REFERENCES tenant_contributors,

  -- Content
  title TEXT,
  source_url TEXT,
  content_text TEXT NOT NULL,
  word_count INTEGER,

  -- Analysis Results (populated by AI)
  voice_analysis JSONB, -- {tone, complexity, sentence_patterns, vocabulary, etc.}
  extracted_phrases JSONB, -- {signature_phrases, writing_patterns}
  analysis_status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed

  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

-- Tenant System Settings
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  category TEXT,
  UNIQUE(tenant_id, key)
);

-- Tenant WordPress Connections
CREATE TABLE tenant_wordpress_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants NOT NULL,

  -- Connection
  site_url TEXT NOT NULL,
  site_name TEXT,
  auth_type TEXT DEFAULT 'application_password', -- application_password, jwt, oauth
  username TEXT,
  encrypted_password TEXT, -- pgcrypto encrypted

  -- Defaults
  default_post_status TEXT DEFAULT 'draft',
  default_category_id INTEGER,
  default_author_id INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Modified Existing Tables

All existing tables get a `tenant_id` column:

```sql
-- Add tenant_id to all content tables
ALTER TABLE articles ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE content_ideas ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE clusters ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE keywords ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE article_revisions ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE article_comments ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE ai_revisions ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE generation_queue ADD COLUMN tenant_id UUID REFERENCES tenants;
ALTER TABLE training_data ADD COLUMN tenant_id UUID REFERENCES tenants;

-- Create indexes
CREATE INDEX idx_articles_tenant ON articles(tenant_id);
CREATE INDEX idx_ideas_tenant ON content_ideas(tenant_id);
-- ... etc for all tables
```

### 4.3 RLS Policies

```sql
-- Tenant isolation policy (applied to all tenant-scoped tables)
CREATE POLICY "tenant_isolation" ON articles
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid()
  )
);

-- Repeat for all tables...
```

---

## 5. Client Onboarding Workflow

### 5.1 Onboarding Steps

```
Step 1: Account Creation
├── Organization name
├── Admin email
├── Password
└── (Auto-create tenant record)

Step 2: Brand Configuration
├── App name (what to call the system)
├── Logo upload
├── Primary color
└── Primary domain (their website)

Step 3: Writing Sample Upload
├── Upload 3-10 sample articles (text, URL, or file)
├── Assign samples to contributors (optional at this stage)
└── Trigger voice analysis AI

Step 4: Contributor Setup
├── Create contributor profiles
├── Assign writing samples
├── Review AI-generated voice profiles
├── Approve/edit voice descriptions
└── Add signature phrases, guidelines

Step 5: Content Rules Configuration
├── Blocked domains (competitors)
├── Allowed domains (trusted sources)
├── Link policies (internal link targets)
└── Content guidelines (dos and don'ts)

Step 6: Monetization Setup (Optional)
├── Create monetization categories
├── Define shortcode templates
├── Map topics to monetization
└── Configure placement rules

Step 7: Integration Setup
├── AI API keys (Grok, Claude, StealthGPT)
├── WordPress connection
├── Keyword research API (DataForSEO)
└── Test connections

Step 8: Site Catalog Import
├── Import existing articles for internal linking
├── Configure sitemap URL or RSS feed
├── Set up auto-sync schedule
└── Review imported articles

Step 9: Ready to Generate!
├── Create first content idea
├── Generate test article
├── Review and refine settings
└── Start production
```

### 5.2 Onboarding UI Components

```
/onboarding
├── /welcome           → Welcome screen with overview
├── /brand             → Branding configuration
├── /samples           → Writing sample upload
├── /contributors      → Contributor creation wizard
├── /rules             → Content rules builder
├── /monetization      → Monetization category builder
├── /integrations      → API key and WordPress setup
├── /catalog           → Site catalog import
└── /complete          → Success screen with next steps
```

### 5.3 Voice Analysis AI (New Feature)

**Purpose:** Automatically extract voice profile from writing samples

**Process:**
1. User uploads 3-10 writing samples
2. System sends samples to Claude with analysis prompt
3. Claude extracts:
   - Tone and voice description
   - Typical sentence structures
   - Vocabulary level and patterns
   - Signature phrases and expressions
   - Topics and expertise areas
   - Writing style metrics
4. Results stored in `tenant_writing_samples.voice_analysis`
5. User reviews and approves extracted profile
6. Profile populates contributor fields

**Analysis Prompt Template:**
```
Analyze these writing samples and extract a comprehensive voice profile:

[SAMPLES]
{samples}
[/SAMPLES]

Return a JSON object with:
{
  "voice_description": "2-3 sentence description of the writing voice",
  "tone": ["primary tone", "secondary tone"],
  "complexity_level": "simple|moderate|advanced|expert",
  "typical_sentence_length": "short|medium|long|varied",
  "vocabulary_patterns": ["key vocabulary characteristics"],
  "signature_phrases": ["5-10 phrases this author uses frequently"],
  "phrases_to_avoid": ["phrases that don't match this voice"],
  "intro_style": "how they typically start articles",
  "conclusion_style": "how they typically end articles",
  "personality_traits": ["authoritative", "friendly", "technical", etc.],
  "target_audience": "who this writing is aimed at",
  "seo_approach": "how they handle keywords and SEO"
}
```

---

## 6. Core Features (Retained)

These features work identically but with tenant-scoped data:

### 6.1 Content Production Pipeline

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-stage AI generation | Retained | Tenant API keys |
| Contributor auto-assignment | Retained | Tenant contributors |
| Quality metrics & scoring | Retained | Configurable thresholds |
| Auto-fix loop (3 attempts) | Retained | As-is |
| StealthGPT humanization | Retained | Tenant API key |
| Claude fallback | Retained | Tenant API key |

### 6.2 Workflow Management

| Feature | Status | Notes |
|---------|--------|-------|
| Kanban dashboard | Retained | Tenant-scoped |
| Content ideas management | Retained | Tenant-scoped |
| Article editor (TipTap) | Retained | As-is |
| Content library | Retained | Tenant-scoped |
| Review queue | Retained | Tenant-scoped |

### 6.3 Publishing & Integration

| Feature | Status | Notes |
|---------|--------|-------|
| WordPress publishing | Retained | Tenant WP credentials |
| Auto-publish scheduler | Retained | Per-tenant settings |
| Keyword research | Retained | Tenant DataForSEO keys |

### 6.4 Quality Assurance

| Feature | Status | Notes |
|---------|--------|-------|
| Pre-publish validation | Retained | Configurable rules |
| Risk assessment | Retained | Configurable thresholds |
| Link validation | Enhanced | Tenant domain rules |
| Author enforcement | Enhanced | Tenant contributors only |

### 6.5 Learning & Training

| Feature | Status | Notes |
|---------|--------|-------|
| AI revision tracking | Retained | Tenant-scoped |
| Editorial comments | Retained | Tenant-scoped |
| Training data export | Retained | Tenant-scoped |

---

## 7. New Features (Enhancements)

### 7.1 Voice Profile Builder

**Purpose:** Visual interface for creating and refining author voice profiles

**Features:**
- Upload writing samples (text, URL, file)
- AI-powered voice extraction
- Side-by-side sample comparison
- Phrase library management
- Voice preview (generate sample paragraph)
- Export/import voice profiles

### 7.2 Domain Rule Builder

**Purpose:** Visual interface for configuring link policies

**Features:**
- Add/remove blocked domains
- Add/remove allowed domains
- Import competitor lists (CSV)
- Domain pattern matching (wildcards)
- Test URL validation
- Preview link validation results

### 7.3 Site Catalog Manager

**Purpose:** Manage internal linking sources

**Features:**
- Sitemap import (XML)
- RSS feed import
- Manual URL entry
- Bulk import (CSV)
- Auto-sync scheduling
- Content refresh triggers
- Link usage analytics

### 7.4 Monetization Builder

**Purpose:** Create custom monetization categories

**Features:**
- Category tree builder
- Shortcode template editor
- Variable substitution preview
- Bulk import (CSV/JSON)
- Topic-to-category mapping
- Placement rule configuration

### 7.5 White-Label Theming

**Purpose:** Customize appearance per tenant

**Features:**
- Logo upload (light/dark variants)
- Primary/secondary colors
- Custom app name
- Email template customization
- Login page customization
- Custom domain support (future)

### 7.6 Multi-User Collaboration

**Purpose:** Team-based content production

**Features:**
- User roles (admin, editor, writer, viewer)
- Permission-based access
- Activity logs
- User invitation flow
- Team analytics

### 7.7 Enhanced Analytics

**Purpose:** Production and quality insights

**Features:**
- Articles produced over time
- Quality score trends
- Contributor performance
- Publishing velocity
- API cost tracking
- Comparison to benchmarks

### 7.8 Template Library

**Purpose:** Pre-built configurations for common use cases

**Templates:**
- Education/Online Degrees (current GetEducated setup)
- SaaS/Technology
- Healthcare/Medical
- Finance/Insurance
- Travel/Hospitality
- E-commerce/Retail
- Legal/Professional Services

Each template includes:
- Sample contributors with voice profiles
- Domain whitelists/blocklists
- Monetization categories
- Content structure presets
- SEO guidelines

---

## 8. Configuration System

### 8.1 Configuration Hierarchy

```
Platform Defaults (lowest priority)
    ↓
Tenant Settings
    ↓
User Preferences (highest priority)
```

### 8.2 Tenant Settings Categories

**Generation Settings:**
```json
{
  "generation": {
    "default_word_count": 2000,
    "min_word_count": 1500,
    "max_word_count": 2500,
    "target_internal_links": 4,
    "target_external_links": 3,
    "target_faq_count": 3,
    "quality_threshold": 85,
    "max_fix_attempts": 3
  }
}
```

**Humanization Settings:**
```json
{
  "humanization": {
    "primary_provider": "stealthgpt", // stealthgpt, claude
    "fallback_provider": "claude",
    "stealthgpt_tone": "College", // Standard, HighSchool, College, PhD
    "stealthgpt_mode": "High", // Low, Medium, High
    "stealthgpt_detector": "gptzero", // gptzero, turnitin
    "detection_threshold": 25
  }
}
```

**Publishing Settings:**
```json
{
  "publishing": {
    "auto_publish_enabled": false,
    "auto_publish_delay_days": 5,
    "default_post_status": "draft",
    "require_review": true,
    "min_quality_for_auto_publish": 85
  }
}
```

**Content Rules:**
```json
{
  "content_rules": {
    "block_edu_domains": true,
    "require_external_citations": true,
    "enforce_approved_authors_only": true,
    "banned_phrases": ["in conclusion", "in summary", "it is important to note"],
    "required_sections": ["introduction", "conclusion", "faqs"]
  }
}
```

### 8.3 Settings UI

Organized into tabs:
- **General:** App name, branding, defaults
- **Generation:** AI models, word counts, quality targets
- **Humanization:** StealthGPT/Claude settings
- **Publishing:** WordPress, auto-publish rules
- **Content Rules:** Domains, phrases, requirements
- **Integrations:** API keys, external services
- **Users:** Team management, roles

---

## 9. API & Integration Layer

### 9.1 Tenant-Aware API Keys

All external API calls use tenant-specific keys:

```javascript
// services/ai/tenantAwareGrokClient.js
export async function getGrokClient(tenantId) {
  const apiKey = await getTenantApiKey(tenantId, 'grok');
  return new GrokClient(apiKey);
}

// Usage in generation pipeline
const grokClient = await getGrokClient(tenant.id);
const draft = await grokClient.generateDraft(prompt, options);
```

### 9.2 Supabase Edge Functions (Tenant-Aware)

All Edge Functions receive tenant context:

```typescript
// supabase/functions/generate-article/index.ts
export async function handler(req: Request) {
  const tenantId = req.headers.get('x-tenant-id');

  // Fetch tenant configuration
  const tenantConfig = await getTenantConfig(tenantId);

  // Use tenant API keys
  const grokKey = await getTenantApiKey(tenantId, 'grok');

  // Generate with tenant settings
  const article = await generateArticle({
    ...req.body,
    config: tenantConfig,
    grokApiKey: grokKey
  });
}
```

### 9.3 WordPress Integration

Each tenant configures their own WordPress site:

```javascript
// services/tenantPublishService.js
export async function publishToWordPress(tenantId, article) {
  const wpConfig = await getTenantWordPressConfig(tenantId);

  const response = await fetch(`${wpConfig.site_url}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${wpConfig.username}:${wpConfig.password}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: article.title,
      content: article.content,
      status: wpConfig.default_post_status,
      // ... other fields
    })
  });
}
```

### 9.4 Sitemap/RSS Import

Automated catalog population:

```javascript
// services/catalogImportService.js
export async function importFromSitemap(tenantId, sitemapUrl) {
  const urls = await parseSitemap(sitemapUrl);

  for (const url of urls) {
    const content = await fetchAndParse(url);

    await supabase.from('tenant_site_catalog').upsert({
      tenant_id: tenantId,
      url: url,
      title: content.title,
      content_html: content.html,
      topics: await extractTopics(content),
      last_synced_at: new Date()
    });
  }
}
```

---

## 10. Security & Isolation

### 10.1 Data Isolation

**Row-Level Security:**
- Every tenant-scoped table has RLS policies
- Users can only access data for their tenant(s)
- Platform admins have bypass for management

**API Key Encryption:**
```sql
-- Store encrypted with pgcrypto
INSERT INTO tenant_api_keys (tenant_id, service, encrypted_key)
VALUES (
  $1,
  'grok',
  pgp_sym_encrypt($2, current_setting('app.encryption_key'))
);

-- Decrypt when needed
SELECT pgp_sym_decrypt(
  encrypted_key::bytea,
  current_setting('app.encryption_key')
) as api_key
FROM tenant_api_keys
WHERE tenant_id = $1 AND service = 'grok';
```

### 10.2 Authentication & Authorization

**Role-Based Access:**
| Role | Permissions |
|------|-------------|
| Admin | Full access, user management, settings, billing |
| Editor | Create/edit content, manage contributors, publish |
| Writer | Create/edit own content, cannot publish |
| Viewer | Read-only access to all content |

**JWT Claims:**
```javascript
// Custom claims added at login
{
  "tenant_id": "uuid-of-tenant",
  "role": "editor",
  "permissions": ["articles.create", "articles.edit", "publish"]
}
```

### 10.3 API Key Security

**Client-Side (Development):**
- API keys fetched from Edge Function proxy
- Never exposed to browser

**Server-Side (Production):**
- All AI calls go through Edge Functions
- API keys stored in Supabase Vault
- Rate limiting per tenant

### 10.4 Audit Logging

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL, -- create, update, delete, publish, etc.
  resource_type TEXT NOT NULL, -- article, idea, contributor, etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Deployment Architecture

### 11.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN (Cloudflare/Vercel)                │
│                      - Static asset caching                 │
│                      - DDoS protection                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      FRONTEND HOSTING                        │
│                      Netlify / Vercel                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Single Deployment)                       │   │
│  │  - Tenant context loaded dynamically                 │   │
│  │  - White-label theming via CSS variables             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      SUPABASE (Shared Project)              │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │   Auth Service    │  │   Realtime        │               │
│  │   - JWT tokens    │  │   - Live updates  │               │
│  └───────────────────┘  └───────────────────┘               │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │   PostgreSQL      │  │   Edge Functions  │               │
│  │   - RLS isolation │  │   - AI proxies    │               │
│  │   - All tenants   │  │   - Publishing    │               │
│  └───────────────────┘  └───────────────────┘               │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │   Storage         │  │   Vault           │               │
│  │   - Tenant files  │  │   - API keys      │               │
│  └───────────────────┘  └───────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      EXTERNAL SERVICES                       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │   xAI     │ │ Anthropic │ │StealthGPT │ │DataForSEO │   │
│  │   Grok    │ │  Claude   │ │           │ │           │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            WordPress Sites (Per Tenant)               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Environment Configuration

```bash
# .env.production

# Supabase (shared project)
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key

# Feature Flags
VITE_USE_EDGE_FUNCTIONS=true
VITE_ENABLE_MULTI_TENANT=true

# Platform Settings
VITE_PLATFORM_NAME="AI Content Engine"
VITE_SUPPORT_EMAIL=support@contentengine.com
```

### 11.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Deploy to Netlify
        run: netlify deploy --prod

      - name: Deploy Edge Functions
        run: supabase functions deploy
```

---

## 12. Migration Strategy

### 12.1 Phase 1: Database Preparation

1. Create new multi-tenant tables (tenants, tenant_users, etc.)
2. Add `tenant_id` column to all existing tables
3. Create default tenant for GetEducated
4. Migrate existing data to default tenant
5. Enable RLS policies
6. Test with existing functionality

### 12.2 Phase 2: Code Abstraction

1. Create TenantContext provider
2. Update all hooks to use tenant context
3. Replace hardcoded values with tenant config lookups
4. Update services to use tenant API keys
5. Refactor validation to use tenant rules

### 12.3 Phase 3: New Features

1. Build onboarding wizard
2. Implement voice analysis
3. Create domain rule builder
4. Build monetization builder
5. Add site catalog manager

### 12.4 Phase 4: Testing & Launch

1. Create test tenants
2. QA all features per tenant
3. Security audit
4. Performance testing
5. Soft launch with beta tenants
6. General availability

---

## 13. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Create tenant tables schema | P0 | Medium |
| Add tenant_id to existing tables | P0 | Medium |
| Implement RLS policies | P0 | Medium |
| Create TenantContext provider | P0 | Low |
| Migrate GetEducated as default tenant | P0 | Medium |

### Phase 2: Tenant Isolation (Weeks 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Refactor useContributors to tenant-scoped | P0 | Medium |
| Refactor generationService | P0 | High |
| Refactor linkValidator | P0 | Medium |
| Update all AI clients for tenant keys | P0 | Medium |
| Tenant-aware publishing service | P0 | Medium |

### Phase 3: Onboarding (Weeks 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Build onboarding wizard UI | P1 | High |
| Implement voice analysis AI | P1 | High |
| Create writing sample upload | P1 | Medium |
| Build contributor wizard | P1 | Medium |
| Implement domain rule builder | P1 | Medium |

### Phase 4: Management Features (Weeks 7-8)

| Task | Priority | Effort |
|------|----------|--------|
| Tenant admin dashboard | P1 | High |
| User invitation system | P1 | Medium |
| Site catalog import | P1 | Medium |
| White-label theming | P2 | Medium |
| Analytics dashboard | P2 | Medium |

### Phase 5: Polish & Launch (Weeks 9-10)

| Task | Priority | Effort |
|------|----------|--------|
| Security audit | P0 | Medium |
| Performance optimization | P1 | Medium |
| Documentation | P1 | Medium |
| Beta testing | P0 | High |
| Production deployment | P0 | Medium |

**Total Estimated Duration:** 10 weeks

---

## 14. Success Metrics

### 14.1 Technical Metrics

| Metric | Target |
|--------|--------|
| Tenant isolation: Zero data leakage | 100% |
| API response time | < 200ms p95 |
| Article generation time | < 3 minutes |
| System uptime | 99.9% |
| RLS policy coverage | 100% of tables |

### 14.2 Business Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Active tenants | 10+ |
| Articles generated per tenant | 100+/month |
| User satisfaction (NPS) | > 50 |
| Churn rate | < 5%/month |
| Average setup time | < 2 hours |

### 14.3 Quality Metrics

| Metric | Target |
|--------|--------|
| Average quality score | > 85 |
| Auto-fix success rate | > 80% |
| AI detection pass rate | > 95% |
| Internal linking accuracy | > 90% |

---

## Appendix A: GetEducated Migration Checklist

**Data to Migrate:**
- [ ] 4 contributors → tenant_contributors
- [ ] All articles → articles (add tenant_id)
- [ ] All content ideas → content_ideas (add tenant_id)
- [ ] geteducated_articles → tenant_site_catalog
- [ ] Monetization categories → tenant_monetization_categories
- [ ] Degree levels → tenant_content_levels
- [ ] System settings → tenant_settings
- [ ] API keys → tenant_api_keys (encrypted)

**Configuration to Preserve:**
- [ ] Blocked competitor domains
- [ ] Allowed external domains
- [ ] Author voice profiles
- [ ] Quality thresholds
- [ ] Publishing settings
- [ ] Humanization preferences

---

## Appendix B: Template: Education Industry

Pre-built configuration for education/online degree clients:

```json
{
  "template_id": "education-industry",
  "name": "Online Education",
  "description": "For online degree, certification, and education content publishers",

  "default_blocked_domains": [
    "onlineu.com", "usnews.com", "bestcolleges.com",
    "niche.com", "petersons.com", "princetonreview.com"
  ],

  "default_allowed_domains": [
    "bls.gov", "ed.gov", "studentaid.gov",
    "chea.org", "aacsb.edu", "collegeboard.org"
  ],

  "sample_contributors": [
    {
      "name": "Rankings Expert",
      "expertise_areas": ["rankings", "data analysis", "affordability"],
      "content_types": ["ranking", "listicle"],
      "voice_description": "Data-driven and analytical. Uses statistics to support claims."
    },
    {
      "name": "Program Guide Writer",
      "expertise_areas": ["degree programs", "career paths", "professional development"],
      "content_types": ["guide", "explainer"],
      "voice_description": "Warm and encouraging. Focuses on practical career outcomes."
    }
  ],

  "sample_monetization_categories": [
    {"category": "Business", "sub_category": "MBA", "shortcode_template": "[degree_programs category=\"business\" level=\"masters\"]"},
    {"category": "Healthcare", "sub_category": "Nursing", "shortcode_template": "[degree_programs category=\"healthcare\" level=\"bachelors\"]"}
  ],

  "sample_content_levels": [
    {"name": "Certificate", "code": "cert"},
    {"name": "Associate", "code": "assoc"},
    {"name": "Bachelor's", "code": "bach"},
    {"name": "Master's", "code": "mast"},
    {"name": "Doctorate", "code": "doct"}
  ]
}
```

---

## Appendix C: API Key Requirements by Service

| Service | Key Type | Required For | Monthly Cost (Est.) |
|---------|----------|--------------|---------------------|
| xAI Grok | API Key | Article drafting | $50-200 |
| Anthropic Claude | API Key | Humanization, fixes | $30-100 |
| StealthGPT | API Key | AI detection bypass | $49-199/plan |
| DataForSEO | Username/Password | Keyword research | $50-200 |
| WordPress | App Password | Publishing | Free (self-hosted) |

**Total estimated cost per tenant:** $200-700/month depending on volume

---

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A client organization using the platform |
| **Contributor** | An author persona with voice profile |
| **Voice Profile** | AI-extracted writing style characteristics |
| **Site Catalog** | Database of client's existing articles for internal linking |
| **Humanization** | Process of making AI text undetectable |
| **Quality Score** | 0-100 metric based on content guidelines |
| **Monetization** | Revenue-generating content elements (shortcodes, affiliate links) |
| **RLS** | Row-Level Security - PostgreSQL data isolation |

---

**Document Status:** Draft for Review
**Next Review:** Before implementation begins
**Owner:** Development Team
**Stakeholders:** Product, Engineering, Client Success

---

*This PRD transforms a single-client content engine into a scalable multi-tenant SaaS platform while preserving all proven functionality and enabling rapid onboarding of new clients.*
