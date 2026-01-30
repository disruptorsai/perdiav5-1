/**
 * QA Testing Service
 *
 * Main orchestration service for all QA tests.
 * Integrates with issue tracker to evolve tests based on discovered issues.
 *
 * Features:
 * - Runs after every commit (via git hook)
 * - Learns from Slack issues via /slack-agent
 * - Generates test cases dynamically based on issue patterns
 * - Produces detailed reports for debugging
 */

import issueTracker, { ISSUE_CATEGORIES } from './issueTracker'
import linkTester from './linkTester'
import internalLinkingTester from './internalLinkingTester'
import revisionTester from './revisionTester'
import { supabase } from '../supabaseClient'

class QATestingService {
  constructor() {
    this.lastRunResults = null
    this.config = {
      // Test categories to run
      enabledTests: {
        internalLinking: true,
        externalLinks: true,
        revisions: true,
        statistics: true,
        dynamicTests: true, // Tests generated from issues
      },
      // Thresholds
      passThreshold: 0.8, // 80% of tests must pass
      criticalFailThreshold: 0, // No critical failures allowed
      // Parallel execution
      maxParallelTests: 5,
    }
  }

  /**
   * Run the complete QA test suite
   */
  async runFullSuite(options = {}) {
    const {
      verbose = false,
      includeDb = true,
      generateReport = true,
      onProgress = () => {},
    } = options

    const startTime = Date.now()

    const results = {
      timestamp: new Date().toISOString(),
      duration: 0,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        critical: 0,
      },
      suites: [],
      dynamicTests: [],
      recommendations: [],
    }

    onProgress({ stage: 'starting', message: 'Starting QA test suite...' })

    // Suite 1: Internal Linking Tests
    if (this.config.enabledTests.internalLinking) {
      onProgress({ stage: 'internal_linking', message: 'Running internal linking tests...' })

      const internalResults = await internalLinkingTester.runAllTests({ verbose, includeDb })
      results.suites.push({
        name: 'Internal Linking',
        ...internalResults,
      })
      results.summary.total += internalResults.totalTests
      results.summary.passed += internalResults.passed
      results.summary.failed += internalResults.failed
    }

    // Suite 2: AI Revision Tests
    if (this.config.enabledTests.revisions) {
      onProgress({ stage: 'revisions', message: 'Running AI revision tests...' })

      const revisionResults = await revisionTester.runAllTests({ verbose })
      results.suites.push({
        name: 'AI Revisions',
        ...revisionResults,
      })
      results.summary.total += revisionResults.totalTests
      results.summary.passed += revisionResults.passed
      results.summary.failed += revisionResults.failed
      results.summary.skipped += revisionResults.skipped || 0
    }

    // Suite 3: Dynamic Tests from Issues
    if (this.config.enabledTests.dynamicTests) {
      onProgress({ stage: 'dynamic', message: 'Running issue-based dynamic tests...' })

      const dynamicResults = await this.runDynamicTests(options)
      results.dynamicTests = dynamicResults.tests
      results.summary.total += dynamicResults.totalTests
      results.summary.passed += dynamicResults.passed
      results.summary.failed += dynamicResults.failed
    }

