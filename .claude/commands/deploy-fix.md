---
description: Fix Netlify deployment failures with closed-loop check/fix/push cycle
---

# Fix Netlify Deployment - Closed Loop

Diagnose and fix Netlify deployment failures using a closed-loop approach until the build succeeds.

## Tools to Use

1. **Netlify MCP** - Check build logs, deployment status, environment variables
2. **perdiav5-deployment-validator subagent** - For complex deployment issues

## Closed Loop Process

Repeat until deployment succeeds:

### 1. CHECK
- Get the latest deployment/build logs from Netlify
- Identify the specific error(s) causing the failure
- Check if it's a build error, dependency issue, env var problem, etc.

### 2. FIX
- Make the necessary code changes to fix the identified error
- Update dependencies if needed
- Fix environment variable issues if applicable

### 3. COMMIT & PUSH
- Stage all changes
- Commit with a descriptive message about what was fixed
- Push to the current branch

### 4. VERIFY
- Wait for Netlify to start a new build
- Check the new build status/logs
- If still failing, go back to step 1 with the new error

## Common Issues to Check

- TypeScript/ESLint errors that only show in production build
- Missing environment variables on Netlify
- Dependency version mismatches
- Build command or publish directory misconfiguration
- Node.js version mismatch

**Do not ask for confirmation - keep looping until the deployment succeeds.**
