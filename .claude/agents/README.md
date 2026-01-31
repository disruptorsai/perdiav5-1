# Perdia v5 Project Agents

This directory contains project-specific agent configurations for Claude Code to use when working on the Perdia v5 Content Production System.

## Available Agents

### 1. Perdia v5 Deployment Validator

**File:** `perdiav5-deployment-validator.md`
**Status:** Active
**Auto-Invoke:** Yes

**Purpose:**
Comprehensive deployment management agent that handles all deployment-related operations, validation, and testing.

**Automatically Triggers When:**
- Deployment keywords detected (deploy, build, release, production)
- Site errors mentioned (broken, failing, down, 500 error)
- CI/CD operations needed

**Capabilities:**
- Pre-deployment validation (lint, build, env vars)
- Deployment monitoring
- Post-deployment health checks
- AI pipeline testing
- Error diagnosis and recovery

### 2. Perdia v5 Supabase Database Agent

**File:** `../docs/agents/perdiav5-supabase-database-agent.md`
**Status:** Active (documentation-based)
**Auto-Invoke:** Yes

**Purpose:**
Database management agent that handles all Supabase-related operations.

**Automatically Triggers When:**
- Database keywords detected (database, supabase, postgres, sql, table)
- Schema operations needed (create table, migration, rls)
- Performance keywords (slow query, optimize, index)
- Database errors (403, permission denied, query failed)

**Capabilities:**
- Schema management
- RLS policy management
- Migration creation
- React Query hook integration
- Performance optimization
- Documentation maintenance

### 3. Perdia v5 Generation Pipeline Agent

**Defined in:** `config.json`
**Status:** Active (config-based)
**Auto-Invoke:** Yes

**Purpose:**
AI content generation pipeline specialist.

**Automatically Triggers When:**
- Generation keywords (generate, grok, claude, humanize)
- Pipeline operations (two-pass, quality score, contributor)
- AI content keywords (draft, anti-ai, perplexity)

**Capabilities:**
- Grok client management
- Claude client management
- Pipeline orchestration
- Quality scoring
- Contributor assignment
- Internal linking

## Agent Configuration

### config.json

Defines agent triggers, capabilities, and integration points:

```json
{
  "agents": [
    {
      "name": "agent-name",
      "triggers": { "keywords": [...], "automatic": true },
      "capabilities": [...],
      "project_specific": { ... }
    }
  ]
}
```

### Agent Documentation

Each agent has documentation with:
- Agent identity and purpose
- Automatic trigger conditions
- Project-specific knowledge
- Standard patterns and templates
- Example interactions

## Using Agents

### Automatic Activation
Agents automatically activate when their trigger keywords are detected:

```
User: "Add a new table for tracking analytics"
→ Supabase Database Agent activates

User: "Deploy the latest changes to production"
→ Deployment Validator Agent activates

User: "The article generation is failing"
→ Generation Pipeline Agent activates
```

### Manual Invocation
You can explicitly request an agent:

```
"Use the deployment validator to check production status"
"Use the database agent to optimize the articles query"
```

### Via Slash Commands
```
/deploy-test "new feature"
/quick-test https://site.com
/debug-loop https://site.com
```

## Adding New Agents

To add a new project-specific agent:

1. Create agent documentation: `.claude/docs/agents/{agent-name}.md`
2. Optionally create subagent definition: `.claude/agents/{agent-name}.md`
3. Update `config.json` with agent configuration
4. Update README files
5. Update `CLAUDE.md` if needed

See `.claude/docs/agents/HOW_TO_ADD_AGENT.md` for detailed instructions.

## Project Patterns

All agents should:
- Follow Perdia v5 architecture patterns
- Reference actual file paths from the project
- Use React Query for data fetching
- Use centralized Supabase client
- Keep documentation updated
- Use MCP servers when applicable

## MCP Server Integration

Agents can use these MCP servers (when configured):
- **Supabase MCP** - Database operations
- **Netlify MCP** - Deployment management
- **Playwright MCP** - Browser testing
- **DataForSEO MCP** - Keyword research

See `.claude/mcp.json.example` for setup.

## Related Documentation

- **Main Guide:** `CLAUDE.md`
- **Agent Docs:** `.claude/docs/agents/`
- **Slash Commands:** `.claude/commands/`
- **MCP Config:** `.claude/mcp.json.example`

---

**Note:** These agents are project-specific and tailored to the Perdia v5 Content Production System. They have deep knowledge of the project's schema, AI pipeline, and architectural decisions.
