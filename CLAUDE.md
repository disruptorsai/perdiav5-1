# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## BB1 Project Context

**Linked Project (Disruptors dev environment):** `C:\Users\Disruptors\Documents\Tech Integration Labs BB1\Projects\Perdiav5\`

This path contains project management context (requirements, decisions, meeting notes, timeline, budget) that may not be present in this repo. This is only relevant when working in the Disruptors development environment.

## Project Overview

Perdia v5 is an AI-powered content production system built with React 19, Vite, and Supabase. The application orchestrates a two-pass AI generation pipeline (Grok for drafting → StealthGPT for humanization) to produce SEO-optimized articles with automated quality assurance, contributor assignment, and WordPress publishing capabilities.

**Primary Client:** GetEducated.com
**Stakeholders:** Tony Huffman, Kayleigh Gilbert, Sara, Charity

## CRITICAL CLIENT REQUIREMENTS

**See `docs/v5-updates/` for detailed specifications.** Key rules:

### Approved Authors (MUST ENFORCE)

**CRITICAL:** Public bylines use REAL NAMES, not aliases. The style proxy names are for internal AI voice matching only.

| Real Name (PUBLIC BYLINE) | Style Proxy (INTERNAL ONLY) | Contributor Page |
|---------------------------|----------------------------|------------------|
| **Tony Huffman** | Kif | [Yes](https://www.geteducated.com/article-contributors/tony-huffman) |
| **Kayleigh Gilbert** | Alicia | Pending creation |
| **Sara** | Danny | Pending creation |
| **Charity** | Julia | Pending creation |

**NEVER publish these as bylines:**
- Julia Tell, Kif Richmann, Alicia Carrasco, Daniel Catena (these are style aliases)
- Admin, GetEducated, Editorial Team
- Any legacy contributors

**Author-to-Content Mapping:**
- **Tony Huffman** → Rankings, data analysis, affordability, Best Buy lists
- **Kayleigh Gilbert** → Professional programs, healthcare/social work, best-of guides
- **Sara** → Technical education, degree overviews, career pathways
- **Charity** → Teaching degrees, education careers, degree comparisons

See `docs/v5-updates/08-AUTHOR-STYLE-SPECIFICATION.md` for detailed style profiles.

### Content Rules
- Cost data MUST come from GetEducated ranking reports only
- Links to schools MUST use GetEducated school pages (never .edu)
- External links ONLY to BLS/government/nonprofit sites
- NEVER link to competitors (onlineu.com, usnews.com, etc.)
- All monetization MUST use shortcodes (no raw affiliate URLs)

### Workflow
- Human review required initially
- Auto-publish after 5 days if unreviewed (configurable)
- Start at ~3 articles/day, scale to ~100/week when stable

## Deployment & Infrastructure

| Service | ID | URL |
|---------|-----|-----|
| Netlify | e6c79ffe-d40e-4123-b404-ade94e4ec295 | https://perdiav5.netlify.app |
| Supabase | nvffvcjtrgxnunncdafz | db.nvffvcjtrgxnunncdafz.supabase.co |
| GitHub | TechIntegrationLabs/perdiav5 | - |

## Development Commands

```bash
npm install              # Install dependencies (uses --legacy-peer-deps via .npmrc)
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

Note: `npm run dev` and `npm run build` automatically run `generate-git-info` as a pre-hook.

### Troubleshooting

If you encounter "Module not found" errors after pulling:
```bash
rm -rf node_modules && npm install
```

Database RLS violations typically mean the user isn't authenticated or policies need updating in Supabase.

## Slash Commands

Project-specific commands for common tasks (run with `/command`):

