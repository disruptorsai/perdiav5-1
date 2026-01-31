/**
 * Shortcode Service for GetEducated
 * Handles monetization shortcode generation, validation, and placement
 *
 * ACTUAL GetEducated WordPress Shortcode Formats (from Tony's email 2025-12-15):
 *
 * 1. GE Picks (degree table):
 *    [su_ge-picks category="8" concentration="18" level="2" header="GetEducated's Picks" cta-button="View More Degrees" cta-url="/online-degrees/bachelor/art-liberal-arts/art-architecture/"][/su_ge-picks]
 *
 * 2. School Link:
 *    [su_ge-cta type="link" cta-copy="SNHU" school="22742"]SNHU[/su_ge-cta]
 *
 * 3. Degree Link:
 *    [su_ge-cta type="link" cta-copy="SNHU's MBA in Athletic Administration" school="22742" degree="315964"]SNHU's MBA in Athletic Administration[/su_ge-cta]
 *
 * 4. Internal Link:
 *    [su_ge-cta type="link" cta-copy="internal link example" url="/online-college-ratings-and-rankings/"]internal link example[/su_ge-cta]
 *
 * 5. External Link:
 *    [su_ge-cta type="link" cta-copy="external link example" url="https://www.aacsb.edu/" target="blank"]external link example[/su_ge-cta]
 *
 * 6. Quick Degree Find:
 *    [su_ge-qdf type="simple" header="Browse Now"][/su_ge-qdf]
 */

import { supabase } from './supabaseClient'

/**
 * Shortcode type constants - Updated to match actual GetEducated shortcodes
 */
export const SHORTCODE_TYPES = {
  GE_PICKS: 'ge_picks',           // [su_ge-picks] - Degree table/picks display
  GE_CTA_SCHOOL: 'ge_cta_school', // [su_ge-cta] with school param - School link
  GE_CTA_DEGREE: 'ge_cta_degree', // [su_ge-cta] with school+degree params - Degree link
  GE_CTA_INTERNAL: 'ge_cta_internal', // [su_ge-cta] with url param (internal) - Internal link
  GE_CTA_EXTERNAL: 'ge_cta_external', // [su_ge-cta] with url+target params - External link
  GE_QDF: 'ge_qdf',               // [su_ge-qdf] - Quick Degree Find widget
}

/**
 * Allowlist of valid shortcode tags
 * These are the ACTUAL GetEducated WordPress shortcodes
 */
export const ALLOWED_SHORTCODE_TAGS = [
  // GetEducated custom shortcodes (ACTUAL WordPress shortcodes)
  'su_ge-picks',    // Degree table/picks
  'su_ge-cta',      // All link types (school, degree, internal, external)
  'su_ge-qdf',      // Quick Degree Find
]

/**
 * Legacy shortcode tags that we previously generated incorrectly
 * These should be flagged for migration
 */
export const LEGACY_SHORTCODE_TAGS = [
  'ge_monetization',
  'degree_table',
  'degree_offer',
  'ge_internal_link',
  'ge_external_cited',
]

// ============================================================================
// SHORTCODE GENERATION FUNCTIONS - Correct GetEducated Format
// ============================================================================

/**
 * Generate a GE Picks shortcode (degree table)
 * This displays a table of degrees matching the category/concentration/level
 *
 * @param {Object} params - Shortcode parameters
 * @param {number} params.category - Category ID from monetization_categories
 * @param {number} params.concentration - Concentration ID from monetization_categories
 * @param {number} params.level - Level code from monetization_levels (optional)
 * @param {string} params.header - Header text (default: "GetEducated's Picks")
 * @param {string} params.ctaButton - CTA button text (default: "View More Degrees")
 * @param {string} params.ctaUrl - CTA URL path (e.g., "/online-degrees/bachelor/business/")
 * @returns {string} The formatted shortcode
 */
