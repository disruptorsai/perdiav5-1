/**
 * Unified Quality Score Service
 *
 * CRITICAL: This is the SINGLE source of truth for quality score calculation.
 * Both generation pipeline and editor must use this service to ensure consistency.
 *
 * The score shown in lists MUST match the score shown in article editor.
 */

import { supabase } from './supabaseClient'

// Default thresholds (used when system_settings unavailable)
const DEFAULT_THRESHOLDS = {
  minWordCount: 800,
  maxWordCount: 2500,
  minInternalLinks: 3,
  minExternalLinks: 1,
  requireBLS: false,
  requireFAQ: false,
  requireHeadings: true,
  minHeadingCount: 3,
  minImages: 1,
  requireImageAlt: true,
  keywordDensityMin: 0.5,
  keywordDensityMax: 2.5,
  minReadability: 60,
  maxReadability: 80,
}

// Cache for system settings
let settingsCache = null
let settingsCacheTime = 0
const CACHE_TTL = 60000 // 1 minute

/**
 * Fetch quality thresholds from system_settings table
 * Uses caching to avoid excessive DB calls
 */
export async function getQualityThresholds() {
  const now = Date.now()

  // Return cached settings if still valid
  if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
    return settingsCache
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')

    if (error) {
      console.warn('Failed to fetch system_settings, using defaults:', error)
      return DEFAULT_THRESHOLDS
    }

    // Build settings object from DB
    const settingsMap = {}
    data?.forEach(row => {
      settingsMap[row.key] = row.value
    })

    const thresholds = {
      minWordCount: parseInt(settingsMap.min_word_count) || DEFAULT_THRESHOLDS.minWordCount,
      maxWordCount: parseInt(settingsMap.max_word_count) || DEFAULT_THRESHOLDS.maxWordCount,
      minInternalLinks: parseInt(settingsMap.min_internal_links) || DEFAULT_THRESHOLDS.minInternalLinks,
      minExternalLinks: parseInt(settingsMap.min_external_links) || DEFAULT_THRESHOLDS.minExternalLinks,
      requireBLS: settingsMap.require_bls_citation === 'true',
      requireFAQ: settingsMap.require_faq_schema === 'true',
      requireHeadings: settingsMap.require_headings !== 'false',
      minHeadingCount: parseInt(settingsMap.min_heading_count) || DEFAULT_THRESHOLDS.minHeadingCount,
      minImages: parseInt(settingsMap.min_images) || DEFAULT_THRESHOLDS.minImages,
      requireImageAlt: settingsMap.require_image_alt_text !== 'false',
      keywordDensityMin: parseFloat(settingsMap.keyword_density_min) || DEFAULT_THRESHOLDS.keywordDensityMin,
      keywordDensityMax: parseFloat(settingsMap.keyword_density_max) || DEFAULT_THRESHOLDS.keywordDensityMax,
      minReadability: parseInt(settingsMap.min_readability_score) || DEFAULT_THRESHOLDS.minReadability,
      maxReadability: parseInt(settingsMap.max_readability_score) || DEFAULT_THRESHOLDS.maxReadability,
    }

    // Update cache
    settingsCache = thresholds
    settingsCacheTime = now

    return thresholds
  } catch (e) {
    console.warn('Error fetching quality thresholds:', e)
    return DEFAULT_THRESHOLDS
  }
}

/**
 * Clear settings cache (call when settings are updated)
 */
export function clearQualitySettingsCache() {
  settingsCache = null
  settingsCacheTime = 0
}

/**
 * Calculate quality metrics for an article
 *
 * @param {string} content - HTML content of the article
 * @param {Object} article - Article object (for FAQs, keywords, etc.)
 * @param {Object} thresholds - Quality thresholds (optional, will fetch from DB if not provided)
 * @returns {Object} - { score, checks, issues, canPublish }
 */
