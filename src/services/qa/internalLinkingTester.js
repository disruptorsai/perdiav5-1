/**
 * Internal Linking Tester
 *
 * Tests the internal linking system for relevance issues.
 * Specifically designed to catch problems like "Digital Ministry → AACSB MBA"
 */

import { supabase } from '../supabaseClient'
import {
  extractSubjectArea,
  extractDegreeLevel,
  extractTopics,
  areSubjectsRelated,
  calculateRelevanceScore,
  filterRelevantArticles,
  SUBJECT_KEYWORDS,
} from '../topicRelevanceService'

// Test scenarios that represent known problem cases
const TEST_SCENARIOS = [
  {
    id: 'ministry_no_business',
    title: 'Digital Ministry Degree Programs',
    expectedSubject: 'religion',
    forbiddenSubjects: ['business', 'engineering', 'technology'],
    description: 'Ministry articles should not link to business/MBA content',
  },
  {
    id: 'nursing_no_criminal_justice',
    title: 'Online BSN Nursing Programs',
    expectedSubject: 'nursing',
    forbiddenSubjects: ['criminal_justice', 'liberal_arts'],
    description: 'Nursing articles should not link to criminal justice content',
  },
  {
    id: 'mba_no_theology',
    title: 'AACSB Accredited Online MBA Programs',
    expectedSubject: 'business',
    forbiddenSubjects: ['religion'],
    description: 'MBA articles should not link to theology/ministry content',
  },
  {
    id: 'education_no_engineering',
    title: 'Online Teaching Degree Programs',
    expectedSubject: 'education',
    forbiddenSubjects: ['engineering', 'science'],
    description: 'Education articles should not link to engineering content',
  },
]

class InternalLinkingTester {
  constructor() {
    this.testResults = []
  }

  /**
   * Run all internal linking tests
   */
  async runAllTests(options = {}) {
    const { verbose = false, includeDb = true } = options

    const results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      tests: [],
    }

    // Test 1: Subject area extraction
    const extractionTest = this.testSubjectAreaExtraction()
    results.tests.push(extractionTest)
    results.totalTests++
    if (extractionTest.passed) results.passed++
    else results.failed++

    // Test 2: Related subjects logic
    const relatedTest = this.testRelatedSubjects()
    results.tests.push(relatedTest)
    results.totalTests++
    if (relatedTest.passed) results.passed++
    else results.failed++

    // Test 3: Relevance scoring
    const scoringTest = this.testRelevanceScoring()
    results.tests.push(scoringTest)
    results.totalTests++
    if (scoringTest.passed) results.passed++
    else results.failed++

    // Test 4: Known problem scenarios
    for (const scenario of TEST_SCENARIOS) {
      const scenarioTest = await this.testScenario(scenario, includeDb)
      results.tests.push(scenarioTest)
      results.totalTests++
      if (scenarioTest.passed) results.passed++
      else results.failed++
    }

    // Test 5: Database relevance query (if DB available)
    if (includeDb) {
      const dbTest = await this.testDatabaseRelevanceQuery()
      results.tests.push(dbTest)
      results.totalTests++
      if (dbTest.passed) results.passed++
      else results.failed++
    }

