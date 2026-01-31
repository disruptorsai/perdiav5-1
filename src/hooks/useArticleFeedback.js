import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook for managing article feedback (thumbs up/down)
 * Per Dec 22, 2025 meeting - provides editor/reviewer feedback on articles
 */

/**
 * Fetch feedback for a specific article
 */
export function useArticleFeedback(articleId) {
  return useQuery({
    queryKey: ['article-feedback', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) {
        // Table might not exist yet - return empty array
        if (error.code === '42P01') {
          console.warn('[Feedback] article_feedback table does not exist yet')
          return []
        }
        throw error
      }
      return data || []
    },
    enabled: !!articleId,
  })
}

/**
 * Get feedback summary for an article (counts)
 */
export function useArticleFeedbackSummary(articleId) {
  return useQuery({
    queryKey: ['article-feedback-summary', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('feedback_type, comment')
        .eq('article_id', articleId)

      if (error) {
        if (error.code === '42P01') {
          return { positive: 0, negative: 0, total: 0 }
        }
        throw error
      }

      const positive = data?.filter(f => f.feedback_type === 'positive').length || 0
      const negative = data?.filter(f => f.feedback_type === 'negative').length || 0

      return {
        positive,
        negative,
        total: positive + negative,
        hasNegativeWithComments: data?.some(f => f.feedback_type === 'negative' && f.comment) || false,
      }
    },
    enabled: !!articleId,
  })
}

/**
 * Submit feedback for an article
 */
export function useSubmitArticleFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, feedbackType, comment = null }) => {
      // Check if user already gave feedback on this article
      const { data: existing } = await supabase
        .from('article_feedback')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing feedback
        const { data, error } = await supabase
          .from('article_feedback')
          .update({
            feedback_type: feedbackType,
            comment,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new feedback
        const { data, error } = await supabase
          .from('article_feedback')
          .insert({
            article_id: articleId,
            user_id: user.id,
            feedback_type: feedbackType,
            comment,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-feedback', variables.articleId] })
      queryClient.invalidateQueries({ queryKey: ['article-feedback-summary', variables.articleId] })
      queryClient.invalidateQueries({ queryKey: ['articles'] }) // Refresh list if needed
    },
  })
}

/**
 * Get user's feedback for an article
 */
export function useUserArticleFeedback(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-article-feedback', articleId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // No feedback found or table doesn't exist
          return null
        }
        throw error
      }
      return data
    },
    enabled: !!articleId && !!user,
  })
}

/**
 * Delete feedback
 */
export function useDeleteArticleFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ feedbackId, articleId }) => {
      const { error } = await supabase
        .from('article_feedback')
        .delete()
        .eq('id', feedbackId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-feedback', variables.articleId] })
      queryClient.invalidateQueries({ queryKey: ['article-feedback-summary', variables.articleId] })
    },
  })
}

export default {
  useArticleFeedback,
  useArticleFeedbackSummary,
  useSubmitArticleFeedback,
  useUserArticleFeedback,
  useDeleteArticleFeedback,
}