export function generateGePicksShortcode(params) {
  const {
    category,
    concentration,
    level,
    header = "GetEducated's Picks",
    ctaButton = "View More Degrees",
    ctaUrl,
  } = params

  if (!category || !concentration) {
    throw new Error('category and concentration are required for su_ge-picks')
  }

  let shortcode = `[su_ge-picks category="${category}" concentration="${concentration}"`

  if (level) {
    shortcode += ` level="${level}"`
  }

  shortcode += ` header="${header}"`
  shortcode += ` cta-button="${ctaButton}"`

  if (ctaUrl) {
    shortcode += ` cta-url="${ctaUrl}"`
  }

  shortcode += `][/su_ge-picks]`

  return shortcode
}

/**
 * Generate a GE CTA shortcode for school link
 * Links to a school's page on GetEducated
 *
 * @param {Object} params - Shortcode parameters
 * @param {string} params.schoolId - WordPress school ID (e.g., "22742")
 * @param {string} params.anchorText - Link text (e.g., "SNHU")
 * @returns {string} The formatted shortcode
 */
export function generateSchoolLinkShortcode(params) {
  const { schoolId, anchorText } = params

  if (!schoolId || !anchorText) {
    throw new Error('schoolId and anchorText are required for school link')
  }

  return `[su_ge-cta type="link" cta-copy="${anchorText}" school="${schoolId}"]${anchorText}[/su_ge-cta]`
}

/**
 * Generate a GE CTA shortcode for degree link
 * Links to a specific degree program
 *
 * @param {Object} params - Shortcode parameters
 * @param {string} params.schoolId - WordPress school ID (e.g., "22742")
 * @param {string} params.degreeId - WordPress degree ID (e.g., "315964")
 * @param {string} params.anchorText - Link text (e.g., "SNHU's MBA in Athletic Administration")
 * @returns {string} The formatted shortcode
 */
export function generateDegreeLinkShortcode(params) {
  const { schoolId, degreeId, anchorText } = params

  if (!schoolId || !degreeId || !anchorText) {
    throw new Error('schoolId, degreeId, and anchorText are required for degree link')
  }

  return `[su_ge-cta type="link" cta-copy="${anchorText}" school="${schoolId}" degree="${degreeId}"]${anchorText}[/su_ge-cta]`
}

/**
 * Generate a GE CTA shortcode for internal link
 * Links to internal GetEducated pages
 *
 * @param {Object} params - Shortcode parameters
 * @param {string} params.url - Internal URL path (e.g., "/online-college-ratings-and-rankings/")
 * @param {string} params.anchorText - Link text
 * @returns {string} The formatted shortcode
 */
export function generateInternalLinkShortcode(params) {
  const { url, anchorText } = params

  if (!url || !anchorText) {
    throw new Error('url and anchorText are required for internal link')
  }

  // Ensure URL is relative (internal)
  let cleanUrl = url
  if (url.includes('geteducated.com')) {
    cleanUrl = url.replace(/https?:\/\/(www\.)?geteducated\.com/, '')
  }

  return `[su_ge-cta type="link" cta-copy="${anchorText}" url="${cleanUrl}"]${anchorText}[/su_ge-cta]`
}

/**
 * Generate a GE CTA shortcode for external link
 * Links to external sites (BLS, government, etc.)
 *
 * @param {Object} params - Shortcode parameters
 * @param {string} params.url - External URL (full URL with https://)
 * @param {string} params.anchorText - Link text
 * @returns {string} The formatted shortcode
 */
export function generateExternalLinkShortcode(params) {
  const { url, anchorText } = params

  if (!url || !anchorText) {
    throw new Error('url and anchorText are required for external link')
  }

  return `[su_ge-cta type="link" cta-copy="${anchorText}" url="${url}" target="blank"]${anchorText}[/su_ge-cta]`
}

/**
 * Generate a Quick Degree Find shortcode
 * Displays a degree search widget
 *
 * @param {Object} params - Shortcode parameters
 * @param {string} params.type - Widget type (default: "simple")
 * @param {string} params.header - Header text (default: "Browse Now")
 * @returns {string} The formatted shortcode
 */
