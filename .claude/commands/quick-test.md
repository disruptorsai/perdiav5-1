---
description: Quick browser test of deployed site - captures console errors without making changes
---

# Quick Browser Test

1. Navigate to $ARGUMENTS in a browser using Playwright or manual inspection
2. Wait for page to fully load (networkidle)
3. Check browser console for any errors or warnings
4. Capture all console messages with their types and locations
5. Test key functionality:
   - Authentication pages accessible
   - Dashboard loads correctly
   - Navigation between pages works
   - API calls succeed (check Network tab)
6. Take a screenshot of the current state
7. Report findings with:
   - Total errors found
   - Total warnings found
   - List of all console messages
   - Screenshot location
   - Network failures (if any)
8. **IMPORTANT:** Do NOT make any code changes - just report status

## Output Format
Provide a detailed report including:
- **URL Tested:** The deployment URL
- **Timestamp:** When the test was run
- **Page Load Time:** How long to reach networkidle
- **Status:** PASS or FAIL

### Console Output
- **Errors:** Count and full details
- **Warnings:** Count and details
- **Info/Debug:** Count (details if relevant)

### Network Analysis
- **Failed Requests:** List with status codes
- **Slow Requests:** Requests > 2 seconds
- **API Errors:** Any 4xx or 5xx responses

### Visual Check
- **Screenshot:** Path to saved screenshot
- **Render Issues:** Any visible problems

### Recommendations
- What needs to be fixed (if any)
- Priority ranking of issues
- Suggested next steps

## Perdia v5 Specific Checks
Pay special attention to:
- Supabase auth errors (check for 401/403)
- React Query errors in console
- Missing environment variable warnings
- AI API connection errors
- Generation service failures
