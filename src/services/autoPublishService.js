/**
 * Auto-Publish Service for GetEducated
 * Handles automatic publishing of articles after review deadline
 *
 * Logic:
 * 1. Query articles with status = 'ready_to_publish' AND autopublish_deadline <= NOW()
 * 2. Check risk level is 'LOW'
 * 3. Run pre-publish validation
 * 4. POST to webhook (or WordPress API in future)
 * 5. Update article status to 'published'
 */

import { supabase } from './supabaseClient'
import { publishArticle } from './publishService'
import { validateForPublish } from './validation/prePublishValidation'
import { assessRisk } from './validation/riskAssessment'

// Default auto-publish settings
const DEFAULT_SETTINGS = {
  enabled: false,
  daysUntilAutoPublish: 5,
  maxRiskLevel: 'LOW', // Only auto-publish LOW risk articles
  minQualityScore: 80,
  maxArticlesPerRun: 10,
}

/**
 * Get auto-publish settings from database
 * @returns {Object} Auto-publish settings
 */
export async function getAutoPublishSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .in('key', [
      'enable_auto_publish',
      'auto_publish_days',
      'block_high_risk_publish',
      'quality_threshold_publish',
    ])

  if (error) {
    console.error('Failed to fetch auto-publish settings:', error)
    return DEFAULT_SETTINGS
  }

  const settings = { ...DEFAULT_SETTINGS }

  for (const setting of data || []) {
    switch (setting.key) {
      case 'enable_auto_publish':
        settings.enabled = setting.value === 'true' || setting.value === true
        break
      case 'auto_publish_days':
        settings.daysUntilAutoPublish = parseInt(setting.value, 10) || 5
        break
      case 'block_high_risk_publish':
        settings.maxRiskLevel = (setting.value === 'true' || setting.value === true)
          ? 'LOW'
          : 'MEDIUM'
        break
      case 'quality_threshold_publish':
        settings.minQualityScore = parseInt(setting.value, 10) || 80
        break
    }
  }

  return settings
}

/**
 * Get articles eligible for auto-publishing
 * @returns {Array} Articles ready for auto-publish
 */
export async function getEligibleArticles() {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('articles')
    .select('*, article_contributors(*)')
    .eq('status', 'ready_to_publish')
    .lte('autopublish_deadline', now)
    .is('human_reviewed', false) // Only auto-publish if not manually reviewed
    .order('autopublish_deadline', { ascending: true })

  if (error) {
    console.error('Failed to fetch eligible articles:', error)
    return []
  }

  return data || []
}

/**
 * Check if an article can be auto-published
 * @param {Object} article - Article to check
 * @param {Object} settings - Auto-publish settings
 * @returns {Object} Eligibility result
 */
export function checkAutoPublishEligibility(article, settings) {
  const result = {
    eligible: true,
    reasons: [],
  }

  // Check risk level
  const riskAssessment = assessRisk(article)
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const articleRiskIndex = riskLevels.indexOf(riskAssessment.riskLevel)
  const maxRiskIndex = riskLevels.indexOf(settings.maxRiskLevel)

  if (articleRiskIndex > maxRiskIndex) {
    result.eligible = false
    result.reasons.push(`Risk level ${riskAssessment.riskLevel} exceeds maximum ${settings.maxRiskLevel}`)
  }

  // Check quality score
  if (article.quality_score < settings.minQualityScore) {
    result.eligible = false
    result.reasons.push(`Quality score ${article.quality_score} below minimum ${settings.minQualityScore}`)
  }

  // Run full validation
  const validation = validateForPublish(article)
  if (!validation.canPublish) {
    result.eligible = false
    result.reasons.push(...validation.blockingIssues.map(i => i.message))
  }

  return result
}

/**
 * Run auto-publish cycle
 * Finds eligible articles and publishes them
 * @returns {Object} Results of the auto-publish run
 */