| Command | Purpose |
|---------|---------|
| `/deploy-fix` | Fix Netlify deployment failures with closed-loop check/fix/push |
| `/deploy-test` | Deploy and run comprehensive tests on deployed site |
| `/quick-test` | Quick browser test - captures console errors without changes |
| `/debug-loop` | Automated debugging: navigate, capture errors, fix, redeploy |
| `/debug-pipeline` | Debug AI generation pipeline issues |
| `/test-ai-clients` | Test Grok and Claude API connections |
| `/generate-article` | Generate article using two-pass AI pipeline |
| `/check-quality` | Analyze article quality metrics |
| `/commit` | Commit and push all changes |
| `/db` | Database changes via MCP and subagent |
| `/setup-database` | Supabase database setup guide |
| `/add-feature` | Guide for adding features following conventions |
| `/review-architecture` | Review codebase architecture |
| `/optimize-prompts` | Optimize AI prompts for better output |
| `/migrate-to-edge-functions` | Guide for moving AI calls to Edge Functions |

## Environment Setup

The application requires environment variables in `.env.local`:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for database access
- `VITE_GROK_API_KEY` and `VITE_CLAUDE_API_KEY` for AI generation
- `VITE_STEALTHGPT_API_KEY` for content humanization (AI detection bypass)
- `VITE_DATAFORSEO_USERNAME` and `VITE_DATAFORSEO_PASSWORD` for keyword research (optional)

Copy `.env.example` to `.env.local` and fill in credentials before development.

## Architecture Overview

### Core Application Flow

1. **Authentication Layer** (`src/contexts/AuthContext.jsx`): Manages user authentication state using Supabase Auth with React Context. Provides `signIn`, `signUp`, `signOut` methods and tracks loading/user state.

2. **Routing Structure** (`src/App.jsx`): React Router 7 with protected routes. All app routes (`/`, `/editor/:articleId`, `/library`, `/analytics`, `/settings`) require authentication via `ProtectedRoute` wrapper. Uses nested routes with `MainLayout` as the parent route containing an `<Outlet />` for child page components.

3. **Layout System** (`src/components/layout/MainLayout.jsx`): Shared layout component with navigation that wraps all authenticated pages. Renders child routes via React Router's `<Outlet />` component.

### AI Generation Pipeline

The generation pipeline is the heart of the application, orchestrated by `src/services/generationService.js`:

**Two-Pass Generation Process:**

1. **Stage 1 - Draft (Grok)**: Initial article generation via `grokClient.js`
   - Generates structured content with headings
   - Creates FAQ sections
   - Produces SEO metadata (title, description, focus keyword)

2. **Stage 2 - Contributor Assignment**: Automatic matching algorithm
   - Scores contributors based on expertise areas, content types, and topic relevance
   - Uses semantic matching against contributor profiles stored in `article_contributors` table

3. **Stage 3 - Humanization (StealthGPT)**: Anti-AI-detection rewriting via `stealthGptClient.js`
   - Processes content through StealthGPT API to bypass AI detection tools
   - Configurable tone (Standard, HighSchool, College, PhD)
   - Configurable bypass mode (Low, Medium, High)
   - Optimized for specific detectors (GPTZero, Turnitin)
   - Falls back to Claude humanization if StealthGPT is unavailable

4. **Stage 4 - Internal Linking**: Intelligent link insertion
   - Fetches relevant articles from `site_articles` catalog (1000+ articles)
   - Scores articles by relevance using title/topic overlap
   - Uses Claude to insert 3-5 contextual links naturally into content

5. **Stage 5 - Quality Scoring**: Automated QA metrics
   - Word count check (target: 1500-2500 words)
   - Internal link count (target: 3-5)
   - External citation count (target: 2-4)
   - FAQ presence (minimum: 3 items)
   - Heading structure validation (H2/H3 hierarchy)
   - Readability score (sentence length heuristic)
   - Returns quality score 0-100 and array of issues with severity levels

### Data Layer

**Supabase Integration** (`src/services/supabaseClient.js`):
- PostgreSQL database with 14 tables (see README.md for full schema)
- Row-level security (RLS) policies for multi-user access
- Real-time subscriptions for live updates

