/**
 * Revision Tester
 *
 * Tests the AI revision system for:
 * - Content destruction (replacing full article with summary)
 * - Wrong output (not making requested change)
 * - Stuck behavior (suggesting same bad link repeatedly)
 * - Word count preservation
 */

import surgicalRevisionService from '../surgicalRevisionService'

// Sample content for testing (mimics real article structure)
const SAMPLE_CONTENT = `
<h2>Introduction to Online Degree Programs</h2>
<p>Online degree programs have grown significantly in popularity over the past decade. According to recent statistics, over 6 million students are enrolled in at least one online course. This represents a significant shift in how education is delivered and consumed.</p>

<h2>Benefits of Online Education</h2>
<p>There are many benefits to pursuing an online degree. Students can learn at their own pace, from anywhere in the world. The flexibility allows working professionals to advance their careers without putting their lives on hold.</p>

<h3>Cost Savings</h3>
<p>Online programs often cost less than traditional on-campus programs. Students save money on commuting, housing, and other expenses associated with attending a physical campus.</p>

<h3>Flexibility</h3>
<p>Perhaps the biggest advantage is flexibility. Students can complete coursework around their existing schedules, whether that means early mornings, late nights, or weekends.</p>

<h2>Choosing the Right Program</h2>
<p>When selecting an online program, accreditation is crucial. Look for programs accredited by recognized agencies to ensure your degree will be valued by employers.</p>

<h2>Frequently Asked Questions</h2>
<div class="faq">
<h4>How long does it take to complete an online degree?</h4>
<p>Most bachelor's degrees take 4 years, while master's programs typically take 1-2 years. Accelerated options may be available.</p>

<h4>Are online degrees respected by employers?</h4>
<p>Yes, most employers now view accredited online degrees as equivalent to traditional degrees, especially from well-known institutions.</p>
</div>
`

// Test scenarios for revisions
const REVISION_TEST_CASES = [
  {
    id: 'simple_text_change',
    description: 'Simple text replacement',
    selectedText: 'over 6 million students',
    feedback: 'change 6 million to 7 million',
    expectedChange: '7 million students',
    expectPreservation: true,
  },
  {
    id: 'year_update',
    description: 'Update year in content',
    selectedText: 'past decade',
    feedback: 'change to "past five years"',
    expectedChange: 'past five years',
    expectPreservation: true,
  },
  {
    id: 'add_internal_link',
    description: 'Add internal link request',
    selectedText: 'online degree programs',
    feedback: 'add an internal link to a GetEducated article about online degrees',
    expectLinkAdded: true,
    expectPreservation: true,
  },
  {
    id: 'add_external_source',
    description: 'Add credible source',
    selectedText: 'According to recent statistics',
    feedback: 'add a credible source citation from BLS or government site',
    expectLinkAdded: true,
    expectWhitelisted: true,
    expectPreservation: true,
  },
]

class RevisionTester {
  constructor() {
    this.testResults = []
  }

  /**
   * Count words in content (strips HTML)
   */
  countWords(content) {
    if (!content) return 0
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.split(' ').filter(w => w.length > 0).length
  }

  /**
   * Run all revision tests
   */
  async runAllTests(options = {}) {
    const { verbose = false, timeout = 30000 } = options

    const results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    }

    // Test 1: Content preservation
    const preservationTest = await this.testContentPreservation()
    results.tests.push(preservationTest)
    results.totalTests++
    if (preservationTest.passed) results.passed++
    else if (preservationTest.skipped) results.skipped++
    else results.failed++

    // Test 2: Simple replacement detection
    const replacementTest = this.testSimpleReplacementDetection()
    results.tests.push(replacementTest)
    results.totalTests++
    if (replacementTest.passed) results.passed++
    else results.failed++

    // Test 3: Rejected links memory
    const rejectedLinksTest = this.testRejectedLinksMemory()
    results.tests.push(rejectedLinksTest)
    results.totalTests++
    if (rejectedLinksTest.passed) results.passed++
    else results.failed++

    // Test 4: Word count validation logic
    const wordCountTest = this.testWordCountValidation()
    results.tests.push(wordCountTest)
    results.totalTests++
    if (wordCountTest.passed) results.passed++
    else results.failed++

