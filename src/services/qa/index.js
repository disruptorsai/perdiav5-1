/**
 * QA Module - Self-Evolving Quality Assurance System
 *
 * This module provides comprehensive testing that:
 * 1. Runs after every commit (via git hook)
 * 2. Learns from Slack issues via /slack-agent integration
 * 3. Generates test cases dynamically based on discovered issues
 * 4. Tests internal linking, external links, AI revisions, and more
 *
 * Usage:
 *   import { qaService, issueTracker, linkTester } from './services/qa'
 *
 *   // Run full test suite
 *   const results = await qaService.runFullSuite()
 *
 *   // Record an issue from Slack
 *   await issueTracker.recordIssue({ description: '...', source: 'slack' })
 *
 *   // Test a specific article
 *   const articleResults = await qaService.testArticle(articleId)
 */

import qaTestingService from './qaTestingService'
import issueTracker, { ISSUE_CATEGORIES, CATEGORY_KEYWORDS } from './issueTracker'
import linkTester from './linkTester'
import internalLinkingTester, { TEST_SCENARIOS } from './internalLinkingTester'
import revisionTester, { REVISION_TEST_CASES } from './revisionTester'

// Main exports
export {
  qaTestingService as qaService,
  issueTracker,
  linkTester,
  internalLinkingTester,
  revisionTester,

  // Constants
  ISSUE_CATEGORIES,
  CATEGORY_KEYWORDS,
  TEST_SCENARIOS,
  REVISION_TEST_CASES,
}

// Default export is the main QA service
export default qaTestingService

/**
 * Quick function to run QA after a commit
 * Returns exit code: 0 = passed, 1 = failed
 */
export async function runPostCommitQA(options = {}) {
  console.log('🧪 Running post-commit QA tests...')

  try {
    const results = await qaTestingService.runFullSuite({
      verbose: options.verbose || false,
      includeDb: options.includeDb !== false,
      generateReport: true,
      onProgress: ({ stage, message }) => {
        if (options.verbose) {
          console.log(`  [${stage}] ${message}`)
        }
      },
    })

    // Print summary
    console.log('')
    console.log(`📊 QA Results: ${results.passRate}% passed`)
    console.log(`   ✅ Passed: ${results.summary.passed}`)
    console.log(`   ❌ Failed: ${results.summary.failed}`)
    console.log(`   ⏭️  Skipped: ${results.summary.skipped}`)
    console.log('')

    if (results.overallStatus === 'failed' || results.overallStatus === 'critical') {
      console.log('⚠️  QA tests failed. See recommendations below:')
      for (const rec of results.recommendations.slice(0, 5)) {
        console.log(`   - [${rec.suite}] ${rec.issue}`)
      }
      console.log('')
      return 1 // Failure
    }

    console.log('✅ QA tests passed!')
    return 0 // Success

  } catch (error) {
    console.error('❌ QA test error:', error.message)
    return 1
  }
}

/**
 * Process Slack messages and extract issues
 */
export async function processSlackIntake(messages) {
  return await qaTestingService.processSlackMessages(messages)
}

/**
 * Get current issue statistics
 */
export async function getIssueStats() {
  return await issueTracker.getIssueStats()
}

/**
 * Generate test cases from recorded issues
 */
export async function generateDynamicTests() {
  return await issueTracker.generateTestCases()
}
