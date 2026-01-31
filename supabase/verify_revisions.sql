-- Revision Verification Query
-- Run this in Supabase SQL Editor to check the state of all revision comments
-- Created: January 2026

-- 1. Summary of revision statuses
SELECT
  status,
  ai_validation_status,
  ai_revised,
  COUNT(*) as count
FROM article_revisions
GROUP BY status, ai_validation_status, ai_revised
ORDER BY count DESC;

-- 2. Find revisions that were marked as addressed by AI but may need verification
-- These are the ones where validation might have been too strict
SELECT
  ar.id,
  ar.article_id,
  a.title as article_title,
  ar.comment,
  LEFT(ar.selected_text, 100) as selected_text_preview,
  ar.status,
  ar.ai_validation_status,
  ar.ai_validation_evidence,
  ar.ai_validation_warnings,
  ar.ai_revised,
  ar.ai_revision_failed,
  ar.created_at
FROM article_revisions ar
LEFT JOIN articles a ON ar.article_id = a.id
WHERE ar.ai_revised = true
  AND (ar.ai_validation_status = 'partial' OR ar.ai_validation_status = 'failed')
ORDER BY ar.created_at DESC;

-- 3. Find pending revisions that were never processed
SELECT
  ar.id,
  ar.article_id,
  a.title as article_title,
  ar.comment,
  LEFT(ar.selected_text, 100) as selected_text_preview,
  ar.status,
  ar.ai_revised,
  ar.created_at
FROM article_revisions ar
LEFT JOIN articles a ON ar.article_id = a.id
WHERE ar.status = 'pending'
  AND (ar.ai_revised IS NULL OR ar.ai_revised = false)
ORDER BY ar.created_at DESC;

-- 4. Check articles that have been marked as revised
SELECT
  id,
  title,
  status,
  is_revision,
  updated_at
FROM articles
WHERE is_revision = true
ORDER BY updated_at DESC
LIMIT 20;

-- 5. Find revisions with potential issues (warnings from validator)
SELECT
  ar.id,
  ar.article_id,
  a.title,
  ar.comment,
  ar.ai_validation_warnings,
  ar.created_at
FROM article_revisions ar
LEFT JOIN articles a ON ar.article_id = a.id
WHERE ar.ai_validation_warnings IS NOT NULL
  AND ar.ai_validation_warnings != ''
ORDER BY ar.created_at DESC;
