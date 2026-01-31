/**
 * Generate Git Info for Build
 *
 * This script runs at build time to extract recent git commits
 * and inject them into the application for the "System Updated" banner.
 *
 * Output: src/data/git-info.json
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputPath = join(__dirname, '../src/data/git-info.json')

function getGitInfo() {
  try {
    // Get the latest 10 commits with hash, date, and message
    const logOutput = execSync(
      'git log -10 --pretty=format:"%H|%ai|%s" --no-merges',
      { encoding: 'utf-8', cwd: join(__dirname, '..') }
    ).trim()

    const commits = logOutput.split('\n').map(line => {
      const [hash, date, ...messageParts] = line.split('|')
      const message = messageParts.join('|') // Handle messages with | in them
      return {
        hash: hash.substring(0, 7),
        fullHash: hash,
        date: new Date(date).toISOString(),
        message: message,
        type: categorizeCommit(message)
      }
    })

    // Get current branch
    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd: join(__dirname, '..')
    }).trim()

    // Get latest tag if exists
    let latestTag = null
    try {
      latestTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf-8',
        cwd: join(__dirname, '..')
      }).trim()
    } catch {
      // No tags exist
    }

    // Build timestamp
    const buildTime = new Date().toISOString()
    const buildDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    return {
      buildTime,
      buildDate,
      branch,
      latestTag,
      latestCommit: commits[0] || null,
      recentCommits: commits,
      version: generateVersion(commits[0]?.date)
    }
  } catch (error) {
    console.error('Error getting git info:', error.message)
    return {
      buildTime: new Date().toISOString(),
      buildDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      branch: 'unknown',
      latestTag: null,
      latestCommit: null,
      recentCommits: [],
      version: 'dev',
      error: error.message
    }
  }
}

/**
 * Categorize commit by its message prefix
 */
function categorizeCommit(message) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.startsWith('fix:') || lowerMessage.startsWith('fix(') || lowerMessage.includes('fix ')) {
    return 'fix'
  }
  if (lowerMessage.startsWith('feat:') || lowerMessage.startsWith('feat(') || lowerMessage.startsWith('feature')) {
    return 'feature'
  }
  if (lowerMessage.startsWith('chore:') || lowerMessage.startsWith('chore(')) {
    return 'chore'
  }
  if (lowerMessage.startsWith('docs:') || lowerMessage.startsWith('docs(')) {
    return 'docs'
  }
  if (lowerMessage.startsWith('refactor:') || lowerMessage.startsWith('refactor(')) {
    return 'refactor'
  }
  if (lowerMessage.startsWith('perf:') || lowerMessage.startsWith('perf(')) {
    return 'perf'
  }
  if (lowerMessage.startsWith('test:') || lowerMessage.startsWith('test(')) {
    return 'test'
  }
  if (lowerMessage.startsWith('style:') || lowerMessage.startsWith('style(')) {
    return 'style'
  }

  return 'other'
}

/**
 * Generate a version string from the commit date
 * Format: YYYY.MM.DD
 */
function generateVersion(dateStr) {
  if (!dateStr) return 'dev'

  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

// Generate and write the file
const gitInfo = getGitInfo()
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(gitInfo, null, 2))

console.log('✓ Generated git-info.json')
console.log(`  Branch: ${gitInfo.branch}`)
console.log(`  Version: ${gitInfo.version}`)
console.log(`  Latest commit: ${gitInfo.latestCommit?.message || 'none'}`)
console.log(`  Total commits: ${gitInfo.recentCommits.length}`)
