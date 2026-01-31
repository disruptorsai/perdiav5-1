/**
 * Publishing Hooks for GetEducated
 * React Query hooks for article publishing operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { publishArticle, bulkPublish, checkPublishEligibility, retryPublish } from '../services/publishService'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to publish a single article
 * @returns {Object} Mutation object with publishArticle function
 */
export function usePublishArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ article, options = {} }) => {
      return publishArticle(article, options)
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate article queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        queryClient.invalidateQueries({ queryKey: ['article', result.articleId] })
      }
    },
  })
}

/**
 * Hook to bulk publish multiple articles
 * @returns {Object} Mutation object with bulkPublish function
 */
export function useBulkPublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articles, options = {} }) => {
      return bulkPublish(articles, options)
    },
    onSuccess: () => {
      // Invalidate all article queries
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Hook to retry a failed publish
 * @returns {Object} Mutation object with retryPublish function
 */
export function useRetryPublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, options = {} }) => {
      return retryPublish(articleId, options)
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        queryClient.invalidateQueries({ queryKey: ['article', result.articleId] })
      }
    },
  })
}

/**
 * Hook to check publish eligibility (non-mutating)
 * @param {Object} article - Article to check
 * @returns {Object} Eligibility result
 */
export function usePublishEligibility(article) {
  if (!article) {
    return {
      eligible: false,
      riskLevel: 'UNKNOWN',
      qualityScore: 0,
      blockingIssues: [],
      warnings: [],
      checks: {},
    }
  }

  return checkPublishEligibility(article)
}

/**
 * Hook that combines eligibility check with publish action
 * @returns {Object} Combined eligibility and publish functionality
 */
export function usePublishWithValidation() {
  const publishMutation = usePublishArticle()

  const publishWithCheck = async (article, options = {}) => {
    // Check eligibility first
    const eligibility = checkPublishEligibility(article)

    if (!eligibility.eligible) {
      return {
        success: false,
        error: 'Article is not eligible for publishing',
        eligibility,
      }
    }

    // Proceed with publish
    return publishMutation.mutateAsync({ article, options })
  }

  return {
    publish: publishWithCheck,
    isPublishing: publishMutation.isPending,
    error: publishMutation.error,
    reset: publishMutation.reset,
  }
}

/**
 * Hook to get articles approved and ready for publishing
 * @returns {Object} Query result with approved articles
 */
export function useApprovedForPublishing() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['articles', 'approved-for-publishing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .eq('status', 'ready_to_publish')
        .eq('human_reviewed', true)
        .not('approved_by_initials', 'is', null)
        .order('reviewed_at', { ascending: true }) // Oldest approved first

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to get count of articles in publishing queue
 * @returns {Object} Query result with queue count
 */
export function usePublishQueueCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['articles', 'publish-queue-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready_to_publish')
        .eq('human_reviewed', true)
        .not('approved_by_initials', 'is', null)

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  })
}

export default {
  usePublishArticle,
  useBulkPublish,
  useRetryPublish,
  usePublishEligibility,
  usePublishWithValidation,
  useApprovedForPublishing,
  usePublishQueueCount,
}
