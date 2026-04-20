# Perdia v6 - Phoenix Rebuild Specification

**Generated:** 2026-01-30
**Source:** Deep analysis of Perdiav5 codebase, git history, documentation, and user feedback
**Purpose:** Guide a complete rebuild that preserves functionality while eliminating accumulated complexity

---

## Executive Summary

Perdia is an AI-powered content production system for GetEducated.com that generates SEO-optimized articles using a two-pass AI pipeline (Grok for drafting, StealthGPT for humanization). The system manages the full content lifecycle from idea generation to WordPress publishing, with 4 approved human authors, monetization shortcode insertion, and quality validation.

**The core problem being solved:** Generate high-volume, monetizable, human-quality content for educational topics while maintaining editorial standards and avoiding AI detection.

---

## Core Value Proposition

If Perdia disappeared, GetEducated would lose:
1. **Automated article generation** from topic ideas
2. **AI detection bypass** (humanization)
3. **Monetization automation** (shortcode insertion for affiliate revenue)
4. **Quality guardrails** (link validation, author enforcement, risk assessment)
5. **WordPress publishing pipeline**

---

## User Personas

### Primary Users
| Persona | Role | Primary Goals |
|---------|------|---------------|
| **Tony Huffman** | Owner/Decision Maker | Revenue through monetizable content, volume scaling |
| **Kayleigh Gilbert** | Content Editor | Review/approve articles, catch quality issues |
| **Sara** | Content Editor | Review technical/education content |
| **Charity** | Content Editor | Review teaching/education career content |

### Secondary Users
| Persona | Role | Primary Goals |
|---------|------|---------------|
| **Developer** | System Maintainer | Fix bugs, add features, monitor health |

---

## Core User Journeys (80% of Value)

### Journey 1: Generate Article from Idea
**Goal:** Transform a content idea into a publishable article
**Trigger:** User approves an idea OR system auto-generates from monetizable topics
**Steps:**
1. Select/approve content idea with topic, keywords
2. System assigns best-matching contributor (of 4 approved)
3. AI generates draft via Grok (structured HTML with headings, FAQs)
4. AI humanizes content via StealthGPT (bypass AI detection)
5. System inserts internal links from GetEducated catalog
6. System inserts monetization shortcodes
7. System calculates quality score
8. Article enters review queue

**Success Criteria:** Article has quality score 70+, no blocked links, correct author
**Data Touched:** `content_ideas`, `articles`, `article_contributors`, `geteducated_articles`, `monetization_categories`

### Journey 2: Review and Approve Article
**Goal:** Human editor reviews AI-generated content for quality
**Trigger:** Article reaches `qa_review` status
**Steps:**
1. Editor opens article in review queue
2. Reviews content, checks links, verifies facts
3. Optionally adds inline comments for AI revision
4. AI revises based on feedback
5. Editor approves revision
6. Article moves to `ready_to_publish`

**Success Criteria:** Article passes editorial review, no issues flagged
**Data Touched:** `articles`, `article_comments`, `ai_revisions`

### Journey 3: Publish to WordPress
**Goal:** Get approved article published to live site
**Trigger:** Article reaches `ready_to_publish` OR auto-publish deadline reached
**Steps:**
1. Pre-publish validation runs (author, links, risk, quality, shortcodes)
2. If passes, article sent to WordPress via webhook
3. WordPress post ID saved back to database
4. Article status updated to `published`

**Success Criteria:** Article live on geteducated.com with correct metadata
**Data Touched:** `articles`

### Journey 4: Discover Monetizable Content Ideas
**Goal:** Find topics that can generate revenue
**Trigger:** User requests new ideas OR scheduled discovery
**Steps:**
1. Query paid schools and their degree offerings
2. Identify gaps in content coverage
3. Generate article ideas for monetizable topics
4. Score ideas by monetization potential
5. Present to user for approval

**Success Criteria:** Ideas generated have high monetization scores
**Data Touched:** `content_ideas`, `schools`, `degrees`, `monetization_categories`

---

## Feature Inventory

### Essential (MVP - Must Rebuild)
| Feature | Purpose | Current Complexity | Rebuild Approach |
|---------|---------|-------------------|------------------|
| AI Draft Generation | Generate article from idea | HIGH (108KB service) | Single focused service |
| AI Humanization | Bypass AI detection | MEDIUM | Keep simple, single client |
| Contributor Assignment | Match author to topic | LOW | Simple scoring algorithm |
| Quality Scoring | Validate article quality | MEDIUM | Streamline metrics |
| Link Validation | Block .edu/competitors | MEDIUM | Keep, simplify |
| Shortcode Insertion | Add monetization | HIGH (complex engine) | Simplify to one format |
| Pre-Publish Validation | Gate publishing | MEDIUM | Keep core checks |
| WordPress Publishing | Send to site | LOW | Keep webhook approach |
| Article Status Workflow | Track progress | LOW | Simplify to 4 states |
| Basic Dashboard | See article pipeline | LOW | Simple Kanban view |
| Article Editor | Edit content | HIGH (TipTap + comments) | Simpler rich text |

