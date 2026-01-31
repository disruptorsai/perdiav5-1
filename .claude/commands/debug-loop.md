---
description: Automated debugging loop for deployed site - navigates, captures errors, fixes, and redeploys
---

# Automated Debugging Loop

Execute the following steps in a loop until no errors remain:

## Phase 1: Navigate and Inspect
1. Navigate to the deployment URL: $ARGUMENTS
2. Wait for page to fully load (check for network idle)
3. Open browser console and capture all console errors, warnings, and network failures
4. Take a screenshot of the current state
5. Capture the full DOM and any visible error messages

## Phase 2: Error Analysis
If console errors or network failures are detected:
1. Extract the full error message, stack trace, and line numbers
2. Identify the source file and specific code causing the error
3. Determine the root cause (syntax error, undefined variable, API issue, etc.)
4. Plan the fix required

## Phase 3: Fix Implementation
1. Locate the problematic file in the codebase
2. Implement the fix with proper error handling
3. Ensure the fix doesn't break existing functionality
4. Run local build to verify: `npm run build`

## Phase 4: Deployment
1. Stage changes: `git add .`
2. Commit with descriptive message: `git commit -m "fix: [brief description of error fixed]"`
3. Push to remote: `git push origin v1` (current branch)
4. Display commit hash and message

## Phase 5: Monitor Deployment
1. Check deployment status (Netlify/Vercel dashboard or CLI)
2. Wait for build to complete (check every 15 seconds, max 5 minutes)
3. Report when deployment is live
4. Get the new deployment URL

## Phase 6: Verification
1. Navigate to the newly deployed site
2. Check console for errors again
3. Verify the original error is resolved
4. Check for any new errors introduced

## Loop Control
- Maximum iterations: 10 loops
- If errors persist after 10 loops, stop and report detailed findings
- If no errors found, report success and create a summary

## Final Report
When complete or max iterations reached, provide:
- Total errors fixed
- List of all commits made
- Final deployment URL
- Screenshot of error-free console (if successful)
- Any remaining issues (if unsuccessful)

## Perdia v5 Specific Checks
Additionally check for:
- Supabase connection errors (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- AI API errors (VITE_GROK_API_KEY, VITE_CLAUDE_API_KEY)
- React Query cache/stale data issues
- Authentication state errors
- Generation pipeline failures
