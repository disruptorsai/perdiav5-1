# Perdia V5 Database Schema Verification Report

**Generated:** 2025-12-08
**Supabase Project:** nvffvcjtrgxnunncdafz

---

## Executive Summary

The database schema is **94.4% complete** (34 of 36 expected tables exist). Two tables are missing and need the corresponding migrations applied:

| Status | Count |
|--------|-------|
| Tables Exist | 34 |
| Tables Missing | 2 |
| Schema Completeness | 94.4% |

---

## Section 1: Table Existence Check

### All 36 Expected Tables

| # | Table Name | Status | Row Count |
|---|------------|--------|-----------|
| 1 | articles | EXISTS | 10 |
| 2 | content_ideas | EXISTS | 47 |
| 3 | article_contributors | EXISTS | 13 |
| 4 | clusters | EXISTS | 0 |
| 5 | keywords | EXISTS | 0 |
| 6 | site_articles | EXISTS | 0 |
| 7 | internal_links | EXISTS | 0 |
| 8 | external_links | EXISTS | 0 |
| 9 | wordpress_connections | EXISTS | 0 |
| 10 | article_revisions | EXISTS | 0 |
| 11 | training_data | EXISTS | 0 |
| 12 | shortcodes | EXISTS | 0 |
| 13 | generation_queue | EXISTS | 0 |
| 14 | system_settings | EXISTS | 48 |
| 15 | monetization_categories | EXISTS | 155 |
| 16 | monetization_levels | EXISTS | 13 |
| 17 | article_monetization | EXISTS | 0 |
| 18 | subjects | EXISTS | 155 |
| 19 | ranking_reports | EXISTS | 46 |
| 20 | ranking_report_entries | EXISTS | 2905 |
| 21 | schools | EXISTS | 40 |
| 22 | degrees | EXISTS | 38 |
| 23 | **ai_revisions** | **MISSING** | - |
| 24 | **article_comments** | **MISSING** | - |
| 25 | geteducated_authors | EXISTS | 10 |
| 26 | geteducated_categories | EXISTS | 0 |
| 27 | geteducated_tags | EXISTS | 0 |
| 28 | geteducated_articles | EXISTS | 1047 |
| 29 | geteducated_article_categories | EXISTS | 0 |
| 30 | geteducated_article_tags | EXISTS | 0 |
| 31 | geteducated_schools | EXISTS | 1704 |
| 32 | geteducated_degree_programs | EXISTS | 0 |
| 33 | geteducated_degree_categories | EXISTS | 0 |
| 34 | geteducated_style_samples | EXISTS | 0 |
| 35 | geteducated_article_versions | EXISTS | 2 |
| 36 | geteducated_revision_queue | EXISTS | 0 |

---

## Section 2: Missing Tables Analysis

### Table: ai_revisions

**Migration File:** `supabase/migrations/20250105000003_create_ai_revisions_table.sql`
**Enhanced By:** `supabase/migrations/20250114000000_enhance_ai_revisions_context.sql`

**Purpose:** Tracks AI revisions triggered by editorial feedback for AI training purposes (per GetEducated spec section 8.4).

**Expected Columns:**
- `id` (UUID, primary key)
- `article_id` (UUID, foreign key to articles)
- `previous_version` (TEXT)
- `revised_version` (TEXT)
- `comments_snapshot` (JSONB)
- `triggered_by_user` (UUID)
- `include_in_training` (BOOLEAN)
- `model_used` (TEXT)
- `revision_type` (TEXT)
- `article_context` (JSONB)
- `prompt_used` (TEXT)
- `applied` (BOOLEAN)
- `rolled_back_at` (TIMESTAMPTZ)
- `rolled_back_by` (UUID)
- `quality_delta` (JSONB)
- `created_at` (TIMESTAMPTZ)

**RLS Policies Required:**
- Users can view revisions for articles they own
- Users can create revisions for their own articles
- Users can update training flag on their revisions
- Users can delete their own revisions

---

### Table: article_comments

**Migration File:** `supabase/migrations/20250113000000_create_article_comments_table.sql`

**Purpose:** Granular text selection comments for editorial feedback that feed into AI revision requests.

**Expected Columns:**
- `id` (UUID, primary key)
- `article_id` (UUID, foreign key to articles)
- `selected_text` (TEXT)
- `selection_start` (INTEGER)
- `selection_end` (INTEGER)
- `category` (TEXT) - accuracy, tone, seo, structure, grammar, general
- `severity` (TEXT) - minor, moderate, major, critical
- `feedback` (TEXT)
- `status` (TEXT) - pending, addressed, dismissed
- `created_by` (UUID)
- `created_at` (TIMESTAMPTZ)
- `addressed_at` (TIMESTAMPTZ)
- `addressed_by_revision` (UUID, foreign key to ai_revisions)

**RLS Policies Required:**
- Users can view comments for articles they have access to
- Users can create comments for their own articles
- Users can update their own comments
- Users can delete their own pending comments

---

