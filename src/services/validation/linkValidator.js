/**
 * Link Validation Service for GetEducated
 * Enforces strict linking rules:
 * - No .edu links (use GetEducated school pages instead)
 * - No competitor links (onlineu.com, usnews.com, etc.)
 * - All school links must go to GetEducated pages
 * - External links only to BLS, government, nonprofit sites
 */

// Competitor domains to block
// FIX #4: Expanded list based on Slack feedback from Kayleigh/Sara
export const BLOCKED_COMPETITORS = [
  // Primary competitors (mentioned in Slack)
  'onlineu.com',
  'usnews.com',
  'bestcolleges.com',
  // Secondary competitors
  'affordablecollegesonline.com',
  'toponlinecollegesusa.com',
  'niche.com',
  'collegeconfidential.com',
  'cappex.com',
  'collegeraptor.com',
  'collegesimply.com',
  'graduateguide.com',
  'gradschools.com',
  'petersons.com',
  'princetonreview.com',
  'collegexpress.com',
  // Additional competitors (often missed)
  'onlineu.org',
  'onlineschoolscenter.com',
  'onlinecolleges.net',
  'thebestschools.org',
  'collegeatlas.org',
  'collegevaluesonline.com',
  'guidetoonlineschools.com',
  'accreditedschoolsonline.org',
  'accreditedcollegesonline.com',
  'onlinecollegecourses.com',
  'onlinedegrees.com',
  'elearners.com',
  'onlineu.net',
  'bestaccreditedcolleges.org',
  'collegerank.net',
  'university.com',
  'worldwidelearn.com',
]

// Allowed external domains (whitelist approach for external links)
export const ALLOWED_EXTERNAL_DOMAINS = [
  // Bureau of Labor Statistics
  'bls.gov',
  'stats.bls.gov',
  // Government education sites
  'ed.gov',
  'nces.ed.gov',
  'studentaid.gov',
  'fafsa.gov',
  'collegescorecard.ed.gov',
  // Accreditation bodies
  'chea.org',
  'aacsb.edu',
  'abet.org',
  'cacrep.org',
  'ccne-accreditation.org',
  'cswe.org',
  'ncate.org',
  'teac.org',
  // Nonprofit education organizations
  'collegeboard.org',
  'acenet.edu',
  'aacn.nche.edu',
  'naspa.org',
  // Professional associations
  'apa.org',
  'nasw.org',
  'nursingworld.org',
]

// Internal GetEducated domains
const GETEDUCATED_DOMAINS = [
  'geteducated.com',
  'www.geteducated.com',
]

/**
 * Validate a single URL against GetEducated linking rules
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result with isValid, type, and issues
 */
export function validateLink(url) {
  const result = {
    url,
    isValid: true,
    type: 'unknown', // internal, external, anchor, invalid
    issues: [],
    severity: 'none', // none, warning, error, blocking
  }

  // Handle empty or invalid URLs
  if (!url || typeof url !== 'string') {
    result.isValid = false
    result.type = 'invalid'
    result.issues.push('Empty or invalid URL')
    result.severity = 'error'
    return result
  }

  // Handle anchor links (always valid)
  if (url.startsWith('#')) {
    result.type = 'anchor'
    return result
  }

  // Handle relative URLs (internal)
  if (url.startsWith('/')) {
    result.type = 'internal'
    return result
  }

  // Parse URL to extract domain
  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.toLowerCase()
  } catch (e) {
    // Not a valid URL format
    result.isValid = false
    result.type = 'invalid'
    result.issues.push('Invalid URL format')
    result.severity = 'error'
    return result
  }

  // Check if it's a GetEducated internal link
  if (GETEDUCATED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
    result.type = 'internal'
    return result
  }

  // Mark as external
  result.type = 'external'

  // CRITICAL: Block .edu links
  if (domain.endsWith('.edu')) {
    result.isValid = false
    result.issues.push('Direct .edu links are not allowed. Use GetEducated school pages instead.')
    result.severity = 'blocking'
    return result
  }

  // CRITICAL: Block competitor links
  for (const competitor of BLOCKED_COMPETITORS) {
    if (domain === competitor || domain.endsWith('.' + competitor)) {
      result.isValid = false
      result.issues.push(`Competitor link detected: ${competitor}. This link is not allowed.`)
      result.severity = 'blocking'
      return result
    }
  }

  // Check if external link is on the allowed whitelist
  const isAllowed = ALLOWED_EXTERNAL_DOMAINS.some(allowed =>
    domain === allowed || domain.endsWith('.' + allowed)
  )

  if (!isAllowed) {
    // STRICT MODE: Block ANY external link not on the whitelist
    // Changed from warning to blocking per Feb 2026 feedback - too many dead links slipping through
    result.isValid = false
    result.issues.push(`External link to ${domain} is NOT on the approved whitelist. Only links to BLS.gov, government sites (.gov), and approved nonprofit/accreditation organizations are allowed. This link will be removed.`)
    result.severity = 'blocking'
  }

  return result
}

