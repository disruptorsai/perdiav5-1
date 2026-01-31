# Tony Feedback Action Plan - December 2025

**Created:** 2025-12-17
**Reference:** Tony's email feedback dated December 15, 2025

---

## Summary of Issues Raised by Tony

1. **Shortcodes are completely wrong** - We were generating fake shortcodes that don't exist in WordPress
2. **Content not monetization-focused** - AI generating content for topics that can't monetize (e.g., "space tourism careers")
3. **AI not learning from Kayleigh's feedback** - Same errors keep recurring
4. **Missing paid schools awareness** - AI doesn't know which schools are paid clients
5. **Ranking link issues** - Wrong dates, incorrect URLs, mismatched topics
6. **Missing BERP/school links** - Content rules not being followed

---

## What We've Fixed (Completed)

### 1. Shortcode System Rewrite

**Files Changed:**
- `src/services/shortcodeService.js` - Complete rewrite
- `src/services/monetizationEngine.js` - Updated to use correct shortcodes
- `src/services/ai/grokClient.js` - Updated prompts to not generate fake shortcodes
- `src/services/validation/prePublishValidation.js` - Updated validation

**Old (WRONG) Shortcodes:**
```
[degree_table category="8" concentration="384" level="4" max="3" sponsored_first="true"]
[degree_offer program_id="X" school_id="Y" highlight="true"]
[ge_monetization category_id="X" concentration_id="Y"]
[ge_internal_link url="/path"]text[/ge_internal_link]
[ge_external_cited url="https://..."]text[/ge_external_cited]
```

**New (CORRECT) GetEducated Shortcodes:**
```
[su_ge-picks category="8" concentration="18" level="2" header="GetEducated's Picks" cta-button="View More Degrees" cta-url="/online-degrees/bachelor/..."][/su_ge-picks]

[su_ge-cta type="link" cta-copy="SNHU" school="22742"]SNHU[/su_ge-cta]

[su_ge-cta type="link" cta-copy="SNHU MBA" school="22742" degree="315964"]SNHU MBA[/su_ge-cta]

[su_ge-cta type="link" cta-copy="link text" url="/internal-path/"]link text[/su_ge-cta]

[su_ge-cta type="link" cta-copy="BLS" url="https://bls.gov/" target="blank"]BLS[/su_ge-cta]

[su_ge-qdf type="simple" header="Browse Now"][/su_ge-qdf]
```

**Validation Changes:**
- Legacy shortcodes (our old fake ones) are now BLOCKED from publishing
- Unknown shortcodes are BLOCKED from publishing
- Missing monetization shortcodes BLOCK publishing
- Clear error messages explaining what needs to be fixed

---

## What Still Needs To Be Done

### Priority 1: WordPress ID Mapping (BLOCKING)

**Problem:** The `[su_ge-cta]` shortcode for school/degree links requires WordPress IDs:
- `school="22742"` - WordPress school ID
- `degree="315964"` - WordPress degree ID

We don't have access to these IDs. Our database has school names but not WordPress IDs.

**What We Need From Tony/Justin:**
1. Export of WordPress school IDs mapped to school names
2. Export of WordPress degree IDs mapped to degree/school names
3. OR API access to query WordPress for these IDs
4. OR a mapping file we can import

**Files That Need This:**
- `src/services/shortcodeService.js` - `generateSchoolLinkShortcode()` and `generateDegreeLinkShortcode()`
- Database tables `schools` and `degrees` need `wordpress_id` column

---

### Priority 2: Import Paid Schools Data

**Current State:**
- We have `docs/client/List of Client Schools and Degrees for AI Training.xlsx`
- Database schema exists with `is_paid_client` and `is_sponsored` fields
- Import script exists at `scripts/import-geteducated-data.js`
- Data has NOT been imported yet

**Questions for Tony:**
1. Is the Excel file in `docs/client/` the latest paid schools list?
2. Tony mentioned attaching an updated list to his email - do we have it?
3. Should Sara send us a fresh export?

**Action Items:**
- [ ] Get confirmation on which file is the latest
- [ ] Convert Excel to CSV format
- [ ] Run import script
- [ ] Verify data in Supabase
- [ ] Update AI prompts to include paid schools context

---

### Priority 3: Monetization-First Content Strategy

**Tony's Core Concern:**
> "Content articles for the sake of articles and traffic isn't the goal, its content and traffic we can monetize."

**Current Problem:**
The idea generation system finds trending topics first, then tries to add monetization. This is backwards.

**Required Approach:**
1. Start with what paid schools/degrees exist
2. Map those to potential article topics
3. THEN validate search volume
4. Generate content that naturally monetizes

**Implementation Plan:**
1. Create a "Monetizable Topics" discovery query that:
   - Queries paid schools and their degree offerings
   - Groups by category/concentration
   - Identifies gaps in content coverage

2. Update idea generation to:
   - Accept "monetization constraints"
   - Score ideas by monetization potential
   - Reject ideas that can't monetize

3. Add UI indicator showing monetization potential for each idea

**Files to Modify:**
- `src/services/ideaDiscoveryService.js` - Add monetization-aware idea generation
- `src/services/ai/grokClient.js` - Update `generateIdeas()` method
- Dashboard UI to show monetization potential

---

### Priority 4: Feedback/Learning System

**Tony's Concern:**
> "it's not 'fixing' things that Kayleigh is mentioning so it seems to not be correcting and learning and getting better"

**Current State:**
- No feedback tracking mechanism
- Kayleigh marks issues but they're not stored
- Same errors recur

**Proposed Solution:**

