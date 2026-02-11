# perdiav5 - User-Specific Context

> **Updated:** 2026-02-06

This file contains user-specific configuration for the Disruptors development environment. See root `CLAUDE.md` for project architecture and conventions.

## Global Tools Available

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

---
*Global system docs: ~/Documents/personal/claude-timesheet-system/*
