/**
 * Issue Tracker Service
 *
 * Tracks issues from Slack and other sources, stores them in Supabase,
 * and generates test cases that evolve based on discovered issues.
 *
 * This is the "brain" of the self-evolving QA system.
 */

import { supabase } from '../supabaseClient'

// Issue categories that map to specific test types
export const ISSUE_CATEGORIES = {
  INTERNAL_LINK_RELEVANCE: 'internal_link_relevance',
  EXTERNAL_LINK_404: 'external_link_404',
  EXTERNAL_LINK_COMPETITOR: 'external_link_competitor',
  STATISTICS_INACCURATE: 'statistics_inaccurate',
  AI_REVISION_DESTROYS_CONTENT: 'ai_revision_destroys',
  AI_REVISION_WRONG_OUTPUT: 'ai_revision_wrong',
  AI_REVISION_STUCK: 'ai_revision_stuck',
  SHORTCODE_INVALID: 'shortcode_invalid',
  AUTHOR_WRONG: 'author_wrong',
  QUALITY_SCORE_MISMATCH: 'quality_score_mismatch',
  UI_ERROR: 'ui_error',
  OTHER: 'other',
}

// Keywords that help categorize issues from Slack messages
const CATEGORY_KEYWORDS = {
  [ISSUE_CATEGORIES.INTERNAL_LINK_RELEVANCE]: [
    'irrelevant link', 'wrong link', 'makes no sense', 'link to', 'internal link',
    'linking to', 'mba', 'ministry', 'doesn\'t match', 'not related',
  ],
  [ISSUE_CATEGORIES.EXTERNAL_LINK_404]: [
    '404', 'broken link', 'dead link', 'page not found', 'doesn\'t exist',
    'link is broken', 'can\'t access',
  ],
  [ISSUE_CATEGORIES.EXTERNAL_LINK_COMPETITOR]: [
    'competitor', 'onlineu', 'usnews', 'bestcolleges', 'niche', '.edu link',
    'blocked domain', 'competitor link',
  ],
  [ISSUE_CATEGORIES.STATISTICS_INACCURATE]: [
    'statistic', 'statistics', 'inaccurate', 'wrong data', 'incorrect number',
    'salary', 'percentage', 'check every', 'data is wrong', 'hallucinating',
  ],
  [ISSUE_CATEGORIES.AI_REVISION_DESTROYS_CONTENT]: [
    'destroyed', 'deleted everything', 'lost content', 'replaced entire',
    'short summary', 'truncated', 'missing content', 'content gone',
  ],
  [ISSUE_CATEGORIES.AI_REVISION_WRONG_OUTPUT]: [
    'wrong output', 'didn\'t change', 'changed wrong thing', 'not what i asked',
    'revision wrong', 'ai didn\'t understand',
  ],
  [ISSUE_CATEGORIES.AI_REVISION_STUCK]: [
    'stuck', 'keeps suggesting', 'same link', 'same error', 'won\'t fix',
    'keeps trying', 'loop',
  ],
  [ISSUE_CATEGORIES.SHORTCODE_INVALID]: [
    'shortcode', 'wrong shortcode', 'invalid shortcode', 'fake shortcode',
    'shortcode error', 'ge_cta', 'su_ge',
  ],
  [ISSUE_CATEGORIES.AUTHOR_WRONG]: [
    'wrong author', 'contributor', 'byline', 'kif', 'alicia', 'julia', 'danny',
    'tony', 'kayleigh', 'sara', 'charity',
  ],
  [ISSUE_CATEGORIES.QUALITY_SCORE_MISMATCH]: [
    'quality score', 'score mismatch', 'different score', 'score wrong',
  ],
  [ISSUE_CATEGORIES.UI_ERROR]: [
    'crash', 'blank page', 'error message', 'not loading', 'ui bug',
    'button not working', 'can\'t click',
  ],
}

class IssueTracker {
  constructor() {
    this.localIssueCache = []
  }

