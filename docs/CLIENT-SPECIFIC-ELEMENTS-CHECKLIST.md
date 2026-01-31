# Client-Specific Elements to Abstract - Quick Reference Checklist

This checklist documents every GetEducated-specific element in the Perdia v5 codebase that must be removed, generalized, or made configurable for the multi-tenant template.

---

## 1. Hardcoded Author Names

### Files to Modify:
- [ ] `src/hooks/useContributors.js:10` - `APPROVED_AUTHORS` array
- [ ] `src/hooks/useContributors.js:16-21` - `AUTHOR_DISPLAY_NAMES` mapping
- [ ] `src/hooks/useContributors.js:29-34` - `AUTHOR_STYLE_PROXIES` mapping
- [ ] `src/hooks/useContributors.js:40-52` - `BLOCKED_BYLINES` array
- [ ] `src/hooks/useContributors.js:57-74` - `AUTHOR_CONTENT_MAPPING`

### Current Values:
```javascript
// Real names (public bylines)
Tony Huffman, Kayleigh Gilbert, Sara, Charity

// Style proxies (internal AI references)
Kif, Alicia, Danny, Julia

// Blocked bylines
Julia Tell, Kif Richmann, Alicia Carrasco, Daniel Catena
```

### New Approach:
- Move to `tenant_contributors` table
- Query from database per tenant
- Allow unlimited contributors per tenant

---

## 2. Domain References

### GetEducated.com URLs to Remove:
- [ ] `src/services/validation/linkValidator.js:254,264,274,289`
- [ ] `src/services/publishService.js:290`
- [ ] `src/pages/Settings.jsx:539,542,545`
- [ ] `src/hooks/useGetEducatedCatalog.js:452`
- [ ] `docs/v5-updates/08-AUTHOR-STYLE-SPECIFICATION.md` (multiple lines)
- [ ] `CLAUDE.md:520-522`
- [ ] `scripts/collect-sitemap-urls.js:16`
- [ ] `scripts/scrape-geteducated.js:28`
- [ ] `scripts/crawl-ranking-reports.js:29`
- [ ] `scripts/crawl-degrees.js:25`
- [ ] `scripts/import-urls-to-supabase.js:33`

### New Approach:
- Store `primary_domain` in `tenants` table
- Reference via `tenant.primary_domain` in code

---

## 3. Blocked Competitor Domains

### Current Location:
- [ ] `src/services/validation/linkValidator.js:11-27`

### Current Values:
```javascript
BLOCKED_COMPETITORS = [
  'onlineu.com',
  'usnews.com',
  'affordablecollegesonline.com',
  'toponlinecollegesusa.com',
  'bestcolleges.com',
  'niche.com',
  'collegeconfidential.com',
  'cappex.com',
  'collegeraptor.com',
  'collegesimply.com',
  'graduateguide.com',
  'gradschools.com',
  'petersons.com',
  'princetonreview.com',
  'collegexpress.com',
]
```

### New Approach:
- Move to `tenants.blocked_domains` array field
- Query from tenant configuration

---

## 4. Allowed External Domains

### Current Location:
- [ ] `src/services/validation/linkValidator.js:30-58`

### Current Values:
```javascript
// Government sources
bls.gov, ed.gov, studentaid.gov, fafsa.gov, collegescorecard.ed.gov

// Accreditation bodies
chea.org, aacsb.edu, abet.org, cacrep.org, ccne-accreditation.org, cswe.org, ncate.org, teac.org

// Education associations
collegeboard.org, acenet.edu, aacn.nche.edu, naspa.org

// Professional organizations
apa.org, nasw.org, nursingworld.org
```

### New Approach:
- Move to `tenants.allowed_domains` array field
- Query from tenant configuration

---

## 5. Branding References

### App Name "Perdia":
- [ ] `src/components/layout/MainLayout.jsx:73` - Logo text
- [ ] `src/App.jsx:42` - Loading message
- [ ] `package.json:2` - Package name
- [ ] `src/config/pageHelpContent.js:379` - Help text

