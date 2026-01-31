# Claude Code Configuration for Perdia v5

This directory contains Claude Code project-specific settings, custom agents, and slash commands for the Perdia v5 Content Production System.

## Directory Structure

```
.claude/
├── agents/                    # Custom agent definitions
│   ├── config.json           # Agent configurations and triggers
│   ├── perdiav5-deployment-validator.md  # Deployment validation agent
│   └── README.md             # Agents directory guide
├── commands/                  # Custom slash commands
│   ├── add-feature.md
│   ├── check-quality.md
│   ├── debug-loop.md         # NEW: Automated debugging loop
│   ├── debug-pipeline.md
│   ├── deploy-test.md        # NEW: Deploy and test
│   ├── generate-article.md
│   ├── migrate-to-edge-functions.md
│   ├── optimize-prompts.md
│   ├── quick-test.md         # NEW: Quick browser test
│   ├── review-architecture.md
│   ├── setup-database.md
│   └── test-ai-clients.md
├── docs/                      # Documentation
│   └── agents/
│       ├── perdiav5-supabase-database-agent.md  # Database agent spec
│       ├── HOW_TO_ADD_AGENT.md                  # Guide for adding agents
│       └── README.md
├── mcp.json.example          # MCP server configuration template
└── README.md                 # This file
```

## Available Agents

### 1. Supabase Database Agent
**Triggers:** database, supabase, postgres, sql, table, schema, migration, rls, query, index

Comprehensive database management agent with knowledge of:
- Complete Perdia v5 schema (14 tables)
- RLS policy patterns
- React Query hook patterns
- Migration templates
- Performance optimization

### 2. Deployment Validator Agent
**Triggers:** deploy, build, release, production, broken, failing, site error

Handles deployment validation:
- Pre-deployment checks
- Build monitoring
- Post-deployment health checks
- AI pipeline testing
- Error diagnosis

### 3. Generation Pipeline Agent
**Triggers:** generate, grok, claude, humanize, pipeline, quality score

AI content generation specialist:
- Two-pass generation (Grok → Claude)
- Quality scoring
- Contributor assignment
- Internal linking

## Available Slash Commands

### Setup & Configuration
| Command | Description |
|---------|-------------|
| `/setup-database` | Set up Supabase database with migrations |
| `/test-ai-clients` | Test Grok and Claude API connections |

### Content Generation
| Command | Description |
|---------|-------------|
| `/generate-article` | Generate article using two-pass pipeline |
| `/check-quality` | Analyze article quality metrics |

### Development & Debugging
| Command | Description |
|---------|-------------|
| `/debug-pipeline` | Debug AI generation pipeline issues |
| `/debug-loop <url>` | Automated debugging loop (fix → deploy → verify) |
| `/review-architecture` | Conduct architecture review |
| `/add-feature` | Guide for adding new features |

### Testing & Deployment
| Command | Description |
|---------|-------------|
| `/quick-test <url>` | Quick browser test (no changes) |
| `/deploy-test <message>` | Deploy and comprehensive test |

### Production Readiness
| Command | Description |
|---------|-------------|
| `/migrate-to-edge-functions` | Migrate AI calls to Edge Functions |
| `/optimize-prompts` | Optimize AI prompts for quality |

## MCP Server Configuration

This project can use MCP (Model Context Protocol) servers for enhanced capabilities.

### Setup Instructions

1. Copy the example configuration:
   ```bash
   cp .claude/mcp.json.example .claude/mcp.json
   ```

2. Edit `.claude/mcp.json` and replace placeholder values:
   - `SUPABASE_ACCESS_TOKEN` - Get from https://supabase.com/dashboard/account/tokens
   - `NETLIFY_AUTH_TOKEN` - Get from Netlify personal access tokens
   - `DATAFORSEO_*` - Get from DataForSEO account (optional)

3. The `.claude/mcp.json` file is gitignored to protect credentials.

### Available MCP Servers

| Server | Purpose |
|--------|---------|
| **supabase** | Database operations, schema inspection, query testing |
| **netlify** | Deployment management, build logs, environment variables |
| **dataforseo** | Keyword research, SEO metrics (optional) |
| **playwright** | Browser automation for testing |

## Using Agents

### Automatic Activation
Agents activate automatically when their trigger keywords are detected:

```
"Add a new table for user preferences"
→ Database Agent activates automatically

"Deploy to production"
→ Deployment Validator activates automatically
```

### Manual Invocation
```
"Use the database agent to optimize the articles query"
"Use the deployment validator to run pre-flight checks"
```

## Adding New Components

### New Slash Commands
1. Create `.md` file in `.claude/commands/`
2. Add description frontmatter
3. Write instructions
4. Update this README

### New Agents
See `.claude/docs/agents/HOW_TO_ADD_AGENT.md` for detailed instructions.

## Project-Specific Patterns

All configurations follow Perdia v5 patterns:
- **Data fetching:** React Query (TanStack Query)
- **Database:** Supabase PostgreSQL
- **AI Services:** Grok for drafts, Claude for humanization
- **State:** React Query cache + React Context (auth only)
- **Styling:** Tailwind CSS 4.1 + Shadcn patterns

## Related Documentation

- **Main Guide:** `CLAUDE.md` (project root)
- **Architecture:** Detailed in `CLAUDE.md`
- **Database Schema:** `supabase/migrations/`
- **AI Clients:** `src/services/ai/`

## Best Practices

1. **Commands** should be task-focused and actionable
2. **Agents** should have clear trigger keywords
3. **Always** update documentation when adding features
4. **Reference** specific files and line numbers when helpful
5. **Follow** existing patterns in the codebase
