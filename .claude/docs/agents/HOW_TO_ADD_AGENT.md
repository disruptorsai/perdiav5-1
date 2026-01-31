# How to Add Custom Agents to Perdia v5

This guide explains how to add custom agents to the Perdia v5 project for Claude Code.

## Overview

Custom agents in Claude Code can be added through:
1. **Documentation Files** - Detailed agent specifications that Claude follows
2. **Subagent Definitions** - Markdown files with frontmatter for Task tool invocation
3. **Configuration** - `config.json` for trigger keywords and capabilities

## Option 1: Documentation-Based Agent (Recommended)

Create a comprehensive documentation file that Claude reads and follows.

### Steps:

1. **Create agent documentation:**
   ```
   .claude/docs/agents/{agent-name}.md
   ```

2. **Include these sections:**
   - Agent Identity (name, type, project)
   - Automatic Trigger Conditions (keywords, patterns)
   - Project-Specific Knowledge (schema, patterns, file locations)
   - Capabilities and Responsibilities
   - Standard Templates
   - Example Workflows
   - Quality Checklist

3. **Update config.json:**
   ```json
   {
     "agents": [
       {
         "name": "your-agent-name",
         "description": "What this agent does",
         "triggers": {
           "keywords": ["keyword1", "keyword2"],
           "patterns": [".*\\bpattern\\b.*"],
           "automatic": true
         },
         "capabilities": ["capability1", "capability2"],
         "documentation": {
           "main": ".claude/docs/agents/your-agent.md"
         }
       }
     ]
   }
   ```

4. **Reference in CLAUDE.md** (optional but recommended for high-priority agents)

### Example: Content Strategy Agent

```markdown
# Content Strategy Agent

## Agent Identity
**Name:** perdiav5-content-strategy-agent
**Type:** Content Planning & Strategy Specialist
**Project:** Perdia v5

## Automatic Trigger Conditions

### Keywords
- "content strategy", "content plan", "editorial calendar"
- "topic cluster", "pillar content", "content gap"

## Capabilities
1. Analyze content gaps
2. Suggest topic clusters
3. Plan editorial calendar
4. Competitor content analysis

## Standard Workflows
...
```

## Option 2: Subagent Definition (Task Tool Integration)

Create a markdown file with frontmatter for formal Task tool invocation.

### Steps:

1. **Create subagent file:**
   ```
   .claude/agents/{agent-name}.md
   ```

2. **Include frontmatter:**
   ```yaml
   ---
   name: agent-name
   description: Use this agent when... (include examples)
   model: inherit
   color: cyan
   ---
   ```

3. **Write the agent prompt** (everything after frontmatter)

### Example:

```markdown
---
name: perdiav5-seo-analyzer
description: Use this agent when you need to analyze SEO metrics, keyword rankings, or content optimization opportunities. This agent automatically activates when SEO-related keywords are mentioned.

Examples:

<example>
user: "Analyze the SEO performance of our latest articles"
assistant: "I'll use the Task tool to launch the perdiav5-seo-analyzer agent..."
</example>
model: inherit
color: green
---

You are an SEO analysis specialist for the Perdia v5 Content Production System...

[Full agent prompt here]
```

## Option 3: Lightweight Config-Only Agent

For simpler agents, you can define them entirely in `config.json`:

```json
{
  "name": "perdiav5-simple-agent",
  "description": "Handles X functionality",
  "triggers": {
    "keywords": ["keyword1", "keyword2"],
    "automatic": true
  },
  "capabilities": ["capability1"],
  "project_specific": {
    "key_files": ["src/file1.js", "src/file2.js"]
  }
}
```

This relies on Claude's general knowledge plus the keywords/context to handle requests.

## Best Practices

### 1. Be Specific to Perdia v5
- Reference actual file paths (`src/services/`, `src/hooks/`)
- Use project terminology (React Query, Supabase, Grok/Claude)
- Include real table names and schema details

### 2. Include Trigger Keywords
- Think about what users might say
- Include error messages as triggers
- Add action verbs ("create", "optimize", "debug")

### 3. Provide Templates
- SQL migration templates
- React Query hook templates
- Component patterns

### 4. Add Quality Checklists
- What to verify before completing
- Common mistakes to avoid
- Security considerations

### 5. Include Examples
- Real-world scenarios
- Expected input/output
- Before/after comparisons

## Testing Your Agent

1. **Keyword Test:**
   ```
   "I need help with [your keyword]"
   ```
   Verify the agent activates.

2. **Capability Test:**
   Ask for something the agent should handle.
   Verify it follows the documented patterns.

3. **Edge Case Test:**
   Try ambiguous requests.
   Verify graceful handling.

## Agent Categories for Perdia v5

Consider creating agents for:

- **Database Operations** - ✅ Done (Supabase Database Agent)
- **Deployment** - ✅ Done (Deployment Validator)
- **AI Generation** - ✅ Done (Generation Pipeline Agent)
- **Content Strategy** - Plan content, analyze gaps
- **SEO Analysis** - Keyword research, optimization
- **WordPress Publishing** - Publish workflow, scheduling
- **Quality Assurance** - Quality scoring, issue detection
- **Analytics** - Performance tracking, reporting

## File Structure

After adding agents:

```
.claude/
├── agents/
│   ├── config.json                    # Agent configurations
│   ├── perdiav5-deployment-validator.md  # Subagent definition
│   └── README.md                      # Agents directory guide
├── commands/
│   ├── debug-loop.md
│   ├── deploy-test.md
│   └── quick-test.md
├── docs/
│   └── agents/
│       ├── perdiav5-supabase-database-agent.md
│       ├── HOW_TO_ADD_AGENT.md        # This file
│       └── README.md
├── mcp.json.example
└── README.md
```

## Summary

**For most agents:** Use Option 1 (Documentation-Based)
- Easiest to maintain
- Same effectiveness
- Clear structure

**For Task tool integration:** Use Option 2 (Subagent Definition)
- Formal invocation
- Separate subprocess
- Better for complex multi-step tasks

**For simple triggers:** Use Option 3 (Config-Only)
- Minimal setup
- Good for straightforward functionality