export function generateQuickDegreeFindShortcode(params = {}) {
  const {
    type = 'simple',
    header = 'Browse Now',
  } = params

  return `[su_ge-qdf type="${type}" header="${header}"][/su_ge-qdf]`
}

// ============================================================================
// SHORTCODE PARSING FUNCTIONS
// ============================================================================

/**
 * Parse a shortcode string into its parameters
 * @param {string} shortcode - The shortcode string
 * @returns {Object} Parsed parameters
 */
export function parseShortcode(shortcode) {
  const result = {
    type: null,
    isValid: false,
    params: {},
    raw: shortcode,
  }

  if (!shortcode || typeof shortcode !== 'string') {
    return result
  }

  // Match su_ge-picks shortcode
  const gePicksMatch = shortcode.match(
    /\[su_ge-picks\s+([^\]]+)\]\[\/su_ge-picks\]/i
  )
  if (gePicksMatch) {
    result.type = SHORTCODE_TYPES.GE_PICKS
    result.params = parseShortcodeAttributes(gePicksMatch[1])
    result.isValid = true
    return result
  }

  // Match su_ge-cta shortcode (various types)
  const geCtaMatch = shortcode.match(
    /\[su_ge-cta\s+([^\]]+)\]([^\[]*)\[\/su_ge-cta\]/i
  )
  if (geCtaMatch) {
    result.params = parseShortcodeAttributes(geCtaMatch[1])
    result.params.innerText = geCtaMatch[2]

    // Determine CTA type based on params
    if (result.params.school && result.params.degree) {
      result.type = SHORTCODE_TYPES.GE_CTA_DEGREE
    } else if (result.params.school) {
      result.type = SHORTCODE_TYPES.GE_CTA_SCHOOL
    } else if (result.params.url && result.params.target === 'blank') {
      result.type = SHORTCODE_TYPES.GE_CTA_EXTERNAL
    } else if (result.params.url) {
      result.type = SHORTCODE_TYPES.GE_CTA_INTERNAL
    }

    result.isValid = result.type !== null
    return result
  }

  // Match su_ge-qdf shortcode
  const geQdfMatch = shortcode.match(
    /\[su_ge-qdf\s+([^\]]+)\]\[\/su_ge-qdf\]/i
  )
  if (geQdfMatch) {
    result.type = SHORTCODE_TYPES.GE_QDF
    result.params = parseShortcodeAttributes(geQdfMatch[1])
    result.isValid = true
    return result
  }

  return result
}

/**
 * Parse shortcode attributes string into object
 * @param {string} attrString - Attribute string (e.g., 'category="8" level="2"')
 * @returns {Object} Parsed attributes
 */
function parseShortcodeAttributes(attrString) {
  const attrs = {}
  const regex = /([\w-]+)="([^"]*)"/g
  let match

  while ((match = regex.exec(attrString)) !== null) {
    // Convert kebab-case to camelCase for JS usage
    const key = match[1].replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    attrs[key] = match[2]
  }

  return attrs
}

/**
 * Extract all shortcodes from content
 * @param {string} content - HTML content
 * @returns {Array} Array of shortcode objects
 */
