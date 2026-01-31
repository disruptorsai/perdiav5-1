# TODO: Tony's Feedback - Priority Fixes

**Priority:** CRITICAL - Phase 1
**Status:** IN PROGRESS
**Created:** 2025-12-17
**Last Updated:** 2025-12-17
**Reference:** Tony's email dated December 15, 2025

---

## Summary of Tony's Concerns

1. AI hallucinating data
2. AI not learning from Kayleigh's corrections
3. Content ideas not focused on monetization
4. Wrong shortcodes (FIXED ✅)
5. Missing school/BERP links
6. Wrong ranking links
7. Schools listed aren't paid clients

---

## Project Status Analysis

After thorough codebase analysis, the project is **~70% complete**. Key findings:

### Already Implemented ✅

| Feature | Status | Location |
|---------|--------|----------|
| Shortcode System (correct format) | ✅ COMPLETE | `shortcodeService.js` |
| Feedback/Learning System | ✅ COMPLETE | `idea_feedback_history`, `ai_learning_sessions` tables |
| Generation Pipeline | ✅ COMPLETE | `generationService.js` |
| Quality Scoring | ✅ COMPLETE | `calculateQualityMetrics()` |
| Author Assignment | ✅ COMPLETE | 4 approved authors with scoring |
| Internal Linking | ✅ COMPLETE | `geteducated_articles` catalog |
| Pre-publish Validation | ✅ COMPLETE | `prePublishValidation.js` |
| Database Schema | ✅ COMPLETE | 37 migrations |

### Needs Data Population ⚠️

| Feature | Status | Blocker |
|---------|--------|---------|
| Schools/Degrees Data | ❌ EMPTY | Need Excel import |
| Ranking Reports Data | ❌ EMPTY | Need data source |
| Monetization with real data | ⏳ WAITING | Depends on above |

### Needs UI Verification 🔍

| Feature | Status | Notes |
|---------|--------|-------|
| Feedback buttons in Ideas UI | 🔍 VERIFY | Hooks exist, check UI |
| Learning session dashboard | 🔍 VERIFY | Backend ready |
| Version comparison UI | 🔍 VERIFY | Backend ready |

---

## Completed Items ✅

### 1. Shortcode System Rewrite (DONE)
- [x] Rewrite `src/services/shortcodeService.js` with correct GetEducated formats
- [x] Update `ALLOWED_SHORTCODE_TAGS` to `['su_ge-picks', 'su_ge-cta', 'su_ge-qdf']`
- [x] Add `LEGACY_SHORTCODE_TAGS` for detection
- [x] Update `src/services/monetizationEngine.js` to use new shortcode functions
- [x] Update Grok prompts to NOT generate shortcodes
- [x] Update `src/services/validation/prePublishValidation.js`
- [x] Create `docs/v5-updates/10-TONY-FEEDBACK-ACTION-PLAN.md`

### 2. Feedback/Learning System (ALREADY EXISTS)
- [x] `idea_feedback_history` table with decision tracking
- [x] `ai_learning_sessions` table for pattern storage
- [x] `record_idea_feedback()` database function
- [x] `useIdeaFeedbackHistory.js` hooks
- [x] Integration in `generationService.js` (`getTrainingPatterns()`, `autoFixWithLearning()`)
- [x] Integration in `ideaDiscoveryService.js` (`loadLearnedPatterns()`)

### 3. Generation Pipeline (ALREADY EXISTS)
- [x] 8-stage pipeline with all steps
- [x] Configurable options (contentType, targetWordCount, etc.)
- [x] Auto-fix loop (up to 3 attempts)
- [x] Quality metrics calculation
- [x] Contributor assignment algorithm

---

## Priority 1: Import Paid Schools Data ✅ READY TO RUN

**Tony's Concern:** "schools listed aren't paid clients"

**Status:** ✅ MIGRATION FILES CREATED - READY TO RUN IN SUPABASE DASHBOARD

### What Was Done
- [x] Parsed `docs/client/List of Client Schools and Degrees for AI Training.xlsx`
- [x] Created `scripts/import-paid-schools.js` (Node.js import script)
- [x] Created `scripts/generate-degrees-sql.js` (individual inserts)
- [x] Created `scripts/generate-degrees-batch-sql.js` (optimized batch inserts)
- [x] Generated SQL migrations with SECURITY DEFINER to bypass RLS