    return results
  }

  /**
   * Test that subject areas are correctly extracted from titles
   */
  testSubjectAreaExtraction() {
    const testCases = [
      { title: 'Online MBA Programs', expected: 'business' },
      { title: 'Digital Ministry Degree', expected: 'religion' },
      { title: 'BSN Nursing Programs', expected: 'nursing' },
      { title: 'Criminal Justice Careers', expected: 'criminal_justice' },
      { title: 'Computer Science Degrees', expected: 'technology' },
      { title: 'Teaching Certification Programs', expected: 'education' },
      { title: 'Public Health MPH', expected: 'healthcare' },
    ]

    const failures = []

    for (const { title, expected } of testCases) {
      const result = extractSubjectArea(title)
      if (result !== expected) {
        failures.push({
          title,
          expected,
          actual: result,
        })
      }
    }

    return {
      name: 'Subject Area Extraction',
      passed: failures.length === 0,
      failures,
      details: `${testCases.length - failures.length}/${testCases.length} titles correctly categorized`,
    }
  }

  /**
   * Test that related subjects are correctly identified
   */
  testRelatedSubjects() {
    const testCases = [
      // Should be related
      { subject1: 'nursing', subject2: 'healthcare', expected: true },
      { subject1: 'technology', subject2: 'engineering', expected: true },
      { subject1: 'business', subject2: 'technology', expected: true },
      // Should NOT be related
      { subject1: 'religion', subject2: 'business', expected: false },
      { subject1: 'nursing', subject2: 'criminal_justice', expected: false },
      { subject1: 'education', subject2: 'engineering', expected: false },
    ]

    const failures = []

    for (const { subject1, subject2, expected } of testCases) {
      const result = areSubjectsRelated(subject1, subject2)
      if (result !== expected) {
        failures.push({
          subject1,
          subject2,
          expected,
          actual: result,
        })
      }
    }

    return {
      name: 'Related Subjects Logic',
      passed: failures.length === 0,
      failures,
      details: `${testCases.length - failures.length}/${testCases.length} relationships correct`,
    }
  }

  /**
   * Test that relevance scoring penalizes unrelated content
   */
  testRelevanceScoring() {
    const sourceArticle = {
      title: 'Digital Ministry Degree Programs',
      subject_area: 'religion',
    }

    const testCases = [
      // Should have positive scores
      {
        article: { title: 'Online Theology Degrees', subject_area: 'religion' },
        expectPositive: true,
      },
      {
        article: { title: 'Christian Ministry Programs', subject_area: 'religion' },
        expectPositive: true,
      },
      // Should have negative scores (penalty)
      {
        article: { title: 'AACSB Accredited MBA Programs', subject_area: 'business' },
        expectPositive: false,
      },
      {
        article: { title: 'Online Accounting Degrees', subject_area: 'business' },
        expectPositive: false,
      },
    ]

    const failures = []

    for (const { article, expectPositive } of testCases) {
      const result = calculateRelevanceScore(sourceArticle, article)
      const isPositive = result.score > 0

      if (isPositive !== expectPositive) {
        failures.push({
          sourceTitle: sourceArticle.title,
          targetTitle: article.title,
          score: result.score,
          expectedPositive: expectPositive,
          reasons: result.reasons,
        })
      }
    }

    return {
      name: 'Relevance Scoring',
      passed: failures.length === 0,
      failures,
      details: failures.length === 0
        ? 'Unrelated subjects correctly penalized'
        : `${failures.length} scoring errors found`,
    }
  }

  /**
   * Test a specific problem scenario
   */
  async testScenario(scenario, includeDb) {
    const { id, title, expectedSubject, forbiddenSubjects, description } = scenario

    // First, verify subject extraction
    const detectedSubject = extractSubjectArea(title)
    if (detectedSubject !== expectedSubject) {
      return {
        name: `Scenario: ${id}`,
        passed: false,
        failures: [{
          message: `Subject extraction failed: expected ${expectedSubject}, got ${detectedSubject}`,
        }],
        details: description,
      }
    }

    // Create mock "bad" articles from forbidden subjects
    const forbiddenArticles = forbiddenSubjects.flatMap(subject => {
      const keywords = SUBJECT_KEYWORDS[subject] || []
      return keywords.slice(0, 3).map(keyword => ({
        title: `Online ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Programs`,
        subject_area: subject,
        url: `/test/${keyword}`,
        topics: [keyword],
      }))
    })

    // Test that forbidden articles get filtered out
    const sourceArticle = {
      title,
      subject_area: expectedSubject,
      topics: extractTopics(title),
    }

    const filtered = filterRelevantArticles(sourceArticle, forbiddenArticles, {
      limit: 10,
      minScore: 30,
      requireSubjectMatch: true,
    })

    if (filtered.length > 0) {
      return {
        name: `Scenario: ${id}`,
        passed: false,
        failures: filtered.map(item => ({
          message: `Forbidden link passed filter: ${item.article.title} (${item.article.subject_area})`,
          score: item.score,
          reasons: item.reasons,
        })),
        details: description,
      }
    }

    return {
      name: `Scenario: ${id}`,
      passed: true,
      failures: [],
      details: `${description} - All forbidden subjects correctly filtered`,
    }
  }

  /**
   * Test that the database relevance query works correctly
   */
  async testDatabaseRelevanceQuery() {
    try {
      // Try to fetch some articles
      const { data: articles, error } = await supabase
        .from('geteducated_articles')
        .select('id, title, url, subject_area, topics')
        .not('content_text', 'is', null)
        .limit(20)

      if (error) {
        return {
          name: 'Database Relevance Query',
          passed: false,
          failures: [{ message: `Database error: ${error.message}` }],
          details: 'Could not query geteducated_articles table',
        }
      }

      if (!articles || articles.length === 0) {
        return {
          name: 'Database Relevance Query',
          passed: true,
          failures: [],
          details: 'No articles in database to test (empty catalog)',
          skipped: true,
        }
      }

      // Test filtering on a sample
      const sourceArticle = {
        title: 'Digital Ministry Degree Programs',
        subject_area: 'religion',
        topics: ['ministry', 'theology'],
      }

      const filtered = filterRelevantArticles(sourceArticle, articles, {
        limit: 5,
        minScore: 30,
        requireSubjectMatch: true,
      })

      // Check that no business articles slipped through
      const businessLeaks = filtered.filter(item =>
        item.article.subject_area === 'business' ||
        extractSubjectArea(item.article.title) === 'business'
      )

      if (businessLeaks.length > 0) {
        return {
          name: 'Database Relevance Query',
          passed: false,
          failures: businessLeaks.map(item => ({
            message: `Business article leaked through: ${item.article.title}`,
            url: item.article.url,
            score: item.score,
          })),
          details: 'Ministry query returned business articles',
        }
      }

      return {
        name: 'Database Relevance Query',
        passed: true,
        failures: [],
        details: `Tested against ${articles.length} articles, ${filtered.length} relevant matches`,
      }

    } catch (e) {
      return {
        name: 'Database Relevance Query',
        passed: false,
        failures: [{ message: e.message }],
        details: 'Exception during database test',
      }
    }
  }

  /**
   * Generate a report from test results
   */
  generateReport(results) {
    const lines = [
      '# Internal Linking Test Report',
      `Generated: ${results.timestamp}`,
      '',
      `## Summary: ${results.passed}/${results.totalTests} tests passed`,
      '',
    ]

    if (results.failed > 0) {
      lines.push('## Failed Tests')
      lines.push('')
    }

    for (const test of results.tests) {
      const status = test.passed ? '✅' : '❌'
      lines.push(`### ${status} ${test.name}`)
      lines.push(test.details)

      if (test.failures && test.failures.length > 0) {
        lines.push('')
        lines.push('**Failures:**')
        for (const failure of test.failures) {
          lines.push(`- ${JSON.stringify(failure)}`)
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}

export default new InternalLinkingTester()
export { InternalLinkingTester, TEST_SCENARIOS }