export function extractShortcodes(content) {
  if (!content) return []

  const shortcodes = []

  // Find all su_ge-picks shortcodes
  const gePicksRegex = /\[su_ge-picks\s+[^\]]+\]\[\/su_ge-picks\]/gi
  let match
  while ((match = gePicksRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all su_ge-cta shortcodes
  const geCtaRegex = /\[su_ge-cta\s+[^\]]+\][^\[]*\[\/su_ge-cta\]/gi
  while ((match = geCtaRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all su_ge-qdf shortcodes
  const geQdfRegex = /\[su_ge-qdf\s+[^\]]+\]\[\/su_ge-qdf\]/gi
  while ((match = geQdfRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  return shortcodes
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate shortcode parameters against database
 * @param {Object} params - Shortcode parameters
 * @returns {Object} Validation result
 */
export async function validateShortcodeParams(params) {
  const { category, concentration, level } = params
  const result = {
    isValid: true,
    errors: [],
    category: null,
    level: null,
  }

  // Validate category and concentration exist
  if (category && concentration) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('monetization_categories')
      .select('*')
      .eq('category_id', category)
      .eq('concentration_id', concentration)
      .single()

    if (categoryError || !categoryData) {
      result.isValid = false
      result.errors.push(`Invalid category (${category}) or concentration (${concentration})`)
    } else {
      result.category = categoryData
    }
  }

  // Validate level code if provided
  if (level) {
    const { data: levelData, error: levelError } = await supabase
      .from('monetization_levels')
      .select('*')
      .eq('level_code', level)
      .single()

    if (levelError || !levelData) {
      result.isValid = false
      result.errors.push(`Invalid level code: ${level}`)
    } else {
      result.level = levelData
    }
  }

  return result
}

/**
 * Extract ALL shortcode-like tokens from content
 * This catches any pattern that looks like a shortcode: [tag ...] or [/tag]
 * Used to detect unknown/hallucinated shortcodes that aren't in our allowlist
 * @param {string} content - HTML content
 * @returns {Array} Array of token objects with tag, raw, isClosing, position
 */
export function extractAllShortcodeLikeTokens(content) {
  if (!content) return []

  const tokens = []
  // Match patterns like [tag], [tag attr="val"], [/tag]
  // This regex captures: opening/closing slash, tag name, and attributes
  const shortcodeRegex = /\[(\/?)([\w-]+)([^\]]*)\]/gi
  let match

  while ((match = shortcodeRegex.exec(content)) !== null) {
    tokens.push({
      raw: match[0],
      tag: match[2].toLowerCase(),
      isClosing: match[1] === '/',
      attributes: match[3].trim(),
      position: match.index,
    })
  }

  return tokens
}

/**
 * Find unknown/invalid shortcodes in content
 * These are shortcode-like patterns that are NOT in our allowlist
 * @param {string} content - HTML content
 * @param {Array} customAllowlist - Optional additional allowed tags
 * @returns {Array} Array of unknown shortcode tokens
 */
export function findUnknownShortcodes(content, customAllowlist = []) {
  const allTokens = extractAllShortcodeLikeTokens(content)
  const allowedTags = [...ALLOWED_SHORTCODE_TAGS, ...customAllowlist].map(t => t.toLowerCase())

  return allTokens.filter(token => !allowedTags.includes(token.tag))
}

/**
 * Find legacy shortcodes that need to be migrated
 * @param {string} content - HTML content
 * @returns {Array} Array of legacy shortcode tokens
 */
export function findLegacyShortcodes(content) {
  const allTokens = extractAllShortcodeLikeTokens(content)
  const legacyTags = LEGACY_SHORTCODE_TAGS.map(t => t.toLowerCase())

  return allTokens.filter(token => legacyTags.includes(token.tag))
}

/**
 * Validate that content contains no unknown shortcodes
 * Returns a structured validation result for use in pre-publish checks
 * @param {string} content - HTML content
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid, unknownShortcodes, message
 */
export function validateNoUnknownShortcodes(content, options = {}) {
  const { customAllowlist = [], blockOnUnknown = true } = options

  const unknownShortcodes = findUnknownShortcodes(content, customAllowlist)
  const legacyShortcodes = findLegacyShortcodes(content)

  if (unknownShortcodes.length === 0 && legacyShortcodes.length === 0) {
    return {
      isValid: true,
      unknownShortcodes: [],
      legacyShortcodes: [],
      message: 'All shortcodes are valid',
    }
  }

  // Get unique unknown tags for the message
  const uniqueUnknownTags = [...new Set(unknownShortcodes.map(s => s.tag))]
  const uniqueLegacyTags = [...new Set(legacyShortcodes.map(s => s.tag))]

  const messages = []
  if (unknownShortcodes.length > 0) {
    messages.push(`Found ${unknownShortcodes.length} unknown shortcode(s): ${uniqueUnknownTags.join(', ')}`)
  }
  if (legacyShortcodes.length > 0) {
    messages.push(`Found ${legacyShortcodes.length} legacy shortcode(s) that need migration: ${uniqueLegacyTags.join(', ')}`)
  }

  return {
    isValid: !blockOnUnknown && legacyShortcodes.length === 0,
    unknownShortcodes,
    legacyShortcodes,
    uniqueUnknownTags,
    uniqueLegacyTags,
    message: messages.join('. '),
    details: [
      ...unknownShortcodes.map(s => ({
        tag: s.tag,
        raw: s.raw.substring(0, 100) + (s.raw.length > 100 ? '...' : ''),
        position: s.position,
        type: 'unknown',
      })),
      ...legacyShortcodes.map(s => ({
        tag: s.tag,
        raw: s.raw.substring(0, 100) + (s.raw.length > 100 ? '...' : ''),
        position: s.position,
        type: 'legacy',
      })),
    ],
  }
}

// ============================================================================
// MONETIZATION COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Check if content has required monetization shortcodes
 * @param {string} content - HTML content
 * @returns {Object} Check result
 */
export function checkMonetizationCompliance(content) {
  const shortcodes = extractShortcodes(content)

  const gePicksCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.GE_PICKS).length
  const schoolLinkCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.GE_CTA_SCHOOL).length
  const degreeLinkCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.GE_CTA_DEGREE).length
  const qdfCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.GE_QDF).length

  // Monetization = GE Picks or QDF (displays degree offers)
  const hasMonetization = gePicksCount > 0 || qdfCount > 0

  return {
    hasMonetization,
    monetizationCount: gePicksCount + qdfCount,
    shortcodes,
    isCompliant: hasMonetization,
    breakdown: {
      gePicks: gePicksCount,
      schoolLinks: schoolLinkCount,
      degreeLinks: degreeLinkCount,
      quickDegreeFind: qdfCount,
    },
    recommendation: !hasMonetization
      ? 'Add at least one [su_ge-picks] or [su_ge-qdf] shortcode to display degree offers'
      : null,
  }
}

