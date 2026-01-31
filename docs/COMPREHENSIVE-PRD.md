# Perdia v5 - Comprehensive Product Requirements Document

**Version:** 1.0.0
**Last Updated:** December 8, 2025
**Status:** Active Development (v5 branch)
**Primary Client:** GetEducated.com
**Stakeholders:** Tony Huffman, Kayleigh Gilbert, Sara, Charity

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Database Schema](#5-database-schema)
6. [AI Generation Pipeline](#6-ai-generation-pipeline)
7. [Pages & Routes](#7-pages--routes)
8. [Components Architecture](#8-components-architecture)
9. [Custom Hooks](#9-custom-hooks)
10. [Services Layer](#10-services-layer)
11. [Content Rules & Validation](#11-content-rules--validation)
12. [Monetization System](#12-monetization-system)
13. [Author Management](#13-author-management)
14. [Automation Engine](#14-automation-engine)
15. [Quality Assurance System](#15-quality-assurance-system)
16. [Publishing Workflow](#16-publishing-workflow)
17. [Configuration & Settings](#17-configuration--settings)
18. [Environment Variables](#18-environment-variables)
19. [Deployment](#19-deployment)
20. [API Integrations](#20-api-integrations)
21. [Implementation Status](#21-implementation-status)

---

## 1. Executive Summary

### 1.1 Purpose

Perdia v5 is an enterprise-grade AI-powered content production system designed specifically for GetEducated.com. The application automates the entire content lifecycle from idea generation to WordPress publishing, utilizing a sophisticated two-pass AI generation pipeline that produces SEO-optimized, human-quality articles while bypassing AI detection tools.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Two-Pass AI Generation** | Grok (drafting) + StealthGPT/Claude (humanization) |
| **Quality Assurance** | Automated scoring, validation, and auto-fix loops |
| **Contributor Management** | 4 approved authors with distinct writing voice profiles |
| **Monetization Integration** | Automatic shortcode generation and placement |
| **Internal Linking** | AI-powered link insertion from 1000+ article catalog |
| **Risk Assessment** | Automatic risk scoring and publish blocking |
| **Batch Processing** | Generate multiple articles concurrently |
| **Auto-Publishing** | Configurable auto-publish for approved content |

### 1.3 Target Metrics

- **Production Volume:** Start at ~3 articles/day, scale to ~100/week
- **Quality Score Target:** 85+ for auto-publish eligibility
- **AI Detection Bypass:** Optimized for GPTZero, Turnitin
- **Review Cycle:** Human review optional, auto-publish after 5 days

---

## 2. System Overview

### 2.1 Architecture Diagram

```
                                    PERDIA V5 ARCHITECTURE

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           FRONTEND (React 19 + Vite)                     │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
    │  │  Dashboard  │  │   Editor    │  │   Library   │  │  Settings   │     │
    │  │  (Kanban)   │  │  (TipTap)   │  │  (Articles) │  │  (Config)   │     │
    │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
    │                                                                          │
    │  ┌────────────────────────────────────────────────────────────────┐     │
    │  │                    STATE MANAGEMENT LAYER                       │     │
    │  │   React Query (Server State)  +  React Context (Auth State)    │     │
    │  └────────────────────────────────────────────────────────────────┘     │
    └─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         SERVICES LAYER                                   │
    │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
    │  │ Generation    │  │ Validation    │  │ Publishing                │   │
    │  │ Service       │  │ Services      │  │ Services                  │   │
    │  │               │  │               │  │                           │   │
    │  │ - Pipeline    │  │ - Link Check  │  │ - WordPress Webhook       │   │
    │  │ - Quality     │  │ - Risk Assess │  │ - Auto-Publish Logic      │   │
    │  │ - Linking     │  │ - Pre-Publish │  │ - Revision Tracking       │   │
    │  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
    ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐
    │    AI CLIENTS     │  │     SUPABASE      │  │   EXTERNAL APIs       │
    │                   │  │                   │  │                       │
    │  ┌─────────────┐  │  │  - PostgreSQL DB  │  │  - DataForSEO         │
    │  │ Grok (xAI)  │  │  │  - Auth           │  │  - WordPress REST     │
    │  │ - Drafting  │  │  │  - RLS Policies   │  │  - n8n Webhooks       │
    │  └─────────────┘  │  │  - Edge Functions │  │                       │
    │  ┌─────────────┐  │  │  - Realtime       │  │                       │
    │  │ StealthGPT  │  │  │                   │  │                       │
    │  │ - Humanize  │  │  │                   │  │                       │
    │  └─────────────┘  │  │                   │  │                       │
    │  ┌─────────────┐  │  │                   │  │                       │
    │  │   Claude    │  │  │                   │  │                       │
    │  │ - Fallback  │  │  │                   │  │                       │
    │  │ - Auto-Fix  │  │  │                   │  │                       │
    │  └─────────────┘  │  │                   │  │                       │
    └───────────────────┘  └───────────────────┘  └───────────────────────┘
```

### 2.2 Project Structure

```
perdiav5/
├── src/
│   ├── assets/                      # Static assets (images, fonts)
│   ├── components/                  # React components
│   │   ├── article/                 # Article editor components (15 files)
│   │   ├── automation/              # Automation engine (1 file)
│   │   ├── dashboard/               # Dashboard widgets
│   │   ├── editor/                  # Editor utilities
│   │   ├── ideas/                   # Idea management (1 file)
│   │   ├── layout/                  # Layout components (1 file)
│   │   ├── ui/                      # Reusable UI primitives (30+ files)
│   │   └── workflow/                # Workflow components
│   ├── contexts/                    # React contexts
│   │   ├── AuthContext.jsx          # Authentication state
│   │   └── GenerationProgressContext.jsx  # Generation tracking
│   ├── hooks/                       # Custom hooks (23 files)
│   ├── lib/                         # Utility libraries
│   │   ├── queryClient.js           # React Query config
│   │   └── utils.js                 # Helper functions
│   ├── pages/                       # Page components (20 files)
│   ├── services/                    # Business logic
│   │   ├── ai/                      # AI clients (6 files)
│   │   ├── validation/              # Validation services (4 files)
│   │   ├── generationService.js     # Pipeline orchestrator
│   │   ├── publishService.js        # WordPress publishing
│   │   ├── autoPublishService.js    # Auto-publish logic
│   │   ├── monetizationEngine.js    # Shortcode generation
│   │   ├── shortcodeService.js      # Shortcode management
│   │   ├── costDataService.js       # Ranking report data
│   │   ├── ideaDiscoveryService.js  # Multi-source ideas
│   │   ├── articleRevisionService.js # Version tracking
│   │   └── supabaseClient.js        # Database client
│   ├── App.jsx                      # Root component with routing
│   └── main.jsx                     # Entry point
├── supabase/
│   ├── migrations/                  # Database migrations (36 files)
│   └── functions/                   # Edge functions (planned)
├── docs/                            # Documentation (28 files)
│   ├── v5-updates/                  # GetEducated-specific docs (9 files)
│   ├── specifications/              # Technical specs (4 files)
│   ├── guides/                      # Setup guides (2 files)
│   └── architecture/                # Architecture docs (2 files)
├── data/                            # Static data files
├── public/                          # Static public files
├── index.html                       # HTML template
├── package.json                     # Dependencies (28 packages)
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS config
├── postcss.config.js                # PostCSS config
├── eslint.config.js                 # ESLint config
├── netlify.toml                     # Netlify deployment
└── CLAUDE.md                        # AI assistant instructions
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework (latest with Server Components) |
| **Vite** | 7.2.4 | Build tool and dev server |
| **React Router DOM** | 7.9.6 | Client-side routing |
| **Tailwind CSS** | 4.1.17 | Utility-first styling |
| **TanStack React Query** | 5.90.10 | Server state management |
| **React Hook Form** | 7.66.1 | Form handling |
| **Zod** | 4.1.13 | Schema validation |
| **TipTap** | 3.13.0 | Rich text editor |
| **Framer Motion** | 12.23.24 | Animations |
| **Recharts** | 3.5.0 | Data visualization |
| **Lucide React** | 0.554.0 | Icon library (454+ icons) |
| **dnd-kit** | Latest | Drag and drop (Kanban) |
| **date-fns** | 4.1.0 | Date utilities |
| **clsx/tailwind-merge** | Latest | Class name utilities |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | Backend as a Service |
| **PostgreSQL** | 15+ | Primary database |
| **Row-Level Security** | N/A | Multi-tenant data isolation |
| **Supabase Auth** | N/A | Authentication (email/password) |
| **Supabase Realtime** | N/A | Live subscriptions |
| **Supabase Edge Functions** | Deno | Server-side logic (planned) |

### 3.3 AI Services

| Service | Model | Purpose |
|---------|-------|---------|
| **xAI Grok** | grok-3 | Primary drafting (12,000 max tokens) |
| **StealthGPT** | Business Engine | Primary humanization (AI detection bypass) |
| **Anthropic Claude** | claude-sonnet-4-20250514 | Fallback humanization, auto-fix, revisions |
| **DataForSEO** | API | Keyword research (optional) |

### 3.4 Data Processing

| Library | Version | Purpose |
|---------|---------|---------|
| **Cheerio** | 1.1.2 | HTML parsing |
| **xml2js** | 0.6.2 | XML processing |
| **jsdom** | 27.2.0 | DOM simulation |
| **p-limit** | 7.2.0 | Rate limiting |
| **xlsx** | 0.18.5 | Excel export |

### 3.5 Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 9.39.1 | Code linting |
| **eslint-plugin-react-hooks** | 7.0.1 | React hooks rules |
| **eslint-plugin-react-refresh** | 0.4.24 | Fast refresh support |
| **dotenv** | 17.2.3 | Environment variables |

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```javascript
// src/contexts/AuthContext.jsx

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async (email, password) => {},
  signUp: async (email, password) => {},
  signOut: async () => {},
});

// Provider wraps entire app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4.2 Protected Routes

```javascript
// src/components/ProtectedRoute.jsx

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? children : null;
}
```

### 4.3 Route Structure

```javascript
// src/App.jsx

<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />

  {/* Protected Routes */}
  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/editor/:articleId?" element={<ArticleEditor />} />
    <Route path="/library" element={<ContentLibrary />} />
    <Route path="/ideas" element={<ContentIdeas />} />
    <Route path="/review" element={<ReviewQueue />} />
    <Route path="/review/:articleId" element={<ArticleReview />} />
    <Route path="/catalog" element={<SiteCatalog />} />
    <Route path="/catalog/:articleId" element={<CatalogArticleDetail />} />
    <Route path="/keywords" element={<Keywords />} />
    <Route path="/automation" element={<Automation />} />
    <Route path="/batch-progress" element={<BatchProgress />} />
    <Route path="/integrations" element={<Integrations />} />
    <Route path="/contributors" element={<Contributors />} />
    <Route path="/contributors/:contributorId" element={<ContributorDetail />} />
    <Route path="/ai-training" element={<AITraining />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

---

## 5. Database Schema

### 5.1 Core Tables

#### articles
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'idea' CHECK (status IN (
    'idea', 'drafting', 'refinement', 'qa_review', 'ready_to_publish', 'published'
  )),
  content_type TEXT CHECK (content_type IN (
    'guide', 'listicle', 'ranking', 'explainer', 'review'
  )),
  contributor_id UUID REFERENCES article_contributors(id),
  cluster_id UUID REFERENCES clusters(id),
  idea_id UUID REFERENCES content_ideas(id),

  -- SEO Fields
  seo_title TEXT,
  seo_description TEXT,
  target_keywords TEXT[],

  -- Quality Fields
  quality_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  faq_count INTEGER DEFAULT 0,

  -- Risk & Publishing
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  autopublish_deadline TIMESTAMPTZ,
  human_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,

  -- WordPress Integration
  wordpress_post_id INTEGER,
  wordpress_url TEXT,
  published_at TIMESTAMPTZ,

  -- FAQs (JSONB)
  faqs JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_contributor_id ON articles(contributor_id);
CREATE INDEX idx_articles_cluster_id ON articles(cluster_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
```

#### content_ideas
```sql
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'completed', 'in_progress'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- Content Configuration
  content_type TEXT,
  suggested_keywords TEXT[],
  target_keywords TEXT[],

  -- Source Tracking
  source TEXT CHECK (source IN (
    'reddit', 'twitter', 'news', 'trends', 'manual', 'ai_generated', 'dataforseo'
  )),
  source_url TEXT,
  trending_reason TEXT,

  -- Keyword Research Data
  keyword_research_data JSONB,
  search_intent TEXT,

  -- Relationships
  cluster_id UUID REFERENCES clusters(id),
  article_id UUID REFERENCES articles(id),

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### article_contributors
```sql
CREATE TABLE article_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,                    -- Real name (public byline)
  display_name TEXT,                     -- Display name
  style_proxy TEXT,                      -- Internal AI voice name (Kif, Alicia, Danny, Julia)

  -- Profile
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'writer',

  -- WordPress Integration
  wp_slug TEXT,                          -- WordPress author slug
  has_contributor_page BOOLEAN DEFAULT false,
  contributor_url TEXT,                  -- GetEducated contributor page URL

  -- Content Configuration
  expertise_areas TEXT[],                -- Areas of expertise
  content_types TEXT[],                  -- Preferred content types
  specialties TEXT[],                    -- Specific topics

  -- Writing Style Profile (JSONB)
  writing_style_profile TEXT,            -- Detailed style description
  sample_urls TEXT[],                    -- Sample article URLs

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### clusters
```sql
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  content_brief TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  parent_id UUID REFERENCES clusters(id),

  -- Configuration
  target_keyword TEXT,
  priority INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 GetEducated-Specific Tables

#### geteducated_articles (Site Catalog)
```sql
CREATE TABLE geteducated_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,

  -- Classification
  category TEXT,
  topics TEXT[],

  -- Metadata
  word_count INTEGER,
  heading_count INTEGER,
  internal_link_count INTEGER,

  -- Link Tracking
  times_linked_to INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  needs_rewrite BOOLEAN DEFAULT false,
  last_scraped_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for relevance queries
CREATE INDEX idx_geteducated_articles_topics ON geteducated_articles USING GIN(topics);
```

#### monetization_categories
```sql
CREATE TABLE monetization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  category_code TEXT,
  concentration TEXT,

  -- Shortcode Configuration
  shortcode_template TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### monetization_levels
```sql
CREATE TABLE monetization_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name TEXT NOT NULL,      -- e.g., "Associate", "Bachelor", "Master"
  level_code TEXT NOT NULL,      -- e.g., "associate", "bachelors", "masters"
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ranking_reports
```sql
CREATE TABLE ranking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  degree_type TEXT,
  degree_level TEXT,

  -- Metadata
  report_date DATE,
  school_count INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ranking_report_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES ranking_reports(id) ON DELETE CASCADE,

  -- School Info
  school_name TEXT NOT NULL,
  program_name TEXT,

  -- Cost Data
  in_state_cost DECIMAL(10,2),
  out_of_state_cost DECIMAL(10,2),
  average_cost DECIMAL(10,2),

  -- Ranking
  rank_position INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### subjects (CIP Code Mapping)
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  subject_area TEXT,
  cip_code TEXT,                 -- Classification of Instructional Programs code

  -- Configuration
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Content Management Tables

#### keywords
```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  keyword TEXT NOT NULL,

  -- Research Data
  search_volume INTEGER,
  difficulty_score INTEGER,
  intent TEXT CHECK (intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  opportunity_score INTEGER,

  -- Status
  is_starred BOOLEAN DEFAULT false,
  is_queued BOOLEAN DEFAULT false,

  -- Relationships
  cluster_id UUID REFERENCES clusters(id),
  idea_id UUID REFERENCES content_ideas(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### article_versions
```sql
CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

  -- Version Content
  title TEXT,
  content TEXT,
  excerpt TEXT,

  -- Version Metadata
  version_number INTEGER NOT NULL,
  change_type TEXT,              -- 'creation', 'edit', 'ai_revision', 'human_review'
  change_summary TEXT,

  -- Author
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### article_comments
```sql
CREATE TABLE article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Comment Content
  selected_text TEXT,            -- Text that was selected
  comment TEXT NOT NULL,
  category TEXT,                 -- 'style', 'fact', 'structure', 'link', 'other'
  severity TEXT DEFAULT 'suggestion' CHECK (severity IN ('critical', 'important', 'suggestion')),

  -- Position (for text selection)
  start_offset INTEGER,
  end_offset INTEGER,

  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ai_revisions
```sql
CREATE TABLE ai_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

  -- Revision Content
  original_content TEXT,
  revised_content TEXT,

  -- Revision Metadata
  revision_type TEXT,            -- 'humanization', 'auto_fix', 'feedback_revision'
  ai_provider TEXT,              -- 'grok', 'claude', 'stealthgpt'

  -- Quality Tracking
  quality_score_before INTEGER,
  quality_score_after INTEGER,

  -- Feedback (for revision with feedback)
  feedback JSONB,
  revision_context JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 System Tables

#### generation_queue
```sql
CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  idea_id UUID REFERENCES content_ideas(id),

  -- Queue Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  priority INTEGER DEFAULT 0,

  -- Processing Info
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Result
  article_id UUID REFERENCES articles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### system_settings
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT,             -- 'automation', 'quality', 'humanization', etc.
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### wordpress_connections
```sql
CREATE TABLE wordpress_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Connection Info
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,

  -- Credentials (encrypted)
  api_key TEXT,
  username TEXT,

  -- Configuration
  is_default BOOLEAN DEFAULT false,
  auto_publish_enabled BOOLEAN DEFAULT false,

  -- Status
  last_connected_at TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'disconnected',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_contributors ENABLE ROW LEVEL SECURITY;
-- ... etc.

-- Shared Workspace Policy (all authenticated users see all data)
CREATE POLICY "Authenticated users can view all articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (true);

-- Service Role Policy (for background jobs)
CREATE POLICY "Service role has full access"
  ON articles FOR ALL
  TO service_role
  USING (true);
```

---

## 6. AI Generation Pipeline

### 6.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TWO-PASS AI GENERATION PIPELINE                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 0: PREPARATION                                                │    │
│  │   - Fetch cost data from ranking reports (RAG context)              │    │
│  │   - Get relevant internal articles for linking (top 50)             │    │
│  │   - Load contributor profile and style guide                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 1: CONTRIBUTOR ASSIGNMENT                                     │    │
│  │   - Score contributors by topic match                               │    │
│  │   - Match expertise areas to idea topics (50 points)                │    │
│  │   - Match content type compatibility (30 points)                    │    │
│  │   - Match title keywords (20 points)                                │    │
│  │   - Select highest scoring contributor                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 2: DRAFT GENERATION (Grok grok-3)                             │    │
│  │   - Build comprehensive prompt with:                                │    │
│  │     • Idea details (title, description, keywords)                   │    │
│  │     • Contributor voice profile                                     │    │
│  │     • Cost data context (from ranking reports)                      │    │
│  │     • Internal linking articles                                     │    │
│  │     • Anti-AI-detection instructions                                │    │
│  │     • E-E-A-T guidelines                                            │    │
│  │   - Max tokens: 12,000                                              │    │
│  │   - Output: JSON { title, excerpt, content, faqs }                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 3: DRAFT VALIDATION                                           │    │
│  │   - Check for truncation (incomplete content)                       │    │
│  │   - Check for placeholders ([School Name], [Date], etc.)            │    │
│  │   - Validate statistics aren't fabricated                           │    │
│  │   - If issues: Retry up to 3 times with adjusted prompt             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 4: HUMANIZATION (StealthGPT or Claude fallback)               │    │
│  │                                                                      │    │
│  │   StealthGPT (Primary):                                             │    │
│  │   - API: https://stealthgpt.ai/api/stealthify                       │    │
│  │   - Settings: Tone=College, Mode=High, Business=true                │    │
│  │   - Detector optimization: GPTZero                                   │    │
│  │   - Chunk size: 150-200 words for optimal processing                │    │
│  │   - Double-pass option for maximum safety                           │    │
│  │                                                                      │    │
│  │   Claude (Fallback):                                                │    │
│  │   - Model: claude-sonnet-4-20250514                                 │    │
│  │   - Temperature: 0.9 (high creativity)                              │    │
│  │   - Focus: Perplexity, burstiness, voice injection                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 5: INTERNAL LINKING                                           │    │
│  │   - Fetch top 50 relevant articles from geteducated_articles        │    │
│  │   - Score by title overlap (10 pts/word) + topic match (15 pts)     │    │
│  │   - Use Claude to insert 3-5 contextual links                       │    │
│  │   - Update times_linked_to counter                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 6: MONETIZATION SHORTCODES                                    │    │
│  │   - Match article topic to monetization category                    │    │
│  │   - Select appropriate concentration and degree level               │    │
│  │   - Generate shortcodes based on article type:                      │    │
│  │     • Ranking: 5 after_intro, 3 mid_article, 1 near_conclusion      │    │
│  │     • Guide: 3 after_intro, 1 near_conclusion                       │    │
│  │     • Listicle: 5 after_intro, 3 mid_article                        │    │
│  │   - Insert [ge_monetization] shortcodes                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 7: QUALITY ASSURANCE LOOP                                     │    │
│  │                                                                      │    │
│  │   Calculate Quality Metrics:                                        │    │
│  │   - Word count (target: 1500-2500)                                  │    │
│  │   - Internal links (target: 3-5)                                    │    │
│  │   - External citations (target: 2-4)                                │    │
│  │   - FAQ count (target: 3+)                                          │    │
│  │   - Heading structure (target: 3+ H2s)                              │    │
│  │   - Readability (avg sentence < 25 words)                           │    │
│  │                                                                      │    │
│  │   Scoring (start at 100):                                           │    │
│  │   - Word count < 1500: -15 (major)                                  │    │
│  │   - Word count > 2500: -5 (minor)                                   │    │
│  │   - Internal links < 3: -15 (major)                                 │    │
│  │   - External links < 2: -10 (minor)                                 │    │
│  │   - FAQs < 3: -10 (minor)                                           │    │
│  │   - Headings < 3: -10 (minor)                                       │    │
│  │   - Readability > 25: -10 (minor)                                   │    │
│  │                                                                      │    │
│  │   If score < threshold:                                             │    │
│  │   - Auto-fix with Claude (up to 3 attempts)                         │    │
│  │   - Re-validate after each attempt                                  │    │
│  │   - Set risk flags if unfixable                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STAGE 8: SAVE & FINALIZE                                            │    │
│  │   - Save article to database                                        │    │
│  │   - Update content_idea status to 'completed'                       │    │
│  │   - Set risk_level based on validation results                      │    │
│  │   - Set autopublish_deadline if enabled                             │    │
│  │   - Create initial article_version record                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Total Time: ~2-4 minutes per article                                       │
│  Estimated Cost: $0.10-0.30 per article                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Grok Client Implementation

```javascript
// src/services/ai/grokClient.js

export class GrokClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
    this.model = 'grok-3';
    this.maxTokens = 12000;
  }

  async generateDraft(idea, options = {}) {
    const {
      contributor,
      siteArticles = [],
      costData = null,
      contentType = 'guide',
    } = options;

    const prompt = this.buildDraftPrompt({
      idea,
      contributor,
      siteArticles,
      costData,
      contentType,
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt(contributor) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Grok API Error: ${error.error?.message}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Clean markdown code blocks
    content = content
      .replace(/^```json\s*/gim, '')
      .replace(/^```\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();

    return JSON.parse(content);
  }

  buildDraftPrompt({ idea, contributor, siteArticles, costData, contentType }) {
    return `
# ARTICLE GENERATION REQUEST

## ASSIGNMENT
Generate a comprehensive, SEO-optimized article about: "${idea.title}"

${idea.description ? `Description: ${idea.description}` : ''}

## CONTENT TYPE: ${contentType}

## TARGET KEYWORDS
${idea.suggested_keywords?.join(', ') || 'N/A'}

## AUTHOR VOICE PROFILE
${contributor?.writing_style_profile || 'Professional, informative tone'}

## COST DATA CONTEXT (Use only this data for cost information)
${costData ? JSON.stringify(costData, null, 2) : 'No cost data available'}

## INTERNAL LINKING OPPORTUNITIES
${siteArticles.slice(0, 15).map(a => `- ${a.title}: ${a.url}`).join('\n')}

## ANTI-HALLUCINATION RULES (CRITICAL)
- NEVER fabricate statistics, studies, or surveys
- NEVER invent school names or programs not in the provided data
- NEVER make up legislation or regulations
- NEVER create fake organizations or accreditation bodies
- If you don't have data, say "according to current data" or omit

## BANNED AI PHRASES (NEVER USE)
- "Furthermore" / "Moreover" / "Additionally"
- "It's important to note that"
- "In conclusion" / "To summarize"
- "Indeed" / "Notably" / "Delve into"

## OUTPUT FORMAT (JSON ONLY)
{
  "title": "SEO-optimized title (10-70 chars)",
  "excerpt": "Meta description (150-300 chars)",
  "content": "HTML content (1500-2500 words)",
  "faqs": [{ "question": "...", "answer": "..." }]
}
`;
  }

  getSystemPrompt(contributor) {
    return `You are ${contributor?.name || 'a professional content writer'} writing for GetEducated.com.
${contributor?.writing_style_profile || ''}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations.`;
  }
}
```

### 6.3 StealthGPT Client Implementation

```javascript
// src/services/ai/stealthGptClient.js

export class StealthGptClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_STEALTHGPT_API_KEY;
    this.baseUrl = 'https://stealthgpt.ai/api/stealthify';
  }

  async humanize(text, options = {}) {
    const {
      tone = 'College',      // Standard, HighSchool, College, PhD
      mode = 'High',         // Low, Medium, High
      business = true,       // 10x more powerful engine
      detector = 'gptzero',  // gptzero, turnitin
    } = options;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': this.apiKey,
      },
      body: JSON.stringify({
        prompt: text,
        tone,
        mode,
        business,
        rephrase: true,
        detector,
      }),
    });

    if (!response.ok) {
      throw new Error(`StealthGPT Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || data.output || text;
  }

  async humanizeLongContent(content, options = {}) {
    // Split content into 150-200 word chunks at heading boundaries
    const chunks = this.splitContentIntoChunks(content, 175);
    const humanizedChunks = [];

    for (const chunk of chunks) {
      const humanized = await this.humanize(chunk, options);
      humanizedChunks.push(humanized);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return humanizedChunks.join('\n\n');
  }

  splitContentIntoChunks(content, targetWordCount) {
    // Split on H2/H3 headings first
    const sections = content.split(/(?=<h[23])/gi);
    const chunks = [];
    let currentChunk = '';

    for (const section of sections) {
      const wordCount = section.split(/\s+/).length;

      if (wordCount > targetWordCount * 2) {
        // Section too long, split by paragraphs
        if (currentChunk) chunks.push(currentChunk);
        const paragraphs = section.split(/(?=<p>)/gi);
        for (const p of paragraphs) {
          chunks.push(p);
        }
        currentChunk = '';
      } else if ((currentChunk + section).split(/\s+/).length > targetWordCount) {
        chunks.push(currentChunk);
        currentChunk = section;
      } else {
        currentChunk += section;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }
}
```

### 6.4 Claude Client Implementation

```javascript
// src/services/ai/claudeClient.js

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  constructor(apiKey) {
    this.client = new Anthropic({
      apiKey: apiKey || import.meta.env.VITE_CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true, // DEV ONLY - Move to Edge Functions
    });
    this.model = 'claude-sonnet-4-20250514';
  }

  async humanize(content, options = {}) {
    const {
      contributorProfile = '',
      targetPerplexity = 'high',
      targetBurstiness = 'high',
    } = options;

    const systemPrompt = `You are a master editor specializing in making AI-generated text
indistinguishable from human writing. Focus on increasing perplexity (varied vocabulary)
and burstiness (varied sentence lengths).`;

    const prompt = `Rewrite this article to make it undetectable as AI-generated:

${content}

AUTHOR STYLE: ${contributorProfile}

REQUIREMENTS:
1. PERPLEXITY: Replace 20-30% of word choices with unexpected alternatives
2. BURSTINESS: Create extreme sentence length variation (3-50 words)
3. REMOVE AI TELLS: Eliminate "Furthermore", "Moreover", "Indeed", etc.
4. ADD HUMANITY: Contractions, opinions, em-dashes, ellipses
5. MAINTAIN: All facts, HTML structure, professional quality

Return ONLY the rewritten HTML.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      temperature: 0.9,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text
      .replace(/^```html\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();
  }

  async autoFixQualityIssues(content, issues, siteArticles = []) {
    const issuesList = issues.map(i =>
      `- ${i.type}: ${i.description} (severity: ${i.severity})`
    ).join('\n');

    const prompt = `Fix these quality issues in the article:

ISSUES:
${issuesList}

CONTENT:
${content}

AVAILABLE ARTICLES FOR INTERNAL LINKING:
${siteArticles.slice(0, 20).map(a => `- "${a.title}" (${a.url})`).join('\n')}

REQUIREMENTS:
- Add content naturally to meet word count
- Insert 3-5 relevant internal links
- Add 2-4 external citations (.gov, BLS)
- Add FAQs if needed (min 3)
- Maintain voice and structure

Return ONLY the improved HTML content.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 12000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text
      .replace(/^```html\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();
  }

  async reviseWithFeedback(content, feedback, options = {}) {
    const feedbackText = feedback.map((item, i) =>
      `${i + 1}. [${item.category}] "${item.selected_text}": ${item.comment}`
    ).join('\n\n');

    const prompt = `Revise this article based on editorial feedback:

CONTENT:
${content}

FEEDBACK:
${feedbackText}

Address all feedback items and return the revised HTML content.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 10000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text
      .replace(/^```html\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();
  }
}
```

### 6.5 Generation Service (Orchestrator)

```javascript
// src/services/generationService.js

export class GenerationService {
  constructor() {
    this.grokClient = new GrokClient();
    this.stealthGptClient = new StealthGptClient();
    this.claudeClient = new ClaudeClient();
    this.humanizationProvider = 'stealthgpt'; // or 'claude'
  }

  async generateArticleComplete(idea, options = {}, onProgress = () => {}) {
    const {
      autoAssignContributor = true,
      addInternalLinks = true,
      addMonetization = true,
      maxQualityAttempts = 3,
    } = options;

    let contributor = options.contributor;
    let articleData = {};

    try {
      // STAGE 0: Preparation
      onProgress({ stage: 'preparation', message: 'Loading context data...' });
      const costData = await this.getCostDataContext(idea);
      const siteArticles = await this.getRelevantSiteArticles(idea.title, 50);

      // STAGE 1: Contributor Assignment
      if (autoAssignContributor && !contributor) {
        onProgress({ stage: 'contributor', message: 'Assigning contributor...' });
        contributor = await this.assignContributor(idea, idea.content_type);
      }

      // STAGE 2: Draft Generation
      onProgress({ stage: 'drafting', message: 'Generating draft with Grok...' });
      const draft = await this.grokClient.generateDraft(idea, {
        contributor,
        siteArticles,
        costData,
        contentType: idea.content_type,
      });

      // STAGE 3: Draft Validation
      onProgress({ stage: 'validation', message: 'Validating draft...' });
      const validation = await this.validateDraft(draft);
      if (!validation.isValid) {
        // Retry logic here
        throw new Error(`Draft validation failed: ${validation.issues.join(', ')}`);
      }

      articleData = { ...draft };

      // STAGE 4: Humanization
      onProgress({ stage: 'humanization', message: 'Humanizing content...' });
      if (this.humanizationProvider === 'stealthgpt') {
        articleData.content = await this.stealthGptClient.humanizeLongContent(
          draft.content,
          { tone: 'College', mode: 'High', business: true }
        );
      } else {
        articleData.content = await this.claudeClient.humanize(
          draft.content,
          { contributorProfile: contributor?.writing_style_profile }
        );
      }

      // STAGE 5: Internal Linking
      if (addInternalLinks) {
        onProgress({ stage: 'linking', message: 'Adding internal links...' });
        articleData.content = await this.addInternalLinksToContent(
          articleData.content,
          siteArticles
        );
      }

      // STAGE 6: Monetization
      if (addMonetization) {
        onProgress({ stage: 'monetization', message: 'Adding monetization...' });
        articleData.content = await this.addMonetizationShortcodes(
          articleData.content,
          idea,
          idea.content_type
        );
      }

      // STAGE 7: Quality Assurance Loop
      onProgress({ stage: 'quality', message: 'Running quality checks...' });
      const qaResult = await this.runQualityLoop(
        articleData,
        siteArticles,
        maxQualityAttempts
      );
      articleData = qaResult.article;
      articleData.quality_score = qaResult.score;
      articleData.risk_flags = qaResult.issues;

      // STAGE 8: Finalize
      articleData.contributor_id = contributor?.id;
      articleData.contributor_name = contributor?.name;
      articleData.status = articleData.quality_score >= 85 ? 'ready_to_publish' : 'qa_review';

      onProgress({ stage: 'complete', message: 'Generation complete!' });
      return articleData;

    } catch (error) {
      onProgress({ stage: 'error', message: error.message });
      throw error;
    }
  }

  async assignContributor(idea, contentType) {
    const { data: contributors } = await supabase
      .from('article_contributors')
      .select('*')
      .eq('is_active', true);

    // Score each contributor
    const scored = contributors.map(contributor => {
      let score = 0;

      // Expertise match (50 points)
      const ideaTopics = [
        ...(idea.suggested_keywords || []),
        idea.title.toLowerCase(),
      ];
      contributor.expertise_areas?.forEach(expertise => {
        if (ideaTopics.some(t => t.toLowerCase().includes(expertise.toLowerCase()))) {
          score += 50;
        }
      });

      // Content type match (30 points)
      if (contributor.content_types?.includes(contentType)) {
        score += 30;
      }

      // Title keyword match (20 points)
      const titleWords = idea.title.toLowerCase().split(/\s+/);
      contributor.specialties?.forEach(spec => {
        if (titleWords.some(w => spec.toLowerCase().includes(w))) {
          score += 20;
        }
      });

      return { contributor, score };
    });

    // Return highest scoring
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.contributor || contributors[0];
  }

  calculateQualityMetrics(content) {
    const text = content.replace(/<[^>]*>/g, ' ');
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const internalLinks = (content.match(/href="[^"]*geteducated\.com[^"]*"/gi) || []).length;
    const externalLinks = (content.match(/href="https?:\/\/(?!.*geteducated)[^"]*"/gi) || []).length;
    const faqs = (content.match(/<[^>]*class="[^"]*faq[^"]*"[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2/gi) || []).length;

    // Readability (average sentence length)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;

    // Calculate score
    let score = 100;
    const issues = [];

    if (wordCount < 1500) {
      score -= 15;
      issues.push({ type: 'word_count', description: `Only ${wordCount} words (need 1500+)`, severity: 'major' });
    } else if (wordCount > 2500) {
      score -= 5;
      issues.push({ type: 'word_count', description: `${wordCount} words (over 2500)`, severity: 'minor' });
    }

    if (internalLinks < 3) {
      score -= 15;
      issues.push({ type: 'internal_links', description: `Only ${internalLinks} internal links (need 3+)`, severity: 'major' });
    }

    if (externalLinks < 2) {
      score -= 10;
      issues.push({ type: 'external_links', description: `Only ${externalLinks} external citations (need 2+)`, severity: 'minor' });
    }

    if (faqs < 3) {
      score -= 10;
      issues.push({ type: 'faqs', description: `Only ${faqs} FAQs (need 3+)`, severity: 'minor' });
    }

    if (h2Count < 3) {
      score -= 10;
      issues.push({ type: 'headings', description: `Only ${h2Count} H2 headings (need 3+)`, severity: 'minor' });
    }

    if (avgSentenceLength > 25) {
      score -= 10;
      issues.push({ type: 'readability', description: `Avg sentence ${avgSentenceLength.toFixed(1)} words (target <25)`, severity: 'minor' });
    }

    return {
      score: Math.max(0, score),
      metrics: { wordCount, internalLinks, externalLinks, faqs, h2Count, avgSentenceLength },
      issues,
    };
  }

  async runQualityLoop(article, siteArticles, maxAttempts) {
    let currentArticle = { ...article };
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      const { score, issues } = this.calculateQualityMetrics(currentArticle.content);

      if (issues.length === 0 || score >= 85) {
        return { article: currentArticle, score, issues: [] };
      }

      if (attempt === maxAttempts) {
        return { article: currentArticle, score, issues };
      }

      // Auto-fix with Claude
      currentArticle.content = await this.claudeClient.autoFixQualityIssues(
        currentArticle.content,
        issues,
        siteArticles
      );
    }

    return { article: currentArticle, score: 0, issues: [] };
  }

  async saveArticle(articleData, ideaId, userId) {
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        ...articleData,
        idea_id: ideaId,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update idea status
    await supabase
      .from('content_ideas')
      .update({ status: 'completed', article_id: article.id })
      .eq('id', ideaId);

    return article;
  }
}
```

---

## 7. Pages & Routes

### 7.1 Page Inventory (20 Pages)

| Route | Page Component | Purpose |
|-------|----------------|---------|
| `/login` | Login.jsx | Authentication (public) |
| `/` | Dashboard.jsx | Main dashboard with Kanban board |
| `/editor/:articleId?` | ArticleEditor.jsx | Article editor with sidebar tools |
| `/library` | ContentLibrary.jsx | Browse all articles |
| `/ideas` | ContentIdeas.jsx | Manage content ideas |
| `/review` | ReviewQueue.jsx | Review queue list |
| `/review/:articleId` | ArticleReview.jsx | Individual article review |
| `/catalog` | SiteCatalog.jsx | GetEducated article catalog |
| `/catalog/:articleId` | CatalogArticleDetail.jsx | Catalog article detail |
| `/keywords` | Keywords.jsx | Keyword research (DataForSEO) |
| `/keywords-clusters` | KeywordsAndClusters.jsx | Keyword/cluster management |
| `/automation` | Automation.jsx | Automation engine config |
| `/batch-progress` | BatchProgress.jsx | Batch generation progress |
| `/integrations` | Integrations.jsx | External service connections |
| `/contributors` | Contributors.jsx | Contributor list |
| `/contributors/:id` | ContributorDetail.jsx | Contributor profile |
| `/ai-training` | AITraining.jsx | AI training data management |
| `/analytics` | Analytics.jsx | Performance analytics |
| `/settings` | Settings.jsx | System configuration |
| `/secret/josh` | SecretJosh.jsx | Hidden admin/debug page |

### 7.2 Dashboard Page (Main Interface)

**Features:**
- Kanban board with 5 columns (Ideas → Drafting → Refinement → QA Review → Ready to Publish)
- Drag-and-drop article management with dnd-kit
- GetEducated metrics panel:
  - Published this week
  - Average quality score
  - Urgent reviews (within 48h)
  - Auto-publish ready count
  - Average review time
  - Risk distribution chart
- Automation mode toggle (Manual/Semi-Auto/Full Auto)
- Find New Ideas button (triggers idea discovery)
- Generate All button (batch generation)

### 7.3 Article Editor Page

**Features:**
- TipTap rich text editor with extensions:
  - StarterKit (basic formatting)
  - Link, Image, Underline
  - TextAlign, Placeholder
- Sidebar with tabbed panels:
  1. **Quality Checklist** - Live quality metrics
  2. **Schema Generator** - JSON-LD generation
  3. **Link Compliance Checker** - Validate links
  4. **BLS Citation Helper** - Add BLS citations
  5. **Article Navigation Generator** - TOC generation
  6. **Content Type Selector** - Select article type
  7. **Contributor Assignment** - Assign/change author
  8. **Internal Link Suggester** - Relevant link suggestions
  9. **Shortcode Inspector** - View/edit shortcodes
  10. **Monetization Preview** - Preview offers
  11. **CommentableArticle** - Editorial feedback
  12. **AI Training Panel** - Extract training patterns
- GetEducated preview mode
- Status workflow transitions
- Save/Publish controls
- AI revision history

### 7.4 Settings Page (Multi-Tab Configuration)

**Tabs:**

1. **GetEducated Tab:**
   - Approved authors only (toggle)
   - Block .edu links (toggle)
   - Block competitor links (toggle)
   - Require ranking cost data (toggle)
   - Auto-publish settings
   - High-risk publish blocking

2. **Automation Tab:**
   - Automation level (Manual/Semi-Auto/Full-Auto)
   - Auto-post enabled (toggle)
   - Auto-post delay (days input)
   - Posting time blocks
   - Auto-generate ideas (toggle)
   - Idea queue minimum
   - Max concurrent generation

3. **Workflow Tab:**
   - Require human review (toggle)
   - Auto-publish days (number)
   - Daily/weekly limits

4. **AI Settings Tab:**
   - Default AI model
   - Temperature slider
   - Max tokens

5. **Humanization Tab:**
   - Provider (StealthGPT/Claude)
   - StealthGPT settings:
     - Tone (College/High School/PhD)
     - Mode (Low/Medium/High)
     - Detector (GPTZero/Turnitin)
     - Business mode (toggle)
     - Double-pass (toggle)

6. **Quality Settings Tab:**
   - Min/max word counts
   - Internal/external link requirements
   - Citation requirements
   - FAQ schema requirement
   - Shortcode enforcement
   - Readability targets

---

## 8. Components Architecture

### 8.1 Article Components (15 Files)

| Component | Purpose |
|-----------|---------|
| QualityChecklist.jsx | Display quality metrics and issues |
| SchemaGenerator.jsx | Generate JSON-LD schema (FAQ, Article) |
| LinkComplianceChecker.jsx | Validate all links against rules |
| BLSCitationHelper.jsx | Search and insert BLS citations |
| ArticleNavigationGenerator.jsx | Auto-generate table of contents |
| ContentTypeSelector.jsx | Select article content type |
| ContributorAssignment.jsx | Auto/manual contributor selection |
| InternalLinkSuggester.jsx | Suggest relevant internal links |
| ShortcodeInspector.jsx | Display and validate shortcodes |
| MonetizationPreview.jsx | Preview monetization blocks |
| CommentableArticle.jsx | TipTap-based feedback interface |
| GetEducatedPreview.jsx | GetEducated-specific preview |
| RiskLevelDisplay.jsx | Risk assessment badge |
| PublishButton.jsx | Pre-publish validation and publish |
| AITrainingPanel.jsx | Extract learning patterns |

### 8.2 UI Components (30+ Files)

| Component | Purpose |
|-----------|---------|
| alert.jsx | Alert message box |
| alert-dialog.jsx | Confirmation dialog |
| animations.jsx | Reusable animations |
| avatar.jsx | User avatar |
| badge.jsx | Status badges |
| button.jsx | Primary button |
| card.jsx | Card container |
| checkbox.jsx | Checkbox input |
| collapsible.jsx | Expandable section |
| dialog.jsx | Modal dialog |
| dropdown-menu.jsx | Dropdown menu |
| empty-state.jsx | Empty state placeholder |
| FloatingProgressWindow.jsx | Floating progress tracker |
| input.jsx | Text input |
| label.jsx | Form label |
| loading.jsx | Loading spinner |
| popover.jsx | Popover tooltip |
| progress.jsx | Progress bar |
| progress-modal.jsx | Progress modal |
| rich-text-editor.jsx | TipTap editor wrapper |
| scroll-area.jsx | Scrollable container |
| select.jsx | Dropdown select |
| separator.jsx | Divider |
| skeleton.jsx | Loading skeleton |
| slider.jsx | Slider input |
| switch.jsx | Toggle switch |
| table.jsx | Data table |
| tabs.jsx | Tab navigation |
| textarea.jsx | Multiline input |
| toast.jsx | Toast notifications |
| tooltip.jsx | Tooltip |

### 8.3 Layout Components

| Component | Purpose |
|-----------|---------|
| MainLayout.jsx | Root layout with navigation and Outlet |

### 8.4 Special Components

| Component | Purpose |
|-----------|---------|
| AutomationEngine.jsx | Manages automatic generation pipeline |
| SourceSelector.jsx | Idea discovery source selection modal |

---

## 9. Custom Hooks

### 9.1 Hook Inventory (23 Hooks)

| Hook | Purpose |
|------|---------|
| **useArticles.js** | Article CRUD operations |
| **useArticle.js** | Single article queries |
| **useArticleRevisions.js** | Version history |
| **useArticleComments.js** | Editorial comments |
| **useArticleValidation.js** | Pre-publish validation |
| **useContentIdeas.js** | Ideas CRUD operations |
| **useIdeas.js** | Alternative ideas interface |
| **useGeneration.js** | AI generation pipeline |
| **useAIRevisions.js** | AI revision tracking |
| **useKeywordResearch.js** | DataForSEO integration |
| **useKeywords.js** | Keyword management |
| **useClusters.js** | Cluster management |
| **useContributors.js** | Contributor management |
| **useTrainingData.js** | AI training samples |
| **useMonetization.js** | Monetization management |
| **useShortcodes.js** | Shortcode management |
| **usePublish.js** | WordPress publishing |
| **useAutoPublish.js** | Auto-publish logic |
| **usePrePublishValidation.js** | Validation checks |
| **useGetEducatedCatalog.js** | Site catalog queries |
| **useSiteArticles.js** | Site articles management |
| **useAutomation.js** | Queue management |
| **useSystemSettings.js** | System configuration |
| **useWordPress.js** | WordPress connections |

### 9.2 Query Pattern

```javascript
// Example: useArticles.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useArticles(filters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.contributor_id) query = query.eq('contributor_id', filters.contributor_id);
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, updates }) => {
      const { data, error } = await supabase
        .from('articles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', data.id] });
    },
  });
}
```

---

## 10. Services Layer

### 10.1 Service Inventory

| Service | Purpose |
|---------|---------|
| **AI Services** | |
| grokClient.js | Grok API for drafting |
| grokClient.edge.js | Edge Function version |
| claudeClient.js | Claude API for humanization/fixes |
| claudeClient.edge.js | Edge Function version |
| stealthGptClient.js | StealthGPT for humanization |
| dataForSEOClient.js | Keyword research |
| **Core Services** | |
| generationService.js | Pipeline orchestrator |
| supabaseClient.js | Database client |
| **Validation Services** | |
| linkValidator.js | Link compliance checking |
| riskAssessment.js | Risk level calculation |
| prePublishValidation.js | Pre-publish checks |
| contentValidator.js | Draft validation |
| **Publishing Services** | |
| publishService.js | WordPress publishing |
| autoPublishService.js | Auto-publish logic |
| articleRevisionService.js | Version tracking |
| **Data Services** | |
| monetizationEngine.js | Shortcode generation |
| shortcodeService.js | Shortcode management |
| costDataService.js | Ranking report data |
| ideaDiscoveryService.js | Multi-source ideas |

---

## 11. Content Rules & Validation

### 11.1 Link Validation Rules

```javascript
// src/services/validation/linkValidator.js

const BLOCKED_DOMAINS = [
  'onlineu.com',
  'usnews.com',
  'affordablecollegesonline.com',
  'toponlinecollegesusa.com',
  // ... other competitors
];

const ALLOWED_EXTERNAL_DOMAINS = [
  'bls.gov',
  'nces.ed.gov',
  'ed.gov',
  // ... government and nonprofit sites
];

export function validateLink(url) {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();

  // Block .edu links
  if (domain.endsWith('.edu')) {
    return {
      valid: false,
      reason: 'BLOCKED: .edu domains not allowed (use GetEducated school pages)',
      severity: 'critical',
    };
  }

  // Block competitor domains
  if (BLOCKED_DOMAINS.some(d => domain.includes(d))) {
    return {
      valid: false,
      reason: `BLOCKED: Competitor domain ${domain}`,
      severity: 'critical',
    };
  }

  // Allow GetEducated internal links
  if (domain.includes('geteducated.com')) {
    return { valid: true, type: 'internal' };
  }

  // Check external whitelist
  if (ALLOWED_EXTERNAL_DOMAINS.some(d => domain.includes(d))) {
    return { valid: true, type: 'external_approved' };
  }

  // Other external links - warning
  return {
    valid: true,
    type: 'external_unknown',
    warning: 'External link not on approved list',
  };
}

export function validateAllLinks(htmlContent) {
  const linkRegex = /href="([^"]+)"/gi;
  const results = [];
  let match;

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (url.startsWith('http')) {
      results.push({
        url,
        ...validateLink(url),
      });
    }
  }

  return {
    links: results,
    hasBlockedLinks: results.some(r => !r.valid),
    blockedCount: results.filter(r => !r.valid).length,
    internalCount: results.filter(r => r.type === 'internal').length,
    externalCount: results.filter(r => r.type?.startsWith('external')).length,
  };
}
```

### 11.2 Risk Assessment

```javascript
// src/services/validation/riskAssessment.js

export function assessRisk(article) {
  const factors = [];
  let riskLevel = 'LOW';

  // Check quality score
  if (article.quality_score < 60) {
    factors.push({ type: 'LOW_QUALITY', severity: 'high' });
    riskLevel = 'HIGH';
  } else if (article.quality_score < 75) {
    factors.push({ type: 'MODERATE_QUALITY', severity: 'medium' });
    riskLevel = Math.max(riskLevel, 'MEDIUM');
  }

  // Check for blocked links
  const linkValidation = validateAllLinks(article.content);
  if (linkValidation.hasBlockedLinks) {
    factors.push({
      type: 'BLOCKED_LINKS',
      count: linkValidation.blockedCount,
      severity: 'critical'
    });
    riskLevel = 'CRITICAL';
  }

  // Check word count
  if (article.word_count < 1000) {
    factors.push({ type: 'THIN_CONTENT', severity: 'high' });
    riskLevel = Math.max(riskLevel, 'HIGH');
  }

  // Check for missing elements
  if (!article.contributor_id) {
    factors.push({ type: 'NO_AUTHOR', severity: 'medium' });
    riskLevel = Math.max(riskLevel, 'MEDIUM');
  }

  // Check for fabricated content markers
  const fabricationCheck = checkForFabrication(article.content);
  if (fabricationCheck.hasFabrication) {
    factors.push({ type: 'POTENTIAL_FABRICATION', severity: 'critical' });
    riskLevel = 'CRITICAL';
  }

  return {
    level: riskLevel,
    factors,
    canAutoPublish: riskLevel === 'LOW' || riskLevel === 'MEDIUM',
    requiresReview: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
  };
}

function checkForFabrication(content) {
  const fabricationPatterns = [
    /\[School Name\]/gi,
    /\[Date\]/gi,
    /\[Source\]/gi,
    /\[Citation Needed\]/gi,
    /according to a recent study/gi, // Vague unsourced claim
    /studies show that/gi, // Generic unsourced claim
  ];

  const matches = fabricationPatterns.filter(p => p.test(content));
  return {
    hasFabrication: matches.length > 0,
    patterns: matches,
  };
}
```

### 11.3 Pre-Publish Validation

```javascript
// src/services/validation/prePublishValidation.js

export async function validateBeforePublish(article) {
  const errors = [];
  const warnings = [];

  // 1. Author Check
  const APPROVED_AUTHORS = ['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity'];
  const BLOCKED_BYLINES = ['Julia Tell', 'Kif Richmann', 'Alicia Carrasco', 'Daniel Catena', 'Admin'];

  if (!article.contributor_id || !article.contributor_name) {
    errors.push({
      type: 'NO_AUTHOR',
      message: 'Article must have an assigned author',
      blocking: true,
    });
  } else if (BLOCKED_BYLINES.includes(article.contributor_name)) {
    errors.push({
      type: 'BLOCKED_AUTHOR',
      message: `"${article.contributor_name}" is not an approved byline`,
      blocking: true,
    });
  } else if (!APPROVED_AUTHORS.includes(article.contributor_name)) {
    warnings.push({
      type: 'UNKNOWN_AUTHOR',
      message: `"${article.contributor_name}" is not in the approved author list`,
    });
  }

  // 2. Risk Level Check
  const risk = assessRisk(article);
  if (risk.level === 'CRITICAL') {
    errors.push({
      type: 'CRITICAL_RISK',
      message: 'Article has critical risk factors that must be resolved',
      factors: risk.factors,
      blocking: true,
    });
  } else if (risk.level === 'HIGH') {
    warnings.push({
      type: 'HIGH_RISK',
      message: 'Article has high risk factors - review recommended',
      factors: risk.factors,
    });
  }

  // 3. Link Compliance
  const linkCheck = validateAllLinks(article.content);
  if (linkCheck.hasBlockedLinks) {
    errors.push({
      type: 'BLOCKED_LINKS',
      message: `${linkCheck.blockedCount} blocked links found`,
      links: linkCheck.links.filter(l => !l.valid),
      blocking: true,
    });
  }

  // 4. Quality Score
  if (article.quality_score < 60) {
    errors.push({
      type: 'LOW_QUALITY',
      message: `Quality score ${article.quality_score} is below minimum (60)`,
      blocking: true,
    });
  } else if (article.quality_score < 75) {
    warnings.push({
      type: 'MODERATE_QUALITY',
      message: `Quality score ${article.quality_score} is below recommended (75)`,
    });
  }

  // 5. Monetization Check
  if (!/\[ge_monetization/.test(article.content)) {
    warnings.push({
      type: 'NO_MONETIZATION',
      message: 'No monetization shortcodes found',
    });
  }

  return {
    valid: errors.filter(e => e.blocking).length === 0,
    errors,
    warnings,
    canPublish: errors.filter(e => e.blocking).length === 0,
    requiresOverride: errors.length > 0 && errors.every(e => !e.blocking),
  };
}
```

---

## 12. Monetization System

### 12.1 Shortcode Format

```
[ge_monetization category="CATEGORY_CODE" concentration="CONCENTRATION" level="DEGREE_LEVEL"]
```

### 12.2 Monetization Engine

```javascript
// src/services/monetizationEngine.js

const SLOT_CONFIGS = {
  ranking: {
    after_intro: 5,
    mid_article: 3,
    near_conclusion: 1,
  },
  guide: {
    after_intro: 3,
    near_conclusion: 1,
  },
  listicle: {
    after_intro: 5,
    mid_article: 3,
  },
  explainer: {
    after_intro: 3,
  },
  review: {
    after_intro: 1,
    near_conclusion: 3,
  },
};

export async function matchTopicToCategory(title, degreeLevel) {
  const { data: categories } = await supabase
    .from('monetization_categories')
    .select('*')
    .eq('is_active', true);

  // Simple keyword matching
  const titleLower = title.toLowerCase();

  for (const cat of categories) {
    const categoryWords = cat.category.toLowerCase().split(/\s+/);
    const concentrationWords = (cat.concentration || '').toLowerCase().split(/\s+/);

    const categoryMatch = categoryWords.some(w => titleLower.includes(w));
    const concentrationMatch = concentrationWords.some(w => titleLower.includes(w));

    if (categoryMatch || concentrationMatch) {
      return {
        category: cat.category_code || cat.category,
        concentration: cat.concentration,
        level: degreeLevel || 'masters',
      };
    }
  }

  return null;
}

export function generateShortcode(category, concentration, level) {
  return `[ge_monetization category="${category}" concentration="${concentration || ''}" level="${level}"]`;
}

export async function insertShortcodesIntoContent(content, idea, contentType) {
  const monetization = await matchTopicToCategory(idea.title, idea.degree_level);

  if (!monetization) {
    return content; // No matching monetization
  }

  const slots = SLOT_CONFIGS[contentType] || SLOT_CONFIGS.guide;
  const shortcode = generateShortcode(
    monetization.category,
    monetization.concentration,
    monetization.level
  );

  let result = content;

  // Insert after intro (after first </p>)
  if (slots.after_intro) {
    const firstParagraphEnd = result.indexOf('</p>') + 4;
    if (firstParagraphEnd > 3) {
      result = result.slice(0, firstParagraphEnd) +
               `\n${shortcode}\n` +
               result.slice(firstParagraphEnd);
    }
  }

  // Insert mid-article (after 3rd H2)
  if (slots.mid_article) {
    const h2Matches = [...result.matchAll(/<\/h2>/gi)];
    if (h2Matches.length >= 3) {
      const insertPoint = h2Matches[2].index + 5;
      result = result.slice(0, insertPoint) +
               `\n${shortcode}\n` +
               result.slice(insertPoint);
    }
  }

  // Insert near conclusion (before last H2 or FAQ section)
  if (slots.near_conclusion) {
    const faqIndex = result.toLowerCase().indexOf('faq');
    if (faqIndex > -1) {
      result = result.slice(0, faqIndex) +
               `${shortcode}\n\n` +
               result.slice(faqIndex);
    }
  }

  return result;
}
```

---

## 13. Author Management

### 13.1 Approved Authors (MANDATORY)

| Real Name (Public Byline) | Style Proxy (Internal) | Specialty |
|---------------------------|------------------------|-----------|
| **Tony Huffman** | Kif | Rankings, data analysis, affordability, Best Buy lists |
| **Kayleigh Gilbert** | Alicia | Professional programs, healthcare/social work, best-of guides |
| **Sara** | Danny | Technical education, degree overviews, career pathways |
| **Charity** | Julia | Teaching degrees, education careers, comparisons |

### 13.2 Blocked Bylines (NEVER PUBLISH)

- Julia Tell
- Kif Richmann
- Alicia Carrasco
- Daniel Catena
- Admin
- GetEducated
- Editorial Team
- Any legacy contributors

### 13.3 Writing Style Profiles

```javascript
// Tony Huffman (Kif Style)
const tonyProfile = {
  name: 'Tony Huffman',
  style_proxy: 'Kif',
  writing_style_profile: `
    Authoritative and data-driven. Uses precise quantitative language,
    methodology explanations, consumer-advocacy tone. Focuses on cost
    transparency and scientific rankings.

    Common phrases: "our database", "we calculate", "meticulous research",
    "total cost", "scientific, data-driven", "reliable system of rankings"

    Opening style: Problem statement about cost or difficulty finding information

    Best for: Ranking reports, affordability analysis, methodology pages
  `,
  expertise_areas: ['rankings', 'affordability', 'data-analysis', 'landing-pages'],
  content_types: ['ranking', 'data-analysis', 'landing-page'],
};

// Kayleigh Gilbert (Alicia Style)
const kayleighProfile = {
  name: 'Kayleigh Gilbert',
  style_proxy: 'Alicia',
  writing_style_profile: `
    Warm but professional, empowering. Numbered school/program lists with
    detailed comparisons. Clear section organization. Emphasizes flexibility
    and career advancement. Service-oriented language.

    Common phrases: "make a difference", "rewarding career", "equip you with",
    "pursue your passion", "opens doors to"

    Opening style: Vision/aspiration statement about career impact

    Best for: Professional program guides, "best of" lists, program comparisons
  `,
  expertise_areas: ['professional-programs', 'healthcare', 'social-work'],
  content_types: ['guide', 'listicle', 'program-comparison'],
};

// Sara (Danny Style)
const saraProfile = {
  name: 'Sara',
  style_proxy: 'Danny',
  writing_style_profile: `
    Direct, practical, accessible. Addresses reader pain points (time, money,
    career change). Numbered lists and comparison tables. Clear actionable
    next steps. Simple, conversational language.

    Common phrases: "you can", "this is your", "keep reading",
    "what are you waiting for?", "start today", "your gateway to"

    Opening style: Reader pain point about career/education barriers

    Best for: Technical education, general degree overviews, career pathway guides
  `,
  expertise_areas: ['technical-education', 'degree-overviews', 'career-pathways'],
  content_types: ['guide', 'overview', 'career-guide'],
};

// Charity (Julia Style)
const charityProfile = {
  name: 'Charity',
  style_proxy: 'Julia',
  writing_style_profile: `
    Encouraging, supportive, practical. Question-based headings. Program
    spotlights with detailed cost breakdowns. Explains technical education
    terms clearly. Comparison-focused. Accessible language, avoids jargon.

    Common phrases: "a great way to", "you can", "consider", "if you want to",
    "whether you are", "depending on your goals"

    Opening style: Starts with reader's goal or motivation

    Best for: Teaching/education degrees, degree comparison articles
  `,
  expertise_areas: ['teaching-degrees', 'education-careers', 'degree-comparisons'],
  content_types: ['comparison', 'guide', 'teaching-program'],
};
```

---

## 14. Automation Engine

### 14.1 Automation Modes

| Mode | Idea Generation | Idea Approval | Article Generation | Quality Checks | Publishing |
|------|-----------------|---------------|-------------------|----------------|------------|
| **Manual** | User triggers | User reviews | User triggers | User runs | User triggers |
| **Semi-Auto** | Auto when queue < 5 | User reviews | Auto when approved | Automatic | User triggers |
| **Full Auto** | Fully automatic | Auto-approve top 5 | Fully automatic | Auto + auto-fix | Auto if quality ≥ 85 |

### 14.2 Automatic Mode Engine

```javascript
// src/services/automation/automaticModeEngine.js

export class AutomaticModeEngine {
  constructor() {
    this.isRunning = false;
    this.settings = {
      min_idea_queue_size: 5,
      max_generation_parallel: 1,
      quality_threshold_publish: 85,
      quality_threshold_review: 75,
      max_auto_fix_attempts: 3,
      cycle_interval_seconds: 300,
      enable_auto_publish: true,
    };
    this.stats = {
      cycles: 0,
      articlesGenerated: 0,
      articlesPublished: 0,
      failures: 0,
    };
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.loadSettings();

    while (this.isRunning) {
      try {
        await this.runCycle();
        this.stats.cycles++;
        await this.sleep(this.settings.cycle_interval_seconds * 1000);
      } catch (error) {
        console.error('Cycle error:', error);
        await this.sleep(60000); // 1 minute on error
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  async runCycle() {
    // Stage 1: Ensure idea queue has ideas
    await this.ensureIdeaQueue();

    // Stage 2: Get next approved idea
    const idea = await this.getNextIdea();
    if (!idea) return;

    // Stage 3: Generate article
    const article = await this.generateArticle(idea);
    if (!article) {
      this.stats.failures++;
      return;
    }

    // Stage 4: Quality assurance loop
    const qaResult = await this.qualityAssuranceLoop(article);

    // Stage 5: Save article
    const savedArticle = await this.saveArticle(qaResult.article, idea);
    this.stats.articlesGenerated++;

    // Stage 6: Auto-publish if quality threshold met
    if (
      this.settings.enable_auto_publish &&
      savedArticle.quality_score >= this.settings.quality_threshold_publish
    ) {
      await this.autoPublish(savedArticle);
      this.stats.articlesPublished++;
    }

    // Stage 7: Update learning
    await this.updateLearning(savedArticle, qaResult);
  }

  // ... implementation details
}
```

### 14.3 Decision Trees

```
PUBLISH OR REVIEW DECISION:

Quality Score ≥ 85 ────► Auto-Publish ✅
         │
Quality Score 75-84 ──► Manual Review Queue 👤
         │
Quality Score < 75 ───► Reject ❌ (analyze failure)


AUTO-FIX LOOP:

Quality Issues Found?
    │
    ├── NO ──► Pass QA → Save Article
    │
    └── YES ─► Attempt < 3?
                  │
                  ├── YES ─► Auto-Fix with Claude → Re-validate → Loop
                  │
                  └── NO ──► Set Risk Flags → Save with warnings
```

---

## 15. Quality Assurance System

### 15.1 Quality Metrics

| Metric | Target | Deduction |
|--------|--------|-----------|
| Word Count | 1500-2500 | -15 if <1500, -5 if >2500 |
| Internal Links | 3-5 | -15 if <3 |
| External Citations | 2-4 | -10 if <2 |
| FAQs | 3+ | -10 if <3 |
| H2 Headings | 3+ | -10 if <3 |
| Readability | <25 words/sentence | -10 if >25 |

### 15.2 Quality Score Calculation

```javascript
function calculateQualityScore(metrics) {
  let score = 100;

  // Word count
  if (metrics.wordCount < 1500) score -= 15;
  else if (metrics.wordCount > 2500) score -= 5;

  // Links
  if (metrics.internalLinks < 3) score -= 15;
  if (metrics.externalLinks < 2) score -= 10;

  // Structure
  if (metrics.faqCount < 3) score -= 10;
  if (metrics.h2Count < 3) score -= 10;

  // Readability
  if (metrics.avgSentenceLength > 25) score -= 10;

  return Math.max(0, score);
}
```

### 15.3 Risk Levels

| Level | Criteria | Action |
|-------|----------|--------|
| **LOW** | Score ≥ 85, no issues | Auto-publish eligible |
| **MEDIUM** | Score 75-84 or minor issues | Review recommended |
| **HIGH** | Score 60-74 or significant issues | Review required |
| **CRITICAL** | Score <60 or blocked links/fabrication | Blocks publish |

---

## 16. Publishing Workflow

### 16.1 Article Status Workflow

```
idea → drafting → refinement → qa_review → ready_to_publish → published
```

### 16.2 Auto-Publish Logic

```javascript
// src/services/autoPublishService.js

export async function checkAndAutoPublish() {
  // Find articles ready for auto-publish
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'ready_to_publish')
    .eq('human_reviewed', false)
    .lte('autopublish_deadline', new Date().toISOString());

  for (const article of articles) {
    // Validate before publish
    const validation = await validateBeforePublish(article);

    if (validation.canPublish) {
      await publishToWordPress(article);

      await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', article.id);
    }
  }
}
```

### 16.3 WordPress Publishing

```javascript
// src/services/publishService.js

export async function publishToWordPress(article) {
  const { data: connection } = await supabase
    .from('wordpress_connections')
    .select('*')
    .eq('is_default', true)
    .single();

  if (!connection) {
    throw new Error('No WordPress connection configured');
  }

  // Currently uses webhook to n8n
  // TODO: Direct WordPress REST API integration
  const response = await fetch(connection.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      author: article.contributor_name,
      status: 'publish',
      meta: {
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        faqs: article.faqs,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress publish failed: ${response.statusText}`);
  }

  return await response.json();
}
```

---

## 17. Configuration & Settings

### 17.1 System Settings

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| automation_level | string | 'manual' | manual/semi_auto/full_auto |
| min_idea_queue_size | number | 5 | Minimum ideas before auto-generate |
| max_generation_parallel | number | 1 | Concurrent generations |
| quality_threshold_publish | number | 85 | Auto-publish threshold |
| quality_threshold_review | number | 75 | Manual review threshold |
| max_auto_fix_attempts | number | 3 | Auto-fix retry limit |
| cycle_interval_seconds | number | 300 | Automation cycle interval |
| enable_auto_publish | boolean | true | Enable auto-publishing |
| humanization_provider | string | 'stealthgpt' | stealthgpt/claude |
| stealthgpt_tone | string | 'College' | Standard/HighSchool/College/PhD |
| stealthgpt_mode | string | 'High' | Low/Medium/High |
| stealthgpt_detector | string | 'gptzero' | gptzero/turnitin |
| stealthgpt_business | boolean | true | Use 10x engine |
| auto_publish_delay_days | number | 5 | Days before auto-publish |
| daily_article_limit | number | 10 | Max articles per day |
| weekly_article_limit | number | 50 | Max articles per week |

---

## 18. Environment Variables

### 18.1 Required Variables

```bash
# .env.local

# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI APIs (Required)
VITE_GROK_API_KEY=your-grok-api-key
VITE_CLAUDE_API_KEY=your-claude-api-key

# Humanization (Optional - falls back to Claude)
VITE_STEALTHGPT_API_KEY=your-stealthgpt-api-key

# Keyword Research (Optional)
VITE_DATAFORSEO_USERNAME=your-username
VITE_DATAFORSEO_PASSWORD=your-password
```

---

## 19. Deployment

### 19.1 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

### 19.2 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### 19.3 Netlify Configuration

```toml
# netlify.toml

[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 19.4 Supabase Auth Redirect

Configure auth redirect URLs in Supabase dashboard:
- Site URL: `https://perdiav5.netlify.app`
- Redirect URLs: `https://perdiav5.netlify.app/**`

---

## 20. API Integrations

### 20.1 Grok API (xAI)

```
Endpoint: https://api.x.ai/v1/chat/completions
Model: grok-3
Max Tokens: 12,000
Purpose: Article drafting, idea generation, SEO metadata
```

### 20.2 StealthGPT API

```
Endpoint: https://stealthgpt.ai/api/stealthify
Settings:
  - tone: College
  - mode: High
  - business: true
  - detector: gptzero
Purpose: Content humanization (AI detection bypass)
```

### 20.3 Claude API (Anthropic)

```
SDK: @anthropic-ai/sdk
Model: claude-sonnet-4-20250514
Purpose: Fallback humanization, auto-fix quality issues, revision with feedback
```

### 20.4 DataForSEO API (Optional)

```
Purpose: Keyword research and opportunity scoring
Auth: Username/password
Features:
  - Search volume
  - Keyword difficulty
  - Search intent
  - Clustering
```

### 20.5 Supabase

```
Services:
  - PostgreSQL database
  - Authentication (email/password)
  - Row-Level Security
  - Realtime subscriptions
  - Edge Functions (planned)
```

---

## 21. Implementation Status

### 21.1 Completed Features (~60%)

- [x] Authentication system (Supabase Auth)
- [x] Dashboard with Kanban board
- [x] Article editor with TipTap
- [x] Content library with filtering
- [x] Content ideas management
- [x] Two-pass AI generation (Grok + StealthGPT/Claude)
- [x] Quality metrics calculation
- [x] Auto-fix quality loop
- [x] Contributor assignment algorithm
- [x] Internal linking from catalog
- [x] Link validation (blocks .edu, competitors)
- [x] Risk assessment system
- [x] Pre-publish validation
- [x] GetEducated article catalog (1000+ articles)
- [x] Monetization categories/levels tables
- [x] Subject-CIP mapping
- [x] Article versioning
- [x] AI revision tracking
- [x] Article comments/feedback

### 21.2 Partially Implemented (~20%)

- [ ] Automation engine (structure exists, needs testing)
- [ ] Auto-publish scheduler (Edge Function exists, needs cron)
- [ ] Webhook publishing to n8n (service exists)
- [ ] Shortcode generation (database ready, UI partial)
- [ ] Keyword research integration (client exists)

### 21.3 Not Yet Implemented (~20%)

- [ ] Direct WordPress REST API publishing
- [ ] Supabase Edge Functions migration (security)
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Real-time collaboration
- [ ] Advanced analytics export
- [ ] Cost data RAG for AI prompts (partial)
- [ ] Ranking report crawler

### 21.4 Known Issues

1. **Security:** Client-side API keys exposed (development only)
2. **Mobile:** Desktop-first design, no mobile optimization
3. **Performance:** Large catalog queries may be slow

---

## Appendix A: Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint

# Fix ESLint errors
npm run lint -- --fix
```

## Appendix B: Key URLs

- **GetEducated Rankings:** https://www.geteducated.com/online-college-ratings-and-rankings/
- **Degree Database:** https://www.geteducated.com/online-degrees/
- **School Database:** https://www.geteducated.com/online-schools/
- **Monetization Sheet:** https://docs.google.com/spreadsheets/d/1s2A1Nt5OBkCeFG0vPswkh7q7Y1QDogoqlQPQPEAtRTw/

## Appendix C: Document References

- `docs/v5-updates/08-AUTHOR-STYLE-SPECIFICATION.md` - CANONICAL author spec
- `docs/v5-updates/02-CLIENT-CONTENT-RULES.md` - Content rules
- `docs/v5-updates/03-MONETIZATION-SPECIFICATION.md` - Monetization system
- `docs/specifications/04-AI-INTEGRATION-STRATEGY.md` - AI implementation
- `docs/specifications/09-AUTOMATIC-MODE-SPECIFICATION.md` - Automation spec

---

**Document Version:** 1.0.0
**Created:** December 8, 2025
**Author:** Generated by Claude Code
**Purpose:** Complete specification for rebuilding Perdia v5 from scratch
