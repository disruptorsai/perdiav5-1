/**
 * useArticleValidation Hook
 * Provides access to article validation data and review workflow
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch articles that require human review
 */
export function useArticlesNeedingReview(options = {}) {
  const { user } = useAuth()
  const {
    riskLevel = null, // Filter by specific risk level
    limit = 50,
    includeReviewed = false,
  } = options

  return useQuery({
    queryKey: ['articles-needing-review', { riskLevel, limit, includeReviewed }],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          status,
          validation_risk_level,
          requires_human_review,
          review_reasons,
          validation_flags,
          reviewed_at,
          reviewed_by,
          created_at,
          contributor_name,
          quality_score
        `)
        .eq('requires_human_review', true)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (!includeReviewed) {
        query = query.is('reviewed_at', null)
      }

      if (riskLevel) {
        query = query.eq('validation_risk_level', riskLevel)
      } else {
        // Order by risk level (CRITICAL first)
        query = query.order('validation_risk_level', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get validation statistics
 */
export function useValidationStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['validation-stats'],
    queryFn: async () => {
      // Count by risk level
      const { data: riskCounts, error: riskError } = await supabase
        .from('articles')
        .select('validation_risk_level')
        .eq('requires_human_review', true)
        .is('reviewed_at', null)

      if (riskError) throw riskError

      const stats = {
        total: riskCounts?.length || 0,
        byRiskLevel: {
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
        },
        byIssueType: {},
      }

      // Count by risk level
      for (const article of riskCounts || []) {
        const level = article.validation_risk_level || 'LOW'
        stats.byRiskLevel[level] = (stats.byRiskLevel[level] || 0) + 1
      }

      // Count by issue type
      const { data: articlesWithFlags, error: flagsError } = await supabase
        .from('articles')
        .select('review_reasons')
        .eq('requires_human_review', true)
        .is('reviewed_at', null)

      if (!flagsError && articlesWithFlags) {
        for (const article of articlesWithFlags) {
          const reasons = article.review_reasons || []
          for (const reason of reasons) {
            stats.byIssueType[reason] = (stats.byIssueType[reason] || 0) + 1
          }
        }
      }

      return stats
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Get validation details for a specific article
 */
export function useArticleValidation(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['article-validation', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          validation_flags,
          requires_human_review,
          review_reasons,
          validation_risk_level,
          reviewed_at,
          reviewed_by,
          review_notes,
          quality_score
        `)
        .eq('id', articleId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Mark an article as reviewed
 */
export function useMarkArticleReviewed() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ articleId, reviewNotes, approved = true }) => {
      const updates = {
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        review_notes: reviewNotes || null,
        requires_human_review: !approved, // Keep flagged if not approved
      }

      // If approved, clear the review requirements
      if (approved) {
        updates.validation_risk_level = 'LOW'
        updates.review_reasons = []
      }

      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['articles-needing-review'] })
      queryClient.invalidateQueries({ queryKey: ['article-validation', data.id] })
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}

/**
 * Dismiss specific validation warnings
 */
export function useDismissValidationWarning() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ articleId, warningType }) => {
      // First, get current article data
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('validation_flags, review_reasons')
        .eq('id', articleId)
        .single()

      if (fetchError) throw fetchError

      // Filter out the dismissed warning
      const updatedFlags = (article.validation_flags || []).filter(
        f => f.type !== warningType
      )
      const updatedReasons = (article.review_reasons || []).filter(
        r => r !== warningType
      )

      // Recalculate if review is still required
      const stillNeedsReview = updatedReasons.length > 0

      const { data, error } = await supabase
        .from('articles')
        .update({
          validation_flags: updatedFlags,
          review_reasons: updatedReasons,
          requires_human_review: stillNeedsReview,
          // Downgrade risk level if no more issues
          validation_risk_level: stillNeedsReview ? article.validation_risk_level : 'LOW',
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles-needing-review'] })
      queryClient.invalidateQueries({ queryKey: ['article-validation', data.id] })
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] })
    },
  })
}

/**
 * Re-run validation on an article
 */
export function useRevalidateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      // Import validator dynamically to avoid circular deps
      const { validateForPublish } = await import('../services/validation/contentValidator')

      // Get article content
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('content, faqs')
        .eq('id', articleId)
        .single()

      if (fetchError) throw fetchError

      // Run validation
      const validationResult = await validateForPublish(article.content, {
        faqs: article.faqs,
      })

      // Update article with new validation data
      const { data, error } = await supabase
        .from('articles')
        .update({
          validation_flags: validationResult.issues.map(i => ({
            type: i.type,
            severity: i.severity,
            message: i.message,
          })),
          requires_human_review: validationResult.requiresReview,
          review_reasons: validationResult.warnings.map(w => w.type),
          validation_risk_level: validationResult.riskLevel,
          // Clear previous review since content may have changed
          reviewed_at: null,
          reviewed_by: null,
          review_notes: null,
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return { article: data, validation: validationResult }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['articles-needing-review'] })
      queryClient.invalidateQueries({ queryKey: ['article-validation', result.article.id] })
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Get human-readable labels for validation issue types
 */
export const VALIDATION_ISSUE_LABELS = {
  truncation: 'Content Truncated',
  placeholder_content: 'Placeholder Content',
  unverified_statistics: 'Unverified Statistics',
  unverified_legislation: 'Unverified Legislation',
  unknown_schools: 'Unknown Schools',
  insufficient_internal_links: 'Missing Internal Links',
  invalid_internal_links: 'Invalid Internal Links',
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'major':
      return 'orange'
    case 'warning':
      return 'yellow'
    case 'minor':
      return 'blue'
    default:
      return 'gray'
  }
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(level) {
  switch (level) {
    case 'CRITICAL':
      return 'red'
    case 'HIGH':
      return 'orange'
    case 'MEDIUM':
      return 'yellow'
    case 'LOW':
      return 'green'
    default:
      return 'gray'
  }
}

export default {
  useArticlesNeedingReview,
  useValidationStats,
  useArticleValidation,
  useMarkArticleReviewed,
  useDismissValidationWarning,
  useRevalidateArticle,
  VALIDATION_ISSUE_LABELS,
  getSeverityColor,
  getRiskLevelColor,
}