// ============================================================================
// URL BUILDING HELPERS
// ============================================================================

/**
 * Build a CTA URL for degree offerings based on category/concentration/level
 * Format: /online-degrees/{level}/{category-slug}/{concentration-slug}/
 *
 * @param {Object} params - URL parameters
 * @param {string} params.levelSlug - Level slug (e.g., "bachelor", "master")
 * @param {string} params.categorySlug - Category slug (e.g., "business")
 * @param {string} params.concentrationSlug - Concentration slug (e.g., "accounting")
 * @returns {string} The CTA URL
 */
export function buildCtaUrl(params) {
  const { levelSlug, categorySlug, concentrationSlug } = params

  let url = '/online-degrees/'

  if (levelSlug) {
    url += `${levelSlug}/`
  }
  if (categorySlug) {
    url += `${categorySlug}/`
  }
  if (concentrationSlug) {
    url += `${concentrationSlug}/`
  }

  return url
}

/**
 * Build a school page URL
 * Format: /online-schools/{school-slug}/
 *
 * @param {string} schoolSlug - School slug
 * @returns {string} The school URL
 */
export function buildSchoolUrl(schoolSlug) {
  return `/online-schools/${schoolSlug}/`
}

/**
 * Build a ranking report URL
 * Format: /online-college-ratings-and-rankings/best-buy-lists/{report-slug}/
 *
 * @param {string} reportSlug - Ranking report slug
 * @returns {string} The ranking report URL
 */
export function buildRankingReportUrl(reportSlug) {
  return `/online-college-ratings-and-rankings/best-buy-lists/${reportSlug}/`
}

// ============================================================================
// TOPIC MATCHING FUNCTIONS
// ============================================================================

/**
 * Match an article topic to the best monetization category
 * @param {string} topic - Article topic/title
 * @param {string} degreeLevel - Degree level (optional)
 * @returns {Object} Best matching category and shortcode params
 */