### Important (Phase 2)
| Feature | Purpose | Why Defer | Notes |
|---------|---------|-----------|-------|
| AI Revision from Comments | Fix issues via AI | Complexity source | Manual edit first |
| Monetization Scoring on Ideas | Prioritize ideas | Nice-to-have | Can filter manually |
| Feedback Learning System | AI improvement | Never worked well | Skip entirely |
| Batch Generation | Multiple articles | Performance feature | Single-article first |
| Auto-Publish Scheduler | Hands-off publishing | Risky automation | Manual publish first |
| Analytics Dashboard | Track metrics | Reporting feature | Basic counts first |
| Keyword Research | DataForSEO integration | External dependency | Manual keywords first |

### Deprecated (Do NOT Rebuild)
| Feature | Reason to Drop |
|---------|----------------|
| `SecretJosh.jsx` (76KB!) | Mystery page, unused |
| AI Training Page | Feedback system never worked |
| Complex Automation Engine | Over-engineered, rarely used |
| Multiple Shortcode Formats | Caused endless bugs - use ONE format |
| Legacy Shortcode Support | Just use correct format |
| Multi-site Architecture | Single client only |
| Version History UI | Database tracks, UI unnecessary |
| Revision Approval UX | Source of BUG #2/#3, simplify |

---

## Data Model (Conceptual)

### Core Entities
| Entity | Purpose | Key Attributes | Relationships |
|--------|---------|----------------|---------------|
| **Article** | Content piece | title, content, status, quality_score, contributor_id | → Contributor, → Idea |
| **Contributor** | Author profile | name, style_proxy, expertise_areas, writing_style_profile | ← Articles |
| **ContentIdea** | Article seed | title, topic, keywords, monetization_score, status | → Article (once generated) |
| **School** | Paid school | name, slug, is_paid_client | → Degrees |
| **Degree** | Program offered | name, school_id, category, level | → School |
| **MonetizationCategory** | Affiliate mapping | category_id, concentration_id, category_name | Used for shortcodes |
| **SiteArticle** | GetEducated catalog | url, title, topics | Used for internal linking |

### Simplified Status Flow
```
idea → drafting → review → published
```

**Remove:** `refinement`, `qa_review`, `ready_to_publish` - too many states

---

## External Integrations

| Service | Purpose | Criticality | Notes |
|---------|---------|-------------|-------|
| **Supabase** | Database + Auth | CRITICAL | Keep, works well |
| **Grok (xAI)** | Draft generation | CRITICAL | Primary AI |
| **StealthGPT** | Humanization | CRITICAL | AI bypass |
| **Claude** | Fallback/fixes | MEDIUM | Backup only |
| **WordPress (n8n)** | Publishing | HIGH | Webhook approach |
| **DataForSEO** | Keywords | LOW | Optional, defer |

---

## Business Rules (Must Preserve Exactly)

### 1. Author Rules
- **ONLY 4 approved authors:** Tony Huffman, Kayleigh Gilbert, Sara, Charity
- **NEVER publish with:** Julia Tell, Kif Richmann, Alicia Carrasco, Daniel Catena (style proxies)
- **Author-to-Content Mapping:**
  - Tony → Rankings, data analysis, affordability
  - Kayleigh → Healthcare, professional programs
  - Sara → Technical education, degree overviews
  - Charity → Teaching degrees, education careers

### 2. Link Rules
- **BLOCK all .edu links** - Use GetEducated school pages
- **BLOCK competitor domains** (47+ blocked including onlineu.com, usnews.com)
- **ALLOW only:** BLS, government, nonprofit external links
- **Internal links:** Must point to geteducated.com URLs

### 3. Shortcode Rules
- **ONLY use:** `[su_ge-picks]`, `[su_ge-cta]`, `[su_ge-qdf]`
- **BLOCK legacy:** `[degree_table]`, `[ge_monetization]`, `[ge_internal_link]`, etc.
- **Required:** At least one monetization shortcode per article

### 4. Content Rules
- **Cost data:** ONLY from GetEducated ranking reports
- **Word count target:** 1500-2500 words
- **Internal links:** Minimum 3
- **FAQs:** Minimum 3
- **No raw affiliate URLs** - Always shortcodes

### 5. Publishing Rules
- **Throttle:** Max 5 articles/minute
- **Risk assessment:** CRITICAL risk blocks publish
- **Quality gate:** Minimum 70 score

---

## Non-Functional Requirements

### Performance
- Article generation: 60-90 seconds acceptable
- Page load: Under 2 seconds
- Quality scoring: Under 1 second

### Scale
- Initial: ~3 articles/day
- Target: ~100 articles/week
- Concurrent users: 1-5

### Security
- API keys: Server-side only (Edge Functions)
- Auth: Supabase Auth (simple email/password)
- RLS: User-scoped data (for future multi-tenant)