export async function runAutoPublishCycle() {
  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    articlesChecked: 0,
    articlesPublished: 0,
    articlesFailed: 0,
    articlesSkipped: 0,
    details: [],
    duration: 0,
  }

  // Get settings
  const settings = await getAutoPublishSettings()

  if (!settings.enabled) {
    results.details.push({ type: 'info', message: 'Auto-publish is disabled' })
    return results
  }

  // Get eligible articles
  const articles = await getEligibleArticles()
  results.articlesChecked = articles.length

  if (articles.length === 0) {
    results.details.push({ type: 'info', message: 'No articles eligible for auto-publish' })
    return results
  }

  // Process each article (up to max per run)
  const toProcess = articles.slice(0, settings.maxArticlesPerRun)

  for (const article of toProcess) {
    const eligibility = checkAutoPublishEligibility(article, settings)

    if (!eligibility.eligible) {
      results.articlesSkipped++
      results.details.push({
        type: 'skipped',
        articleId: article.id,
        title: article.title,
        reasons: eligibility.reasons,
      })
      continue
    }

    // Attempt to publish
    try {
      const publishResult = await publishArticle(article, {
        status: 'publish',
        validateFirst: false, // Already validated above
        updateDatabase: true,
      })

      if (publishResult.success) {
        results.articlesPublished++
        results.details.push({
          type: 'published',
          articleId: article.id,
          title: article.title,
          webhookResponse: publishResult.webhookResponse,
        })

        // Log the auto-publish event
        await logAutoPublishEvent(article.id, 'success', publishResult)
      } else {
        results.articlesFailed++
        results.details.push({
          type: 'failed',
          articleId: article.id,
          title: article.title,
          error: publishResult.error,
        })

        await logAutoPublishEvent(article.id, 'failed', publishResult)
      }
    } catch (error) {
      results.articlesFailed++
      results.details.push({
        type: 'error',
        articleId: article.id,
        title: article.title,
        error: error.message,
      })

      await logAutoPublishEvent(article.id, 'error', { error: error.message })
    }
  }

  results.duration = Date.now() - startTime

  return results
}

/**
 * Log auto-publish event for audit trail
 * @param {string} articleId - Article ID
 * @param {string} status - 'success', 'failed', 'error'
 * @param {Object} details - Event details
 */
async function logAutoPublishEvent(articleId, status, details) {
  try {
    // Update article with auto-publish attempt info
    await supabase
      .from('articles')
      .update({
        updated_at: new Date().toISOString(),
        // Could add a dedicated auto_publish_log JSONB column in future
      })
      .eq('id', articleId)

    // Log to console for now (could be sent to logging service)
    console.log(`[Auto-Publish] Article ${articleId}: ${status}`, details)
  } catch (error) {
    console.error('Failed to log auto-publish event:', error)
  }
}

/**
 * Set auto-publish deadline for an article
 * @param {string} articleId - Article ID
 * @param {number} daysFromNow - Days until auto-publish (null to disable)
 */
export async function setAutoPublishDeadline(articleId, daysFromNow = 5) {
  const deadline = daysFromNow
    ? new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('articles')
    .update({ autopublish_deadline: deadline })
    .eq('id', articleId)

  if (error) {
    throw new Error(`Failed to set auto-publish deadline: ${error.message}`)
  }

  return { articleId, deadline }
}

/**
 * Cancel auto-publish for an article
 * @param {string} articleId - Article ID
 */
export async function cancelAutoPublish(articleId) {
  return setAutoPublishDeadline(articleId, null)
}

/**
 * Mark article as human-reviewed (prevents auto-publish)
 * @param {string} articleId - Article ID
 * @param {string} reviewerId - User ID of reviewer
 */
export async function markAsReviewed(articleId, reviewerId) {
  const { error } = await supabase
    .from('articles')
    .update({
      human_reviewed: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', articleId)

  if (error) {
    throw new Error(`Failed to mark as reviewed: ${error.message}`)
  }

  return { articleId, reviewedAt: new Date().toISOString() }
}

/**
 * Get auto-publish status for an article
 * @param {string} articleId - Article ID
 * @returns {Object} Auto-publish status
 */
export async function getAutoPublishStatus(articleId) {
  const { data: article, error } = await supabase
    .from('articles')
    .select('status, autopublish_deadline, human_reviewed, reviewed_at, risk_level, quality_score')
    .eq('id', articleId)
    .single()

  if (error) {
    throw new Error(`Failed to get article: ${error.message}`)
  }

  const now = new Date()
  const deadline = article.autopublish_deadline ? new Date(article.autopublish_deadline) : null

  return {
    articleId,
    status: article.status,
    hasDeadline: !!deadline,
    deadline: article.autopublish_deadline,
    isOverdue: deadline && deadline < now,
    timeRemaining: deadline ? deadline - now : null,
    humanReviewed: article.human_reviewed,
    reviewedAt: article.reviewed_at,
    riskLevel: article.risk_level,
    qualityScore: article.quality_score,
    willAutoPublish: !article.human_reviewed && deadline && deadline <= now && article.status === 'ready_to_publish',
  }
}

export default {
  getAutoPublishSettings,
  getEligibleArticles,
  checkAutoPublishEligibility,
  runAutoPublishCycle,
  setAutoPublishDeadline,
  cancelAutoPublish,
  markAsReviewed,
  getAutoPublishStatus,
}