export async function matchTopicToMonetization(topic, degreeLevel = null) {
  if (!topic) {
    return { matched: false, error: 'No topic provided' }
  }

  const topicLower = topic.toLowerCase()

  // Fetch all categories
  const { data: categories, error } = await supabase
    .from('monetization_categories')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return { matched: false, error: error.message }
  }

  // Score each category based on keyword matching
  const scoredCategories = categories.map(cat => {
    let score = 0
    const categoryLower = cat.category.toLowerCase()
    const concentrationLower = cat.concentration.toLowerCase()

    // Exact concentration match (highest priority)
    if (topicLower.includes(concentrationLower)) {
      score += 100
    }

    // Category match
    if (topicLower.includes(categoryLower)) {
      score += 50
    }

    // Word-level matching
    const categoryWords = categoryLower.split(/\s+/)
    const concentrationWords = concentrationLower.split(/\s+/)
    const topicWords = topicLower.split(/\s+/)

    for (const word of categoryWords) {
      if (word.length > 3 && topicWords.includes(word)) {
        score += 10
      }
    }

    for (const word of concentrationWords) {
      if (word.length > 3 && topicWords.includes(word)) {
        score += 20
      }
    }

    return { ...cat, score }
  })

  // Sort by score and get best match
  scoredCategories.sort((a, b) => b.score - a.score)
  const bestMatch = scoredCategories[0]

  if (!bestMatch || bestMatch.score === 0) {
    return { matched: false, error: 'No matching category found' }
  }

  // Get level code if degree level provided
  let levelCode = null
  let levelSlug = null
  if (degreeLevel) {
    const { data: level } = await supabase
      .from('monetization_levels')
      .select('level_code, level_name')
      .ilike('level_name', `%${degreeLevel}%`)
      .single()

    if (level) {
      levelCode = level.level_code
      levelSlug = level.level_name.toLowerCase().replace(/\s+/g, '-')
    }
  }

  // Build the CTA URL
  const categorySlug = bestMatch.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const concentrationSlug = bestMatch.concentration.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const ctaUrl = buildCtaUrl({
    levelSlug,
    categorySlug,
    concentrationSlug,
  })

  return {
    matched: true,
    category: bestMatch,
    categoryId: bestMatch.category_id,
    concentrationId: bestMatch.concentration_id,
    levelCode,
    ctaUrl,
    confidence: bestMatch.score > 50 ? 'high' : bestMatch.score > 20 ? 'medium' : 'low',
  }
}

// ============================================================================
// SHORTCODE INSERTION FUNCTIONS
// ============================================================================

/**
 * Insert a shortcode into content at specified position
 * @param {string} content - HTML content
 * @param {string} shortcode - Shortcode to insert
 * @param {string} position - Position: 'after_intro', 'mid_content', 'pre_conclusion'
 * @returns {string} Modified content
 */
export function insertShortcodeInContent(content, shortcode, position = 'after_intro') {
  if (!content || !shortcode) return content

  // Wrap shortcode in paragraph for proper display
  const wrappedShortcode = `\n<p class="monetization-block">${shortcode}</p>\n`

  switch (position) {
    case 'after_intro': {
      // Insert after first </p> or </h2>
      const firstParagraphEnd = content.indexOf('</p>')
      if (firstParagraphEnd !== -1) {
        return content.slice(0, firstParagraphEnd + 4) + wrappedShortcode + content.slice(firstParagraphEnd + 4)
      }
      // Fallback: insert at beginning
      return wrappedShortcode + content
    }

    case 'mid_content': {
      // Find middle H2 and insert after it
      const h2Matches = [...content.matchAll(/<h2[^>]*>.*?<\/h2>/gi)]
      if (h2Matches.length >= 2) {
        const midIndex = Math.floor(h2Matches.length / 2)
        const midH2 = h2Matches[midIndex]
        const insertPos = midH2.index + midH2[0].length
        return content.slice(0, insertPos) + wrappedShortcode + content.slice(insertPos)
      }
      // Fallback: insert in middle of content
      const midPoint = Math.floor(content.length / 2)
      const nextParagraph = content.indexOf('</p>', midPoint)
      if (nextParagraph !== -1) {
        return content.slice(0, nextParagraph + 4) + wrappedShortcode + content.slice(nextParagraph + 4)
      }
      return content + wrappedShortcode
    }

    case 'pre_conclusion': {
      // Insert before last H2 or before FAQ section
      const faqStart = content.indexOf('<h2')
      const lastH2Index = content.lastIndexOf('<h2')
      if (lastH2Index > 0 && lastH2Index !== faqStart) {
        return content.slice(0, lastH2Index) + wrappedShortcode + content.slice(lastH2Index)
      }
      // Fallback: insert near end
      const lastParagraph = content.lastIndexOf('</p>')
      if (lastParagraph !== -1) {
        return content.slice(0, lastParagraph + 4) + wrappedShortcode + content.slice(lastParagraph + 4)
      }
      return content + wrappedShortcode
    }

    default:
      return content + wrappedShortcode
  }
}

