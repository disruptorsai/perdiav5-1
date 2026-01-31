# Sitemap Crawling Specification

**Created:** December 18, 2025
**Source:** Technical meeting with Justin (GetEducated Developer)

---

## Overview

The GetEducated site catalog must be populated from the **public sitemap**, which is rebuilt daily and serves as the **source of truth** for all URL whitelisting and internal linking.

## Current Problem

The current site catalog (~1,047 articles) is missing the entire `/online-degrees/` section, which is **the most important section for monetization**. The catalog was only scraping WordPress articles/pages and missing the custom post type for schools/degrees.

## Sitemap Details

| Property | Value |
|----------|-------|
| URL | `https://www.geteducated.com/sitemap.xml` |
| Refresh Rate | Daily (rebuilt every night) |
| Format | Standard XML sitemap |
| Contains | All 200 OK pages, up to date |

### Sitemap Data Available

Each entry in the sitemap includes:
- `<loc>` - Full URL
- `<lastmod>` - Last modification date (CRITICAL for preferring newer content)
- `<changefreq>` - Change frequency hint
- `<priority>` - SEO priority value

## Required URL Patterns

### Must Include (Priority Order)

1. **`/online-degrees/*`** - School directory pages (HIGHEST PRIORITY)
   - These are the monetizable listings
   - Contains sponsored school indicators
   - Was previously missing from catalog

2. **`/online-college-ratings-and-rankings/*`** - Ranking reports
   - Cost data source
   - Must use latest version (check `lastmod`)

3. **`/resources/*`** - Resource articles
   - Career guides, how-to content

4. **`/blog/*`** - Blog posts (lower priority)
   - 32 blog posts currently

### URL Structure Reference

```
/online-degrees/                          # Root directory
/online-degrees/{category}/               # Category level (e.g., business, nursing)
/online-degrees/{category}/{concentration}/ # Concentration level
/online-degrees/{category}/{concentration}/{level}/ # Degree level

# School pages
/online-schools/{school-slug}/            # Individual school pages
```

## Implementation Requirements

### 1. Daily Sitemap Sync Service

```javascript
// src/services/sitemapService.js

/**
 * Fetch and parse the GetEducated sitemap
 * Should run daily via scheduled job
 */
export async function syncFromSitemap() {
  const sitemapUrl = 'https://www.geteducated.com/sitemap.xml'

  // 1. Fetch sitemap XML
  const response = await fetch(sitemapUrl)
  const xml = await response.text()

  // 2. Parse XML to extract URLs with metadata
  const urls = parseSitemap(xml)

  // 3. Filter to relevant sections
  const relevantUrls = urls.filter(url =>
    url.loc.includes('/online-degrees/') ||
    url.loc.includes('/online-college-ratings-and-rankings/') ||
    url.loc.includes('/resources/') ||
    url.loc.includes('/blog/')
  )

  // 4. Upsert to geteducated_articles table
  for (const url of relevantUrls) {
    await upsertCatalogEntry(url)
  }

  // 5. Mark stale entries (not in sitemap anymore)
  await markStaleEntries(relevantUrls.map(u => u.loc))

  return {
    total: urls.length,
    synced: relevantUrls.length,
    timestamp: new Date().toISOString()
  }
}
```

### 2. Sponsored School Detection

When crawling `/online-degrees/` pages, detect sponsored listings by:

1. **Logo Presence** - If a school logo is displayed (not placeholder), it's sponsored
2. **Priority Field** - `school_priority >= 5` indicates paid client
3. **Sort Order** - Higher sort order = higher priority client
4. **LD+JSON Metadata** - Pages contain structured data with sponsor indicators