### Migration Files Created
| File | Description | Records |
|------|-------------|---------|
| `supabase/migrations/20251217000000_seed_paid_schools.sql` | 94 paid schools | 94 schools |
| `supabase/migrations/20251217000001_seed_paid_degrees.sql` | 4,845 degrees | 4,845 degrees |
| `scripts/run-in-supabase-dashboard.sql` | Combined file for easy paste | ~5,100 lines |

### How to Run
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/run-in-supabase-dashboard.sql`
3. Paste and run
4. Verify with: `SELECT COUNT(*) FROM schools WHERE is_paid_client = true;`
   - Expected: 94 schools
5. Verify degrees: `SELECT COUNT(*) FROM degrees WHERE is_sponsored = true;`
   - Expected: 4,845 degrees

### Data Imported
- **94 unique schools** from client Excel file
- **4,845 degree programs** with:
  - Degree level classification (Doctorate, Master, Bachelor, Associate, Certificate)
  - Degree level codes (1-6)
  - `is_sponsored = true`, `sponsorship_tier = 1`
  - Generated slugs for URLs

### Remaining Task
- [ ] Run migrations in Supabase Dashboard
- [ ] Verify data counts after import
- [ ] Test monetization engine with real data

---

## Priority 2: Add Monetization Scoring to Ideas ✅ COMPLETE

**Tony's Concern:** "content with very little focus on content we can monetize"

**Status:** ✅ COMPLETE - Migration and UI created

### What Was Done
- [x] Created `supabase/migrations/20251217000002_add_monetization_scoring.sql`
  - Added `monetization_score`, `monetization_confidence` columns
  - Added `monetization_category_id`, `monetization_concentration_id` columns
  - Added `monetization_degree_level` column
  - Created `calculate_idea_monetization_score()` PostgreSQL function
  - Created auto-scoring trigger on insert/update
  - Included backfill script for existing ideas
- [x] Created `src/hooks/useMonetizationScoring.js` hooks
  - `useCalculateMonetizationScore()` - client-side scoring
  - `useUpdateIdeaMonetizationScore()` - update individual idea
  - `useBatchScoreIdeas()` - batch score all unscored
  - Helper functions for badge colors and labels
- [x] Updated `src/pages/ContentIdeas.jsx` UI
  - Added monetization badge to IdeaCard (High $, Med $, Low $)
  - Added degree level badge (Master, Bachelor, etc.)
  - Added monetization filter buttons
  - Color-coded by confidence level

### Files Created/Modified
| File | Description |
|------|-------------|
| `supabase/migrations/20251217000002_add_monetization_scoring.sql` | Database migration |
| `src/hooks/useMonetizationScoring.js` | React Query hooks |
| `src/pages/ContentIdeas.jsx` | UI updates |

### How to Run
1. Run migration in Supabase Dashboard (included in `scripts/run-in-supabase-dashboard.sql`)
2. Existing ideas will be automatically scored by the backfill script
3. New ideas will be scored automatically via trigger

---

## Priority 3: Verify Feedback UI ✅ ALREADY COMPLETE

**Tony's Concern:** "not correcting and learning and getting better"

**Status:** ✅ COMPLETE - Full system already implemented

### What Already Exists
The feedback/learning system is **fully implemented**:

- [x] `src/hooks/useIdeaFeedbackHistory.js` - Complete hook library
  - `useRecordFeedback()` - Record approve/reject/thumbs decisions
  - `useFeedbackHistory()` - View all feedback
  - `useUntrainedFeedback()` - Get feedback ready for AI training
  - `useFeedbackStats()` - Analytics dashboard
  - `useCreateLearningSession()` - Create AI training sessions
  - `useActivateLearningSession()` - Apply learned patterns
  - 8 rejection categories with descriptions

- [x] `src/pages/ContentIdeas.jsx` UI
  - Thumbs up/down buttons on each idea card
  - Rejection reason modal with category selection
  - Feedback score badge on cards
  - "Train AI" button showing untrained feedback count
  - Feedback History tab

- [x] `src/components/ideas/AILearningModal.jsx`
  - Review pending feedback
  - Claude-powered pattern extraction
  - Create learning sessions
  - Preview improvements before applying

- [x] `src/components/ideas/IdeaFeedbackHistory.jsx`
  - Full feedback history view
  - Statistics and charts
  - Filter by decision type

### Database Tables
- `idea_feedback_history` - Stores all feedback decisions
- `ai_learning_sessions` - Stores learned patterns and improved prompts
- `record_idea_feedback()` - RPC function for atomic feedback recording

### Integration Points
- `ideaDiscoveryService.js` - Loads active learning session patterns
- `generationService.js` - Uses learned patterns for auto-fix
- Patterns are injected into AI prompts automatically

### Verification
All components exist and are properly connected. No changes needed.

---

## Priority 4: Populate Ranking Reports

**Kayleigh's Issues:** Wrong dates, incorrect URLs, mismatched topics

**Status:** Tables exist but are EMPTY

### Database Ready ✅
```sql
-- Already exists in 20250105000001_create_ranking_reports_tables.sql
ranking_reports:
  - report_url, report_title, report_slug
  - degree_level, field_of_study
  - category_id, concentration_id

