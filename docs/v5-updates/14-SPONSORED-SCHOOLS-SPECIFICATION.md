# Sponsored Schools Detection Specification

**Created:** December 18, 2025
**Source:** Technical meeting with Justin (GetEducated Developer) and Tony (Owner)

---

## Overview

GetEducated monetizes through sponsored school listings. The AI content generation system must:
1. **Detect** which schools/degrees are sponsored (paid clients)
2. **Prioritize** content creation for sponsored areas
3. **Avoid** creating content for non-monetizable topics

## The Monetization Problem

### Current State (Wrong)

The AI was looking at existing articles on the site and generating similar content. However, many old articles were written for topics that cannot be monetized.

**Tony's Quote:**
> "We were writing a bunch of stuff that we couldn't monetize. So you may be looking at things that are indeed on the website but don't do us any good."

### New Approach (Correct)

1. Start with the `/online-degrees/` directory
2. Identify which schools/degrees are SPONSORED
3. Work backwards to find content opportunities for those paid areas
4. Validate with search query research

## How to Identify Sponsored Listings

### Method 1: Logo Presence

**Sponsored:** School logo is displayed
**Not Sponsored:** No logo or placeholder logo

```javascript
/**
 * Check if a listing page shows a school logo (indicating sponsorship)
 * @param {string} html - Page HTML content
 * @returns {boolean}
 */
function hasSchoolLogo(html) {
  // Check for actual logo image (not placeholder)
  const hasLogoImg = html.includes('class="school-logo"') ||
                     html.includes('class="sponsor-logo"')

  // Ensure it's not a placeholder
  const isPlaceholder = html.includes('placeholder-logo') ||
                        html.includes('no-logo')

  return hasLogoImg && !isPlaceholder
}
```

### Method 2: School Priority Field

**Rule:** `school_priority >= 5` means paid client

```javascript
/**
 * Check school priority from page data
 * @param {string} html - Page HTML
 * @returns {number|null} Priority value
 */
function getSchoolPriority(html) {
  // Look in LD+JSON structured data
  const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (ldJsonMatch) {
    try {
      const data = JSON.parse(ldJsonMatch[1])
      return data.schoolPriority || data.priority || null
    } catch (e) {
      return null
    }
  }

  // Or look for data attribute
  const priorityMatch = html.match(/data-priority="(\d+)"/)
  return priorityMatch ? parseInt(priorityMatch[1]) : null
}

/**
 * Check if school is a paid client
 */
function isPaidClient(priority) {
  return priority !== null && priority >= 5
}
```

### Method 3: Sort Order

Schools at the top of listings are higher priority (paid).

```javascript
/**
 * Extract school listing order
 * Higher position = higher priority (more paid)
 */
function getSchoolSortOrder(html, schoolName) {
  const schoolPositions = []
  const schoolCards = html.match(/<div class="school-card"[^>]*>([\s\S]*?)<\/div>/g) || []

  schoolCards.forEach((card, index) => {
    if (card.includes(schoolName)) {
      schoolPositions.push(index)
    }
  })

  return schoolPositions[0] ?? -1  // -1 if not found
}
```

### Method 4: LD+JSON Metadata

Pages contain structured data with sponsorship information.

```javascript
/**
 * Extract sponsorship info from LD+JSON
 */
function extractLdJsonSponsorData(html) {
  const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)

  if (!ldJsonMatch) return null

  for (const match of ldJsonMatch) {
    try {
      const jsonContent = match
        .replace('<script type="application/ld+json">', '')
        .replace('</script>', '')
      const data = JSON.parse(jsonContent)

      return {
        isSponsored: data.isSponsored || data.sponsor || false,
        schoolPriority: data.schoolPriority || null,
        sponsorName: data.sponsorName || data.name || null,
        offerCount: data.numberOfOffers || null
      }
    } catch (e) {
      continue
    }
  }

  return null
}
```

## Content Prioritization Logic

### Idea Generation Flow

```
┌────────────────────────┐
│ 1. Fetch /online-degrees/│
│    from sitemap        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 2. Crawl each listing  │
│    page for sponsor    │
│    indicators          │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 3. Filter to only      │
│    SPONSORED listings  │
│    (logo OR priority≥5)│
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 4. Generate content    │
│    ideas for sponsored │
│    categories          │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ 5. Validate search     │
│    demand (DataForSEO) │
└────────────────────────┘
```

### Database Schema

```sql
-- Add sponsorship tracking to degree directory
CREATE TABLE IF NOT EXISTS online_degree_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  category TEXT,
  concentration TEXT,
  level TEXT,

  -- Sponsorship indicators
  has_logo BOOLEAN DEFAULT false,
  school_priority INTEGER,
  is_sponsored BOOLEAN GENERATED ALWAYS AS (
    has_logo = true OR school_priority >= 5
  ) STORED,
  sort_order INTEGER,

  -- Counts
  school_count INTEGER DEFAULT 0,
  sponsored_school_count INTEGER DEFAULT 0,

  -- Metadata
  lastmod TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding sponsored content
CREATE INDEX idx_sponsored_listings
ON online_degree_listings(is_sponsored, category, concentration)
WHERE is_sponsored = true;
```