```javascript
/**
 * Detect if a school listing is sponsored
 * @param {string} pageHtml - HTML content of the page
 * @returns {boolean} True if sponsored
 */
export function detectSponsoredListing(pageHtml) {
  // Check for non-placeholder logo
  const hasLogo = !pageHtml.includes('placeholder-logo') &&
                  pageHtml.includes('school-logo')

  // Check LD+JSON for sponsor indicators
  const ldJsonMatch = pageHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
  if (ldJsonMatch) {
    try {
      const data = JSON.parse(ldJsonMatch[1])
      if (data.sponsor || data.isSponsored) return true
    } catch (e) {
      // Invalid JSON, continue with other checks
    }
  }

  return hasLogo
}
```

### 3. Lastmod Date Usage

**CRITICAL:** Always prefer newer content based on `lastmod` date.

Problem from meeting: AI was referencing old ranking reports (2020, 2022) instead of current (2024) versions.

```javascript
/**
 * Get the most recent version of a ranking report
 * @param {string} topic - The ranking topic (e.g., "online mba")
 * @returns {Object} The most recent ranking report URL and data
 */
export async function getLatestRankingReport(topic) {
  const { data: articles } = await supabase
    .from('geteducated_articles')
    .select('*')
    .ilike('title', `%${topic}%`)
    .ilike('url', '%rankings%')
    .order('lastmod', { ascending: false }) // Newest first
    .limit(1)

  return articles?.[0] || null
}
```

### 4. Database Schema Updates

Add new columns to `geteducated_articles` table:

```sql
-- Add columns for sitemap sync
ALTER TABLE geteducated_articles ADD COLUMN IF NOT EXISTS
  lastmod TIMESTAMPTZ,
  sitemap_priority DECIMAL(2,1),
  is_sponsored BOOLEAN DEFAULT false,
  school_priority INTEGER,
  last_sitemap_sync TIMESTAMPTZ;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_geteducated_articles_lastmod
ON geteducated_articles(lastmod DESC);

CREATE INDEX IF NOT EXISTS idx_geteducated_articles_sponsored
ON geteducated_articles(is_sponsored) WHERE is_sponsored = true;
```

## Crawling Schedule

| Task | Frequency | Time |
|------|-----------|------|
| Full sitemap sync | Daily | 2:00 AM MT |
| Sponsored status refresh | Daily | 2:30 AM MT |
| Stale entry cleanup | Weekly | Sunday 3:00 AM MT |

## Data Flow

```
┌─────────────────┐
│ GetEducated     │
│ Sitemap.xml     │
└────────┬────────┘
         │ Daily sync
         ▼
┌─────────────────┐
│ sitemapService  │──────┐
│ .syncFromSitemap│      │
└────────┬────────┘      │
         │               │
         ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│geteducated_     │ │ Sponsored       │
│articles table   │ │ Detection       │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Content         │
         │ Prioritization  │
         └─────────────────┘
```

## Validation Rules

1. **URL Whitelist** - Only suggest internal links to URLs in the sitemap
2. **Freshness** - Prefer articles with `lastmod` within last 12 months
3. **Sponsored Priority** - Prioritize sponsored listings for monetization
4. **No Dead Links** - Remove entries not found in latest sitemap

## Error Handling

```javascript
// If sitemap fetch fails, use cached data
if (!sitemapResponse.ok) {
  console.warn('[SitemapService] Failed to fetch sitemap, using cached catalog')
  return { usedCache: true, cacheAge: await getCacheAge() }
}

// If page returns 404, mark as stale
if (pageResponse.status === 404) {
  await markAsStale(url)
}
```

## Testing

1. Verify sitemap is accessible: `curl https://www.geteducated.com/sitemap.xml`
2. Count URLs in each section
3. Verify `/online-degrees/` pages are being captured
4. Confirm sponsored detection accuracy against known paid schools
5. Test lastmod ordering for ranking reports

## Migration Steps

1. Create sitemap service
2. Run initial full sync
3. Verify `/online-degrees/` captured (~1,700 school pages expected)
4. Set up daily cron job
5. Update internal linking to use sitemap-synced catalog
6. Update content idea generation to prioritize sponsored listings