/**
 * Extract all links from HTML content
 * @param {string} content - HTML content
 * @returns {Array} Array of link objects with url and anchorText
 */
export function extractLinks(content) {
  if (!content) return []

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
 * Validate all links in HTML content
 * @param {string} content - HTML content to validate
 * @returns {Object} Comprehensive validation result
 */
export function validateContent(content) {
  const links = extractLinks(content)
  const results = {
    isCompliant: true,
    totalLinks: links.length,
    internalLinks: 0,
    externalLinks: 0,
    anchorLinks: 0,
    invalidLinks: 0,
    blockingIssues: [],
    warnings: [],
    errors: [],
    links: [],
  }

  for (const link of links) {
    const validation = validateLink(link.url)
    validation.anchorText = link.anchorText

    results.links.push(validation)

    // Count by type
    switch (validation.type) {
      case 'internal':
        results.internalLinks++
        break
      case 'external':
        results.externalLinks++
        break
      case 'anchor':
        results.anchorLinks++
        break
      case 'invalid':
        results.invalidLinks++
        break
    }

    // Collect issues by severity
    if (validation.severity === 'blocking') {
      results.isCompliant = false
      results.blockingIssues.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    } else if (validation.severity === 'error') {
      results.errors.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    } else if (validation.severity === 'warning') {
      results.warnings.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    }
  }

  return results
}

/**
 * Check if a URL is a GetEducated school page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedSchoolPage(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-schools/')
}

/**
 * Check if a URL is a GetEducated degree page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedDegreePage(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-degrees/')
}

/**
 * Check if a URL is a GetEducated ranking report
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedRankingReport(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-college-ratings-and-rankings/')
}

/**
 * Get the appropriate GetEducated school page URL for a school name
 * @param {string} schoolName - Name of the school
 * @returns {string} GetEducated school page URL
 */
export function getSchoolPageUrl(schoolName) {
  if (!schoolName) return ''
  const slug = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return `https://www.geteducated.com/online-schools/${slug}/`
}

/**
 * Check if link compliance allows publishing
 * @param {Object} validationResult - Result from validateContent
 * @returns {Object} Publish status with reason
 */
export function canPublish(validationResult) {
  if (!validationResult.isCompliant) {
    return {
      canPublish: false,
      reason: 'Content contains blocked links that must be removed before publishing.',
      blockingIssues: validationResult.blockingIssues,
    }
  }

  return {
    canPublish: true,
    reason: null,
    warnings: validationResult.warnings,
  }
}

/**
 * FIX #4: Check if a URL is live (not a 404)
 * Uses HEAD request for efficiency
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in ms (default 5000)
 * @returns {Promise<Object>} { isLive, statusCode, error }
 */
export async function checkLinkStatus(url, timeout = 5000) {
  if (!url || url.startsWith('#') || url.startsWith('/')) {
    return { isLive: true, statusCode: null, error: null, skipped: true }
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GetEducatedBot/1.0; +https://geteducated.com)',
      },
    })
    
    clearTimeout(timeoutId)
    
    const isLive = response.status >= 200 && response.status < 400
    
    return {
      isLive,
      statusCode: response.status,
      finalUrl: response.url, // After redirects
      error: null,
    }
    
  } catch (error) {
    // Handle specific errors
    if (error.name === 'AbortError') {
      return { isLive: false, statusCode: null, error: 'Timeout' }
    }
    
    return { 
      isLive: false, 
      statusCode: null, 
      error: error.message || 'Network error',
    }
  }
}

/**
 * FIX #4: Validate all links in content for liveness (404 check)
 * @param {string} content - HTML content
 * @param {Object} options - Options
 * @returns {Promise<Object>} Validation result with live/dead links
 */
