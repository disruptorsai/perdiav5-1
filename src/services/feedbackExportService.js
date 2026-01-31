/**
 * Service for generating comprehensive feedback exports
 * Creates markdown documents optimized for Claude Code analysis
 */

import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from '../hooks/useDevFeedback'

/**
 * Generate a comprehensive markdown document from feedback items
 * @param {Array} feedbackItems - Array of feedback objects from the database
 * @param {Object} stats - Statistics object from useDevFeedbackStats
 * @returns {string} Markdown-formatted string
 */
export function generateFeedbackMarkdown(feedbackItems, stats) {
  const now = new Date().toISOString()
  const readableDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  let md = `# Dev Feedback Export for Perdia v5

**Generated:** ${readableDate}
**Total Items:** ${stats?.total || feedbackItems.length}

---

## Summary Statistics

### By Status
| Status | Count |
|--------|-------|
${Object.entries(stats?.byStatus || {})
  .map(([status, count]) => `| ${FEEDBACK_STATUSES[status]?.label || status} | ${count} |`)
  .join('\n')}

### By Category
| Category | Count |
|----------|-------|
${Object.entries(stats?.byCategory || {})
  .map(([category, count]) => `| ${FEEDBACK_CATEGORIES[category]?.label || category} | ${count} |`)
  .join('\n')}

---

## Action Items

Please review and address the following feedback items. Priority order:
1. **Bugs** - Fix broken functionality
2. **Confusion** - Clarify UI/UX issues
3. **Questions** - Answer or document
4. **Suggestions** - Consider for future iterations

---

`

  // Group feedback by category
  const byCategory = feedbackItems.reduce((acc, item) => {
    const cat = item.category || 'other'
    acc[cat] = acc[cat] || []
    acc[cat].push(item)
    return acc
  }, {})

  // Define category order (priority)
  const categoryOrder = ['bug', 'confusion', 'question', 'suggestion', 'other']

  for (const category of categoryOrder) {
    const items = byCategory[category]
    if (!items || items.length === 0) continue

    const categoryConfig = FEEDBACK_CATEGORIES[category] || { label: category }
    md += `## ${categoryConfig.label.toUpperCase()}S (${items.length})\n\n`

    // Group by status within category
    const pending = items.filter(i => i.status === 'pending')
    const reviewed = items.filter(i => i.status === 'reviewed')
    const resolved = items.filter(i => i.status === 'resolved' || i.status === 'wont_fix')

    if (pending.length > 0) {
      md += `### Pending (${pending.length})\n\n`
      for (const item of pending) {
        md += formatFeedbackItem(item)
      }
    }

    if (reviewed.length > 0) {
      md += `### Reviewed (${reviewed.length})\n\n`
      for (const item of reviewed) {
        md += formatFeedbackItem(item)
      }
    }

    if (resolved.length > 0) {
      md += `### Resolved (${resolved.length})\n\n`
      for (const item of resolved) {
        md += formatFeedbackItem(item)
      }
    }
  }

  // Add footer with instructions
  md += `---

## Instructions for Claude Code

1. Review each feedback item, prioritizing bugs and confusion issues
2. For bugs: Identify the root cause and implement a fix
3. For confusion: Improve UI/UX, add tooltips, or update help content
4. For questions: Document answers or improve onboarding
5. For suggestions: Evaluate feasibility and add to backlog if valuable
6. After addressing items, update their status in the Dev Feedback Queue

**Project Path:** Perdia v5 (perdiav5)
**Tech Stack:** React 19 + Vite + Supabase + TanStack Query
`

  return md
}

/**
 * Format a single feedback item as markdown
 */
function formatFeedbackItem(item) {
  const statusLabel = FEEDBACK_STATUSES[item.status]?.label || item.status
  const createdDate = new Date(item.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  let md = `#### [${statusLabel.toUpperCase()}] ${item.page_path || 'Unknown Page'}

**Submitted:** ${createdDate}
**Page:** ${item.page_title || item.page_path || 'N/A'}

**Feedback:**
> ${item.message.split('\n').join('\n> ')}

`

  if (item.developer_notes) {
    md += `**Developer Notes:** ${item.developer_notes}\n\n`
  }

  if (item.resolved_at) {
    const resolvedDate = new Date(item.resolved_at).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    md += `**Resolved:** ${resolvedDate}\n\n`
  }

  md += `---\n\n`

  return md
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
      return false
    }
  }
}

/**
 * Generate and copy feedback export in one step
 * @param {Array} feedbackItems - Feedback items
 * @param {Object} stats - Statistics
 * @returns {Promise<{success: boolean, markdown: string}>}
 */
export async function generateAndCopyFeedback(feedbackItems, stats) {
  const markdown = generateFeedbackMarkdown(feedbackItems, stats)
  const success = await copyToClipboard(markdown)
  return { success, markdown }
}

export default {
  generateFeedbackMarkdown,
  copyToClipboard,
  generateAndCopyFeedback,
}