### New Approach:
- Store `app_name` in `tenants` table
- Inject via TenantContext

---

## 6. API Keys & Credentials

### .env.local File:
- [ ] Line 2: `VITE_SUPABASE_URL` - Supabase project URL
- [ ] Line 3: `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] Line 6: `VITE_GROK_API_KEY` - xAI Grok API key
- [ ] Line 7: `VITE_CLAUDE_API_KEY` - Anthropic Claude API key
- [ ] Line 10-11: DataForSEO credentials
- [ ] Line 21: `SUPABASE_ACCESS_TOKEN`
- [ ] Line 23: `VITE_STEALTHGPT_API_KEY`
- [ ] Line 25: `SUPABASE_SERVICE_KEY`

### New Approach:
- Platform-level Supabase credentials (shared)
- Tenant-specific AI keys in `tenant_api_keys` table (encrypted)
- Edge Functions for all AI calls (never expose keys client-side)

---

## 7. Webhook & Publishing URLs

### Current Location:
- [ ] `src/services/publishService.js:14` - n8n webhook URL

### Current Value:
```javascript
WEBHOOK_URL = 'https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79'
```

### New Approach:
- Move to `tenant_wordpress_sites` table
- Support direct WordPress REST API per tenant

---

## 8. Database Tables to Rename

| Current Name | New Name | Action |
|--------------|----------|--------|
| `geteducated_articles` | `tenant_site_catalog` | Rename + add tenant_id |
| `geteducated_authors` | `catalog_authors` | Rename + add tenant_id |
| `geteducated_categories` | `catalog_categories` | Rename + add tenant_id |
| `geteducated_tags` | `catalog_tags` | Rename + add tenant_id |
| `geteducated_article_versions` | `catalog_versions` | Rename + add tenant_id |
| `geteducated_revision_queue` | `revision_queue` | Rename + add tenant_id |

---

## 9. Monetization Categories

### Current Location:
- [ ] `data/monetization-categories.json` - 155 education categories
- [ ] `data/monetization-levels.json` - 13 degree levels
- [ ] `supabase/migrations/*_add_monetization_tables.sql`
- [ ] `src/services/monetizationEngine.js`
- [ ] `src/services/shortcodeService.js`

### Current Values:
- 155 category/concentration pairs (education-specific)
- 13 degree levels (Associate, Bachelor, Master, Doctorate, etc.)
- CIP codes for subject mapping

### New Approach:
- Move to `tenant_monetization_categories` table
- Move degree levels to `tenant_content_levels` table
- Allow custom taxonomy per tenant

---

## 10. Documentation Files

### Files to Remove or Generalize:
- [ ] `docs/v5-updates/01-REQUIREMENTS-OVERVIEW.md` - GetEducated requirements
- [ ] `docs/v5-updates/02-CLIENT-CONTENT-RULES.md` - Kayleigh's rules
- [ ] `docs/v5-updates/03-MONETIZATION-SPECIFICATION.md` - Education monetization
- [ ] `docs/v5-updates/04-IMPLEMENTATION-TODO.md` - GetEducated tasks
- [ ] `docs/v5-updates/05-MISSING-INFORMATION.md` - GetEducated gaps
- [ ] `docs/v5-updates/06-AUTHOR-STYLE-GUIDE.md` - Author profiles
- [ ] `docs/v5-updates/07-REMAINING-IMPLEMENTATION.md` - GetEducated gaps
- [ ] `docs/v5-updates/08-AUTHOR-STYLE-SPECIFICATION.md` - Author samples
- [ ] `docs/v5-updates/09-ARTICLE-STYLE-EXTRACTS.md` - Article excerpts
- [ ] `docs/v5-updates/perdia_geteducated_*.md` - All addendum specs

### New Approach:
- Archive in `docs/examples/geteducated/` as reference
- Create new `docs/templates/` with generic templates
- Update `CLAUDE.md` for generic platform

---

## 11. Scripts to Update

### Scraping/Import Scripts:
- [ ] `scripts/collect-sitemap-urls.js` - Hardcoded baseUrl
- [ ] `scripts/scrape-geteducated.js` - Hardcoded baseUrl
- [ ] `scripts/crawl-ranking-reports.js` - Hardcoded URL
- [ ] `scripts/crawl-degrees.js` - Hardcoded URL
- [ ] `scripts/import-urls-to-supabase.js` - Hardcoded URL
- [ ] `scripts/enrich-articles-content.js` - URL references
- [ ] `scripts/data/geteducated-sitemap-urls.json` - URL list

### New Approach:
- Make scripts tenant-aware (accept tenant_id parameter)
- Read base URL from tenant configuration
- Create generic catalog import tool

---

## 12. Components with Client References

### GetEducated-Specific Components:
- [ ] `src/components/article/GetEducatedPreview.jsx` - Rename to `SitePreview.jsx`
- [ ] `src/pages/SiteCatalog.jsx:88` - Default tab 'geteducated'
- [ ] `src/pages/ArticleEditor.jsx:72` - Import GetEducatedPreview
- [ ] `src/pages/ArticleEditor.jsx:632-634` - Preview label
- [ ] `src/pages/ArticleReview.jsx:45,593` - Uses GetEducatedPreview

### New Approach:
- Rename to generic names
- Make preview component configurable
- Remove client name from UI text

---

## 13. Settings with Client Defaults

### Current Location:
- [ ] `src/pages/Settings.jsx` (multiple lines)

### Client-Specific Settings:
- Approved authors only toggle (references 4 authors)
- Block .edu links (education-specific)
- Block competitor links (references competitor list)
- Require ranking cost data (GetEducated-specific)
- GetEducated-specific help text

### New Approach:
- Make all settings tenant-configurable
- Store defaults in `tenant_settings` table
- Remove hardcoded references

---

## 14. AI Prompt Templates

### Files with Client-Specific Prompts:
- [ ] `src/services/ai/grokClient.js` - Draft generation prompts
- [ ] `src/services/ai/claudeClient.js` - Humanization prompts
- [ ] `src/services/generationService.js` - Pipeline prompts

### Client-Specific Elements in Prompts:
- Author names and profiles
- GetEducated content rules
- Cost data from GetEducated rankings
- Link policies (never .edu)
- Banned phrases
- Structure templates

### New Approach:
- Build prompts dynamically from tenant configuration
- Load author profiles from database
- Load content rules from tenant settings
- Create prompt template system

---

## 15. Email Templates

### Current Location:
- [ ] `supabase/email-templates/README.md:32-33` - perdiav5.netlify.app URLs

### New Approach:
- Make email templates tenant-configurable
- Use dynamic URLs from tenant domain

---

## Summary Statistics

| Category | Count | Effort |
|----------|-------|--------|
| Hardcoded author references | 5 files | Medium |
| Domain URL references | 12+ files | Medium |
| Blocked/allowed domain lists | 2 files | Low |
| Branding references | 4 files | Low |
| API keys/credentials | 1 file | Medium |
| Database tables to rename | 6 tables | High |
| Documentation to archive | 11 files | Low |
| Scripts to update | 7 files | Medium |
| Components to rename | 5 files | Low |
| Settings to generalize | 1 file | Medium |
| Prompt templates | 3 files | High |

**Total Estimated Effort:** 2-3 weeks of refactoring

---

## Implementation Priority

### P0 - Must Do First (Weeks 1-2)
1. Create tenant tables and RLS policies
2. Add tenant_id to existing tables
3. Refactor useContributors.js
4. Update linkValidator.js
5. Update generationService.js

### P1 - Core Features (Weeks 3-4)
1. Rename database tables
2. Update AI clients for tenant keys
3. Refactor prompts to use tenant config
4. Create TenantContext provider
5. Update publishing service

### P2 - Polish (Weeks 5-6)
1. Rename components
2. Update UI text
3. Generalize scripts
4. Archive documentation
5. Create template docs

---

*Use this checklist to track progress during the multi-tenant migration.*
