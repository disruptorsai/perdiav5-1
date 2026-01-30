/**
 * Link Tester Service
 *
 * Tests links for:
 * - 404 errors (dead links)
 * - Competitor domains
 * - .edu direct links
 * - Redirect chains
 * - SSL issues
 */

import { validateLink, validateContent, BLOCKED_COMPETITORS, ALLOWED_EXTERNAL_DOMAINS } from '../validation/linkValidator'

class LinkTester {
  constructor() {
    this.cache = new Map() // Cache link check results
    this.cacheExpiry = 1000 * 60 * 60 // 1 hour cache
  }

  /**
   * Check if a URL is accessible (not 404)
   * Uses HEAD request for efficiency
   */
  async checkUrlAccessibility(url, options = {}) {
    const { timeout = 10000, followRedirects = true } = options

    // Check cache first
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.checkedAt < this.cacheExpiry) {
      return cached.result
    }

    const result = {
      url,
      accessible: false,
      statusCode: null,
      redirectUrl: null,
      error: null,
      responseTime: null,
    }

    const startTime = Date.now()

    try {
      // Use AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method: 'HEAD',
        redirect: followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PerdiaQA/1.0; +https://perdiav5.netlify.app)',
        },
      })

      clearTimeout(timeoutId)

      result.statusCode = response.status
      result.responseTime = Date.now() - startTime
      result.accessible = response.ok || response.status === 301 || response.status === 302

      // Track redirects
      if (response.redirected) {
        result.redirectUrl = response.url
      }

      // If HEAD fails, try GET (some servers don't support HEAD)
      if (response.status === 405) {
        const getResponse = await fetch(url, {
          method: 'GET',
          redirect: followRedirects ? 'follow' : 'manual',
          signal: controller.signal,
        })
        result.statusCode = getResponse.status
        result.accessible = getResponse.ok
      }

    } catch (error) {
      result.error = error.name === 'AbortError' ? 'Timeout' : error.message
      result.responseTime = Date.now() - startTime
    }

    // Cache the result
    this.cache.set(url, { result, checkedAt: Date.now() })

    return result
  }

  /**
   * Extract all links from HTML content
   */
  extractAllLinks(content) {
    const links = []
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        url: match[1],
        anchorText: match[2] || '',
        fullMatch: match[0],
      })
    }

    return links
  }

  /**
   * Categorize a link (internal, external, anchor, etc.)
   */
  categorizeLink(url) {
    if (!url) return { type: 'invalid', domain: null }

    if (url.startsWith('#')) return { type: 'anchor', domain: null }
    if (url.startsWith('/')) return { type: 'internal_relative', domain: 'geteducated.com' }
    if (url.startsWith('mailto:')) return { type: 'email', domain: null }
    if (url.startsWith('tel:')) return { type: 'phone', domain: null }

    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.toLowerCase()

      if (domain.includes('geteducated.com')) {
        return { type: 'internal', domain }
      }

      if (domain.endsWith('.edu')) {
        return { type: 'edu', domain }
      }

      if (BLOCKED_COMPETITORS.some(comp => domain.includes(comp))) {
        return { type: 'competitor', domain }
      }

      if (ALLOWED_EXTERNAL_DOMAINS.some(allowed => domain.includes(allowed))) {
        return { type: 'external_whitelisted', domain }
      }

      return { type: 'external_unknown', domain }

    } catch (e) {
      return { type: 'invalid', domain: null }
    }
  }

  /**
   * Run comprehensive link tests on content
   */
  async testAllLinks(content, options = {}) {
    const {
      check404s = true,
      checkCompetitors = true,
      checkEdu = true,
      parallel = 5, // Max concurrent requests
    } = options

    const links = this.extractAllLinks(content)
    const results = {
      totalLinks: links.length,
      passed: [],
      failed: [],
      warnings: [],
      summary: {
        internal: 0,
        external: 0,
        broken: 0,
        competitor: 0,
        edu: 0,
        unknown: 0,
      },
    }

    // First pass: categorize all links (fast, no network)
    const categorizedLinks = links.map(link => ({
      ...link,
      ...this.categorizeLink(link.url),
      validation: validateLink(link.url),
    }))

    // Check competitors and .edu (instant fails, no network needed)
    for (const link of categorizedLinks) {
      if (link.type === 'competitor') {
        results.failed.push({
          ...link,
          reason: 'Competitor domain',
          severity: 'blocking',
        })
        results.summary.competitor++
        continue
      }

      if (link.type === 'edu' && checkEdu) {
        results.failed.push({
          ...link,
          reason: 'Direct .edu link not allowed',
          severity: 'blocking',
        })
        results.summary.edu++
        continue
      }

      if (link.type === 'external_unknown') {
        results.warnings.push({
          ...link,
          reason: `External domain not on whitelist: ${link.domain}`,
          severity: 'warning',
        })
        results.summary.unknown++
      }

      if (link.type === 'internal' || link.type === 'internal_relative') {
        results.summary.internal++
      } else if (link.type === 'external_whitelisted') {
        results.summary.external++
      }
    }

    // Second pass: check 404s (network requests)
    if (check404s) {
      const linksToCheck = categorizedLinks.filter(link =>
        link.type !== 'anchor' &&
        link.type !== 'email' &&
        link.type !== 'phone' &&
        link.type !== 'invalid' &&
        link.type !== 'competitor' // Already failed
      )

      // Process in batches for parallel requests
      for (let i = 0; i < linksToCheck.length; i += parallel) {
        const batch = linksToCheck.slice(i, i + parallel)
        const checks = await Promise.all(
          batch.map(link => this.checkUrlAccessibility(link.url))
        )

        for (let j = 0; j < batch.length; j++) {
          const link = batch[j]
          const check = checks[j]

          if (!check.accessible) {
            results.failed.push({
              ...link,
              ...check,
              reason: check.error || `HTTP ${check.statusCode}`,
              severity: check.statusCode === 404 ? 'error' : 'warning',
            })
            results.summary.broken++
          } else {
            results.passed.push({
              ...link,
              ...check,
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Test internal link relevance (uses topicRelevanceService logic)
   */
  async testInternalLinkRelevance(articleTitle, content) {
    // Import dynamically to avoid circular dependency
    const { extractSubjectArea, areSubjectsRelated } = await import('../topicRelevanceService')

    const articleSubject = extractSubjectArea(articleTitle)
    const links = this.extractAllLinks(content)
    const internalLinks = links.filter(link =>
      link.url.includes('geteducated.com') || link.url.startsWith('/')
    )

    const results = {
      articleTitle,
      articleSubject,
      totalInternalLinks: internalLinks.length,
      relevant: [],
      irrelevant: [],
    }

    for (const link of internalLinks) {
      // Extract subject from linked article title (from anchor text or URL)
      const linkSubject = extractSubjectArea(link.anchorText) ||
                          extractSubjectArea(this.extractTitleFromUrl(link.url))

      const isRelated = areSubjectsRelated(articleSubject, linkSubject)

      if (!articleSubject || !linkSubject || isRelated) {
        results.relevant.push({
          ...link,
          linkSubject,
          reason: isRelated ?
            `Related subjects: ${articleSubject} ↔ ${linkSubject}` :
            'Subject not determined',
        })
      } else {
        results.irrelevant.push({
          ...link,
          linkSubject,
          reason: `Unrelated subjects: ${articleSubject} vs ${linkSubject}`,
          severity: 'error',
        })
      }
    }

    return results
  }

  /**
   * Extract a readable title from a URL path
   */
  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url, 'https://geteducated.com')
      const path = urlObj.pathname
      const slug = path.split('/').filter(Boolean).pop() || ''
      return slug.replace(/-/g, ' ').replace(/\//g, '')
    } catch (e) {
      return url
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear()
  }
}

export default new LinkTester()
export { LinkTester }