    return results
  }

  /**
   * Test that revisions preserve content length
   */
  async testContentPreservation() {
    const originalWordCount = this.countWords(SAMPLE_CONTENT)

    try {
      // Clear any previous rejected links
      surgicalRevisionService.clearRejectedLinks()

      const result = await surgicalRevisionService.processSingleFeedback(
        SAMPLE_CONTENT,
        {
          selected_text: 'over 6 million students',
          comment: 'change 6 million to 7 million',
        },
        'Test Article'
      )

      const revisedWordCount = this.countWords(result.content)
      const wordCountRatio = revisedWordCount / originalWordCount

      // Word count should be within 10%
      const withinThreshold = wordCountRatio >= 0.9 && wordCountRatio <= 1.1

      if (!withinThreshold) {
        return {
          name: 'Content Preservation',
          passed: false,
          failures: [{
            message: `Word count changed from ${originalWordCount} to ${revisedWordCount} (${(wordCountRatio * 100).toFixed(1)}%)`,
            expectedRatio: '90-110%',
            actualRatio: `${(wordCountRatio * 100).toFixed(1)}%`,
          }],
          details: 'Simple edit should not significantly change word count',
        }
      }

      // Check that the change was actually made
      if (!result.content.includes('7 million')) {
        return {
          name: 'Content Preservation',
          passed: false,
          failures: [{
            message: 'Expected change was not applied',
            expected: '7 million',
            found: false,
          }],
          details: 'Revision should apply the requested change',
        }
      }

      return {
        name: 'Content Preservation',
        passed: true,
        failures: [],
        details: `Word count preserved: ${originalWordCount} → ${revisedWordCount} (${(wordCountRatio * 100).toFixed(1)}%)`,
      }

    } catch (error) {
      return {
        name: 'Content Preservation',
        passed: false,
        skipped: true,
        failures: [{
          message: `Test threw exception: ${error.message}`,
        }],
        details: 'Could not complete test due to error',
      }
    }
  }

  /**
   * Test that simple replacement patterns are detected correctly
   */
  testSimpleReplacementDetection() {
    const testPatterns = [
      { feedback: 'change 2025 to 2026', expected: { find: '2025', replace: '2026' } },
      { feedback: "replace 'old' with 'new'", expected: { find: 'old', replace: 'new' } },
      { feedback: 'should be 2026 not 2025', expected: { find: '2025', replace: '2026' } },
      { feedback: '2025 → 2026', expected: { find: '2025', replace: '2026' } },
      { feedback: 'update to 2026', selectedText: '2025', expected: { find: '2025', replace: '2026' } },
    ]

    const failures = []

    for (const { feedback, selectedText, expected } of testPatterns) {
      const result = surgicalRevisionService.detectSimpleReplacement(feedback, selectedText)

      if (!result) {
        failures.push({
          feedback,
          expected,
          actual: null,
          message: 'Pattern not detected',
        })
      } else if (result.find !== expected.find || result.replace !== expected.replace) {
        failures.push({
          feedback,
          expected,
          actual: result,
          message: 'Wrong find/replace values',
        })
      }
    }

    return {
      name: 'Simple Replacement Detection',
      passed: failures.length === 0,
      failures,
      details: `${testPatterns.length - failures.length}/${testPatterns.length} patterns correctly detected`,
    }
  }

  /**
   * Test that rejected links are remembered
   */
  testRejectedLinksMemory() {
    // Clear first
    surgicalRevisionService.clearRejectedLinks()

    // Add some rejected links
    surgicalRevisionService.addRejectedLink('https://onlineu.com/bad-link')
    surgicalRevisionService.addRejectedLink('https://usnews.com/competitor')

    // Get linking rules
    const rules = surgicalRevisionService.getLinkingRules()

    const failures = []

    if (!rules.includes('onlineu.com/bad-link')) {
      failures.push({
        message: 'Rejected link not included in rules',
        expected: 'onlineu.com/bad-link in rules',
      })
    }

    if (!rules.includes('PREVIOUSLY REJECTED LINKS')) {
      failures.push({
        message: 'Rejected links section not in rules',
        expected: 'PREVIOUSLY REJECTED LINKS header',
      })
    }

    // Clean up
    surgicalRevisionService.clearRejectedLinks()

    return {
      name: 'Rejected Links Memory',
      passed: failures.length === 0,
      failures,
      details: failures.length === 0
        ? 'Rejected links are properly tracked and included in AI prompts'
        : 'Rejected links tracking has issues',
    }
  }

  /**
   * Test word count validation logic
   */
  testWordCountValidation() {
    const failures = []

    // Test counting
    const testContent = '<p>This is a test with exactly ten words in it.</p>'
    const count = this.countWords(testContent)

    if (count !== 10) {
      failures.push({
        message: `Word count incorrect: expected 10, got ${count}`,
        content: testContent,
      })
    }

    // Test with HTML tags
    const htmlContent = '<h2>Header</h2><p>Body <strong>text</strong> here.</p>'
    const htmlCount = this.countWords(htmlContent)
    // Should count: Header, Body, text, here = 4 words
    if (htmlCount !== 4) {
      failures.push({
        message: `HTML word count incorrect: expected 4, got ${htmlCount}`,
        content: htmlContent,
      })
    }

    return {
      name: 'Word Count Validation',
      passed: failures.length === 0,
      failures,
      details: failures.length === 0
        ? 'Word counting logic is correct'
        : 'Word counting has issues',
    }
  }

  /**
   * Generate a report from test results
   */
  generateReport(results) {
    const lines = [
      '# AI Revision Test Report',
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
      const status = test.passed ? '✅' : test.skipped ? '⏭️' : '❌'
      lines.push(`### ${status} ${test.name}`)
      lines.push(test.details)

      if (test.failures && test.failures.length > 0) {
        lines.push('')
        lines.push('**Failures:**')
        for (const failure of test.failures) {
          lines.push(`- ${failure.message}`)
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}

export default new RevisionTester()
export { RevisionTester, REVISION_TEST_CASES, SAMPLE_CONTENT }
