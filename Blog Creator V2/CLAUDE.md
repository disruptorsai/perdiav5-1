# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rankless.ai is an AI-powered blog content management system that helps agencies manage multiple clients' SEO content. It generates research, keywords, and blog articles using Claude AI, then publishes them to WordPress or webhooks on a schedule.

The main application code is in the `blogforge/` directory.

## Commands

All commands should be run from the `blogforge/` directory:

```bash
cd blogforge
npm run dev      # Start Vite dev server
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
netlify dev      # Run local dev with Netlify functions (tests serverless functions locally)
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 7.3
- **Styling**: Tailwind CSS v4 with CSS variables
- **State**: TanStack React Query for server state, useState for UI state
- **Database**: Supabase (PostgreSQL)
- **Backend**: Netlify Functions (serverless)
- **AI**: Claude API via Anthropic SDK (model: `claude-sonnet-4-20250514`)

### Frontend Structure (`blogforge/src/`)
- `main.tsx` → `App.tsx` - Entry point with tab-based routing (no React Router, uses tabs)
- `components/` - UI components organized by feature (clients, research, blogs, queue, settings, auth, auto-mode)
- `hooks/` - Custom hooks for data fetching (`useClients`, `useClientData`, `useQueue`)
- `lib/` - Supabase client (`supabase.ts`) and API utilities (`api.ts`)
- `types/` - TypeScript interfaces
- `contexts/` - AuthContext for Supabase authentication

### Key Data Flow
1. **Client Selection** → loads research, keywords, questions, titles, articles
2. **Research Generation** → POST to `/api/research` → Claude AI analysis → saves to Supabase
3. **Keyword Generation** → POST to `/api/keywords` → triggers background worker → generates keywords/questions/titles
4. **Article Generation** → POST to `/api/generate-blog` → triggers background worker → Claude AI writes article
5. **Publishing** → scheduled function (every 5min) checks queue → publishes to WordPress or webhook

### Netlify Functions (`blogforge/netlify/functions/`)
All serverless functions use Supabase service key (not anon key) for backend operations.

| Function | Type | Purpose |
|----------|------|---------|
| `research.ts` | HTTP POST | Generates SEO research with Claude AI |
| `keywords.mts` | HTTP POST | Triggers keyword generation background worker |
| `keywords-worker-background.ts` | Background | Long-running keyword/question/title generation (15 min limit) |
| `generate-blog.mts` | HTTP POST | Triggers article generation background worker |
| `generate-blog-worker-background.ts` | Background | Long-running article generation with Claude AI |
| `article-status.ts` | HTTP GET | Poll article generation status |
| `process-queue.mts` | Scheduled (5min) | Publishes queued articles to WordPress/webhook |
| `publish-wordpress.ts` | HTTP POST | Direct WordPress publish |
| `publish-webhook.ts` | HTTP POST | Webhook publish |
| `publish-now.mts` | HTTP POST | Immediate publish (bypasses queue) |
| `queue-manage.ts` | HTTP | Queue CRUD operations |
| `schedule-manage.ts` | HTTP | Schedule CRUD operations |
| `search-unsplash.ts` | HTTP | Search Unsplash for featured images |
| `search-pexels.ts` | HTTP | Search Pexels for featured images |
| `auto-mode.ts` | HTTP GET/POST | Batch generate articles from unused sources |
| `users.mts` | HTTP | User management |
| `user-access.mts` | HTTP | User-client access control |
| `rehumanize.ts` | HTTP POST | Re-run humanization on existing article |
| `_blog-profiles.ts` | Module | 5 rotating article structure templates |
| `_writing-framework.ts` | Module | AI writing prompts and forbidden phrases |

**Background Function Pattern**: Functions ending in `-background` are Netlify Background Functions (up to 15 min). The main HTTP function creates a placeholder record in Supabase, invokes the background worker, and the frontend polls `article-status` for completion.

### API Routing
Frontend calls `/api/*` which redirects to `/.netlify/functions/*` via netlify.toml.

### Database Tables (Supabase)
Migrations are in `blogforge/supabase/migrations/` (13 migration files).

- `clients` - Client businesses (name, website, industry, service_area, competitors)
- `client_research` - AI-generated SEO research (status: generating/completed/error)
- `keywords`, `questions`, `blog_titles` - Generated content opportunities (with `used` and `archived` tracking)
- `blog_articles` - Generated articles (status: generating/draft/published/archived/error)
- `blog_settings` - Per-client config (AI model, WordPress creds, writing style, connection type, queue settings)
- `publishing_queue` - Articles queued for publishing (status: queued/scheduled/publishing/published/failed)
- `publishing_schedules` - Day/time slots for auto-publishing

## Environment Variables

**Frontend** (prefix with `VITE_`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Netlify Functions**:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`
- `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` (optional, for image search)
- `BYPASSGPT_API_KEY` (optional, for humanization via BypassGPT)

## Key Patterns

### Article Generation Pipeline
1. **Outline Generation** - Creates title, meta description, section structure
2. **Content Writing** - Full article based on approved outline
3. **Humanization** - BypassGPT API to pass AI detection (uses "Enhanced" model)
4. **Formatting** - Final SEO and readability pass

The `_writing-framework.ts` module contains the master AI prompts with:
- Agent identity and core principles
- Forbidden phrases list (e.g., "In today's fast-paced world")
- Search intent classification
- Writing execution rules (intro hooks, paragraph rules, SEO integration)

### Blog Profile Rotation
5 rotating structural profiles in `_blog-profiles.ts`:
1. Deep-Dive Educational Guide (1400-1800 words)
2. Systems & Protocol Overview (1400-1800 words)
3. Problem-Specific Solution Guide (1400-1800 words)
4. Comparative Reference Guide (1200-1600 words)
5. Specialty Service Overview (1400-1800 words)

Each profile defines: structure, section specs, style rules, formatting elements, tone. Tracked per-client via `blog_settings.last_blog_profile_id`. Universal rules enforce second-person voice, 5-question FAQ, no single-sentence paragraphs.

### Publishing Integrations
Two methods configured per-client in `blog_settings.default_connection_type`:
- **WordPress**: REST API with Application Passwords authentication
- **Webhook**: POST to custom endpoint with optional secret header

### Auto Mode
Batch generation from unused keywords/questions/titles via `/api/auto-mode` endpoint:
- GET `/api/auto-mode?client_id=X` - Returns available sources and current status
- POST `/api/auto-mode` - Starts batch generation with `{client_id, source_type, limit}`

Articles are automatically added to the publishing queue when generation starts.

## Important Technical Details

### Word Count Limits
Maximum article word count is 1800 words to stay within BypassGPT humanization limits. Default target is 1200-1600 words.

### HTML Output
AI generates HTML directly (not Markdown). Uses semantic tags: `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<strong>`, `<em>`. FAQ uses `<section class="faq">` wrapper.

### Custom Hooks
- `useClients()` - Client CRUD operations
- `useClientResearch(clientId)` - Research data
- `useKeywords(clientId)`, `useQuestions(clientId)`, `useBlogTitles(clientId)` - Content opportunities
- `useBlogArticles(clientId)` - Articles
- `useBlogSettings(clientId)` - Per-client settings
- `useQueue(clientId)`, `useSchedule(clientId)` - Publishing queue and schedules
- `useKeywordsHistory(clientId)` - Archived content history