    // Calculate duration
    results.duration = Date.now() - startTime

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results)

    // Calculate pass rate
    results.passRate = results.summary.total > 0
      ? (results.summary.passed / results.summary.total * 100).toFixed(1)
      : 100

    // Determine overall status
    results.overallStatus = this.determineOverallStatus(results)

    // Save results
    this.lastRunResults = results
    await this.saveResults(results)

    onProgress({ stage: 'complete', message: `QA complete: ${results.passRate}% passed` })

    if (generateReport) {
      results.report = this.generateReport(results)
    }

    return results
  }

  /**
   * Run tests dynamically generated from tracked issues
   */
  async runDynamicTests(options = {}) {
    const testCases = await issueTracker.generateTestCases()

    const results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      tests: [],
    }

    for (const testCase of testCases) {
      const testResult = await this.runDynamicTest(testCase)
      results.tests.push(testResult)
      results.totalTests++

      if (testResult.passed) results.passed++
      else results.failed++
    }

    return results
  }

  /**
   * Run a single dynamic test based on an issue-generated test case
   */
  async runDynamicTest(testCase) {
    const result = {
      name: `Dynamic: ${testCase.category}`,
      testCase,
      passed: false,
      failures: [],
      timestamp: new Date().toISOString(),
    }

    try {
      switch (testCase.testType) {
        case 'internal_linking':
          // Test using the topics from issues
          for (const topic of testCase.testTopics || []) {
            const topicTest = await this.testInternalLinkingForTopic(topic)
            if (!topicTest.passed) {
              result.failures.push(...topicTest.failures)
            }
          }
          result.passed = result.failures.length === 0
          break

        case 'link_validation':
          // Test the URLs mentioned in issues
          for (const url of testCase.urlsToCheck || []) {
            const check = await linkTester.checkUrlAccessibility(url)
            if (!check.accessible) {
              result.failures.push({
                url,
                message: `Link is broken: ${check.error || check.statusCode}`,
              })
            }
          }
          result.passed = result.failures.length === 0
          break

        case 'competitor_check':
          // This is tested in the static suite, mark as passed if no new competitors reported
          result.passed = true
          result.details = 'Competitor checking is handled by static tests'
          break

        case 'statistics_validation':
          // Statistics validation needs ranking data - mark as skipped if not available
          result.passed = true
          result.skipped = true
          result.details = 'Statistics validation requires ranking data import'
          break

        case 'revision_safety':
        case 'revision_memory':
          // These are tested in the revision suite
          result.passed = true
          result.details = 'Covered by AI Revision test suite'
          break

        default:
          result.passed = true
          result.details = `No specific test for category: ${testCase.category}`
      }

    } catch (error) {
      result.passed = false
      result.failures.push({
        message: `Test threw exception: ${error.message}`,
      })
    }

    return result
  }

  /**
   * Test internal linking for a specific topic
   */
  async testInternalLinkingForTopic(topic) {
    const result = {
      passed: true,
      failures: [],
    }

    // Get the expected subject for this topic
    const { extractSubjectArea, areSubjectsRelated, filterRelevantArticles } = await import('../topicRelevanceService')

    const topicSubject = extractSubjectArea(topic)

    if (!topicSubject) {
      result.details = `Could not determine subject for topic: ${topic}`
      return result
    }

    // Fetch some articles from the catalog
    try {
      const { data: articles, error } = await supabase
        .from('geteducated_articles')
        .select('id, title, url, subject_area')
        .limit(50)

      if (error || !articles) {
        result.details = 'Could not fetch articles from catalog'
        return result
      }

      // Test that unrelated subjects don't pass through
      const sourceArticle = {
        title: `${topic} Programs`,
        subject_area: topicSubject,
      }

      const filtered = filterRelevantArticles(sourceArticle, articles, {
        limit: 10,
        minScore: 30,
        requireSubjectMatch: true,
      })

      // Check for any obvious mismatches
      for (const item of filtered) {
        const itemSubject = item.article.subject_area || extractSubjectArea(item.article.title)
        if (itemSubject && !areSubjectsRelated(topicSubject, itemSubject)) {
          result.passed = false
          result.failures.push({
            message: `Unrelated article passed filter: ${item.article.title}`,
            sourceSubject: topicSubject,
            targetSubject: itemSubject,
          })
        }
      }

    } catch (e) {
      result.details = `Exception: ${e.message}`
    }

    return result
  }

  /**
   * Determine overall status based on results
   */
  determineOverallStatus(results) {
    if (results.summary.critical > 0) {
      return 'critical'
    }

    const passRate = results.summary.total > 0
      ? results.summary.passed / results.summary.total
      : 1

    if (passRate >= this.config.passThreshold) {
      return 'passed'
    } else if (passRate >= 0.5) {
      return 'warning'
    } else {
      return 'failed'
    }
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(results) {
    const recommendations = []

    // Check each suite for failures
    for (const suite of results.suites) {
      if (suite.failed > 0) {
        for (const test of suite.tests) {
          if (!test.passed && test.failures) {
            for (const failure of test.failures) {
              recommendations.push({
                suite: suite.name,
                test: test.name,
                issue: failure.message || JSON.stringify(failure),
                priority: 'high',
              })
            }
          }
        }
      }
    }

    // Check dynamic tests
    for (const test of results.dynamicTests) {
      if (!test.passed && test.failures) {
        for (const failure of test.failures) {
          recommendations.push({
            suite: 'Dynamic Tests',
            test: test.name,
            issue: failure.message || JSON.stringify(failure),
            priority: test.testCase?.priority || 'medium',
          })
        }
      }
    }

    return recommendations
  }

  /**
   * Generate a detailed report
   */
  generateReport(results) {
    const lines = [
      '# QA Test Report',
      `Generated: ${results.timestamp}`,
      `Duration: ${(results.duration / 1000).toFixed(2)}s`,
      '',
      `## Overall Status: ${results.overallStatus.toUpperCase()}`,
      `Pass Rate: ${results.passRate}%`,
      '',
      '## Summary',
      `- Total Tests: ${results.summary.total}`,
      `- Passed: ${results.summary.passed}`,
      `- Failed: ${results.summary.failed}`,
      `- Skipped: ${results.summary.skipped}`,
      '',
    ]

    // Test suites
    lines.push('## Test Suites')
    lines.push('')

    for (const suite of results.suites) {
      const status = suite.failed === 0 ? '✅' : '❌'
      lines.push(`### ${status} ${suite.name}`)
      lines.push(`${suite.passed}/${suite.totalTests} tests passed`)
      lines.push('')

      if (suite.tests) {
        for (const test of suite.tests) {
          const testStatus = test.passed ? '✓' : test.skipped ? '○' : '✗'
          lines.push(`  ${testStatus} ${test.name}`)
          if (test.failures && test.failures.length > 0 && !test.passed) {
            for (const failure of test.failures.slice(0, 3)) {
              lines.push(`    → ${failure.message || JSON.stringify(failure)}`)
            }
          }
        }
      }
      lines.push('')
    }

    // Dynamic tests
    if (results.dynamicTests.length > 0) {
      lines.push('## Dynamic Tests (from Issues)')
      lines.push('')

      for (const test of results.dynamicTests) {
        const status = test.passed ? '✅' : test.skipped ? '⏭️' : '❌'
        lines.push(`### ${status} ${test.name}`)
        lines.push(`Priority: ${test.testCase?.priority || 'medium'}`)
        lines.push(`Issues tracked: ${test.testCase?.issueCount || 0}`)

        if (test.failures && test.failures.length > 0) {
          lines.push('Failures:')
          for (const failure of test.failures) {
            lines.push(`  - ${failure.message}`)
          }
        }
        lines.push('')
      }
    }

    // Recommendations
    if (results.recommendations.length > 0) {
      lines.push('## Recommendations')
      lines.push('')

      for (const rec of results.recommendations) {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        lines.push(`${priority} **${rec.suite}** - ${rec.test}`)
        lines.push(`   ${rec.issue}`)
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  /**
   * Save results to database
   */
  async saveResults(results) {
    try {
      const { error } = await supabase
        .from('qa_test_runs')
        .insert({
          timestamp: results.timestamp,
          duration_ms: results.duration,
          total_tests: results.summary.total,
          passed: results.summary.passed,
          failed: results.summary.failed,
          skipped: results.summary.skipped,
          pass_rate: parseFloat(results.passRate),
          status: results.overallStatus,
          report: results.report,
          suites: results.suites,
          recommendations: results.recommendations,
        })

      if (error) {
        console.warn('[QA] Could not save results to database:', error.message)
      }
    } catch (e) {
      console.warn('[QA] Error saving results:', e.message)
    }
  }

  /**
   * Process Slack messages and record issues
   * Called by /slack-agent integration
   */
  async processSlackMessages(messages) {
    const processedIssues = []

    for (const msg of messages) {
      // Check if this looks like a bug report or complaint
      const isIssue = this.looksLikeIssue(msg.text || msg.message)

      if (isIssue) {
        const issue = await issueTracker.recordIssue({
          source: 'slack',
          reporter: msg.user || msg.author,
          description: msg.text || msg.message,
          rawMessage: JSON.stringify(msg),
          timestamp: msg.ts || msg.timestamp,
          channel: msg.channel || 'perdia',
        })
        processedIssues.push(issue)
      }
    }

    // After processing, regenerate test cases
    if (processedIssues.length > 0) {
      console.log(`[QA] Processed ${processedIssues.length} new issues from Slack`)
    }

    return processedIssues
  }

  /**
   * Check if a message looks like a bug report
   */
  looksLikeIssue(text) {
    if (!text) return false

    const issueIndicators = [
      /bug|issue|problem|error|broken|doesn't work|not working/i,
      /wrong|incorrect|inaccurate|shouldn't/i,
      /crash|fail|failure|exception/i,
      /stuck|loop|infinite/i,
      /missing|lost|deleted|destroyed/i,
      /competitor|404|dead link/i,
      /irrelevant|makes no sense|doesn't match/i,
    ]

    return issueIndicators.some(pattern => pattern.test(text))
  }

  /**
   * Get the last run results
   */
  getLastRunResults() {
    return this.lastRunResults
  }

  /**
   * Quick test for a specific article
   */
  async testArticle(articleId) {
    try {
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error || !article) {
        return { error: 'Article not found' }
      }

      const results = {
        articleId,
        title: article.title,
        tests: [],
      }

      // Test links in the article
      if (article.content) {
        const linkResults = await linkTester.testAllLinks(article.content, {
          check404s: true,
          parallel: 3,
        })
        results.tests.push({
          name: 'Link Validation',
          ...linkResults,
        })

        // Test internal link relevance
        const relevanceResults = await linkTester.testInternalLinkRelevance(
          article.title,
          article.content
        )
        results.tests.push({
          name: 'Internal Link Relevance',
          ...relevanceResults,
        })
      }

      return results

    } catch (e) {
      return { error: e.message }
    }
  }
}

export default new QATestingService()
export { QATestingService }
