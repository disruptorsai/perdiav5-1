-- Migration: Allow authenticated users to write to geteducated_articles
-- Date: 2026-01-13
-- Purpose: Fix 403 errors on sitemap sync by allowing authenticated users to upsert
--
-- ISSUE: The geteducated_articles table has RLS policies that only allow:
--   - Authenticated users: SELECT only
--   - Service role: INSERT/UPDATE/DELETE
--
-- The sitemap sync runs from the browser using the anon key (authenticated user),
-- not the service_role key, so upserts fail with 403 Forbidden.
--
-- SOLUTION: Add INSERT and UPDATE policies for authenticated users.
-- This is safe because:
--   1. Only authenticated users can make changes
--   2. This is reference data (GetEducated site catalog), not user-sensitive data
--   3. The data originates from public sitemap crawling

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Authenticated users can insert geteducated_articles" ON geteducated_articles;
DROP POLICY IF EXISTS "Authenticated users can update geteducated_articles" ON geteducated_articles;

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert geteducated_articles"
ON geteducated_articles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update geteducated_articles"
ON geteducated_articles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ROLLBACK (if needed):
-- DROP POLICY "Authenticated users can insert geteducated_articles" ON geteducated_articles;
-- DROP POLICY "Authenticated users can update geteducated_articles" ON geteducated_articles;
