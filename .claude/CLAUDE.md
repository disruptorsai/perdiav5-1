# perdiav5 - Claude Code Context

> **Initialized:** 2025-12-15 | **Updated:** 2026-01-12
> **Path:** C:\Users\Disruptors\Documents\Tech Integration Labs BB1\Projects\Perdiav5\perdiav5

## Project Description

Perdia v5 is an AI-powered content production system built with React 19, Vite, and Supabase. The application orchestrates a two-pass AI generation pipeline (Grok for drafting → StealthGPT for humanization) to produce SEO-optimized articles with automated quality assurance, contributor assignment, and WordPress publishing capabilities.

**Primary Client:** GetEducated.com

## Global Tools Available

This project is connected to the Disruptors global development environment.

### Automatic Time Tracking
All work is automatically logged to `~/.claude/timesheet/logs/`
- Sessions, prompts, and tool usage captured
- Time calculated in 15-minute blocks (0.25 hrs each)

### Commands
| Command | Description |
|---------|-------------|
| `/hours` | Quick timesheet summary |
| `/hours week` | Last 7 days summary |
| `/timesheet` | Detailed breakdown |
| `/notion-sync` | Push to Notion |
| `/init` | Re-run this setup |
| `/get-env` | Show project's service configs |

### MCP Servers
- **Notion** - Page/database management
- **GoHighLevel** - CRM integration
- **Supabase** - Database (project: perdiav5)
- **Netlify** - Deployments (site: perdiav5)

### Subagents
- `timesheet-reporter` - "Generate my timesheet"
- `notion-timesheet` - "Sync to Notion"
- `project-init` - "Initialize this project"

## Service Configuration

| Service | Project/Site | ID |
|---------|--------------|-----|
| Supabase | perdiav5 | nvffvcjtrgxnunncdafz |
| Netlify | perdiav5 | e6c79ffe-d40e-4123-b404-ade94e4ec295 |
| GitHub | disruptorsai/perdiav5 | - |

**Live URL:** https://perdiav5.netlify.app
**DB Host:** db.nvffvcjtrgxnunncdafz.supabase.co

Configuration sourced from: `/Operations/dev-config-system/projects/_registry.json`

## Project Notes

- See root `CLAUDE.md` for detailed project architecture and conventions
- AI generation pipeline: Grok → StealthGPT → Claude (fallback)
- 4 approved authors: Tony Huffman, Kayleigh Gilbert, Sara, Charity
- See `docs/v5-updates/` for GetEducated-specific requirements

## Key Files

- `src/services/generationService.js` - Main AI generation pipeline
- `src/services/ai/grokClient.js` - Grok API client (drafting)
- `src/services/ai/stealthGptClient.js` - StealthGPT client (humanization)
- `src/services/ai/claudeClient.js` - Claude API client (fallback/revision)
- `src/contexts/AuthContext.jsx` - Authentication layer
- `src/App.jsx` - Main routing
- `supabase/migrations/` - Database migrations

---
*Global system docs: ~/Documents/personal/claude-timesheet-system/*
