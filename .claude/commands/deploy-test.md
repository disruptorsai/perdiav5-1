---
description: Deploy current changes and run comprehensive tests on the deployed site
---

# Deploy and Test

## Step 1: Pre-Deployment Checks
1. Run linting: `npm run lint`
2. Run build validation: `npm run build`
3. Check for uncommitted changes: `git status`
4. Verify environment variables are documented in `.env.example`
5. Check that no secrets are being committed

## Step 2: Commit and Deploy
1. Stage all changes: `git add .`
2. Commit with message: `git commit -m "feat: $ARGUMENTS"`
3. Push to remote: `git push origin v1` (or current branch)
4. Display commit hash and message

## Step 3: Monitor Deployment
1. Monitor deployment status via hosting platform
2. Wait for build to start (30 seconds)
3. Check build progress every 15 seconds
4. Maximum wait time: 5 minutes
5. Report build status (success, failed, or timeout)

## Step 4: Browser Testing
Once deployed:
1. Get the deployment URL
2. Navigate to the deployed site
3. Wait for page load
4. Check console for errors and warnings
5. Take screenshot of initial state

## Step 5: Functional Testing
Test key Perdia v5 functionality:

### Authentication
- [ ] Sign in page loads
- [ ] Sign up page loads
- [ ] Auth redirects work correctly

### Dashboard
- [ ] Dashboard renders without errors
- [ ] Kanban board displays articles
- [ ] Status metrics show correctly

### Content Ideas
- [ ] Ideas list loads
- [ ] Can view idea details
- [ ] Approval workflow works

### Article Editor
- [ ] Editor loads without errors
- [ ] Rich text editor functional
- [ ] Quality score displays

### Generation Pipeline (if API keys configured)
- [ ] Can initiate generation
- [ ] Progress indicators work
- [ ] Generated content saves correctly

## Step 6: Report
Provide a comprehensive deployment report:
- **Commit:** Hash and message
- **Branch:** Current branch name
- **Deployment Status:** Success/Failed
- **Deployment URL:** Live site URL
- **Build Time:** How long the build took
- **Browser Test Results:**
  - Errors found: Count and details
  - Warnings found: Count and details
  - Screenshot location
- **Functional Tests:** Pass/Fail for each category
- **Overall Status:** PASS or FAIL

If deployment or tests fail, provide recommendations for fixes.

## Perdia v5 Specific Validations
- Verify Supabase tables are accessible
- Check that React Query is caching properly
- Verify protected routes require authentication
- Test that AI generation services respond (if keys set)
