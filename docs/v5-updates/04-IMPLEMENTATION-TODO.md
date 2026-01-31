# Implementation To-Do List

**Last Updated:** December 3, 2025
**Priority:** P0 = Must have, P1 = Important, P2 = Nice to have

---

## Phase 1: Critical Fixes (Week 1-2)

### P0-1: Fix Author Attribution System
**Status:** Not Started
**Files:** `src/hooks/useContributors.js`, `src/pages/ArticleEditor.jsx`

- [ ] Restrict author selection to only 4 approved authors:
  - Tony Huffman
  - Kayleigh Gilbert
  - Sara
  - Charity
- [ ] Remove/hide all legacy authors from contributor dropdown
- [ ] Default to Tony or Kayleigh until Sara/Charity pages exist
- [ ] Update `article_contributors` table seed data
- [ ] Add validation to block publishing with unauthorized authors

### P0-2: Implement Shortcode Enforcement
**Status:** Not Started
**Files:** `src/services/generationService.js`, `supabase/functions/publish-to-wordpress/`

- [ ] Create shortcode catalog table in database
- [ ] Define approved shortcode formats:
  - Internal links: `[ge_internal_link]`
  - External citations: `[ge_external_cited]`
  - Monetization: `[ge_monetization]`
- [ ] Add validation layer before WordPress publish
- [ ] Block publish if raw monetized/competitor URLs detected
- [ ] Create shortcode transformation utility

### P0-3: Update Link Validation Rules
**Status:** Not Started
**Files:** `src/components/article/LinkComplianceChecker.jsx`

- [ ] Add competitor domain blocklist:
  - onlineu.com
  - usnews.com
  - affordablecollegesonline.com
  - toponlinecollegesusa.com
- [ ] Block .edu school website links
- [ ] Allow only BLS/government/nonprofit external links
- [ ] Require internal links to use GetEducated URLs only

### P0-4: Cost Data Source Enforcement
**Status:** Not Started
**Files:** `src/services/ai/grokClient.js`, `src/services/ai/claudeClient.js`

- [ ] Update prompts to require cost data from ranking reports only
- [ ] Add ranking report index to RAG system
- [ ] Create validation to flag external cost data
- [ ] Build ranking report data ingestion pipeline

---

## Phase 2: Workflow Improvements (Week 3-4)

### P0-5: Auto-Publish Scheduler
**Status:** Not Started
**Files:** New file needed, `supabase/functions/`

- [ ] Create new Edge Function: `auto-publish-scheduler`
- [ ] Add `autopublish_deadline` field to articles table
- [ ] Implement logic:
  - Query articles with `status = 'ready_to_publish'` AND `autopublish_deadline <= NOW()`
  - Check risk level (only publish if `risk_level = 'low'`)
  - Call WordPress publish function
  - Update article status
- [ ] Add configurable N-day setting (default: 5 days)
- [ ] Add "Require Review" toggle in settings
- [ ] Create cron job or scheduled trigger

### P0-6: Risk Level Assessment
**Status:** Not Started
**Files:** `src/services/generationService.js`

- [ ] Implement risk scoring system:
  - Missing schema → HIGH
  - Raw affiliate links → HIGH (BLOCKING)
  - No external citation → MEDIUM
  - <3 internal links → MEDIUM
  - Word count too low → MEDIUM
- [ ] Display risk level on Review Queue
- [ ] Block auto-publish for HIGH risk articles

### P1-7: Two-Check System (AI + Human)
**Status:** Partially Implemented
**Files:** `src/pages/ReviewQueue.jsx`, `src/pages/ArticleReview.jsx`

- [ ] Clarify column meanings in Kanban:
  - `drafting` = AI generating
  - `refinement` = AI self-checking and revising
  - `qa_review` = Human review required
  - `ready_to_publish` = Approved by human
- [ ] Add AI check pass before moving to `qa_review`
- [ ] Ensure human must explicitly approve before `ready_to_publish`
- [ ] Add status history/audit log

---

## Phase 3: Data Integration (Week 5-6)

### P0-8: Ranking Report Integration
**Status:** Not Started
**Files:** New service needed

- [ ] Create data model for ranking report data
- [ ] Build crawler/scraper for ranking reports index
- [ ] Extract structured data:
  - Program name
  - School name
  - Degree level
  - Total cost (with fees)
  - In-state vs out-of-state
  - Accreditation
- [ ] Make available to AI generation via RAG
- [ ] Create API endpoint for cost lookups

### P0-9: Degree Database Integration
**Status:** Partially Implemented (site_articles table exists)
**Files:** `src/hooks/useSiteArticles.js`

