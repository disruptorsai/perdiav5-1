# Perdia V8 - Phoenix Rebuild Specification

**Generated:** 2026-01-31
**Philosophy:** Radical simplification. Delete everything that doesn't directly make money.
**Database:** Same Supabase project (nvffvcjtrgxnunncdafz) - no migration needed

---

## Executive Summary

Perdia V8 is a **radical rebuild** of the GetEducated content production system. Not a cleanup - a complete rethink.

**The ONLY thing that matters:** Generate articles that make affiliate revenue.

**V5 Problem:** 10,673 lines of service code, 47% fix commits, AI learning systems that never worked, 6 status states, 31 hooks, 15+ pages of bloat.

**V8 Goal:** ~800 lines of core logic, 4 status states, 10 hooks, 7 pages. Same output quality.

---

## Core Philosophy

1. **Delete first, add later** - Start minimal, prove value
2. **Revenue-first** - Only generate content for paid schools
3. **Never hallucinate** - Cost data from database only, or don't include
4. **One format** - Single shortcode format, no legacy support
5. **Manual before automatic** - Automation caused bugs, earn automation back
6. **Config over UI** - Hard-code what doesn't change often
7. **No learning systems** - They never worked, stop trying

---

## What V8 Does (The 5 Things That Matter)

### 1. Generate Draft (Grok)
- Input: Title, keywords, topic
- Output: SEO-optimized HTML article
- One function, ~200 lines

### 2. Humanize (StealthGPT)
- Input: Draft HTML
- Output: AI-detection-proof content
- One API call, ~100 lines

### 3. Insert Monetization
- Shortcode: `[su_ge-picks]` ONLY
- One function, ~50 lines

### 4. Validate for Publish
- 5 blocking checks only:
  - Author is approved (Tony/Kayleigh/Sara/Charity)
  - No .edu links
  - No competitor links
  - Has monetization shortcode
  - Quality score >= 70
- ~150 lines

### 5. Publish to WordPress
- Webhook call to n8n
- ~50 lines

**Total core logic: ~550 lines** (vs 10,673 in V5)

---

## What V8 Kills (The Death List)

| Feature | Lines Killed | Why |
|---------|-------------|-----|
| SecretJosh.jsx | 928 | Mystery page nobody uses |
| AI Training/Learning | ~2000 | Never worked - Tony confirmed |
| Automation Engine | ~500 | Over-engineered, caused bugs |
| Keywords/DataForSEO | 3134 | Unused integration |
| Batch Processing | ~400 | Single article is fine |
| Version History UI | ~300 | Database tracks this |
| Content Rules Editor | ~500 | Config file is enough |
| AI Reasoning Panel | ~200 | Debugging feature nobody used |
| Revision Approval Flow | ~600 | Source of BUG #2 and #3 |
| Multiple shortcode formats | ~400 | ONE format only |
| Complex status states | ~300 | 4 states, not 6 |

**Total killed: ~9,000+ lines**

---

## Status Flow (Simplified)

### V5 (Too Complex)
```
idea → drafting → refinement → qa_review → ready_to_publish → published
```

### V8 (Simple)
```
idea → drafting → review → published
```

| Status | Meaning | Transitions |
|--------|---------|-------------|
| `idea` | Approved content idea | → drafting (generate) |
| `drafting` | AI generation in progress | → review (complete) or → idea (fail) |
| `review` | Human review queue | → published (approve) or → drafting (revise) |
| `published` | Live on WordPress | Terminal |

---

## Database Strategy

**Use the SAME database** - no migration needed.

### Tables V8 Uses

| Table | Purpose |
|-------|---------|
| `articles` | Core content storage |
| `content_ideas` | Ideas pipeline |
| `article_contributors` | 4 approved authors |
| `geteducated_articles` | Internal linking catalog |
| `monetization_categories` | Shortcode generation |
| `monetization_levels` | Degree level mapping |
| `ranking_report_entries` | **ONLY source for cost data** |
| `system_settings` | Configuration |
| `generation_queue` | AI processing queue |

### Tables V8 Ignores

| Table | Why Ignore |
|-------|-----------|
| `training_data` | Learning system killed |
| `ai_revisions` | No revision tracking |
| `article_comments` | No inline comments |
| `geteducated_article_versions` | No version UI |
| `article_revisions` | Simplified to simple edits |

---

## Business Rules (Preserved Exactly)

### Authors
```javascript
const APPROVED_AUTHORS = ['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity']
const BLOCKED_BYLINES = ['Julia Tell', 'Kif Richmann', 'Alicia Carrasco', 'Daniel Catena']

const AUTHOR_TOPICS = {
  'Tony Huffman': ['rankings', 'data', 'affordability', 'cost'],
  'Kayleigh Gilbert': ['healthcare', 'nursing', 'professional'],
  'Sara': ['technical', 'education', 'degree overview'],
  'Charity': ['teaching', 'education careers', 'K-12']
}
```

### Links
```javascript
const BLOCKED_DOMAINS = [
  'onlineu.com', 'usnews.com', 'niche.com', 'bestcolleges.com',
  'collegechoice.net', 'thebestschools.org', // ... 47+ more
]
const BLOCK_ALL_EDU = true
const ALLOWED_EXTERNAL = ['bls.gov', 'ed.gov', 'nces.ed.gov']
```

### Shortcodes
```javascript
const ALLOWED_SHORTCODES = ['su_ge-picks', 'su_ge-cta', 'su_ge-qdf']
const REQUIRED_SHORTCODE = 'su_ge-picks'
```

