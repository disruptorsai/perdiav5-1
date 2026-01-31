import { useState, useMemo, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSettingsMap } from './useSystemSettings'
import { validateForPublish, getValidationSummary, canAutoPublish } from '../services/validation/prePublishValidation'
import { supabase } from '../services/supabaseClient'

/**
 * Hook for pre-publish validation
 * Validates article before publishing and provides UI-friendly results
 */
export function usePrePublishValidation(article) {
  const { getBoolValue, getIntValue } = useSettingsMap()

  // Get settings
  const enforceApprovedAuthors = getBoolValue('approved_authors_only', true)
  const blockHighRisk = getBoolValue('block_high_risk_publish', true)
  const requireMinQualityScore = getIntValue('min_quality_score', 70)

  // Compute validation result
  const validation = useMemo(() => {
    if (!article) return null

    return validateForPublish(article, {
      enforceApprovedAuthors,
      blockHighRisk,
      requireMinQualityScore,
      checkLinks: true,
    })
  }, [article, enforceApprovedAuthors, blockHighRisk, requireMinQualityScore])

  // Compute summary
  const summary = useMemo(() => {
    if (!validation) return null
    return getValidationSummary(validation)
  }, [validation])

  return {
    validation,
    summary,
    canPublish: validation?.canPublish ?? false,
    riskLevel: validation?.riskLevel ?? 'UNKNOWN',
    blockingIssues: validation?.blockingIssues ?? [],
    warnings: validation?.warnings ?? [],
    checks: validation?.checks ?? {},
  }
}

/**
 * Hook for validating and then publishing an article
 */
export function useValidateAndPublish() {
  const [validationResult, setValidationResult] = useState(null)

  const validateMutation = useMutation({
    mutationFn: async (article) => {
      const result = validateForPublish(article, {
        enforceApprovedAuthors: true,
        blockHighRisk: true,
        requireMinQualityScore: 70,
        checkLinks: true,
      })
      setValidationResult(result)
      return result
    },
  })

  const publishMutation = useMutation({
    mutationFn: async ({ articleId, validation }) => {
      if (!validation.canPublish) {
        throw new Error('Article has blocking issues and cannot be published')
      }

      // Update article status to ready_to_publish
      const { data, error } = await supabase
        .from('articles')
        .update({
          status: 'ready_to_publish',
          risk_level: validation.riskLevel,
          link_compliance_issues: {
            blockingIssues: validation.blockingIssues,
            warnings: validation.warnings,
          },
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
  })

  const validateAndPublish = useCallback(async (article) => {
    // First validate
    const validation = await validateMutation.mutateAsync(article)

    if (!validation.canPublish) {
      return {
        success: false,
        validation,
        error: 'Article has blocking issues',
      }
    }

    // Then publish
    try {
      const publishedArticle = await publishMutation.mutateAsync({
        articleId: article.id,
        validation,
      })
      return {
        success: true,
        validation,
        article: publishedArticle,
      }
    } catch (error) {
      return {
        success: false,
        validation,
        error: error.message,
      }
    }
  }, [validateMutation, publishMutation])

  return {
    validateAndPublish,
    validationResult,
    isValidating: validateMutation.isPending,
    isPublishing: publishMutation.isPending,
    isLoading: validateMutation.isPending || publishMutation.isPending,
    error: validateMutation.error || publishMutation.error,
  }
}

/**
 * Hook for checking auto-publish eligibility
 */
export function useAutoPublishEligibility(article) {
  const { getBoolValue, getIntValue } = useSettingsMap()

  const autoPublishEnabled = getBoolValue('auto_publish_enabled', false)
  const blockHighRiskPublish = getBoolValue('block_high_risk_publish', true)
  const requireMinQualityScore = getIntValue('min_quality_score', 80)

  const eligibility = useMemo(() => {
    if (!article) return { eligible: false, reason: 'No article' }

    return canAutoPublish(article, {
      autoPublishEnabled,
      blockHighRiskPublish,
      requireMinQualityScore,
    })
  }, [article, autoPublishEnabled, blockHighRiskPublish, requireMinQualityScore])

  return eligibility
}

export default {
  usePrePublishValidation,
  useValidateAndPublish,
  useAutoPublishEligibility,
}
