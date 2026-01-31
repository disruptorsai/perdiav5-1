/**
 * Changelog data for Perdia Content Engine
 *
 * Organization: By release version (newest first)
 * Each release has:
 * - version: Semantic version string (YYYY.MM.DD.patch for date-based releases)
 * - date: Human-readable release date
 * - type: 'major' | 'minor' | 'patch' | 'hotfix'
 * - title: Short release title
 * - changes: Array of { type, description } where type is 'fix' | 'feature' | 'improvement' | 'breaking'
 */

export const CHANGELOG = [
  {
    version: '2026.01.12.2',
    date: 'January 12, 2026',
    type: 'minor',
    title: 'Tony\'s Issue List - Complete Resolution',
    changes: [
      { type: 'fix', description: 'Idea Generator - resolved error when clicking Generate Ideas button, now works reliably' },
      { type: 'fix', description: 'AI revision validation - revisions now verify changes were actually applied before marking as complete' },
      { type: 'fix', description: 'Ranking link insertion - system validates links exist in catalog before marking issue as "addressed"' },
      { type: 'fix', description: 'Full article access - clicking articles now opens complete content in editor view' },
      { type: 'fix', description: 'Approve/reject workflow - thumbs up/down controls now visible with full article content' },
      { type: 'feature', description: 'Preview Full Article button more prominent on completed ideas for easier access' },
      { type: 'feature', description: 'Idea source labels - ideas now show clear source attribution (Reddit, Trending News, Google Trends)' },
      { type: 'feature', description: 'Version indicator - footer displays current version, banner shows latest updates' },
      { type: 'feature', description: 'Release History page - view all updates at /releases with full changelog' },
      { type: 'feature', description: 'Revision results show exactly what changed with diff view highlighting' },
    ]
  },
  {
    version: '2026.01.11.1',
    date: 'January 11, 2026',
    type: 'minor',
    title: 'Review Queue & Article Contributor Fixes',
    changes: [
      { type: 'fix', description: 'Send revised site catalog articles to Review Queue instead of auto-publishing' },
      { type: 'feature', description: 'Added revision indicators showing count of AI revisions on articles' },
      { type: 'fix', description: 'Corrected article_contributors column name in ArticlePreviewModal query' },
      { type: 'feature', description: 'Full article preview modal with enhanced error handling' },
    ]
  },
  {
    version: '2026.01.10.1',
    date: 'January 10, 2026',
    type: 'minor',
    title: 'GetEducated Critical Fixes',
    changes: [
      { type: 'fix', description: 'Address GetEducated critical issues - revision validation improvements' },
      { type: 'improvement', description: 'Enhanced UI for article preview and review workflow' },
    ]
  },
  {
    version: '2026.01.09.1',
    date: 'January 9, 2026',
    type: 'minor',
    title: 'Site Catalog Revision System',
    changes: [
      { type: 'feature', description: 'AI-powered revision system for site catalog articles' },
      { type: 'feature', description: 'Automatic detection of outdated articles needing refresh' },
      { type: 'feature', description: 'Content staleness scoring based on age and topic' },
    ]
  },
  {
    version: '2026.01.08.1',
    date: 'January 8, 2026',
    type: 'minor',
    title: 'Quality Checklist Enhancements',
    changes: [
      { type: 'feature', description: 'Expanded quality checklist with detailed issue categorization' },
      { type: 'improvement', description: 'Better error messaging for failed AI operations' },
      { type: 'fix', description: 'Fixed contributor assignment algorithm edge cases' },
    ]
  },
  {
    version: '2026.01.07.1',
    date: 'January 7, 2026',
    type: 'major',
    title: 'StealthGPT Integration',
    changes: [
      { type: 'feature', description: 'StealthGPT API integration for enhanced content humanization' },
      { type: 'feature', description: 'Configurable bypass modes (Low, Medium, High)' },
      { type: 'feature', description: 'Detector optimization (GPTZero, Turnitin)' },
      { type: 'improvement', description: 'Claude fallback when StealthGPT unavailable' },
    ]
  },
  {
    version: '2026.01.05.1',
    date: 'January 5, 2026',
    type: 'minor',
    title: 'Internal Linking System',
    changes: [
      { type: 'feature', description: 'Intelligent internal link insertion using site catalog' },
      { type: 'feature', description: 'Relevance scoring for link suggestions' },
      { type: 'improvement', description: 'Claude-powered natural link placement in content' },
    ]
  },
  {
    version: '2026.01.03.1',
    date: 'January 3, 2026',
    type: 'major',
    title: 'Monetization System Launch',
    changes: [
      { type: 'feature', description: '155 monetization category/concentration pairs' },
      { type: 'feature', description: '13 degree level shortcode mappings' },
      { type: 'feature', description: 'Automatic shortcode generation for affiliate content' },
      { type: 'breaking', description: 'Raw affiliate URLs no longer supported - shortcodes required' },
    ]
  },
  {
    version: '2026.01.01.1',
    date: 'January 1, 2026',
    type: 'major',
    title: 'Perdia v5 Initial Release',
    changes: [
      { type: 'feature', description: 'Two-pass AI generation pipeline (Grok drafting → humanization)' },
      { type: 'feature', description: '4 approved GetEducated authors with style profiles' },
      { type: 'feature', description: 'Automatic contributor assignment based on content type' },
      { type: 'feature', description: 'Quality scoring system with automated QA checks' },
      { type: 'feature', description: 'WordPress publishing integration via n8n webhooks' },
    ]
  },
]

// Get the current/latest version
export const CURRENT_VERSION = CHANGELOG[0]?.version || '0.0.0'
export const CURRENT_RELEASE_DATE = CHANGELOG[0]?.date || 'Unknown'

// Helper to get recent fixes for the banner (latest release only)
export const getRecentFixes = (limit = 4) => {
  const latestRelease = CHANGELOG[0]
  if (!latestRelease) return []

  return latestRelease.changes.slice(0, limit).map(change => {
    const prefix = change.type === 'fix' ? 'FIXED' :
                   change.type === 'feature' ? 'NEW' :
                   change.type === 'improvement' ? 'IMPROVED' :
                   change.type === 'breaking' ? 'BREAKING' : ''
    return `${prefix}: ${change.description}`
  })
}