export function calculateQualityScore(content, article = {}, thresholds = DEFAULT_THRESHOLDS) {
  if (!content) {
    return {
      score: 0,
      checks: {},
      issues: [],
      canPublish: false,
      word_count: 0,
    }
  }

  const t = thresholds

  // Calculate metrics
  const plainText = content.replace(/<[^>]*>/g, '')
  const wordCount = plainText.split(/\s+/).filter(w => w).length

  // Count links
  const allLinks = content.match(/<a\s+[^>]*href=["'][^"']+["'][^>]*>/gi) || []
  const internalLinks = allLinks.filter(link =>
    link.includes('geteducated.com') ||
    link.includes('localhost') ||
    link.match(/href=["']\/[^"']*["']/)
  ).length
  const externalLinks = allLinks.length - internalLinks

  // FAQ check
  const hasSchema = article?.faqs && article.faqs.length > 0
  const faqCount = article?.faqs?.length || 0

  // BLS citation
  const hasBLSCitation = content.toLowerCase().includes('bls.gov') ||
                         content.toLowerCase().includes('bureau of labor')

  // Headings
  const h2Count = (content.match(/<h2/gi) || []).length
  const h3Count = (content.match(/<h3/gi) || []).length
  const totalHeadings = h2Count + h3Count

  // Images
  const imageMatches = content.match(/<img[^>]*>/gi) || []
  const imageCount = imageMatches.length
  const imagesWithAlt = imageMatches.filter(img => /alt=["'][^"']+["']/i.test(img)).length

  // Keyword density
  let keywordDensity = 0
  const targetKeywords = article?.target_keywords || article?.focus_keyword
  if (targetKeywords && wordCount > 0) {
    const primaryKeyword = Array.isArray(targetKeywords)
      ? targetKeywords[0]?.toLowerCase()
      : targetKeywords.toLowerCase()
    if (primaryKeyword) {
      const keywordOccurrences = (plainText.toLowerCase().match(new RegExp(primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      keywordDensity = (keywordOccurrences / wordCount) * 100
    }
  }

  // Readability (Flesch Reading Ease)
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim()).length
  const syllables = plainText.split(/\s+/).reduce((count, word) => {
    return count + (word.replace(/[^aeiou]/gi, '').length || 1)
  }, 0)
  const readabilityScore = sentences > 0 && wordCount > 0
    ? Math.max(0, Math.min(100, 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)))
    : 50

  // Build checks object
  const checks = {
    wordCount: {
      passed: wordCount >= t.minWordCount && wordCount <= t.maxWordCount,
      critical: false,
      enabled: true,
      label: `${t.minWordCount}-${t.maxWordCount} words`,
      value: `${wordCount} words`,
      issue: wordCount < t.minWordCount
        ? `Add ${t.minWordCount - wordCount} more words`
        : wordCount > t.maxWordCount
          ? `Remove ${wordCount - t.maxWordCount} words`
          : null
    },
    internalLinks: {
      passed: internalLinks >= t.minInternalLinks,
      critical: true,
      enabled: true,
      label: `At least ${t.minInternalLinks} internal links`,
      value: `${internalLinks} link${internalLinks !== 1 ? 's' : ''}`,
      issue: internalLinks < t.minInternalLinks
        ? `Add ${t.minInternalLinks - internalLinks} more internal link(s)`
        : null
    },
    externalLinks: {
      passed: externalLinks >= t.minExternalLinks,
      critical: false,
      enabled: true,
      label: `At least ${t.minExternalLinks} external citation${t.minExternalLinks !== 1 ? 's' : ''}`,
      value: `${externalLinks} citation${externalLinks !== 1 ? 's' : ''}`,
      issue: externalLinks < t.minExternalLinks
        ? `Add ${t.minExternalLinks - externalLinks} more external citation(s)`
        : null
    },
    schema: {
      passed: !t.requireFAQ || hasSchema,
      critical: t.requireFAQ,
      enabled: t.requireFAQ,
      label: 'FAQ Schema markup',
      value: hasSchema ? `${faqCount} FAQs` : 'Missing',
      issue: !hasSchema && t.requireFAQ ? 'Add FAQ schema markup' : null
    },
    blsCitation: {
      passed: !t.requireBLS || hasBLSCitation,
      critical: t.requireBLS,
      enabled: t.requireBLS,
      label: 'BLS data citation',
      value: hasBLSCitation ? 'Present' : 'Missing',
      issue: !hasBLSCitation && t.requireBLS ? 'Add BLS citation' : null
    },
    headings: {
      passed: !t.requireHeadings || totalHeadings >= t.minHeadingCount,
      critical: false,
      enabled: t.requireHeadings,
      label: `At least ${t.minHeadingCount} headings (H2/H3)`,
      value: `${totalHeadings} heading${totalHeadings !== 1 ? 's' : ''}`,
      issue: totalHeadings < t.minHeadingCount && t.requireHeadings
        ? `Add ${t.minHeadingCount - totalHeadings} more heading(s)`
        : null
    },
    images: {
      passed: imageCount >= t.minImages,
      critical: false,
      enabled: t.minImages > 0,
      label: `At least ${t.minImages} image${t.minImages !== 1 ? 's' : ''}`,
      value: `${imageCount} image${imageCount !== 1 ? 's' : ''}`,
      issue: imageCount < t.minImages
        ? `Add ${t.minImages - imageCount} more image(s)`
        : null
    },
    imageAlt: {
      passed: !t.requireImageAlt || imageCount === 0 || imagesWithAlt === imageCount,
      critical: false,
      enabled: t.requireImageAlt && imageCount > 0,
      label: 'All images have alt text',
      value: imageCount > 0 ? `${imagesWithAlt}/${imageCount} with alt text` : 'No images',
      issue: imagesWithAlt < imageCount && t.requireImageAlt
        ? `Add alt text to ${imageCount - imagesWithAlt} image(s)`
        : null
    },
    keywordDensity: {
      passed: !targetKeywords || (keywordDensity >= t.keywordDensityMin && keywordDensity <= t.keywordDensityMax),
      critical: false,
      enabled: !!targetKeywords,
      label: `Keyword density ${t.keywordDensityMin}%-${t.keywordDensityMax}%`,
      value: `${keywordDensity.toFixed(2)}%`,
      issue: targetKeywords && (keywordDensity < t.keywordDensityMin || keywordDensity > t.keywordDensityMax)
        ? keywordDensity < t.keywordDensityMin
          ? 'Increase keyword usage'
          : 'Reduce keyword usage (potential stuffing)'
        : null
    },
    readability: {
      passed: readabilityScore >= t.minReadability && readabilityScore <= t.maxReadability,
      critical: false,
      enabled: true,
      label: `Readability ${t.minReadability}-${t.maxReadability}`,
      value: `${readabilityScore.toFixed(0)} (${
        readabilityScore >= 70 ? 'Easy' :
        readabilityScore >= 60 ? 'Standard' :
        readabilityScore >= 50 ? 'Difficult' : 'Very Difficult'
      })`,
      issue: readabilityScore < t.minReadability
        ? 'Simplify sentence structure'
        : readabilityScore > t.maxReadability
          ? 'Add more complexity for target audience'
          : null
    }
  }

  // Filter to enabled checks only
  const enabledChecks = Object.entries(checks).reduce((acc, [key, check]) => {
    if (check.enabled !== false) {
      acc[key] = check
    }
    return acc
  }, {})

  // Calculate score as percentage of passed checks
  const totalChecks = Object.keys(enabledChecks).length
  const passedChecks = Object.values(enabledChecks).filter(c => c.passed).length
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  // Check for critical failures
  const criticalFailed = Object.values(enabledChecks).some(c => c.critical && !c.passed)

  // Build issues array
  const issues = Object.values(enabledChecks)
    .filter(c => !c.passed && c.issue)
    .map(c => ({
      description: c.issue,
      critical: c.critical,
      severity: c.critical ? 'major' : 'minor'
    }))

  return {
    score,
    checks: enabledChecks,
    issues,
    canPublish: !criticalFailed,
    word_count: wordCount,
    thresholds_used: t,
  }
}

/**
 * Calculate quality score asynchronously (fetches thresholds from DB)
 * Use this when you don't have thresholds already loaded
 */
export async function calculateQualityScoreAsync(content, article = {}) {
  const thresholds = await getQualityThresholds()
  return calculateQualityScore(content, article, thresholds)
}

/**
 * Update article quality score in database
 * Call this after any content change to keep DB in sync
 */
export async function updateArticleQualityScore(articleId, content, article = {}) {
  const result = await calculateQualityScoreAsync(content, article)

  try {
    const { error } = await supabase
      .from('articles')
      .update({
        quality_score: result.score,
        quality_issues: result.issues,
      })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to update quality score:', error)
    }
  } catch (e) {
    console.error('Error updating quality score:', e)
  }

  return result
}

