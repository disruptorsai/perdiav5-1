# Monetization Implementation Specification

**Last Updated:** December 3, 2025

---

## Overview

GetEducated has a specific monetization system that uses WordPress shortcodes to display degree offers within articles. The AI must learn to:
1. Select appropriate degree offers based on article topic
2. Output correct shortcode markup
3. Place monetization blocks in appropriate article locations

---

## Monetization Spreadsheet Structure

**Source:** https://docs.google.com/spreadsheets/d/1s2A1Nt5OBkCeFG0vPswkh7q7Y1QDogoqlQPQPEAtRTw/edit

### Tab 1: Categories & Concentrations
- **Column B:** Category
- **Column C:** Category code/identifier
- **Column D:** Concentration

The AI selects ONE value from each of columns B, C, and D to determine which degree offers to show.

### Tab 2: Levels
- Contains degree level codes (Associate, Bachelor's, Master's, Doctorate, Certificate, etc.)

---

## Shortcode Types

Based on Kayleigh's documentation, the system uses shortcodes for:

### 1. Monetization Shortcodes
Display sponsored degree offers based on category/concentration/level selection.

Expected format (to be confirmed from WordPress example):
```
[ge_monetization category="X" concentration="Y" level="Z"]
```

### 2. Internal Link Shortcodes
Links to GetEducated degree pages and school pages.

Expected format:
```
[ge_internal_link url="/path"]Anchor Text[/ge_internal_link]
```

### 3. External Link Shortcodes
Links to approved external sources (BLS, government sites).

Expected format:
```
[ge_external_cited url="https://www.bls.gov/..."]BLS Source[/ge_external_cited]
```

---

## Selection Logic

### How the AI Should Choose Degree Offers

1. **Identify Article Topic**
   - What degree type is discussed?
   - What field/concentration?
   - What level (Master's, Bachelor's, etc.)?

2. **Map to Spreadsheet Values**
   - Match topic to Column B (Category)
   - Match specialization to Column D (Concentration)
   - Match level from Tab 2

3. **Generate Shortcode**
   - Combine the three selections
   - Output properly formatted shortcode

### Placement Rules

Monetization blocks typically appear:
- After the introduction section
- Within relevant content sections
- Before or after program listings
- Near call-to-action areas

---

## Current Manual Process

Kayleigh's current workflow:
1. Opens an article in WordPress
2. Selects appropriate row from monetization spreadsheet
3. Manually creates shortcode with B/C/D values
4. Pastes into article at appropriate location
5. Previews to verify correct offers display

**Goal:** Automate this entire process within Perdia.

---

## Implementation Requirements

### Data Model

```sql
-- Monetization options table
CREATE TABLE monetization_categories (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  category_code TEXT,
  concentration TEXT,
  level TEXT,
  shortcode_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article monetization placements
CREATE TABLE article_monetization (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  category_id UUID REFERENCES monetization_categories(id),
  position_in_article TEXT, -- 'intro_after', 'mid_content', 'pre_conclusion'
  shortcode_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Validation Rules

1. **Pre-Publish Check:**
   - Every article must have at least one monetization block
   - All monetization must use shortcodes (no raw links)
   - Category/concentration must be valid (exist in spreadsheet)

2. **Blocking Errors:**
   - Raw affiliate URLs → BLOCK PUBLISH
   - Invalid category codes → BLOCK PUBLISH
   - Missing monetization entirely → WARNING (may proceed)

### AI Prompt Requirements

The generation prompt must include:
```
When creating content, you must:
1. Identify the appropriate monetization category based on the article topic
2. Select matching concentration from the approved list
3. Generate shortcode in format: [ge_monetization category="X" concentration="Y" level="Z"]
4. Place the shortcode block after the introduction and/or in relevant content sections
5. NEVER output raw URLs to affiliate partners
```

---

## Sponsored Listing Integration

### What "Sponsored Listing" Means
- Schools/degrees that pay GetEducated for promotion
- Displayed with logo in degree database
- Should be emphasized in article content
- Still include non-sponsored for user value, but prioritize sponsored

### Detection
When generating content:
1. Check if program/school has `is_sponsored: true` flag
2. If sponsored, include in featured positions
3. Add "Sponsored" badge/indicator where appropriate

### Business Rule
- Sponsored programs can be linked and promoted
- Non-sponsored programs can be mentioned for editorial balance
- BUT never send traffic off-site to non-sponsored schools

---

## WordPress Preview Article

**URL:** https://www.geteducated.com/?page_id=173562&preview=true#/

This article contains:
- All content in one text block
- Examples of shortcodes for monetization
- Examples of internal/external link shortcodes
- Actual HTML structure used

**NOTE:** Requires WordPress login to view. Need to extract actual shortcode examples.

---

## Information Still Needed

To complete this specification, we need:

1. **Exact shortcode syntax** from the WordPress preview article
2. **Full spreadsheet data** (categories, concentrations, levels)
3. **Shortcode-to-offer mapping** (how shortcode params translate to displayed offers)
4. **Screenshot of rendered monetization block** (what it looks like on the site)

---

## Integration with Perdia

### Generation Service Changes

```javascript
// In generationService.js
async selectMonetization(articleTopic, degreeLevel) {
  // 1. Match topic to category
  const category = await this.matchCategory(articleTopic);

  // 2. Match to concentration
  const concentration = await this.matchConcentration(articleTopic, category);

  // 3. Generate shortcode
  const shortcode = `[ge_monetization category="${category.code}" concentration="${concentration.code}" level="${degreeLevel}"]`;

  return {
    shortcode,
    position: 'after_intro',
    category,
    concentration
  };
}
```

### Validation Service

```javascript
// New validation check
function validateMonetization(articleHtml) {
  const errors = [];

  // Check for raw affiliate URLs
  const rawAffiliatePattern = /href=["']https?:\/\/(partner|affiliate|click)\./gi;
  if (rawAffiliatePattern.test(articleHtml)) {
    errors.push({
      type: 'BLOCKING',
      message: 'Raw affiliate URLs detected - must use shortcodes'
    });
  }

  // Check for monetization shortcode presence
  const hasMonetization = /\[ge_monetization/.test(articleHtml);
  if (!hasMonetization) {
    errors.push({
      type: 'WARNING',
      message: 'No monetization shortcode found'
    });
  }

  return errors;
}
```

---

## Testing Checklist

- [ ] Import monetization spreadsheet data to database
- [ ] Create category/concentration matching logic
- [ ] Generate correct shortcode syntax
- [ ] Place shortcodes in correct article positions
- [ ] Validate no raw affiliate links on publish
- [ ] Test with sample articles from each content type
- [ ] Verify shortcodes render correctly in WordPress preview
