# Perdia v5 Data Scripts

This directory contains Node.js scripts for populating the database with GetEducated data.

## Prerequisites

1. Environment variables must be set:
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Install required dependencies (if running standalone):
   ```bash
   npm install @supabase/supabase-js cheerio
   ```

## Scripts

### crawl-ranking-reports.js

Crawls GetEducated's ranking report pages to extract program cost data.

**Target:** https://www.geteducated.com/online-college-ratings-and-rankings/

**Data collected:**
- School name and program name
- Total cost, in-state cost, out-of-state cost
- Accreditation information
- Sponsored/featured status
- GetEducated school URLs

**Usage:**
```bash
node scripts/crawl-ranking-reports.js
```

### crawl-schools.js

Crawls the GetEducated schools directory for internal linking data.

**Target:** https://www.geteducated.com/online-schools/

**Data collected:**
- School name
- GetEducated URL (for internal links)
- Sponsorship status (paid client, featured)
- Accreditation abbreviations
- State/location

**Usage:**
```bash
node scripts/crawl-schools.js
```

### crawl-degrees.js

Crawls the GetEducated degrees directory for monetization matching.

**Target:** https://www.geteducated.com/online-degrees/

**Data collected:**
- Program/degree name
- School name
- Degree level (Associate, Bachelor, Master, Doctorate, Certificate)
- Category/concentration mapping (links to subjects table)
- Sponsorship tier (1-3)
- GetEducated URL

**Usage:**
```bash
node scripts/crawl-degrees.js
```

## Important Notes

### Selectors Need Updating

These scripts contain **placeholder CSS selectors** that need to be updated based on the actual HTML structure of GetEducated pages. Before running:

1. Visit the target URLs in a browser
2. Inspect the HTML structure using DevTools
3. Update the selectors in each script to match the actual page structure

### Rate Limiting

The scripts include built-in rate limiting (1-1.5 second delays between requests) to be respectful to the GetEducated servers. Do not reduce these delays.

### Data Validation

After running the crawlers, verify the data:

```sql
-- Check ranking report entries
SELECT COUNT(*) FROM ranking_report_entries;
SELECT * FROM ranking_report_entries LIMIT 10;

-- Check schools
SELECT COUNT(*) FROM schools;
SELECT * FROM schools WHERE is_sponsored = true;

-- Check degrees
SELECT COUNT(*) FROM degrees;
SELECT * FROM degrees WHERE sponsorship_tier = 1;
```

### Re-running Scripts

All scripts use UPSERT operations, so running them multiple times will update existing records rather than creating duplicates.

## Recommended Execution Order

1. **crawl-schools.js** - Populates the schools table first (referenced by degrees)
2. **crawl-ranking-reports.js** - Populates cost data (can run in parallel with schools)
3. **crawl-degrees.js** - Populates degrees (links to schools)

## Scheduling

For production, consider scheduling these crawlers to run periodically (e.g., weekly) to keep data fresh. You can use:

- Supabase Edge Function with pg_cron
- External cron job service
- GitHub Actions scheduled workflow

## Troubleshooting

### No data collected
- Check the CSS selectors match the actual page structure
- Verify the target URLs are accessible
- Check for JavaScript-rendered content (may need Puppeteer instead)

### Connection errors
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- Check network connectivity
- Verify Supabase project is accessible

### Duplicate key errors
- Normal for re-runs (UPSERT handles this)
- Check unique constraint columns if unexpected
