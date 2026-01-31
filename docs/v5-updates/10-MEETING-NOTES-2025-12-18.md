# Meeting Notes: December 18, 2025

**Attendees:** Tony (GetEducated Owner), Justin (Site Developer), Will (Perdia), Josh (Perdia)

**Summary:** Technical integration meeting covering site crawling, WordPress integration, shortcodes, author mapping, and content prioritization.

---

## Critical Action Items

### 1. Site Catalog - Missing Online Degrees Section (HIGH PRIORITY)

**Problem:** The current site catalog only has ~1,047 articles but is MISSING the entire `/online-degrees/` section, which is the **most important section for monetization**.

**Current State:**
- Crawled: ~1,047 WordPress articles/pages
- Missing: Entire `/online-degrees/` directory (school pages)
- WordPress shows: 1,128 pages + 32 blog posts

**Action Required:**
- Crawl the sitemap daily (it's public and rebuilt daily)
- Include everything under `geteducated.com/online-degrees/`
- Justin confirmed they removed ~40,000 degree-level pages, so now it's just school pages
- Use the sitemap as the **source of truth** for all URL whitelisting

**Implementation Notes:**
- The 40,000 degree pages (`/online-degrees/school-name/degree-name/`) were removed
- Now only school-level pages remain
- Sitemap contains 200 OK pages, up to date

### 2. Sponsored/Paid School Detection (HIGH PRIORITY)

**Problem:** AI is suggesting content for degrees/schools that can't be monetized.

**How to Identify Paid Schools:**
1. **Logo presence:** If a school logo is displayed (not placeholder), it's a paid client
2. **Priority field:** `school_priority >= 5` means paid client
3. **Sort order:** Higher sort order = higher priority client
4. **LD+JSON metadata:** Pages contain structured data that can be scraped

**Visual Indicator:**
- Pages with logos at top = paid/sponsored schools
- No logo = cannot monetize this area
- Example given: `/online-degrees/religion/pastoral-counseling/associate/` - no logo, no monetization

**Action Required:**
- When crawling, detect logo presence or `is_sponsor: true` flag
- Prioritize content creation for sponsored listings only
- Cross-reference with the paid clients spreadsheet Tony sent

### 3. WordPress Article Contributor Mapping (HIGH PRIORITY)

**Current System (DON'T USE):** Standard WordPress `post_author` field

**Correct System (MUST USE):** Custom meta keys for article contributors

**Required Meta Keys to Set:**
```
written_by = [contributor_id]
```

**Contributor IDs (from Justin's chat):**
| Name | Role | ID |
|------|------|-----|
| Tony Huffman | Ranking reports, data analysis, affordability, best buys | TBD - need from Justin |
| Kayleigh Gilbert | Professional programs, healthcare, social work, nursing | 4 (mentioned) |
| Sara Raines | STEM, Technical Education, Career Pathways | TBD - need from Justin |
| Charity | Teaching degrees, education careers | TBD - need from Justin |

**Action Required:**
- Get exact contributor IDs from Justin
- Set `written_by` meta key when publishing to WordPress
- Map content types to appropriate contributors based on topic

### 4. Shortcode System (HIGH PRIORITY)

**Critical Rule:** NEVER output raw affiliate URLs. ALWAYS use shortcodes.

**Why:** If a school goes away, all their links break. Shortcodes allow centralized management.

**Primary Shortcodes to Implement:**

1. **GE-CTA (Call to Action)** - Most important for monetization
2. **GE-QDF** - Quick Data Facts
3. **GE-PICS** - School logos with width control
4. **Blog page linking**
5. **Article post linking**

**Documentation Location:**
- Stage site: `stage.geteducated.com/shortcodes` (requires basic auth)
- Credentials: `ge2022` / `!educated`
- Contains AI training block with all shortcode specs

**Additional Resources:**
- WP Bakery shortcodes (page builder - tables, columns, mobile/desktop layouts)
- Gem theme shortcodes (flashy design elements)

**Action Required:**
- Crawl the shortcodes page for full specs
- Add all shortcodes to the whitelist in settings
- Ensure AI never outputs raw URLs, only shortcodes

### 5. Content Prioritization Change (HIGH PRIORITY)

**Problem:** AI was looking at old articles for inspiration, but many old articles are for topics that can't be monetized.

**Old Approach (Wrong):**
1. Look at existing articles on the site
2. Find related search queries
3. Generate similar content

**New Approach (Correct):**
1. Start with `/online-degrees/` directory
2. Identify which schools/degrees are SPONSORED (have logos, priority >= 5)
3. Work backwards to find content opportunities for those paid areas
4. Then validate with search query research

**Key Insight:** "We were writing a bunch of stuff that we couldn't monetize" - existing articles are not a reliable indicator of what to write about.

---

## Medium Priority Items

### 6. N8N/Webhook Publishing Flow

**Confirmed Approach:**
- App pushes to N8N webhook when article is ready to publish
- N8N uses WordPress API to create/update posts
- Need dedicated system account credentials (not personal accounts)

**Account Setup Required:**
- Create new WordPress account specifically for Perdia automation
- Separate from human user accounts for tracking purposes

**Throttling Requirement:**
- Justin recommended: ~5 posts per minute maximum
- Start with 5/day during testing
- Ramp up slowly to ~100/week when stable

### 7. Stage Enforcement / Auto-Publish

**Current Plan Confirmed:**
- Manual: Generate articles, require human approval before publish
- Semi-Auto: Generate articles automatically, human clicks publish
  - If unreviewed for 10+ days, auto-publish (configurable)
- Full-Auto: Generate and publish without human intervention

**Start State:** Manual mode until articles are consistently good

### 8. AI Revision Issues

**Reported Problems:**
1. Kayleigh tried revisions but AI wasn't doing what she asked
2. AI referenced old ranking report versions (2020, 2022) instead of current (2024)
3. AI would ignore corrections like "use the updated version"

**Possible Causes:**
- StealthGPT humanization adding random imperfections
- Site catalog not having all pages (now understood)
- Need to use sitemap's `lastmod` date to prefer newer content

**Suggested Enhancement:**
- Add "AI reasoning" output that explains why it wrote the article the way it did
- Would help debug issues and dial in prompts

### 9. Domain Enforcement / Link Rules

**Confirmed Rules:**
- Block competitor sites (onlineu.com, usnews.com, etc.)
- Allow government/nonprofit sources (BLS, etc.)
- GetEducated internal links should use shortcodes
- Never link directly to .edu sites

**Action Required:**
- Add domain enforcement to the tone/voice settings area
- Create explicit blacklist of competitor domains

### 10. Model Selection & Temperature

**Current Setup:**
- Grok: Default for content (most up-to-date, more human-sounding)
- Claude: Available as alternative (less hallucination-prone)
- Temperature: 0.7 (AI-recommended sweet spot)

**Justin's Notes:**
- Grok is more prone to hallucination
- Temperature 1.0 = "absolute hallucination acid mode"
- Try Claude if Grok produces problematic content

**Recommendation:** Keep 0.7 default, but document that Tony can adjust if articles are too bland (increase) or too creative (decrease).

---

## Technical Specifications from Justin

### LD+JSON Structured Data
- Pages contain rich metadata in LD+JSON format
- Can be scraped for school/program information
- Use for automated data extraction

### Sitemap
- Public: `geteducated.com/sitemap.xml`
- Rebuilt daily
- Contains `lastmod` timestamps
- Should be the source of truth for URL whitelisting

### WordPress Custom Fields
```
Meta Key: written_by
Value: [article_contributor_id]
```

Must be set when creating/updating posts for proper author attribution.

### Stage Site Access
- URL: `stage.geteducated.com`
- Basic Auth: `ge2022` / `!educated`
- Contains shortcode documentation at `/shortcodes`

---

## Questions to Resolve

1. **Exact Contributor IDs:** Need the numeric IDs for Tony, Kayleigh, Sara, and Charity from WordPress
2. **Complete Shortcode List:** Need to crawl stage site for full specifications
3. **Sitemap Format:** Verify we can extract all needed metadata (sponsor status, priority, logos)
4. **Revision Caps:** Justin mentioned they cap revisions at 5 on WordPress side

---

## Implementation Priority Order

1. **Immediate (Before Next Test):**
   - Add `/online-degrees/` to site catalog crawl
   - Implement sitemap-based URL sourcing (daily refresh)
   - Add sponsored/paid school detection

2. **This Week:**
   - Implement proper `written_by` meta key in WordPress publishing
   - Add all shortcodes from stage site documentation
   - Add AI reasoning/thinking output for debugging

3. **Before Semi-Auto Mode:**
   - Complete domain enforcement blacklist
   - Add throttling to publish flow (5/minute max)
   - Set up dedicated WordPress system account

4. **Ongoing:**
   - Monitor for hallucination issues
   - Tune temperature settings based on output quality
   - Build out WP Bakery/Gem theme shortcode support for enhanced formatting