**Key Tables:**
- `articles` - Main content storage with status workflow (idea → drafting → refinement → qa_review → ready_to_publish → published). Includes `risk_level`, `autopublish_deadline`, `reviewed_at` fields.
- `content_ideas` - Article ideas with approval workflow (pending → approved → rejected → completed)
- `article_contributors` - 4 approved authors (Tony/Kif, Kayleigh/Alicia, Sara/Daniel, Charity/Julia) with writing style profiles
- `geteducated_articles` - GetEducated site catalog for internal linking (1000+ articles)
- `monetization_categories` - 155 category/concentration pairs for shortcode generation
- `monetization_levels` - 13 degree levels (Associate, Bachelor, Master, etc.)
- `subjects` - Subject-CIP code mapping for topic classification
- `ranking_reports`, `ranking_report_entries` - Cost data from GetEducated rankings
- `generation_queue` - Automatic mode task queue

**TanStack React Query** (`src/lib/queryClient.js`):
- Centralized query client configuration with 5-minute staleTime and 30-minute cacheTime
- Handles caching, refetching, and optimistic updates
- Custom hooks in `src/hooks/` wrap common queries
- Mutations automatically invalidate relevant queries for cache consistency

**Key Hooks** (`src/hooks/`):
- `useArticles.js`, `useContentIdeas.js` - Core content CRUD
- `useContributors.js` - Author management (enforces 4 approved authors)
- `useGeneration.js` - AI generation pipeline triggers
- `usePublish.js`, `useAutoPublish.js` - Publishing workflow
- `usePrePublishValidation.js` - Validation before publish
- `useMonetization.js`, `useShortcodes.js` - Monetization system
- `useGetEducatedCatalog.js` - Site article catalog for internal linking
- `useAIRevisions.js` - AI revision history tracking

### State Management Pattern

No global state manager (Redux/Zustand) - state is managed through:
1. **React Query** for server state (articles, ideas, contributors, settings)
2. **React Context** for authentication state only
3. **Local component state** for UI-specific state (form inputs, modals, etc.)

### Component Organization

**Pages** (`src/pages/`):
- Route-level components that compose smaller components
- Handle data fetching via custom hooks
- Manage page-specific UI state

**Components** (`src/components/`):
- `ui/` - Reusable UI primitives (buttons, inputs, cards, etc.)
- `layout/` - Layout components (MainLayout, navigation)
- `dashboard/` - Dashboard-specific components (Kanban board, metrics)
- `editor/` - Article editor components (React Quill integration)

## Important Technical Considerations

### Security Warning

**CRITICAL**: The current implementation includes `dangerouslyAllowBrowser: true` in `src/services/ai/claudeClient.js`. This exposes API keys in the browser and is **FOR DEVELOPMENT ONLY**. In production:
- Move all AI API calls to Supabase Edge Functions
- Never commit API keys to version control
- Use environment variables server-side only

### AI Client Architecture

All AI clients (`grokClient.js`, `claudeClient.js`, `stealthGptClient.js`) follow a similar pattern:
- Initialize API client in constructor (apiKey defaults to environment variables)
- Expose high-level methods (`generateDraft`, `humanize`, `autoFixQualityIssues`)
- Handle prompt engineering internally via dedicated prompt builder methods
- Return structured data objects (Grok returns parsed JSON, Claude/StealthGPT return text)

**Grok Client** (`grokClient.js`):
- Uses xAI's Grok API (model: `grok-beta`)
- Expects JSON responses from prompts
- Primary methods: `generateDraft()`, `generateIdeas()`, `generateMetadata()`
- Direct fetch-based HTTP client implementation

