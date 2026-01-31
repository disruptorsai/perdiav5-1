# Supabase Database Fix Guide

**Date:** 2025-12-18
**Issue:** Console errors showing 404 for missing tables/functions and 500 for Edge Function

## Summary of Issues

### 1. Missing Database Tables (404 Errors)

The following tables exist in migration files but have NOT been applied to Supabase:

| Table | Migration File | Status |
|-------|---------------|--------|
| `idea_feedback_history` | `20251215000002_add_idea_feedback_history.sql` | **Not Applied** |
| `ai_learning_sessions` | `20251215000002_add_idea_feedback_history.sql` | **Not Applied** |
| `default_author_by_article_type` | `20250105000004_add_default_author_config.sql` | **Not Applied** |

### 2. Missing RPC Function (404 Error)

| Function | Migration File | Status |
|----------|---------------|--------|
| `get_feedback_for_learning` | `20251215000002_add_idea_feedback_history.sql` | **Not Applied** |

### 3. Edge Function Error (500)

The `grok-api` Edge Function is returning 500 Internal Server Error, likely due to:
- Missing `GROK_API_KEY` secret in Supabase
- Grok API model name changes (grok-3 may not be available)

## Solution

### Step 1: Apply the Fix Migration

Run the consolidated fix migration in Supabase SQL Editor:

**Option A: Use Supabase Dashboard**
1. Go to Supabase Dashboard > SQL Editor
2. Open file: `supabase/migrations/20251218000000_fix_missing_tables_and_functions.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"

**Option B: Use Supabase CLI**
```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdiav5"
supabase db push
```

### Step 2: Configure Edge Function Secrets

The following secrets MUST be configured for Edge Functions to work:

```bash
# Required for grok-api function
supabase secrets set GROK_API_KEY=your-grok-api-key-here

# Required for claude-api function
supabase secrets set CLAUDE_API_KEY=your-claude-api-key-here

# Required for stealthgpt-humanize function
supabase secrets set STEALTHGPT_API_KEY=your-stealthgpt-api-key-here

# Optional: DataForSEO (for keyword research)
supabase secrets set DATAFORSEO_USERNAME=your-username
supabase secrets set DATAFORSEO_PASSWORD=your-password
```

**To verify secrets are set:**
```bash
supabase secrets list
```

### Step 3: Redeploy Edge Functions (if needed)

If the grok-api function continues to fail after setting secrets:

```bash
# Redeploy specific function
supabase functions deploy grok-api

# Or redeploy all functions
supabase functions deploy
```

### Step 4: Verify the Fix

After applying the migration, verify the tables exist:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('idea_feedback_history', 'ai_learning_sessions', 'default_author_by_article_type');

-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_feedback_for_learning';

-- Verify default authors are seeded
SELECT * FROM default_author_by_article_type;
```

## Tables Created by Fix Migration

### 1. `default_author_by_article_type`
Maps article types to default primary authors per GetEducated spec.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `article_type` | TEXT | Content type (ranking, guide, etc.) |
| `default_author_name` | TEXT | Author name (Tony, Kayleigh, Sara, Charity) |
| `description` | TEXT | Why this author is default |
| `is_active` | BOOLEAN | Whether mapping is active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Update timestamp |

**Seeded mappings:**
- `ranking`, `comparison`, `analysis`, `landing-page` -> Tony Huffman
- `program_list`, `listicle`, `career-guide` -> Kayleigh Gilbert
- `guide`, `explainer`, `overview` -> Sara
- `tutorial`, `how-to`, `certification` -> Charity

### 2. `idea_feedback_history`
Tracks all approval/rejection decisions for AI learning.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `idea_id` | UUID | Reference to content_ideas |
| `decision` | TEXT | approved, rejected, thumbs_up, thumbs_down |
| `rejection_category` | TEXT | Categorization for rejections |
| `rejection_reason` | TEXT | Detailed reason |
| `idea_title` | TEXT | Snapshot of idea title |
| `idea_description` | TEXT | Snapshot of description |
| `idea_source` | TEXT | Where idea came from |
| `idea_content_type` | TEXT | Type of content |
| `idea_keywords` | TEXT[] | Associated keywords |
| `feedback_notes` | TEXT | Additional notes |
| `decided_by` | UUID | User who made decision |
| `decided_at` | TIMESTAMPTZ | When decision was made |
| `used_for_training` | BOOLEAN | Whether used for AI learning |
| `training_batch_id` | UUID | Which training session used it |

### 3. `ai_learning_sessions`
Tracks AI prompt improvement sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_type` | TEXT | idea_generation, content_writing, title_optimization |
| `feedback_count` | INTEGER | Number of feedback items used |
| `approved_count` | INTEGER | Count of approved items |
| `rejected_count` | INTEGER | Count of rejected items |
| `feedback_ids` | UUID[] | Array of feedback IDs used |
| `original_prompt` | TEXT | Original prompt before improvement |
| `improved_prompt` | TEXT | Improved prompt |
| `improvement_notes` | TEXT | Notes about what was learned |
| `learned_patterns` | JSONB | Extracted patterns for AI |
| `is_active` | BOOLEAN | Whether this session is active |
| `applied_at` | TIMESTAMPTZ | When session was activated |
| `created_by` | UUID | User who created session |

## Functions Created

### `record_idea_feedback(idea_id, decision, rejection_category, rejection_reason, feedback_notes)`
Records a feedback decision and updates the idea status.

### `get_feedback_for_learning(limit)`
Returns unprocessed feedback for AI learning.

### `mark_feedback_as_trained(feedback_ids, session_id)`
Marks feedback items as used in a training session.

## Grok API Edge Function Notes

The `grok-api` Edge Function (`supabase/functions/grok-api/index.ts`) includes:
- Model fallback system (tries grok-3, grok-2-latest, grok-2, grok-beta, grok-2-1212)
- Proper error handling for 404 (model not found)
- CORS headers for browser requests

**If all models fail:**
1. Check your Grok API key is valid
2. Check xAI API status at https://status.x.ai
3. Verify your account has API access

## Required Supabase Secrets Summary

| Secret Name | Required For | How to Get |
|-------------|--------------|------------|
| `GROK_API_KEY` | grok-api Edge Function | https://console.x.ai |
| `CLAUDE_API_KEY` | claude-api Edge Function | https://console.anthropic.com |
| `STEALTHGPT_API_KEY` | stealthgpt-humanize Edge Function | https://stealthgpt.ai |
| `DATAFORSEO_USERNAME` | dataforseo-api Edge Function | https://dataforseo.com |
| `DATAFORSEO_PASSWORD` | dataforseo-api Edge Function | https://dataforseo.com |

## Troubleshooting

### Still getting 404 errors after migration?
1. Verify migration ran successfully (no errors in SQL Editor)
2. Check RLS policies are enabled: `SELECT tablename, policies FROM pg_policies WHERE schemaname = 'public'`
3. Ensure user is authenticated when making requests

### Edge Function still returning 500?
1. Check function logs: `supabase functions logs grok-api --tail`
2. Verify secrets are set: `supabase secrets list`
3. Try redeploying: `supabase functions deploy grok-api`

### Permission denied errors?
The migration includes RLS policies that allow:
- All authenticated users to SELECT from all 3 tables
- All authenticated users to INSERT into feedback tables
- Service role full access to all tables

If you need different permissions, modify the policies in the migration.
