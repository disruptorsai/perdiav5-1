import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSettingsMap } from './useSystemSettings'
import { assessRisk, checkAutoPublishEligibility } from '../services/validation/riskAssessment'

/**
 * Hook for managing auto-publish functionality
 * Implements the 5-day auto-publish rule with risk-based blocking
 */
export function useAutoPublish() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { getBoolValue, getIntValue } = useSettingsMap()

  // Get auto-publish settings
  const autoPublishEnabled = getBoolValue('auto_publish_enabled', false)
  const autoPublishDays = getIntValue('auto_publish_days', 5)
  const blockHighRisk = getBoolValue('block_high_risk_publish', true)

  return {
    autoPublishEnabled,
    autoPublishDays,
    blockHighRisk,
  }
}

/**
 * Get articles that are due for auto-publish (shared workspace)
 */
export function useArticlesDueForAutoPublish() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['articles', 'auto-publish-due'],
    queryFn: async () => {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .eq('status', 'ready_to_publish')
        .lte('autopublish_deadline', now)
        .in('risk_level', ['LOW', 'MEDIUM']) // Only auto-publish LOW/MEDIUM risk
        .order('autopublish_deadline', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  })
}

/**
 * Set the auto-publish deadline for an article
 */
export function useSetAutoPublishDeadline() {
  const queryClient = useQueryClient()
  const { getIntValue } = useSettingsMap()
  const autoPublishDays = getIntValue('auto_publish_days', 5)

  return useMutation({
    mutationFn: async ({ articleId, daysFromNow = null }) => {
      const days = daysFromNow ?? autoPublishDays
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + days)

      const { data, error } = await supabase
        .from('articles')
        .update({
          autopublish_deadline: deadline.toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Clear the auto-publish deadline (mark as reviewed)
 */
export function useClearAutoPublishDeadline() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (articleId) => {
      const { data, error } = await supabase
        .from('articles')
        .update({
          autopublish_deadline: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Update the risk level for an article
 */
export function useUpdateRiskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, riskLevel }) => {
      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)) {
        throw new Error('Invalid risk level')
      }

      const { data, error } = await supabase
        .from('articles')
        .update({ risk_level: riskLevel })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Calculate and update risk level for an article
 */
export function useCalculateRiskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (article) => {
      // Assess risk using the risk assessment service
      const assessment = assessRisk(article)

      const { data, error } = await supabase
        .from('articles')
        .update({
          risk_level: assessment.riskLevel,
          link_compliance_issues: {
            blockingIssues: assessment.blockingIssues,
            warnings: assessment.warnings,
            issues: assessment.issues,
          },
        })
        .eq('id', article.id)
        .select()
        .single()

      if (error) throw error
      return { article: data, assessment }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Get the countdown time until auto-publish
 * @param {string} deadline - ISO date string of the deadline
 * @returns {Object} Countdown information
 */
export function getAutoPublishCountdown(deadline) {
  if (!deadline) {
    return {
      isSet: false,
      isPast: false,
      daysRemaining: null,
      hoursRemaining: null,
      displayText: 'No deadline set',
    }
  }

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffMs <= 0) {
    return {
      isSet: true,
      isPast: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      displayText: 'Auto-publish pending',
    }
  }

  let displayText = ''
  if (diffDays > 0) {
    displayText = `${diffDays} day${diffDays !== 1 ? 's' : ''}`
    if (diffHours > 0) {
      displayText += `, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    }
  } else if (diffHours > 0) {
    displayText = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    displayText = `${diffMins} minute${diffMins !== 1 ? 's' : ''}`
  }

  return {
    isSet: true,
    isPast: false,
    daysRemaining: diffDays,
    hoursRemaining: diffHours,
    displayText: `Auto-publish in ${displayText}`,
  }
}

/**
 * Check if an article can be auto-published based on risk and settings
 * @param {Object} article - The article to check
 * @param {Object} settings - System settings
 * @returns {Object} Eligibility result
 */
export function canAutoPublish(article, settings = {}) {
  const {
    blockHighRiskPublish = true,
    requireMinQualityScore = 80,
  } = settings

  // Check if auto-publish is blocked for this risk level
  if (blockHighRiskPublish) {
    if (article.risk_level === 'HIGH' || article.risk_level === 'CRITICAL') {
      return {
        eligible: false,
        reason: `${article.risk_level} risk articles require manual review`,
      }
    }
  }

  // Check quality score
  if (article.quality_score < requireMinQualityScore) {
    return {
      eligible: false,
      reason: `Quality score (${article.quality_score}) below minimum (${requireMinQualityScore})`,
    }
  }

  // Check if article has blocking issues
  const linkIssues = article.link_compliance_issues || {}
  if (linkIssues.blockingIssues && linkIssues.blockingIssues.length > 0) {
    return {
      eligible: false,
      reason: 'Article has blocking compliance issues',
    }
  }

  return {
    eligible: true,
    reason: null,
  }
}

export default {
  useAutoPublish,
  useArticlesDueForAutoPublish,
  useSetAutoPublishDeadline,
  useClearAutoPublishDeadline,
  useUpdateRiskLevel,
  useCalculateRiskLevel,
  getAutoPublishCountdown,
  canAutoPublish,
}