export async function validateLinksAreLive(content, options = {}) {
  const { 
    checkExternal = true,
    checkInternal = true,
    maxConcurrent = 5,
    timeout = 5000,
  } = options
  
  const links = extractLinks(content)
  const results = {
    totalChecked: 0,
    liveLinks: 0,
    deadLinks: 0,
    timeoutLinks: 0,
    skippedLinks: 0,
    details: [],
  }
  
  // Filter links based on options
  const linksToCheck = links.filter(link => {
    if (link.url.startsWith('#') || link.url.startsWith('/')) {
      results.skippedLinks++
      return false
    }
    
    const isInternal = link.url.includes('geteducated.com')
    if (isInternal && !checkInternal) {
      results.skippedLinks++
      return false
    }
    if (!isInternal && !checkExternal) {
      results.skippedLinks++
      return false
    }
    
    return true
  })
  
  // Check links in batches
  for (let i = 0; i < linksToCheck.length; i += maxConcurrent) {
    const batch = linksToCheck.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(
      batch.map(async link => {
        const status = await checkLinkStatus(link.url, timeout)
        return { ...link, status }
      })
    )
    
    for (const result of batchResults) {
      results.totalChecked++
      
      if (result.status.isLive) {
        results.liveLinks++
      } else if (result.status.error === 'Timeout') {
        results.timeoutLinks++
      } else {
        results.deadLinks++
      }
      
      results.details.push({
        url: result.url,
        anchorText: result.anchorText,
        isLive: result.status.isLive,
        statusCode: result.status.statusCode,
        error: result.status.error,
      })
    }
  }
  
  results.hasDeadLinks = results.deadLinks > 0
  
  return results
}

/**
 * STRICT LINK CLEANUP: Remove any links not on the approved whitelist
 * This runs as a post-processing step to catch anything the AI generated incorrectly
 * @param {string} content - HTML content
 * @returns {Object} { cleanedContent, removedLinks, stats }
 */
export function stripUnapprovedLinks(content) {
  if (!content) return { cleanedContent: content, removedLinks: [], stats: { total: 0, removed: 0 } }

  const links = extractLinks(content)
  const removedLinks = []
  let cleanedContent = content

  for (const link of links) {
    const validation = validateLink(link.url)

    // If the link is not valid (blocked), remove the <a> tag but keep the text
    if (!validation.isValid) {
      removedLinks.push({
        url: link.url,
        anchorText: link.anchorText,
        reason: validation.issues.join('; '),
      })

      // Replace the full <a>...</a> tag with just the anchor text
      cleanedContent = cleanedContent.replace(link.fullMatch, link.anchorText)
    }
  }

  return {
    cleanedContent,
    removedLinks,
    stats: {
      total: links.length,
      removed: removedLinks.length,
      remaining: links.length - removedLinks.length,
    },
  }
}

/**
 * Format the allowed external domains as a string for AI prompts
 * @returns {string} Formatted list of allowed domains
 */
export function getApprovedDomainsForPrompt() {
  return `APPROVED EXTERNAL LINK DOMAINS (ONLY these are allowed):
- bls.gov (Bureau of Labor Statistics)
- ed.gov, nces.ed.gov, studentaid.gov, fafsa.gov, collegescorecard.ed.gov (Government education)
- chea.org, aacsb.edu, abet.org, cacrep.org, ccne-accreditation.org, cswe.org (Accreditation bodies)
- collegeboard.org, acenet.edu, aacn.nche.edu, naspa.org (Nonprofit education)
- apa.org, nasw.org, nursingworld.org (Professional associations)

ANY other external domain will be STRIPPED from the content. Do NOT link to:
- Any .edu domains (use GetEducated school pages instead)
- Any .org, .com, .net sites not listed above
- Wikipedia, news sites, university websites, etc.`
}

export default {
  validateLink,
  validateContent,
  extractLinks,
  isGetEducatedSchoolPage,
  isGetEducatedDegreePage,
  isGetEducatedRankingReport,
  getSchoolPageUrl,
  canPublish,
  checkLinkStatus,
  validateLinksAreLive,
  stripUnapprovedLinks,
  getApprovedDomainsForPrompt,
  BLOCKED_COMPETITORS,
  ALLOWED_EXTERNAL_DOMAINS,
}