### Idea Generation Service Update

```javascript
// src/services/ideaDiscoveryService.js

/**
 * Generate content ideas prioritizing sponsored categories
 */
export async function generateIdeasFromSponsoredListings(options = {}) {
  const { limit = 10, category = null } = options

  // 1. Get sponsored listings from database
  let query = supabase
    .from('online_degree_listings')
    .select('*')
    .eq('is_sponsored', true)
    .gt('sponsored_school_count', 0)
    .order('sponsored_school_count', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data: sponsoredListings, error } = await query.limit(limit)

  if (error || !sponsoredListings?.length) {
    console.warn('[IdeaDiscovery] No sponsored listings found')
    return []
  }

  // 2. Generate content ideas for each sponsored area
  const ideas = []
  for (const listing of sponsoredListings) {
    const listingIdeas = await generateIdeasForListing(listing)
    ideas.push(...listingIdeas)
  }

  // 3. Validate search demand
  const validatedIdeas = await validateSearchDemand(ideas)

  return validatedIdeas
}

/**
 * Generate content ideas for a specific sponsored listing
 */
async function generateIdeasForListing(listing) {
  const templates = [
    `Best Online ${listing.level} in ${listing.concentration}`,
    `Cheapest ${listing.level} in ${listing.concentration} Online`,
    `How to Become a ${listing.concentration} Professional`,
    `${listing.concentration} ${listing.level} Career Guide`,
    `Online ${listing.concentration} Programs: What to Know`,
  ]

  return templates.map(title => ({
    title,
    category: listing.category,
    concentration: listing.concentration,
    level: listing.level,
    is_sponsored_topic: true,
    source_listing_url: listing.url,
    sponsored_school_count: listing.sponsored_school_count
  }))
}
```

## Non-Monetizable Detection

### Warning System

When generating content, warn if the topic cannot be monetized:

```javascript
/**
 * Check if a topic can be monetized
 * @returns {Object} Monetization status and warning
 */
export async function checkMonetizationPotential(topic) {
  const { category, concentration, level } = parseTopic(topic)

  // Check if any sponsored listings exist for this topic
  const { data: listings } = await supabase
    .from('online_degree_listings')
    .select('is_sponsored, sponsored_school_count')
    .eq('category', category)
    .eq('concentration', concentration)
    .eq('level', level)
    .limit(1)
    .single()

  if (!listings || !listings.is_sponsored) {
    return {
      canMonetize: false,
      warning: `No sponsored schools for ${level} in ${concentration}. Content may not generate revenue.`,
      sponsoredCount: 0
    }
  }

  return {
    canMonetize: true,
    warning: null,
    sponsoredCount: listings.sponsored_school_count
  }
}
```

### UI Warning Component

```jsx
// src/components/article/MonetizationWarning.jsx

export function MonetizationWarning({ topic }) {
  const { canMonetize, warning, sponsoredCount } = useMonetizationCheck(topic)

  if (canMonetize) {
    return (
      <div className="text-green-600 text-sm">
        {sponsoredCount} sponsored schools available
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-yellow-600" size={16} />
        <span className="font-medium text-yellow-800">Monetization Warning</span>
      </div>
      <p className="text-sm text-yellow-700 mt-1">{warning}</p>
    </div>
  )
}
```

## Example: Non-Monetizable Listing

From the meeting, Tony showed this example:

**URL:** `/online-degrees/religion/pastoral-counseling/associate/`

**Indicators:**
- No school logo displayed
- Empty sponsor section
- Cannot monetize this area

**AI Behavior:**
- SHOULD NOT generate content for this topic
- SHOULD flag if user manually requests it
- SHOULD suggest alternative monetizable topics

## Paid Client Spreadsheet Cross-Reference

Tony sent a spreadsheet with all paid clients. This should be imported and cross-referenced:

```sql
-- Import paid clients from spreadsheet
CREATE TABLE IF NOT EXISTS paid_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  school_slug TEXT,
  degree_categories TEXT[],
  degree_levels TEXT[],
  contract_start DATE,
  contract_end DATE,
  is_active BOOLEAN DEFAULT true,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-reference function
CREATE OR REPLACE FUNCTION is_paid_client(school_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM paid_clients
    WHERE school_name ILIKE $1
    AND is_active = true
    AND (contract_end IS NULL OR contract_end > NOW())
  );
END;
$$ LANGUAGE plpgsql;
```

## Testing Checklist

- [ ] Crawl `/online-degrees/` section completely
- [ ] Verify logo detection accuracy
- [ ] Test school_priority extraction
- [ ] Import paid client spreadsheet
- [ ] Cross-reference crawled data with spreadsheet
- [ ] Generate ideas only for sponsored topics
- [ ] Add monetization warning to UI
- [ ] Test non-monetizable topic detection

## Summary

### DO
- Prioritize content for sponsored categories
- Check logo presence before generating content
- Use sitemap for latest sponsored status
- Warn users about non-monetizable topics
- Start idea generation from `/online-degrees/`

### DO NOT
- Generate content for areas without logos
- Use old articles as the basis for new content
- Ignore sponsorship status
- Create content that cannot be monetized