- [ ] Expand `site_articles` or create new table for degree data
- [ ] Crawl degree database: https://www.geteducated.com/online-degrees/
- [ ] Extract:
  - Degree type
  - School
  - URL
  - Is sponsored (has logo + "Sponsored Listing")
  - Category/concentration
- [ ] Use for internal link suggestions

### P0-10: School Database Integration
**Status:** Not Started

- [ ] Create school data model
- [ ] Crawl: https://www.geteducated.com/online-schools/
- [ ] Extract:
  - School name
  - GetEducated URL
  - Is paid client
  - Programs offered
  - Logo/sponsored status
- [ ] Block linking to .edu, require GE URLs

---

## Phase 4: Monetization System (Week 7-8)

### P0-11: Monetization Shortcode System
**Status:** Not Started
**Files:** New components needed

- [ ] Import monetization spreadsheet data
- [ ] Create `monetization_categories` table
- [ ] Build category/concentration matcher
- [ ] Auto-generate shortcodes based on article topic
- [ ] Place shortcodes in appropriate article positions

### P1-12: Monetization Preview
**Status:** Not Started

- [ ] Add preview of what monetization block will look like
- [ ] Show selected category/concentration in editor sidebar
- [ ] Allow manual override of auto-selected monetization

---

## Phase 5: UI Refinements (Week 9-10)

### P1-13: Simplify Editor
**Status:** Partially Implemented
**Files:** `src/pages/ArticleEditor.jsx`

- [ ] Fix ReactQuill React 19 incompatibility OR replace with TipTap
- [ ] Keep sidebar intelligence components
- [ ] Add shortcode inspector panel
- [ ] Improve link compliance visibility

### P1-14: Review Queue Improvements
**Status:** Partially Implemented
**Files:** `src/pages/ReviewQueue.jsx`

- [ ] Add "Age since created" column
- [ ] Add "Auto-publish deadline" column
- [ ] Add risk level indicators
- [ ] Bulk actions: Assign, Approve, Schedule

### P1-15: Training/Feedback Integration
**Status:** Implemented but needs refinement
**Files:** `src/pages/AITraining.jsx`

- [ ] Streamline comment → revision → training flow
- [ ] Add option to exclude specific revisions from global training
- [ ] Surface feedback impact metrics

---

## Phase 6: Polish & Scale (Week 11+)

### P1-16: Dashboard Metrics
**Status:** Basic implementation exists
**Files:** `src/pages/Dashboard.jsx`

- [ ] Add widgets:
  - Articles per week
  - Median review time
  - Auto-publish rate
  - Shortcode compliance rate
  - Risk distribution

### P2-17: Image Generation
**Status:** Not Started

- [ ] Evaluate image generation quality
- [ ] Build image suggestion/generation for articles
- [ ] Add editor preview before publish
- [ ] Ensure stock-photo quality matches site style

### P2-18: GSC Integration
**Status:** Partially Implemented (keywords exist)
**Files:** `src/pages/KeywordsAndClusters.jsx`

- [ ] Add GSC data import (CSV or API)
- [ ] Show position, clicks, impressions
- [ ] Flag keyword opportunities

---

## Information Still Needed From Client

### Must Have (Blocking)
1. **WordPress example article HTML** - Raw HTML showing exact shortcode syntax
2. **Monetization spreadsheet** - Full export (already have link, need to import)
3. **Business model explanation** - Voice note/transcript about how monetization works

### Should Have
4. **Ranking report data export** - Structured data if available
5. **Degree database export** - Structured data if available
6. **Forum URL** - For potential testimonial/example sourcing

### Nice to Have
7. **SEO guidelines document** - Any existing internal docs
8. **E-E-A-T checklist** - If they have one internally

---

## Testing Requirements

### Before Each Deploy
- [ ] All shortcodes render correctly in WP preview
- [ ] No raw affiliate URLs in published content
- [ ] Author is one of approved four
- [ ] Cost data comes from ranking reports
- [ ] No links to competitor sites
- [ ] No links to .edu sites
- [ ] Minimum 3 internal links present

### Weekly Validation
- [ ] Review auto-published articles for quality
- [ ] Check training data for anomalies
- [ ] Monitor shortcode/schema pass rates
- [ ] Review blocked publishes and reasons

---

## Technical Debt to Address

1. **ReactQuill incompatibility** - Needs replacement or fix for React 19
2. **Client-side API keys** - Move to Edge Functions (security risk)
3. **Multi-site assumptions** - Simplify for single-client use
4. **Automation page** - Hide/disable until needed
5. **AITraining page** - Simplify UI, keep backend functionality
