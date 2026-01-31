---
description: Use MCP and database subagent to implement database changes
---

# Database Implementation Mode

When implementing database-related changes, follow this approach:

## Priority Order

1. **Use MCP tools first** - If Supabase MCP is available, use it directly for:
   - Creating/modifying tables
   - Writing RLS policies
   - Running SQL queries
   - Checking table schemas

2. **Use the perdiav5-supabase-database subagent** - For complex database work:
   - Multi-table migrations
   - React Query hooks that follow project patterns
   - Troubleshooting RLS/permission issues
   - Query optimization

3. **Create migration files** - Always generate proper migration SQL files in `supabase/migrations/` with:
   - Timestamp prefix (YYYYMMDDHHMMSS)
   - Descriptive name
   - Comments explaining purpose
   - RLS policies included

## What to Implement

- Create any needed database tables
- Write complete RLS policies for shared workspace model
- Create React Query hooks in `src/hooks/` following existing patterns
- Add proper indexes for query performance
- Include rollback instructions if applicable

## After Implementation

- Provide the SQL that needs to be run in Supabase dashboard (if MCP can't execute it)
- List any environment variables or secrets needed
- Note any Edge Functions that may be required

**Do not ask for permission - just implement what's needed to complete the task.**
