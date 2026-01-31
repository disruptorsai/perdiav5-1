# Shortcode System Specification

**Created:** December 18, 2025
**Source:** Technical meeting with Justin (GetEducated Developer)

---

## Overview

GetEducated uses WordPress shortcodes for all monetization links. The AI **MUST NEVER** output raw affiliate URLs - only shortcodes.

**Justin's Quote:**
> "If you guys are not doing that and we just have a bunch of AA drivers scattered about and a school goes away—it's a problem, so we've consolidated all of our links into the shortcodes."

## Stage Site Documentation

Full shortcode documentation is available at:

**URL:** `https://stage.geteducated.com/shortcodes`

**Authentication:**
- Username: `ge2022`
- Password: `!educated`

This page contains AI training blocks with full specifications for each shortcode.

## Critical Shortcodes

### 1. GE-CTA (Call to Action) - MOST IMPORTANT

The primary monetization shortcode for degree offers.

```
[ge_cta category="business" concentration="mba" level="masters"]
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| category | Yes | Main category (business, nursing, education, etc.) |
| concentration | Yes | Specific concentration/specialization |
| level | Yes | Degree level (associate, bachelors, masters, doctorate, certificate) |
| max | No | Maximum offers to display (default: 5) |
| style | No | Display style (list, grid, cards) |

**Example Usage:**
```html
<p>If you're interested in earning your MBA online, explore these accredited programs:</p>

[ge_cta category="business" concentration="mba" level="masters" max="5"]

<p>These programs offer flexible scheduling for working professionals.</p>
```

### 2. GE-QDF (Quick Data Facts)

Displays data facts/statistics block.

```
[ge_qdf topic="nursing" stat_type="salary"]
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| topic | Yes | Topic for facts |
| stat_type | No | Type of statistic (salary, growth, employment) |

### 3. GE-PICS (School Logos)

Displays school logos with controlled width.

```
[ge_pics school="university-of-phoenix" width="200"]
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| school | Yes | School slug |
| width | No | Logo width in pixels (default: 150) |

### 4. Internal Link Shortcode

For links to GetEducated pages:

```
[ge_internal_link url="/online-degrees/nursing/bsn/"]Learn about BSN programs[/ge_internal_link]
```

**RULE:** All internal links MUST use this shortcode, not raw `<a>` tags.

### 5. External Cited Link

For links to external sources (BLS, government sites):

```
[ge_external_cited url="https://www.bls.gov/ooh/healthcare/" source="BLS"]Bureau of Labor Statistics[/ge_external_cited]
```

## Additional Resources

### WP Bakery Shortcodes

The site uses WP Bakery page builder, which provides additional formatting shortcodes:

- Tables
- Columns (2-col, 3-col, 4-col)
- Desktop/mobile visibility toggles
- Accordions
- Tabs

**Documentation:** See stage site WP Bakery docs

### Gem Theme Shortcodes

The Gem theme provides flashy design elements:

- Call-out boxes
- Feature boxes
- Icon boxes
- Testimonials
- Progress bars

**Documentation:** See stage site Gem theme docs

## Implementation in Perdia

### Shortcode Whitelist

Only these shortcodes should be generated:

```javascript
// src/services/shortcodeService.js

export const APPROVED_SHORTCODES = [
  // Monetization (Critical)
  'ge_cta',
  'ge_monetization',  // Legacy alias for ge_cta
  'ge_qdf',
  'ge_pics',

  // Links
  'ge_internal_link',
  'ge_external_cited',

  // Layout (WP Bakery)
  'vc_column',
  'vc_row',
  'vc_column_text',
  'vc_tta_accordion',
  'vc_tta_tabs',

  // Gem Theme
  'gem_button',
  'gem_textbox',
  'gem_icon_box',

  // Blog/Article
  'blog_page',
  'article_post'
]

