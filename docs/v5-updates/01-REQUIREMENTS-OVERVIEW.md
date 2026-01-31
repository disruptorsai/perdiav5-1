# Perdia v5 Requirements Overview

**Last Updated:** December 3, 2025
**Client:** GetEducated.com
**Stakeholders:** Tony Huffman, Kayleigh Gilbert, Sara, Charity

---

## Executive Summary

Perdia v5 is being refined specifically for GetEducated.com's content production needs. The app must generate high-quality, SEO-optimized content that:
1. Earns AI citations (Google AI Overviews, ChatGPT, etc.)
2. Maintains strict monetization compliance via shortcodes
3. Uses only GetEducated's internal data sources for cost/program information
4. Supports a human-in-the-loop review workflow with eventual automation

---

## P0 - Must-Have Requirements (from Client Meetings)

### 1. Human-in-the-Loop Publishing
- All AI drafts flow into a **Review Queue**
- Editors can request rewrites, then **approve/schedule**
- Any item **auto-publishes after 5 days** if not reviewed (configurable)
- Initially require human review; automation comes after trust is established

### 2. WordPress Integration
- Push **drafts first** (not direct publish) for testing
- Publish only when approved by editors
- All articles must pass validation before WordPress push
- Store WordPress post ID after successful publish

### 3. Shortcode Enforcement (CRITICAL)
- **ALL monetized and outbound links MUST use shortcodes**
- Publishing is BLOCKED if any raw link violates this rule
- Never expose direct affiliate URLs or competitor links
- Shortcodes handle internal links, external citations, and monetization

### 4. Site Understanding & Internal Links
- App must crawl and understand existing GetEducated content:
  - Degree database (36,000+ programs)
  - Ranking reports (cost/fee data)
  - School pages
  - "BURPs" / degree database entries
- Propose **relevant internal links** for each draft (minimum 3)

### 5. External Citations
- Each draft should include at least one **authoritative external reference**
- Allowed: BLS (Bureau of Labor Statistics), government sites, nonprofit education orgs
- **FORBIDDEN**: School .edu websites, competitor sites (onlineu.com, usnews.com, affordablecollegesonline.com, etc.)

### 6. Keyword Manager & Clustering
- Maintain **currently ranked** vs **new target** keywords
- Generate **topic clusters** with briefs
- Support GSC (Google Search Console) data import

### 7. Feedback Loop
- Editor scoring + inline change notes feed the system
- Future drafts should need **fewer edits** over time
- Training data stored and applied to improve prompts

### 8. Throughput Controls
- Start small (~3 articles/day)
- Ramp toward **~100/week** once quality KPIs are stable

---

## P1 - Important (After P0 Stable)

### 1. Persona Framing
- Allowed but must be **clearly labeled as persona** (not real testimonials)
- Example: "Example student persona" vs implying real person

### 2. Basic Dashboards
- Output per week
- Review latency
- Schema/shortcode pass rate
- Internal link coverage
- Keyword movement tracking

### 3. Risk Flags
- Missing schema
- Thin content
- Missing shortcodes
- Low internal-link density
- Unverified cost data

### 4. Image Generation
- Generate or select stock-style images for articles
- Quality must match current site (generic college/online school style)
- Preview for editor approval before publish

---

## P2 - Later/Out of Scope

- Multi-tenant/multi-brand features
- Complex "agent swarms"
- Heavy competitor SERP tooling
- Social-scrape automations
- Chat/collab spaces
- Video content generation

---

## Key Workflow States

### Article Status Pipeline
1. `idea` - Initial concept
2. `drafting` - AI generation in progress
3. `refinement` - AI or human refinement
4. `qa_review` - Human review (Kayleigh/Sara/Tony)
5. `ready_to_publish` - Approved, awaiting publish
6. `published` - Live on WordPress

### Content Ideas Pipeline
1. `pending` - Awaiting approval
2. `approved` - Ready for generation
3. `rejected` - Not to be used
4. `completed` - Article generated

---

## Approved Authors (CRITICAL)

Only these four people can be attributed as authors:
1. **Tony Huffman** - Has author page on site
2. **Kayleigh Gilbert** - Has author page on site
3. **Sara** - Author page to be created
4. **Charity** - Author page to be created

**NEVER use legacy authors** - real people who didn't write AI content don't want their names on it.

**Default until Sara/Charity pages exist:** Tony or Kayleigh

---

## Success Metrics (First 90 Days)

| Metric | Target |
|--------|--------|
| Editorial review time | Median ≤6 minutes |
| Post-publish hotfix rate | ≤10% |
| Shortcode compliance | 100% |
| Raw monetized links | 0 |
| Net new/updated pages | ≥300 |
| Ramp target | ~100/week if quality stable |
| Internal links per article | ≥3 |
| External citations | ≥1 (when relevant) |

---

## Meeting Attendees & Roles

- **Tony Huffman** - Exec Sponsor, sets policy, reviews dashboards
- **Kayleigh Gilbert** - SEO/Content Lead, defines topics, manages keywords/clusters
- **Sara** - Content Editor (daily reviewer), will be on future calls
- **Josh Dennis** - Perdia PM/Integrator
- **Will Welsh** - Perdia Developer

---

## Next Steps

1. Implement shortcode enforcement in publish pipeline
2. Integrate ranking report data as primary cost source
3. Restrict author selection to approved 4
4. Build auto-publish scheduler (5-day default)
5. Create monetization block auto-placement logic
6. Refine prompts based on Kayleigh's "Rules for GE Content"