**StealthGPT Client** (`stealthGptClient.js`):
- Uses StealthGPT API (https://stealthgpt.ai/api/stealthify)
- Primary humanization provider for AI detection bypass
- Primary methods: `humanize()`, `humanizeLongContent()`, `generate()`
- Configurable options:
  - `tone`: Standard, HighSchool, College (default), PhD
  - `mode`: Low, Medium, High (default) - bypass aggressiveness
  - `detector`: gptzero (default), turnitin - optimize for specific detector
- Handles long content by splitting on H2/H3 headings for chunked processing
- Falls back to Claude if API key not configured or request fails

**Claude Client** (`claudeClient.js`):
- Uses Anthropic SDK (model: `claude-sonnet-4-20250514`)
- Returns raw text content
- Primary methods: `humanize()`, `autoFixQualityIssues()`, `reviseWithFeedback()`, `extractLearningPatterns()`
- High temperature (0.9) for humanization, lower (0.7) for fixing/revision
- Acts as fallback humanizer when StealthGPT is unavailable

When modifying AI prompts:
- Keep context windows in mind (max_tokens: 4000-4500)
- Test with various content types (guide, tutorial, listicle, ranking, review, explainer)
- Validate output structure matches expected schema (especially Grok's JSON responses)
- Be aware of the "banned phrases" list in Claude's humanization prompt

### Additional Services

Beyond AI clients, the `src/services/` directory contains:

**Validation (`src/services/validation/`):**
- `linkValidator.js` - Blocks .edu links, competitor URLs, validates external whitelist
- `riskAssessment.js` - Calculates risk levels (LOW/MEDIUM/HIGH/CRITICAL)
- `prePublishValidation.js` - Pre-publish checks (author, links, risk, quality)

**Publishing & Workflow:**
- `publishService.js` - Webhook publishing to n8n (temporary) → WordPress API (future)
- `autoPublishService.js` - Auto-publish logic for unreviewed articles
- `articleRevisionService.js` - Article version tracking and AI revision history

**Data Services:**
- `monetizationEngine.js` - Topic-to-monetization matching
- `shortcodeService.js` - Shortcode generation and validation
- `costDataService.js` - Ranking report cost data access
- `ideaDiscoveryService.js` - Content idea generation

### Database Migrations

Supabase migrations are in `supabase/migrations/`. Run migrations in order via Supabase SQL Editor when setting up new environments.

**Core migrations:**
- `20250101000000_initial_schema.sql` - Base tables (articles, content_ideas, contributors, etc.)
- `20250101000001_seed_contributors.sql` - Seeds contributor personas
- `20250101000002_seed_settings.sql` - System configuration

**GetEducated-specific migrations:**
- `20250103000000_add_monetization_tables.sql` - Monetization categories and levels
- `20250103000002_update_contributors_geteducated.sql` - Updates contributors to 4 approved authors
- `20250105000000_create_subjects_table.sql` - Subject-CIP code mapping
- `20250105000001_create_ranking_reports_tables.sql` - Cost data storage
- `20250107000000_geteducated_site_catalog.sql` - GetEducated articles catalog
- `20250108000000_article_versions_system.sql` - Version tracking
- `20250108000001_enhance_contributor_profiles.sql` - Author profiles with style data

### Quality Metrics Implementation

The quality scoring system in `generationService.js` uses simple heuristics:
- Word count via regex HTML stripping
- Link counting via regex pattern matching
- Readability via sentence length calculation

When improving quality checks:
- Keep calculations client-side performant
- Add new checks to `calculateQualityMetrics()` method
- Update quality score algorithm weights carefully
- Add corresponding UI feedback in article editor

### Content Workflow States

Articles progress through status pipeline (enforced by database CHECK constraint):
- `idea` - Initial concept stage
- `drafting` - Initial AI generation complete
- `refinement` - Human editing in progress
- `qa_review` - Quality assurance review
- `ready_to_publish` - Approved, awaiting publication
- `published` - Published to WordPress

Content ideas have a separate workflow:
- `pending` - Awaiting approval
- `approved` - Ready for generation
- `rejected` - Not to be used
- `completed` - Article has been generated

State transitions should update `status` field and optionally create `article_revisions` records for audit trail. Use the `useUpdateArticleStatus` hook for status changes.

## Styling and UI

- **Tailwind CSS 4.1** with `@tailwindcss/postcss` plugin (not v3)
- **Class Variance Authority (CVA)** for variant-based component styling
- **Lucide React** for icons
- **Shadcn/ui patterns** for component architecture (not full Shadcn install)
- Use `cn()` utility in `src/lib/utils.js` for conditional class merging (`clsx` + `tailwind-merge`)

## Testing

No test suite exists. When adding tests, use Vitest (compatible with Vite). Priority test targets:
- Generation pipeline with mocked AI responses
- Quality metrics calculation with known content samples
- Contributor assignment algorithm with fixture data

## Feature Development Guidelines

### Adding New AI Features

1. Create service in `src/services/ai/` if new provider
2. Update `generationService.js` to orchestrate new capability
3. Add corresponding UI in relevant page component
4. Update quality metrics if feature affects quality score

### Adding New Database Tables

1. Create migration file in `supabase/migrations/` with timestamp prefix
2. Include RLS policies in migration
3. Create custom hook in `src/hooks/` for data access
4. Update relevant page components to use new hook

### Modifying Generation Pipeline

The pipeline stages in `GenerationService.generateArticle()` are designed to be extended:
- Each stage is isolated with clear inputs/outputs
- Stages can be made optional via `options` parameter
- New stages can be inserted between existing stages
- Error handling at stage level allows partial recovery

## Common Patterns

### Data Fetching
Custom hooks in `src/hooks/` wrap React Query with auth context. Key patterns:
- Include filters in `queryKey` for proper caching
- Use `enabled: !!user` to wait for authentication
- Mutations call `queryClient.invalidateQueries()` for cache consistency

### AI Generation
Instantiate `GenerationService` and call `generateArticle(idea, options)` where options include `contentType`, `targetWordCount`, `autoAssignContributor`, and `addInternalLinks`. Always wrap AI client calls in try/catch.

### Form Handling
Uses React Hook Form with Zod validation via `zodResolver`.

## Important Implementation Details

### Contributor Assignment Algorithm

The `assignContributor()` method in `generationService.js` uses a scoring system:
- 50 points for expertise area match with idea topics
- 30 points for content type compatibility
- 20 points for title keyword matches
- Returns highest-scoring contributor, falls back gracefully if none match

### Internal Linking Relevance Scoring

The `getRelevantSiteArticles()` method scores articles by:
- Title word overlap (10 points per common word)
- Topic array matches (15 points per matching topic)
- Filters out articles with zero relevance score
- Prioritizes articles with fewer existing links (`times_linked_to` field)

### Quality Metrics Weights

Quality score starts at 100 and deducts points:
- Word count < 1500: -15 (major)
- Word count > 2500: -5 (minor)
- Internal links < 3: -15 (major)
- External links < 2: -10 (minor)
- FAQs < 3: -10 (minor)
- Heading count < 3 H2s: -10 (minor)
- Average sentence length > 25 words: -10 (minor)

Minimum score is clamped to 0.

## Known Limitations & Current Status

**Implemented:**
- Link validation (blocks .edu, competitors)
- Risk assessment and auto-publish deadline system
- Pre-publish validation framework
- Approved authors enforcement
- Monetization categories/levels tables
- GetEducated site catalog (`geteducated_articles` table)
- Subject-CIP mapping

**Partially Implemented:**
- Internal linking (needs catalog population)
- Auto-publish scheduler (Edge Function exists, needs cron setup)
- Webhook publishing to n8n (service exists)

**Not Yet Implemented:**
- Direct WordPress REST API publishing
- Shortcode auto-generation from topic matching
- Cost data RAG for AI prompts
- Ranking report crawler

**Known Issues:**
- TipTap editor used for rich text editing (React 19 compatible, replaced ReactQuill)
- Client-side API keys - security risk, needs Edge Functions migration
- Desktop-first design - no mobile optimization

See `docs/v5-updates/07-REMAINING-IMPLEMENTATION.md` for detailed gap analysis.

## Future: V8 Phoenix Rebuild

A radical simplification is planned in `PERDIA-V8-PHOENIX-SPEC.md`. Key changes:
- Reduce from 10,673 service lines to ~800
- Simplify status flow: `idea → drafting → review → published` (4 states vs 6)
- Kill unused features: AI learning, batch processing, version history UI, DataForSEO
- Single shortcode format (`su_ge-picks`)
- Same Supabase database - no migration needed

**V8 Mantra:** "If it doesn't directly generate monetizable content, delete it."

## V5 Updates Documentation

All GetEducated-specific requirements and implementation details are in `docs/v5-updates/`:

- `01-REQUIREMENTS-OVERVIEW.md` - Full requirements from client meetings
- `02-CLIENT-CONTENT-RULES.md` - Kayleigh's content rules and linking policies
- `03-MONETIZATION-SPECIFICATION.md` - Shortcode system and monetization logic
- `04-IMPLEMENTATION-TODO.md` - Prioritized implementation task list
- `05-MISSING-INFORMATION.md` - Documents still needed from client
- `06-AUTHOR-STYLE-GUIDE.md` - Legacy style guide (superseded by 08)
- `07-REMAINING-IMPLEMENTATION.md` - Gap analysis (~41% complete, detailed status)
- `08-AUTHOR-STYLE-SPECIFICATION.md` - **CANONICAL** author spec with style proxies and content mapping
- `09-ARTICLE-STYLE-EXTRACTS.md` - Full article excerpts for AI voice training
- `10-MEETING-NOTES-2025-12-18.md` - Technical meeting notes with Justin/Tony
- `12-SITEMAP-CRAWLING-SPECIFICATION.md` - **CRITICAL** Daily sitemap sync requirements
- `13-WORDPRESS-INTEGRATION-SPECIFICATION.md` - WordPress CPT and meta key mapping
- `14-SPONSORED-SCHOOLS-SPECIFICATION.md` - Monetization prioritization logic
- `15-SHORTCODE-SYSTEM-SPECIFICATION.md` - Full shortcode documentation
- `16-AI-REASONING-OUTPUT-SPECIFICATION.md` - Debug/transparency logging

## CRITICAL: December 2025 Technical Requirements

These requirements were confirmed in the Dec 18, 2025 meeting with Justin (developer) and Tony (owner):

### Site Catalog - MUST Include /online-degrees/

The current catalog is MISSING the most important section. **CRITICAL FIX REQUIRED:**
- Crawl `https://www.geteducated.com/sitemap.xml` daily
- Include ALL pages under `/online-degrees/` (school directory)
- Use sitemap as **source of truth** for URL whitelisting
- Prefer content with recent `lastmod` dates

### Sponsored Schools Detection

Only create content for MONETIZABLE topics:
- Check for logo presence (logo = sponsored)
- Check `school_priority >= 5` (paid client)
- Cross-reference with paid clients spreadsheet
- WARN if generating content for non-monetizable areas

### WordPress Article Contributor System

**DO NOT** use standard WordPress `post_author`. Use custom meta keys:
```
written_by: [WordPress CPT ID]  -- Article Contributor CPT ID
edited_by: [CPT ID]             -- Optional editor
expert_review_by: [CPT ID]      -- Optional expert reviewer
```

Get contributor CPT IDs from Justin before publishing.

### Shortcode Requirements

**NEVER output raw affiliate URLs.** Always use shortcodes:
- `[ge_cta category="X" concentration="Y" level="Z"]` - Monetization
- `[ge_internal_link url="/path"]Text[/ge_internal_link]` - Internal links
- `[ge_external_cited url="https://..." source="BLS"]Text[/ge_external_cited]` - External

Stage site docs: `https://stage.geteducated.com/shortcodes` (auth: ge2022 / !educated)

### Publishing Throttling

Maximum rate: 5 articles per minute with 12-second delay between publishes.

### AI Reasoning Output

Include reasoning/thinking output for debugging:
- Why contributor was selected
- Why monetization category was chosen
- Why internal links were selected
- Warnings for data freshness issues

## Key URLs for GetEducated Integration

- Ranking Reports: https://www.geteducated.com/online-college-ratings-and-rankings/
- Degree Database: https://www.geteducated.com/online-degrees/
- School Database: https://www.geteducated.com/online-schools/
- Monetization Sheet: https://docs.google.com/spreadsheets/d/1s2A1Nt5OBkCeFG0vPswkh7q7Y1QDogoqlQPQPEAtRTw/