export function isApprovedShortcode(shortcode) {
  const tagMatch = shortcode.match(/^\[(\w+)/)
  if (!tagMatch) return false
  return APPROVED_SHORTCODES.includes(tagMatch[1])
}
```

### Shortcode Validation

```javascript
/**
 * Validate all shortcodes in content
 * @param {string} content - HTML content with shortcodes
 * @returns {Object} Validation result
 */
export function validateShortcodes(content) {
  const shortcodePattern = /\[(\w+)[^\]]*\]/g
  const issues = []
  const found = []

  let match
  while ((match = shortcodePattern.exec(content)) !== null) {
    const shortcodeTag = match[1]
    found.push(shortcodeTag)

    if (!APPROVED_SHORTCODES.includes(shortcodeTag)) {
      issues.push({
        type: 'BLOCKING',
        message: `Unknown shortcode: [${shortcodeTag}] - May be hallucinated`,
        shortcode: match[0]
      })
    }
  }

  // Check for required monetization
  const hasMonetization = found.some(s =>
    ['ge_cta', 'ge_monetization'].includes(s)
  )

  if (!hasMonetization) {
    issues.push({
      type: 'WARNING',
      message: 'No monetization shortcode found in content'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'BLOCKING').length === 0,
    issues,
    shortcodesFound: [...new Set(found)]
  }
}
```

### AI Prompt Rules

Add these rules to AI generation prompts:

```javascript
const SHORTCODE_PROMPT_RULES = `
## Shortcode Requirements

CRITICAL: You MUST use shortcodes for ALL monetization and links. NEVER output raw URLs.

### Monetization Shortcodes (Required)
Every article MUST include at least one monetization shortcode:
[ge_cta category="X" concentration="Y" level="Z"]

Place monetization shortcodes:
- After the introduction (1st placement)
- In the middle of the article (2nd placement)
- Before the FAQ section (3rd placement)

### Link Shortcodes (Required)
For internal GetEducated links:
[ge_internal_link url="/path"]Anchor Text[/ge_internal_link]

For external source citations:
[ge_external_cited url="https://..." source="BLS"]Source Name[/ge_external_cited]

### Forbidden
- Raw affiliate URLs (e.g., https://tracking.partner.com/...)
- Plain <a> tags to GetEducated pages
- Unknown/made-up shortcodes
- Links to competitor sites

### Approved Shortcodes Only
Only use these shortcode tags:
- ge_cta, ge_monetization, ge_qdf, ge_pics
- ge_internal_link, ge_external_cited
- vc_column, vc_row, vc_column_text
- gem_button, gem_textbox
`
```

## Shortcode Placement Rules

### Monetization Placement

```javascript
/**
 * Auto-insert monetization shortcodes at appropriate positions
 */
export function insertMonetizationShortcodes(content, options) {
  const { category, concentration, level } = options
  const shortcode = `[ge_cta category="${category}" concentration="${concentration}" level="${level}"]`

  // Find insertion points
  const insertionPoints = []

  // 1. After first H2 (post-introduction)
  const firstH2 = content.indexOf('</h2>')
  if (firstH2 !== -1) {
    insertionPoints.push({
      position: firstH2 + 5,
      label: 'after_intro'
    })
  }

  // 2. After third H2 (mid-content)
  let h2Count = 0
  let searchPos = 0
  while (h2Count < 3) {
    const h2Pos = content.indexOf('</h2>', searchPos)
    if (h2Pos === -1) break
    h2Count++
    searchPos = h2Pos + 5
    if (h2Count === 3) {
      insertionPoints.push({
        position: h2Pos + 5,
        label: 'mid_content'
      })
    }
  }

  // 3. Before FAQ section
  const faqPos = content.indexOf('<h2>Frequently Asked Questions')
  if (faqPos !== -1) {
    insertionPoints.push({
      position: faqPos,
      label: 'pre_faq'
    })
  }

  // Insert shortcodes (reverse order to maintain positions)
  let result = content
  insertionPoints.reverse().forEach(point => {
    result = result.slice(0, point.position) +
             `\n\n${shortcode}\n\n` +
             result.slice(point.position)
  })

  return result
}
```

## Pre-Publish Validation

### Block Unknown Shortcodes

```javascript
// In prePublishValidation.js

export function validateForPublish(article, options = {}) {
  const { blockUnknownShortcodes = true } = options

  // ... other validations ...

  // Shortcode validation
  if (blockUnknownShortcodes) {
    const shortcodeValidation = validateShortcodes(article.content)

    if (!shortcodeValidation.valid) {
      return {
        canPublish: false,
        blockingIssues: shortcodeValidation.issues.filter(i => i.type === 'BLOCKING'),
        warnings: shortcodeValidation.issues.filter(i => i.type === 'WARNING')
      }
    }
  }

  // ... continue validation ...
}
```

## Testing Checklist

- [ ] Crawl stage site shortcode documentation
- [ ] Update APPROVED_SHORTCODES list with all valid shortcodes
- [ ] Test shortcode validation catches unknown shortcodes
- [ ] Test monetization shortcode auto-insertion
- [ ] Verify AI prompts include shortcode rules
- [ ] Test pre-publish blocks unknown shortcodes
- [ ] Verify internal links use shortcode format
- [ ] Verify external citations use shortcode format

## Settings UI

The shortcode configuration is available in the app:

**Settings > Content Rules > Shortcodes**

Displays:
- Approved shortcode whitelist
- Usage examples for each shortcode
- Parameter documentation
- Validation rules

## Summary

### MUST DO
- Use `[ge_cta]` for all monetization
- Use `[ge_internal_link]` for internal links
- Use `[ge_external_cited]` for external sources
- Validate shortcodes before publish
- Block unknown/hallucinated shortcodes

### MUST NOT DO
- Output raw affiliate URLs
- Use plain `<a>` tags for internal links
- Invent new shortcode tags
- Publish without monetization shortcode
- Skip shortcode validation
