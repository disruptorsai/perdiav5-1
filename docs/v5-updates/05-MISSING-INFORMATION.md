# Missing Information & Documents Needed

**Last Updated:** December 3, 2025
**Status:** Partially resolved - monetization data imported

This document tracks what additional information is needed from the client to complete implementation.

---

## CRITICAL - Blocking Implementation

### 1. WordPress Example Article HTML
**Status:** Requested but not received
**Source:** Kayleigh sent preview URL but requires WordPress login

**What we need:**
- Raw HTML/text content from: `https://www.geteducated.com/?page_id=173562&preview=true#/`
- This shows exact shortcode syntax used for:
  - Monetization blocks
  - Internal links
  - External links

**How to get it:**
- Login to WordPress admin
- Go to the article in edit mode
- Switch to "Code Editor" or "Text" view
- Copy the entire content
- Share as text file or paste directly

**Why it's critical:**
Without the exact shortcode format, we cannot:
- Build the shortcode generator
- Validate shortcode compliance
- Auto-place monetization blocks

---

### 2. Monetization Spreadsheet Data Import
**Status:** COMPLETED
**Source:** School_Degree Category_Subject Organization - IPEDS.xlsx

**What was imported:**
- 155 unique category/concentration pairs
- 13 degree levels (Associate through Doctorate)
- Covers all major fields: Business, Education, Healthcare, Engineering, etc.

**Implementation:**
- Data exported to `data/monetization-categories.json` and `data/monetization-levels.json`
- Supabase migrations created:
  - `20250103000000_add_monetization_tables.sql` - Creates tables
  - `20250103000001_seed_monetization_data.sql` - Seeds all data

**Shortcode format (to be confirmed):**
```
[ge_degrees category_id="9" concentration_id="90" level="4"]
```
Where: category_id=Business(9), concentration_id=Business Administration(90), level=Master(4)

---

### 3. Business Model / Monetization Explanation
**Status:** Requested but not received
**Source:** Asked Tony & Kayleigh to record voice note

**What we need:**
- Explanation of:
  - How GetEducated makes money
  - Paid vs free school relationships
  - When traffic can/cannot be sent off-site
  - How to balance paid vs non-paid schools in content
  - Cost information strategy

**How to get it:**
- Record a phone/voice memo (5-10 minutes)
- Send audio file and/or transcript
- Or type out explanation in email

**Why it's critical:**
This becomes the "brain" for:
- AI prompt rules
- Validation logic
- Link policy decisions

---

## IMPORTANT - Needed for Full Implementation

### 4. Ranking Report Data Schema
**Status:** Can scrape, but structured export preferred

**What we need:**
- Sample ranking report data in structured format (CSV/JSON)
- Fields: Program, School, Degree Level, Total Cost, In-State Cost, Out-of-State Cost, Accreditation, etc.

**Fallback:**
We can build a scraper to extract from the ranking report pages if no export exists.

---

### 5. Degree Database Schema
**Status:** Can scrape, but structured export preferred

**What we need:**
- Export of degree database if available
- Fields: Degree Type, Level, School, URL, Is Sponsored, Category, Concentration

**Fallback:**
We can crawl https://www.geteducated.com/online-degrees/ to build this data.

---

### 6. School Database Schema
**Status:** Can scrape, but structured export preferred

**What we need:**
- Export of school database if available
- Fields: School Name, GetEducated URL, Is Paid Client, Programs, Logo/Sponsored Status

**Fallback:**
We can crawl https://www.geteducated.com/online-schools/ to build this data.

---

### 7. Forum URL
**Status:** Mentioned in meeting but URL not provided

**What we need:**
- Base URL for the GetEducated forums
- 3-5 example threads that show good first-hand experiences

**Why it matters:**
Could be used for:
- Sourcing real-world experiences for content
- Training AI on authentic student voices
- Creating proper attribution for testimonials

---

## NICE TO HAVE - Polish Items

### 8. Internal SEO Guidelines
**Status:** Not requested yet

**What we need:**
- Any internal documents about SEO strategy
- E-E-A-T checklists if they exist
- Content style guides beyond what Kayleigh sent

---

### 9. Author Profile Pictures
**Status:** Kayleigh said she'll send

**What we need:**
- Profile photos for: Tony, Kayleigh, Sara, Charity
- For WordPress author pages and app display

---

### 10. WordPress API Credentials
**Status:** Exists in .env.local but needs verification

**What we need:**
- Confirmation that current credentials are valid
- Test that draft push works correctly
- Verify permission scopes for publishing

---

## Summary Checklist for Client

Please provide the following (in order of priority):

- [ ] **WordPress article HTML** - Raw content showing shortcodes
- [ ] **Monetization spreadsheet export** - XLSX download of the Google Sheet
- [ ] **Business model explanation** - Voice note or written summary
- [ ] **Forum URL** - Link to GetEducated forums
- [ ] **Author photos** - Pictures of Tony, Kayleigh, Sara, Charity

Optional but helpful:
- [ ] Ranking report data export (if available)
- [ ] Degree database export (if available)
- [ ] School database export (if available)
- [ ] Any internal SEO/content guidelines

---

## What We Can Do Without These

While waiting for the above, we can:

1. **Implement author restriction** - Lock to 4 approved authors
2. **Build link validation** - Block competitors and .edu links
3. **Create auto-publish scheduler** - 5-day rule infrastructure
4. **Improve risk scoring** - Based on existing quality metrics
5. **Build ranking report scraper** - Extract data ourselves
6. **Build degree/school database scrapers** - Extract data ourselves

What we CANNOT do until we have items 1-3:
- Implement monetization shortcode system
- Complete shortcode validation
- Finalize publish pipeline
