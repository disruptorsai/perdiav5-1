# TODO: Content Rules Settings Page

**Priority:** Phase 2 (After core fixes)
**Status:** NOT STARTED
**Created:** 2025-12-17

---

## Overview

Create a comprehensive settings page where Tony can view, edit, and version-control all content generation rules, toggle pipeline steps, and restore previous configurations.

---

## Database Tasks

- [ ] Create migration `20251217000000_content_rules_config.sql`
  - [ ] `content_rules_config` table with JSONB columns
  - [ ] `content_rules_history` table for version tracking
  - [ ] RLS policies
  - [ ] Indexes

- [ ] Create seed data migration `20251217000001_seed_content_rules.sql`
  - [ ] Migrate hardcoded values from current codebase
  - [ ] Set initial version to 1

---

## React Query Hooks

- [ ] Create `src/hooks/useContentRulesConfig.js`
  - [ ] `useContentRulesConfig()` - Get active config
  - [ ] `useUpdateContentRulesConfig()` - Update with versioning
  - [ ] `useContentRulesHistory()` - Get version history
  - [ ] `useRestoreContentRulesVersion()` - Restore previous version

---

## UI Components

### Main Tab Container
- [ ] Create `src/components/settings/content-rules/ContentRulesTab.jsx`
  - [ ] Sub-tab navigation (Hard Rules, Guidelines, Tone, Pipeline, Authors)
  - [ ] Save/Discard buttons
  - [ ] Unsaved changes detection

### Section Components
- [ ] `HardRulesSection.jsx`
  - [ ] Approved authors list (add/remove/edit)
  - [ ] Blocked domains list
  - [ ] Allowed external sources list
  - [ ] Toggle switches for enforcement options

- [ ] `GuidelinesSection.jsx`
  - [ ] Word count min/target/max inputs
  - [ ] Structure requirements (headings, FAQs)
  - [ ] Link count requirements
  - [ ] Quality score thresholds

- [ ] `ToneVoiceSection.jsx`
  - [ ] Overall style textarea
  - [ ] Banned phrases list (add/remove)
  - [ ] Preferred phrases list
  - [ ] Content focus points

- [ ] `PipelineSection.jsx`
  - [ ] List of pipeline steps with toggle switches
  - [ ] Expandable config for each step
  - [ ] Step reordering (drag-and-drop optional)
  - [ ] Provider selection per step

- [ ] `AuthorMappingSection.jsx`
  - [ ] Per-author expertise areas
  - [ ] Content type assignments
  - [ ] Keyword associations

- [ ] `ShortcodeRulesSection.jsx`
  - [ ] Allowed shortcodes display
  - [ ] Legacy shortcodes blocked list
  - [ ] Monetization position settings

### Reusable Components
- [ ] `DomainListEditor.jsx` - Add/remove domains with validation
- [ ] `PhraseListEditor.jsx` - Add/remove phrases
- [ ] `PipelineStepCard.jsx` - Individual step with toggle and config

### Version History
- [ ] `VersionHistoryPanel.jsx`
  - [ ] List of versions with metadata
  - [ ] Diff view modal
  - [ ] Restore confirmation dialog
  - [ ] Change summary display

---

## Settings Page Integration

- [ ] Add "Content Rules" tab to `src/pages/Settings.jsx`
- [ ] Import and render ContentRulesTab component
- [ ] Add tab icon and description

---

## Service Integration

- [ ] Update `src/services/generationService.js` to read from config
- [ ] Update `src/services/validation/prePublishValidation.js` to use config
- [ ] Update `src/services/validation/linkValidator.js` to use config
- [ ] Update `src/services/ai/grokClient.js` to use config for prompts
- [ ] Update `src/hooks/useContributors.js` to read approved authors from config

---

## Testing

- [ ] Test version history creation on save
- [ ] Test restore functionality
- [ ] Test pipeline step toggling affects generation
- [ ] Test settings changes reflect in article generation
- [ ] Test validation uses updated rules

---

## Documentation

- [ ] Update CLAUDE.md with new settings system
- [ ] Add inline help text for each setting
- [ ] Create user guide for Tony

---

## Estimated Effort

| Phase | Tasks | Time |
|-------|-------|------|
| Database | Migration + seed | 2 hours |
| Hooks | React Query hooks | 2 hours |
| Basic UI | Read-only display | 3 hours |
| Editing UI | Forms + validation | 4 hours |
| Pipeline Editor | Toggles + config | 3 hours |
| Version History | Diff + restore | 3 hours |
| Integration | Service updates | 4 hours |
| Testing | End-to-end | 2 hours |
| **Total** | | **~23 hours** |

---

## Dependencies

- Requires Tony's feedback issues to be fixed first (monetization, feedback system)
- Can be built in parallel with other work if needed