### Reliability
- Uptime: 99% during business hours
- Error handling: Graceful fallbacks
- Data: Never lose articles in progress

---

## Simplification Opportunities

### 1. Generation Service (108KB → 20KB)
**Current:** Monolithic 3000-line class with everything
**Simplified:**
- `generateDraft()` - Call Grok, return HTML
- `humanize()` - Call StealthGPT
- `insertLinks()` - Add internal links
- `insertShortcodes()` - Add monetization
- `calculateScore()` - Simple metrics

### 2. Shortcode System (29KB → 5KB)
**Current:** Multiple formats, legacy support, complex matching
**Simplified:**
- ONE shortcode generator function
- ONE format: `[su_ge-picks]` only
- Remove all legacy handling

### 3. Article Editor (52KB → 15KB)
**Current:** TipTap + inline comments + AI revision approval + pending states
**Simplified:**
- Basic rich text editor
- No inline comments in MVP
- Simple save/publish buttons

### 4. Status Workflow (6 states → 4 states)
**Current:** idea → drafting → refinement → qa_review → ready_to_publish → published
**Simplified:** idea → drafting → review → published

### 5. Hooks Directory (23 hooks → 10 hooks)
**Current:** Separate hook for everything
**Simplified:** Consolidate related queries

### 6. Remove Entirely
- AI Training system (never worked)
- SecretJosh page (76KB mystery)
- Complex automation engine
- Batch progress tracking
- Version history UI
- Feedback learning

---

## Lessons Learned from Original

### 1. Feature Creep Through AI Iteration
The codebase grew from focused to sprawling through repeated AI-assisted additions without refactoring. Files like `generationService.js` (108KB) and `SecretJosh.jsx` (76KB) are symptoms.

### 2. Multiple Shortcode Formats = Endless Bugs
Supporting legacy formats alongside new ones created constant validation issues. Tony's feedback repeatedly mentioned "wrong shortcodes."

### 3. Revision Approval UX Was Too Complex
BUG #2 and BUG #3 both related to the AI revision approval flow. Auto-applying revisions without user confirmation caused data loss.

### 4. Documentation Said "100% Complete" When It Wasn't
Gap Analysis claimed complete while Tony Feedback showed critical issues. Overconfidence in completion status.

### 5. Most Modified Files = Problem Areas
Git history shows: ContentIdeas.jsx (11 fixes), generationService.js (7 fixes), CommentableArticle.jsx (4 fixes). These need architectural rethink.

### 6. Client-Side API Keys
Security risk acknowledged but deferred. Rebuild should use Edge Functions from day one.

---

## Open Questions

1. **WordPress IDs:** Do we need school/degree WordPress IDs for shortcodes, or can we use URL-based linking?
2. **Ranking Data:** Should we re-crawl ranking reports or use existing data?
3. **Edge Functions:** Port all AI calls to Edge Functions, or some?
4. **Mobile:** Is mobile support needed? Current is desktop-only.

---

## Recommended Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 19 + Vite | Keep, works well |
| Styling | Tailwind CSS 4 | Keep, CSS variables working |
| State | TanStack Query | Keep, simplify hooks |
| Forms | React Hook Form + Zod | Keep |
| Editor | TipTap (simplified) | Keep, but reduce features |
| Icons | Lucide React | Keep |
| Backend | Supabase | Keep |
| AI | Grok + StealthGPT | Keep, move to Edge Functions |
| Publishing | n8n Webhook | Keep for now |

---

## Rebuild Approach

### Phase 1: Core Pipeline (Week 1-2)
1. New project scaffold (React 19 + Vite + Supabase)
2. Auth (copy from existing)
3. Simple article CRUD
4. Generation pipeline (stripped down)
5. Basic quality scoring
6. Publishing webhook

### Phase 2: Editor & Review (Week 3)
1. Basic rich text editor
2. Review queue
3. Status workflow
4. Pre-publish validation

### Phase 3: Monetization & Links (Week 4)
1. Internal link insertion
2. Shortcode generation (ONE format)
3. Monetization matching

### Phase 4: Polish (Week 5)
1. Dashboard metrics
2. Contributor management
3. Settings page
4. Error handling

---

## UI/UX Preservation Notes

From code analysis, preserve these design elements:
- **Color scheme:** CSS variables (--primary, --secondary, etc.)
- **Layout:** Sidebar navigation + main content area
- **Components:** Shadcn/ui patterns (Card, Button, Input, Badge)
- **Kanban board:** For article pipeline visualization
- **Form patterns:** React Hook Form + Zod validation
- **Icons:** Lucide React throughout

---

## Success Metrics for Rebuild

1. **Codebase size:** < 30% of original
2. **Files over 500 lines:** Zero
3. **Fix commits in first month:** < 5
4. **Generation pipeline:** Same output quality
5. **Publishing validation:** All existing rules preserved
6. **User feedback:** "Feels the same, works better"

---

*This specification was generated using the Phoenix Rebuild Analysis process, synthesizing codebase analysis, git history, user feedback, and documentation review.*
