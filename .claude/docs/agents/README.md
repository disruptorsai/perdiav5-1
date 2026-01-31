# Agent Documentation

This directory contains comprehensive documentation for Perdia v5 project agents and guides for working with them.

## Documentation Files

### perdiav5-supabase-database-agent.md
Complete specification for the Perdia v5 Supabase Database Agent. Contains:
- Automatic trigger conditions (database, supabase, postgres keywords)
- Project-specific knowledge (14 tables schema)
- Standard patterns and templates (table creation, React Query hooks)
- RLS policy management guidelines
- Performance optimization tips
- Supabase MCP integration commands

**Use this when:** Working with database operations, schema changes, RLS policies, migrations, or React Query hooks.

### Browser Testing Agent (via commands)
Browser testing is handled through slash commands rather than a dedicated agent:
- `/quick-test` - Quick browser test without changes
- `/deploy-test` - Deploy and comprehensive test
- `/debug-loop` - Automated fix-and-deploy loop

**Use these when:** Testing deployments, debugging production issues, or setting up automated testing.

## Active Custom Agents

Custom agent definitions in `.claude/agents/`:

1. **perdiav5-deployment-validator** - Handles deployment validation and testing
   - Pre-deployment checks
   - Build monitoring
   - Post-deployment validation
   - AI pipeline testing

2. **perdiav5-generation-pipeline-agent** (defined in config.json)
   - Grok client management
   - Claude client management
   - Pipeline orchestration
   - Quality scoring

## How Agents Work

**Documentation-based agents** (like the Supabase Database Agent):
- No separate subprocess
- Claude reads the documentation and follows the patterns
- Activated by keyword detection
- Same effectiveness as custom subagents for most use cases

**Custom subagents** (like perdiav5-deployment-validator):
- Defined in `.claude/agents/*.md` with proper frontmatter
- Can be invoked via Task tool
- Run as specialized subprocess
- More formal integration with Claude Code

## Agent Configuration

The `config.json` in `.claude/agents/` defines:
- Agent names and descriptions
- Trigger keywords and patterns
- Capabilities
- MCP server integration settings
- Project-specific file locations

## Using Agents

### Automatic Activation
Agents automatically activate when their trigger keywords are detected in your messages.

Examples:
- "Add a new table for..." → Supabase Database Agent
- "Deploy to production" → Deployment Validator
- "Generate an article..." → Generation Pipeline Agent

### Manual Invocation
You can explicitly request an agent:
```
"Use the Supabase Database Agent to add a subscriptions table"
"Use the deployment validator to check the production site"
```

### Via Slash Commands
```
/deploy-test "new feature description"
/quick-test https://your-deployed-site.com
/debug-loop https://your-deployed-site.com
```

## Project-Specific Patterns

All agents follow Perdia v5 patterns:
- React Query for data fetching (not custom SDK)
- Centralized Supabase client (`src/services/supabaseClient.js`)
- Custom hooks in `src/hooks/`
- Two-pass AI generation (Grok → Claude)
- Quality scoring system

## Adding New Agents

To add a new project-specific agent:

1. Create documentation: `.claude/docs/agents/{agent-name}.md`
2. Optionally create subagent definition: `.claude/agents/{agent-name}.md` (with frontmatter)
3. Update `config.json` with agent configuration
4. Update this README
5. Reference in `CLAUDE.md` if needed for automatic activation

## MCP Server Integration

Agents can automatically use MCP servers when available:
- **Supabase MCP** - For database operations
- **Netlify MCP** - For deployment management
- **Playwright MCP** - For browser testing
- **DataForSEO MCP** - For keyword research

See `.claude/mcp.json.example` for configuration templates.

## Related Documentation

- **Main Guide:** `CLAUDE.md`
- **Agent Config:** `.claude/agents/config.json`
- **MCP Setup:** `.claude/mcp.json.example`
- **Slash Commands:** `.claude/commands/`