// ============================================================================
// LEGACY COMPATIBILITY - Deprecated functions
// These are kept for backward compatibility but should not be used
// ============================================================================

/**
 * @deprecated Use generateGePicksShortcode instead
 */
export function generateShortcode(params) {
  console.warn('generateShortcode is deprecated. Use generateGePicksShortcode for correct GetEducated format.')
  return generateGePicksShortcode({
    category: params.categoryId,
    concentration: params.concentrationId,
    level: params.levelCode,
  })
}

/**
 * @deprecated Use generateGePicksShortcode instead
 */
export function generateDegreeTableShortcode(params) {
  console.warn('generateDegreeTableShortcode is deprecated. Use generateGePicksShortcode for correct GetEducated format.')
  return generateGePicksShortcode({
    category: params.categoryId,
    concentration: params.concentrationId,
    level: params.levelCode,
  })
}

/**
 * @deprecated Use generateDegreeLinkShortcode instead
 */
export function generateDegreeOfferShortcode(params) {
  console.warn('generateDegreeOfferShortcode is deprecated. Use generateDegreeLinkShortcode for correct GetEducated format.')
  // This is a breaking change - we need school/degree WordPress IDs which we don't have
  throw new Error('generateDegreeOfferShortcode requires WordPress school/degree IDs. Use generateDegreeLinkShortcode with proper IDs.')
}

/**
 * @deprecated Use generateInternalLinkShortcode instead
 */
export function createInternalLinkShortcode(url, anchorText) {
  console.warn('createInternalLinkShortcode is deprecated. Use generateInternalLinkShortcode for correct GetEducated format.')
  return generateInternalLinkShortcode({ url, anchorText })
}

/**
 * @deprecated Use generateExternalLinkShortcode instead
 */
export function createExternalCitationShortcode(url, anchorText) {
  console.warn('createExternalCitationShortcode is deprecated. Use generateExternalLinkShortcode for correct GetEducated format.')
  return generateExternalLinkShortcode({ url, anchorText })
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  SHORTCODE_TYPES,
  ALLOWED_SHORTCODE_TAGS,
  LEGACY_SHORTCODE_TAGS,

  // Generation functions (NEW - correct format)
  generateGePicksShortcode,
  generateSchoolLinkShortcode,
  generateDegreeLinkShortcode,
  generateInternalLinkShortcode,
  generateExternalLinkShortcode,
  generateQuickDegreeFindShortcode,

  // Parsing functions
  parseShortcode,
  extractShortcodes,

  // Validation functions
  validateShortcodeParams,
  extractAllShortcodeLikeTokens,
  findUnknownShortcodes,
  findLegacyShortcodes,
  validateNoUnknownShortcodes,

  // Compliance functions
  checkMonetizationCompliance,

  // URL building functions
  buildCtaUrl,
  buildSchoolUrl,
  buildRankingReportUrl,

  // Topic matching
  matchTopicToMonetization,

  // Content manipulation
  insertShortcodeInContent,

  // Legacy (deprecated)
  generateShortcode,
  generateDegreeTableShortcode,
  generateDegreeOfferShortcode,
  createInternalLinkShortcode,
  createExternalCitationShortcode,
}