1. **Create Feedback Database Table:**
```sql
CREATE TABLE editor_feedback (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  feedback_type TEXT, -- 'correction', 'issue', 'pattern'
  issue_category TEXT, -- 'ranking_link', 'school_mention', 'hallucination', 'formatting'
  original_text TEXT,
  corrected_text TEXT,
  notes TEXT,
  editor_name TEXT,
  created_at TIMESTAMPTZ
);
```

2. **Add Feedback UI:**
   - Button to mark text as "Issue"
   - Quick categorization (dropdown)
   - Optional notes field

3. **Pattern Recognition:**
   - Aggregate common issues
   - Generate "Known Issues" context for AI prompts
   - Weekly report of recurring issues

**Questions:**
- Would Tony/Kayleigh use a simple feedback UI in the app?
- What categories of issues do they see most often?

---

### Priority 5: Ranking Links Accuracy

**Issues Kayleigh Found:**
- Pulling incorrect info (wrong dates despite being told)
- Not linking to ranks where opportunities exist
- Linking to incorrect rank URLs
- Linking to ranks that don't make sense for article topic

**Root Causes:**
1. Ranking data may be stale
2. AI doesn't have enough context about available rankings
3. No validation of ranking URLs before use

**Action Items:**
- [ ] Audit current ranking data in database
- [ ] Create ranking URL validation function
- [ ] Update AI prompts with ranking link rules
- [ ] Add "Available Rankings" context to generation prompts
- [ ] Consider: ranking data crawler to keep data fresh

**Questions for Tony:**
1. Where should we source ranking data from? Just the sitemap URLs?
2. Is there a database export of all ranking reports with their URLs and dates?
3. How often do ranking reports get updated?

---

### Priority 6: CTA URL Construction

**Problem:** The `cta-url` parameter in `[su_ge-picks]` needs the correct URL path.

**Example from Tony:**
```
cta-url="/online-degrees/bachelor/art-liberal-arts/art-architecture/"
```

**Questions:**
1. How do we construct this URL from category/concentration IDs?
2. Is there a mapping or formula?
3. Does the URL structure follow a consistent pattern?

**Current Assumption:**
```
/online-degrees/{level}/{category-slug}/{concentration-slug}/
```

But we need confirmation this is correct.

---

## Data We Need From Client

| Item | Who Can Provide | Priority |
|------|-----------------|----------|
| WordPress School ID mapping | Justin/Tony | CRITICAL |
| WordPress Degree ID mapping | Justin/Tony | CRITICAL |
| Latest paid schools list | Sara/Tony | HIGH |
| CTA URL construction rules | Justin/Tony | HIGH |
| Ranking reports export with URLs | Tony/Sara | HIGH |
| Feedback on UI for editor corrections | Tony/Kayleigh | MEDIUM |

---

## Questions for Tony

### Immediate Questions

1. **WordPress IDs:** Can Justin provide a mapping of school names → WordPress IDs and degree names → WordPress IDs? The shortcodes won't work without these.

2. **Paid Schools File:** Is `docs/client/List of Client Schools and Degrees for AI Training.xlsx` the latest? Or did you attach a newer version?

3. **CTA URLs:** How do we construct the `cta-url` parameter? Is it always `/online-degrees/{level}/{category}/{concentration}/`?

### Follow-up Questions

4. **Ranking Data Source:** Where should we get the definitive list of ranking reports and their URLs?

5. **Feedback System:** Would Kayleigh use a built-in feedback system to mark issues she finds? This would help us track patterns.

6. **Content Approval:** Should all content go through Kayleigh before publishing, or only certain types?

---

## Timeline Estimate

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | Fix shortcode system | ✅ DONE |
| Phase 2 | Import paid schools data | ⏳ Waiting for data confirmation |
| Phase 3 | WordPress ID integration | ⏳ Waiting for ID mapping |
| Phase 4 | Monetization-first content strategy | 🔜 Ready to start |
| Phase 5 | Feedback/learning system | 🔜 Needs client input |
| Phase 6 | Ranking links accuracy | 🔜 Needs data audit |

---

## Files Changed in This Update

1. `src/services/shortcodeService.js` - Complete rewrite with correct GetEducated shortcodes
2. `src/services/monetizationEngine.js` - Updated to use new shortcode functions
3. `src/services/ai/grokClient.js` - Updated prompts to prevent fake shortcode generation
4. `src/services/validation/prePublishValidation.js` - Added legacy shortcode detection and blocking
5. `docs/v5-updates/10-TONY-FEEDBACK-ACTION-PLAN.md` - This document

---

## Test Cases for QA

After deploying these changes, test:

1. **New articles should NOT have these shortcodes:**
   - `[degree_table ...]`
   - `[degree_offer ...]`
   - `[ge_monetization ...]`
   - `[ge_internal_link ...]`
   - `[ge_external_cited ...]`

2. **Publishing should BLOCK if:**
   - Any of the above legacy shortcodes are found
   - No `[su_ge-picks]` or `[su_ge-qdf]` shortcodes present
   - Unknown shortcode patterns detected

3. **Correct shortcode generation:**
   - `generateGePicksShortcode()` produces `[su_ge-picks ...]` format
   - `generateInternalLinkShortcode()` produces `[su_ge-cta type="link" url="..."]` format
   - `generateExternalLinkShortcode()` produces `[su_ge-cta ... target="blank"]` format

---

## Next Steps

1. **Will to Tony:** Send this document and the specific questions
2. **Wait for:** WordPress ID mapping, paid schools confirmation
3. **Then:** Import data and continue with Phase 3+