/**
 * Batch recalculate quality scores for all articles
 * Use this to sync all scores after updating the scoring algorithm
 * @param {Function} onProgress - Optional callback for progress updates (current, total)
 * @returns {Object} - { updated: number, errors: number, details: [] }
 */
export async function batchRecalculateQualityScores(onProgress = null) {
  const thresholds = await getQualityThresholds()
  const results = { updated: 0, errors: 0, details: [] }

  try {
    // Fetch all articles with content
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, content, faqs, target_keywords, focus_keyword, quality_score')
      .not('content', 'is', null)

    if (error) {
      console.error('Failed to fetch articles:', error)
      return { ...results, errors: 1, details: [{ error: error.message }] }
    }

    const total = articles?.length || 0
    console.log(`[QualityScore] Recalculating scores for ${total} articles...`)

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]

      try {
        const result = calculateQualityScore(article.content, article, thresholds)
        const oldScore = article.quality_score

        // Only update if score changed
        if (oldScore !== result.score) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              quality_score: result.score,
              quality_issues: result.issues,
            })
            .eq('id', article.id)

          if (updateError) {
            results.errors++
            results.details.push({ id: article.id, error: updateError.message })
          } else {
            results.updated++
            results.details.push({
              id: article.id,
              oldScore,
              newScore: result.score,
              change: result.score - (oldScore || 0)
            })
          }
        }

        // Report progress
        if (onProgress) {
          onProgress(i + 1, total)
        }
      } catch (e) {
        results.errors++
        results.details.push({ id: article.id, error: e.message })
      }
    }

    console.log(`[QualityScore] Recalculation complete: ${results.updated} updated, ${results.errors} errors`)
    return results
  } catch (e) {
    console.error('Batch recalculation failed:', e)
    return { ...results, errors: 1, details: [{ error: e.message }] }
  }
}

export default {
  calculateQualityScore,
  calculateQualityScoreAsync,
  getQualityThresholds,
  clearQualitySettingsCache,
  updateArticleQualityScore,
  batchRecalculateQualityScores,
  DEFAULT_THRESHOLDS,
}