## Section 3: Key Column Verification (Existing Tables)

| Table | Expected Cols | Present | Status |
|-------|---------------|---------|--------|
| articles | 26 | 27 | COMPLETE (+1 extra) |
| content_ideas | 14 | 19 | COMPLETE (+5 extra) |
| article_contributors | 23 | 30 | COMPLETE (+7 extra) |
| geteducated_articles | 37 | 37 | COMPLETE |
| monetization_categories | 7 | 7 | COMPLETE |
| monetization_levels | 5 | 5 | COMPLETE |
| subjects | 16 | 16 | COMPLETE |
| ranking_reports | 14 | 14 | COMPLETE |
| ranking_report_entries | 21 | 21 | COMPLETE |
| schools | 18 | 18 | COMPLETE |
| degrees | 23 | 23 | COMPLETE |

**Notes:**
- Extra columns in `articles`: `updated_by`
- Extra columns in `content_ideas`: `content_type`, `target_keywords`, `search_intent`, `trending_reason`, `updated_by`
- Extra columns in `article_contributors`: `is_active`, `author_page_url`, `display_name`, `style_proxy`, `sample_urls`, `has_contributor_page`, `specialties`

---

## Section 4: RLS Policy Verification

| Table | Expected RLS Type | Status |
|-------|------------------|--------|
| articles | user_owned | WARNING - Check policies |
| content_ideas | user_owned | WARNING - Check policies |
| article_contributors | public_read | OK |
| clusters | user_owned | OK (empty) |
| keywords | user_owned | OK (empty) |
| site_articles | user_owned | OK (empty) |
| internal_links | article_linked | OK (empty) |
| external_links | article_linked | OK (empty) |
| wordpress_connections | user_owned | OK (empty) |
| article_revisions | article_linked | OK (empty) |
| training_data | user_owned | OK (empty) |
| shortcodes | user_owned | OK (empty) |
| generation_queue | system | OK (empty) |
| system_settings | system | OK |
| monetization_categories | public_read | OK |
| monetization_levels | public_read | OK |
| article_monetization | article_linked | OK (empty) |
| subjects | public_read | OK |
| ranking_reports | public_read | OK |
| ranking_report_entries | public_read | OK |
| schools | public_read | OK |
| degrees | public_read | OK |
| geteducated_* (all 10) | public_read | OK |

**RLS Warning Notes:**
- The `articles` and `content_ideas` tables may have overly permissive policies. Review `20250110000000_shared_workspace_rls.sql` migration which may have made changes to allow workspace sharing.

---

## Section 5: Seed Data Verification

| Data Type | Table | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| Approved Authors | article_contributors | 4 | 13 | Extra contributors present |
| Monetization Categories | monetization_categories | 155 | 155 | COMPLETE |
| Monetization Levels | monetization_levels | 13 | 13 | COMPLETE |
| Subjects/CIP Mapping | subjects | 155 | 155 | COMPLETE |
| System Settings | system_settings | ~7+ | 48 | COMPLETE |

**Notes on article_contributors:**
- The 4 approved authors for GetEducated are: Tony Huffman, Kayleigh Gilbert, Sara, Charity
- Additional contributors may be legacy data or test data
- Per CLAUDE.md, only these 4 authors should be used for public bylines

---

## Section 6: Action Items

### CRITICAL - Apply Missing Migrations

Run the following migrations in the Supabase SQL Editor:

1. **Create ai_revisions table:**
   ```sql
   -- Copy contents of supabase/migrations/20250105000003_create_ai_revisions_table.sql
   ```

2. **Create article_comments table:**
   ```sql
   -- Copy contents of supabase/migrations/20250113000000_create_article_comments_table.sql
   ```

3. **Enhance ai_revisions with context columns:**
   ```sql
   -- Copy contents of supabase/migrations/20250114000000_enhance_ai_revisions_context.sql
   ```

4. **Refresh PostgREST schema cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### RECOMMENDED - Review RLS Policies

Review the RLS policies on `articles` and `content_ideas` tables to ensure they are appropriately restrictive. The shared workspace migration may have broadened access.

---

## Section 7: Views and Functions

The following views and functions should exist after migrations are applied:

### Views
- `ai_training_export` - For exporting AI training data
- `ai_training_summary` - Summary of AI revisions
- `pending_article_comments` - Pending comments by article

### Functions
- `update_updated_at_column()` - Trigger function for updated_at timestamps
- `find_relevant_ge_articles()` - Find relevant articles for internal linking
- `increment_article_link_count()` - Update link count on articles
- `create_original_version()` - Create initial version from article
- `create_article_version()` - Create new version
- `get_article_versions()` - Get version history

---

## Conclusion

The Perdia V5 database schema is **substantially complete** with 94.4% of expected tables present. The two missing tables (`ai_revisions` and `article_comments`) are critical for the AI training workflow and editorial feedback system.

**Immediate Action Required:**
Apply the three migration files listed above to complete the schema.

**Overall Assessment:** PARTIAL - Requires migration application