### Publishing
```javascript
const MIN_QUALITY_SCORE = 70
const MAX_PUBLISH_PER_MINUTE = 5
const CRITICAL_RISK_BLOCKS = true
```

---

## V8 File Structure

```
perdiav8/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn-style primitives (button, card, input, badge)
│   │   └── layout/
│   │       └── MainLayout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx    # Simple metrics only
│   │   ├── Ideas.jsx        # List + approve/reject
│   │   ├── Articles.jsx     # Pipeline view
│   │   ├── Editor.jsx       # Simple rich text
│   │   ├── Review.jsx       # Review queue
│   │   ├── Settings.jsx     # Essential config
│   │   └── Login.jsx
│   ├── services/
│   │   ├── supabase.js      # Client init
│   │   ├── generate.js      # Grok draft generation (~200 lines)
│   │   ├── humanize.js      # StealthGPT (~100 lines)
│   │   ├── monetize.js      # Shortcode insertion (~50 lines)
│   │   ├── validate.js      # Pre-publish validation (~150 lines)
│   │   └── publish.js       # WordPress webhook (~50 lines)
│   ├── hooks/
│   │   ├── useArticles.js   # Article CRUD
│   │   ├── useIdeas.js      # Ideas CRUD
│   │   ├── useGenerate.js   # Generation flow
│   │   ├── useContributors.js # Author data
│   │   ├── useMonetization.js # Shortcode data
│   │   ├── useCatalog.js    # GetEducated catalog
│   │   ├── useSettings.js   # System settings
│   │   ├── usePublish.js    # Publishing
│   │   └── useAuth.js       # Authentication
│   ├── lib/
│   │   ├── utils.js         # cn() helper
│   │   └── queryClient.js   # TanStack Query
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── config/
│   │   ├── authors.js       # Hard-coded author rules
│   │   ├── links.js         # Blocked/allowed domains
│   │   └── shortcodes.js    # Shortcode rules
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

**Target: < 3,000 total lines** (vs 15,000+ in V5)

---

## UI Design (New Look)

V8 gets a **new, simpler design** - not preserving V5 UI.

### Design Principles
1. **Cards over tables** - Visual, scannable
2. **Status badges** - Immediate understanding
3. **One-click actions** - Generate, Approve, Publish
4. **Monetization visible** - $ indicator on every idea/article
5. **Clean whitespace** - Not cramped

### Color Palette
```css
--bg: #f8fafc;           /* Light gray background */
--card: #ffffff;         /* White cards */
--primary: #0f172a;      /* Dark text */
--accent: #3b82f6;       /* Blue accent */
--success: #22c55e;      /* Green for published/approved */
--warning: #f59e0b;      /* Orange for review */
--danger: #ef4444;       /* Red for blocked/rejected */
--muted: #64748b;        /* Gray for secondary text */
```

### Key UI Changes from V5

| V5 | V8 |
|----|-----|
| Complex sidebar with many items | Simple sidebar: Dashboard, Ideas, Articles, Settings |
| TipTap with inline comments | Simple Markdown editor |
| 6 status tabs | 4 status filters |
| Analytics dashboard | Simple count cards |
| AI Training modal | **Deleted** |
| Version history panel | **Deleted** |
| Automation settings | **Deleted** |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | React 19 + Vite | Fast, modern |
| **Styling** | Tailwind CSS 4 | Utility-first |
| **State** | TanStack Query v5 | Data fetching |
| **Forms** | React Hook Form + Zod | Validation |
| **Editor** | Textarea + HTML preview | No TipTap complexity |
| **Icons** | Lucide React | Clean icons |
| **Backend** | Supabase | Auth + Database |
| **AI** | Grok (xAI) + StealthGPT | Generation + Humanization |
| **Publishing** | n8n Webhook | WordPress integration |

---

## Success Metrics

| Metric | V5 | V8 Target |
|--------|-----|-----------|
| Total service lines | 10,673 | < 800 |
| Total codebase lines | 15,000+ | < 3,000 |
| Files over 500 lines | 8 | 0 |
| Status states | 6 | 4 |
| Hook files | 31 | 10 |
| Pages | 15+ | 7 |
| Fix commits (month 1) | 43+ | < 5 |

---

## Build Order

### Phase 1: Foundation (Now)
1. Scaffold project (Vite + React + Tailwind)
2. Connect to existing Supabase
3. Auth context
4. Basic layout
5. Simple dashboard

### Phase 2: Core Pipeline
1. Ideas page (list, approve, reject)
2. Generate service (Grok)
3. Humanize service (StealthGPT)
4. Articles page (pipeline view)

### Phase 3: Publishing
1. Simple editor (no TipTap)
2. Validation service
3. Publish service
4. Review queue

### Phase 4: Polish
1. Settings page
2. Error handling
3. Loading states
4. Final styling

---

## API Keys (From Dev Config)

```env
VITE_SUPABASE_URL=https://nvffvcjtrgxnunncdafz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROK_API_KEY=xai-...
VITE_STEALTHGPT_API_KEY=... (from settings page)
```

---

## The V8 Mantra

> "If it doesn't directly generate monetizable content, delete it."

Every feature must answer: **"Does this help create articles that make money?"**

If the answer is no, or "maybe later", or "nice to have" - **DELETE IT**.

---

*This specification replaces all previous Phoenix specs. V8 is not V6 with fixes. V8 is a complete rethink.*