  /**
   * Categorize an issue based on its text content
   */
  categorizeIssue(issueText) {
    const textLower = issueText.toLowerCase()
    const scores = {}

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      scores[category] = 0
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          scores[category] += 1
        }
      }
    }

    // Find highest scoring category
    const sortedCategories = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])

    if (sortedCategories.length > 0) {
      return {
        primary: sortedCategories[0][0],
        secondary: sortedCategories.slice(1, 3).map(([cat]) => cat),
        confidence: sortedCategories[0][1] / Math.max(...Object.values(scores), 1),
      }
    }

    return { primary: ISSUE_CATEGORIES.OTHER, secondary: [], confidence: 0 }
  }

  /**
   * Extract test case parameters from an issue
   */
  extractTestParameters(issue) {
    const params = {
      category: issue.category,
      searchTerms: [],
      exampleUrls: [],
      exampleText: [],
    }

    // Extract URLs from the issue text
    const urlRegex = /https?:\/\/[^\s<>"]+/gi
    const urls = issue.description.match(urlRegex) || []
    params.exampleUrls = urls

    // Extract quoted text (often contains the problematic content)
    const quotedRegex = /"([^"]+)"|'([^']+)'|"([^"]+)"|'([^']+)'/g
    let match
    while ((match = quotedRegex.exec(issue.description)) !== null) {
      const quoted = match[1] || match[2] || match[3] || match[4]
      if (quoted && quoted.length > 3) {
        params.exampleText.push(quoted)
      }
    }

    // Extract key terms for search
    const keyTerms = issue.description
      .split(/\s+/)
      .filter(word => word.length > 5 && !/^(should|could|would|their|there|these|those)$/i.test(word))
      .slice(0, 10)
    params.searchTerms = keyTerms

    return params
  }

  /**
   * Record a new issue from Slack or other source
   */
  async recordIssue(issueData) {
    const {
      source = 'slack',
      reporter,
      description,
      rawMessage,
      timestamp,
      channel,
    } = issueData

    // Categorize the issue
    const categorization = this.categorizeIssue(description)

    // Extract test parameters
    const testParams = this.extractTestParameters({
      description,
      category: categorization.primary,
    })

    const issue = {
      source,
      reporter,
      description,
      raw_message: rawMessage,
      category: categorization.primary,
      secondary_categories: categorization.secondary,
      confidence: categorization.confidence,
      test_parameters: testParams,
      channel,
      reported_at: timestamp || new Date().toISOString(),
      status: 'new', // new, acknowledged, test_created, fixed, closed
      created_at: new Date().toISOString(),
    }

    // Try to save to Supabase
    try {
      const { data, error } = await supabase
        .from('qa_issues')
        .insert(issue)
        .select()
        .single()

      if (error) {
        console.warn('[IssueTracker] Could not save to database:', error.message)
        // Fall back to local storage
        issue.id = `local_${Date.now()}`
        this.localIssueCache.push(issue)
        return issue
      }

      return data
    } catch (e) {
      console.warn('[IssueTracker] Database error, using local cache:', e.message)
      issue.id = `local_${Date.now()}`
      this.localIssueCache.push(issue)
      return issue
    }
  }

  /**
   * Get all issues, optionally filtered
   */
  async getIssues(filters = {}) {
    const { category, status, since, limit = 100 } = filters

    try {
      let query = supabase
        .from('qa_issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) query = query.eq('category', category)
      if (status) query = query.eq('status', status)
      if (since) query = query.gte('created_at', since)

      const { data, error } = await query

      if (error) {
        console.warn('[IssueTracker] Query error, using local cache')
        return this.localIssueCache
      }

      return [...(data || []), ...this.localIssueCache]
    } catch (e) {
      return this.localIssueCache
    }
  }

  /**
   * Generate test cases based on recorded issues
   * This is the "evolution" logic
   */
  async generateTestCases() {
    const issues = await this.getIssues({ status: 'new' })
    const testCases = []

    // Group issues by category
    const byCategory = {}
    for (const issue of issues) {
      if (!byCategory[issue.category]) {
        byCategory[issue.category] = []
      }
      byCategory[issue.category].push(issue)
    }

    // Generate test cases for each category with issues
    for (const [category, categoryIssues] of Object.entries(byCategory)) {
      const testCase = this.generateTestCaseForCategory(category, categoryIssues)
      if (testCase) {
        testCases.push(testCase)
      }
    }

    return testCases
  }

  /**
   * Generate a specific test case for a category based on its issues
   */
  generateTestCaseForCategory(category, issues) {
    // Collect all example data from issues
    const allUrls = issues.flatMap(i => i.test_parameters?.exampleUrls || [])
    const allText = issues.flatMap(i => i.test_parameters?.exampleText || [])
    const allTerms = issues.flatMap(i => i.test_parameters?.searchTerms || [])

    const testCase = {
      category,
      issueCount: issues.length,
      priority: issues.length >= 3 ? 'high' : issues.length >= 2 ? 'medium' : 'low',
      lastReported: issues[0]?.reported_at,
      generatedAt: new Date().toISOString(),
      testData: {
        exampleUrls: [...new Set(allUrls)].slice(0, 10),
        exampleText: [...new Set(allText)].slice(0, 10),
        searchTerms: [...new Set(allTerms)].slice(0, 20),
      },
    }

    // Add category-specific test configuration
    switch (category) {
      case ISSUE_CATEGORIES.INTERNAL_LINK_RELEVANCE:
        testCase.testType = 'internal_linking'
        testCase.assertions = [
          'All internal links must match article subject area',
          'No cross-domain linking (e.g., ministry to business)',
          'Relevance score must be >= 30',
        ]
        testCase.testTopics = this.extractTopicsFromIssues(issues)
        break

      case ISSUE_CATEGORIES.EXTERNAL_LINK_404:
        testCase.testType = 'link_validation'
        testCase.assertions = [
          'All external links must return 200 status',
          'No redirect loops',
          'Links must be accessible',
        ]
        testCase.urlsToCheck = allUrls
        break

      case ISSUE_CATEGORIES.EXTERNAL_LINK_COMPETITOR:
        testCase.testType = 'competitor_check'
        testCase.assertions = [
          'No competitor domains in content',
          'No .edu direct links',
          'External links on whitelist or flagged',
        ]
        break

      case ISSUE_CATEGORIES.STATISTICS_INACCURATE:
        testCase.testType = 'statistics_validation'
        testCase.assertions = [
          'All statistics must have verifiable source',
          'Salary data matches BLS or ranking reports',
          'Percentages are realistic and sourced',
        ]
        testCase.statisticsToVerify = allText.filter(t => /\d+%|\$[\d,]+|\d+\s*(percent|salary|median)/i.test(t))
        break

      case ISSUE_CATEGORIES.AI_REVISION_DESTROYS_CONTENT:
        testCase.testType = 'revision_safety'
        testCase.assertions = [
          'Revised content is within 10% of original word count',
          'All HTML structure preserved',
          'Only targeted text modified',
        ]
        break

      case ISSUE_CATEGORIES.AI_REVISION_STUCK:
        testCase.testType = 'revision_memory'
        testCase.assertions = [
          'Rejected links are not suggested again',
          'Alternative solutions offered after failure',
          'No infinite retry loops',
        ]
        break

      default:
        testCase.testType = 'general'
        testCase.assertions = ['Issue should not recur']
    }

    return testCase
  }

  /**
   * Extract topic examples from issues (for internal linking tests)
   */
  extractTopicsFromIssues(issues) {
    const topics = new Set()

    for (const issue of issues) {
      const text = issue.description.toLowerCase()

      // Look for topic mentions
      const topicPatterns = [
        /ministry|theology|divinity|religious|pastoral/gi,
        /mba|business|management|accounting|finance/gi,
        /nursing|healthcare|clinical|patient/gi,
        /education|teaching|curriculum|k-12/gi,
        /computer|technology|software|data science/gi,
        /criminal justice|law enforcement|forensic/gi,
      ]

      for (const pattern of topicPatterns) {
        const matches = text.match(pattern)
        if (matches) {
          topics.add(matches[0].toLowerCase())
        }
      }
    }

    return Array.from(topics)
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(issueId, status, notes = '') {
    try {
      const { error } = await supabase
        .from('qa_issues')
        .update({
          status,
          status_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)

      if (error) throw error
      return true
    } catch (e) {
      // Update local cache
      const localIssue = this.localIssueCache.find(i => i.id === issueId)
      if (localIssue) {
        localIssue.status = status
        localIssue.status_notes = notes
      }
      return true
    }
  }

  /**
   * Get issue statistics for reporting
   */
  async getIssueStats() {
    const issues = await this.getIssues({})

    const stats = {
      total: issues.length,
      byCategory: {},
      byStatus: {},
      recentCount: 0,
      priorityIssues: [],
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    for (const issue of issues) {
      // Count by category
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1

      // Count by status
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1

      // Count recent
      if (new Date(issue.created_at) > oneWeekAgo) {
        stats.recentCount++
      }
    }

    // Identify priority issues (categories with 3+ reports)
    stats.priorityIssues = Object.entries(stats.byCategory)
      .filter(([_, count]) => count >= 3)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return stats
  }
}

export default new IssueTracker()
export { IssueTracker, ISSUE_CATEGORIES, CATEGORY_KEYWORDS }
