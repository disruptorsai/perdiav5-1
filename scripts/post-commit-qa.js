#!/usr/bin/env node
/**
 * Post-Commit QA Runner
 *
 * This script is designed to be run after every git commit.
 * It runs the full QA test suite and reports results.
 *
 * Setup:
 *   1. Add to .git/hooks/post-commit
 *   2. Or run manually: node scripts/post-commit-qa.js
 *
 * Options:
 *   --verbose     Show detailed output
 *   --no-db       Skip database tests
 *   --fail-fast   Exit on first failure
 */

import { runPostCommitQA } from '../src/services/qa/index.js'

async function main() {
  const args = process.argv.slice(2)
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    includeDb: !args.includes('--no-db'),
    failFast: args.includes('--fail-fast'),
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  PERDIA QA - Post-Commit Quality Assurance')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  // Get git info
  try {
    const { execSync } = await import('child_process')
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim().split('\n')[0]
    console.log(`📝 Commit: ${commitHash} - ${commitMsg}`)
    console.log('')
  } catch (e) {
    // Not in a git repo, that's fine
  }

  const exitCode = await runPostCommitQA(options)

  console.log('═══════════════════════════════════════════════════════════')

  process.exit(exitCode)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