ranking_report_entries:
  - total_cost, in_state_cost, out_of_state_cost
  - rank_position, best_buy_rank
```

### Tasks
- [ ] Get ranking data export from Tony/Sara
- [ ] Create import script for ranking reports
- [ ] Populate `ranking_reports` and `ranking_report_entries`
- [ ] Test cost data context in generation

### Blocking Question
- Need data source from Tony

---

## Priority 5: WordPress ID Mapping

**Problem:** `[su_ge-cta school="22742"]` requires WordPress IDs

### Tasks
- [ ] Add `wordpress_id` column to `schools` and `degrees` tables
- [ ] Request ID mapping from Justin
- [ ] Import WordPress IDs
- [ ] Update shortcode generation to use WordPress IDs

### Blocking Question
- Need WordPress ID export from Justin

---

## Data Requirements from Tony

| Data Needed | Source | Status |
|-------------|--------|--------|
| Paid schools/degrees | Excel file in `docs/client/` | Have file, need to import |
| WordPress school IDs | Justin | BLOCKING |
| WordPress degree IDs | Justin | BLOCKING |
| Ranking reports data | Tony/Sara | BLOCKING |
| CTA URL format confirmation | Tony | BLOCKING |

---

## Implementation Order

1. **Import Schools Data** (No blocker - Excel file exists)
2. **Add Monetization Scoring** (No blocker)
3. **Verify/Create Feedback UI** (No blocker)
4. **Ranking Data** (Blocked - need data)
5. **WordPress IDs** (Blocked - need mapping)

---

## Progress Tracking

| # | Task | Status | Blocker |
|---|------|--------|---------|
| 1 | Shortcode System | ✅ COMPLETE | - |
| 2 | Feedback Backend | ✅ ALREADY EXISTS | - |
| 3 | Generation Pipeline | ✅ ALREADY EXISTS | - |
| 4 | Import Schools Data | ✅ SQL READY | Run in Supabase Dashboard |
| 5 | Monetization Scoring | ✅ COMPLETE | Run migration in Supabase |
| 6 | Verify Feedback UI | ✅ ALREADY EXISTS | - |
| 7 | Ranking Data | ⏸️ BLOCKED | Need data from Tony |
| 8 | WordPress IDs | ⏸️ BLOCKED | Need mapping from Justin |

---

## Files Created/Modified in This Session

### New Files
| File | Purpose |
|------|---------|
| `scripts/parse-excel-preview.js` | Preview Excel file structure |
| `scripts/import-paid-schools.js` | Node.js import script (RLS blocked) |
| `scripts/generate-degrees-sql.js` | Generate individual INSERT SQL |
| `scripts/generate-degrees-batch-sql.js` | Generate optimized batch SQL |
| `scripts/run-in-supabase-dashboard.sql` | Combined SQL for dashboard (all migrations) |
| `supabase/migrations/20251217000000_seed_paid_schools.sql` | 94 schools migration |
| `supabase/migrations/20251217000001_seed_paid_degrees.sql` | 4,845 degrees migration |
| `supabase/migrations/20251217000002_add_monetization_scoring.sql` | Monetization scoring for ideas |
| `src/hooks/useMonetizationScoring.js` | React Query hooks for scoring |
| `docs/todo/00-TONY-FEEDBACK-PRIORITY-FIXES.md` | This TODO file |
| `docs/todo/01-CONTENT-RULES-SETTINGS-PAGE.md` | Phase 2 settings page plan |

### Modified Files
| File | Changes |
|------|---------|
| `src/services/shortcodeService.js` | Complete rewrite with correct GetEducated shortcodes |
| `src/services/monetizationEngine.js` | Updated to use new shortcode functions |
| `src/services/ai/grokClient.js` | Added rule to NOT generate shortcodes |
| `src/services/validation/prePublishValidation.js` | Added legacy shortcode detection |
| `src/pages/ContentIdeas.jsx` | Added monetization badges and filters |

### Build Status
✅ Build successful (17.68s) - No compilation errors
