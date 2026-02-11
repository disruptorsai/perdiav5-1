/**
 * Article Comments Hook
 * Manages granular text selection feedback for the commenting workflow
 * Per spec: Editors highlight text -> add structured feedback -> AI revision processes all
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

// Comment categories with labels and descriptions
export const COMMENT_CATEGORIES = [
  { value: 'accuracy', label: 'Accuracy', description: 'Factual errors or outdated information' },
  { value: 'tone', label: 'Tone', description: 'Voice, style, or writing tone issues' },
  { value: 'seo', label: 'SEO', description: 'Keyword usage, meta content, optimization' },
  { value: 'structure', label: 'Structure', description: 'Organization, headings, flow' },
  { value: 'grammar', label: 'Grammar', description: 'Spelling, punctuation, syntax' },
  { value: 'general', label: 'General', description: 'Other feedback or suggestions' },
]

// Severity levels with colors for highlighting
export const COMMENT_SEVERITIES = [
  { value: 'minor', label: 'Minor', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.2)', description: 'Nice to fix' },
  { value: 'moderate', label: 'Moderate', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)', description: 'Should be fixed' },
  { value: 'major', label: 'Major', color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.2)', description: 'Important to fix' },
  { value: 'critical', label: 'Critical', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.2)', description: 'Must be fixed' },
]

/**
 * Get severity config by value
 */
export function getSeverityConfig(severity) {
  return COMMENT_SEVERITIES.find(s => s.value === severity) || COMMENT_SEVERITIES[0]
}

/**
 * Get category config by value
 */
export function getCategoryConfig(category) {
  return COMMENT_CATEGORIES.find(c => c.value === category) || COMMENT_CATEGORIES[5]
}

/**
 * Fetch all comments for a specific article
 */
export function useArticleComments(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['article-comments', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Fetch only pending comments for an article (for AI revision)
 */
export function usePendingComments(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['article-comments', articleId, 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      articleId,
      selectedText,
      category = 'general',
      severity = 'minor',
      feedback,
      selectionStart,
      selectionEnd,
    }) => {
      // Check if we're using the mock/anonymous user (no real auth)
      const isAnonymousUser = user?.id === '00000000-0000-0000-0000-000000000000'

      const insertData = {
        article_id: articleId,
        selected_text: selectedText,
        category,
        severity,
        feedback,
        selection_start: selectionStart,
        selection_end: selectionEnd,
        status: 'pending',
        // Only include created_by if it's a real authenticated user
        ...(isAnonymousUser ? {} : { created_by: user?.id }),
      }

      const { data, error } = await supabase
        .from('article_comments')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', data.article_id] })
    },
  })
}

/**
 * Update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, updates }) => {
      const { data, error } = await supabase
        .from('article_comments')
        .update(updates)
        .eq('id', commentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', data.article_id] })
    },
  })
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, articleId }) => {
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      return { articleId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', data.articleId] })
    },
  })
}

/**
 * Mark comments as addressed (after AI revision)
 */
export function useMarkCommentsAddressed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentIds, revisionId, articleId }) => {
      const { data, error } = await supabase
        .from('article_comments')
        .update({
          status: 'addressed',
          addressed_at: new Date().toISOString(),
          addressed_by_revision: revisionId,
        })
        .in('id', commentIds)
        .select()

      if (error) throw error
      return { data, articleId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', result.articleId] })
    },
  })
}

/**
 * Mark a comment as pending review (AI revision attempted but validation failed)
 */
export function useMarkCommentPendingReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, articleId, revisionId, validationDetails }) => {
      const { data, error } = await supabase
        .from('article_comments')
        .update({
          status: 'pending_review',
          addressed_by_revision: revisionId,
          ai_revision_failed: true,
          validation_details: validationDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select()
        .single()

      if (error) throw error
      return { data, articleId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', result.articleId] })
    },
  })
}

/**
 * Dismiss a comment without AI revision
 */
export function useDismissComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, articleId }) => {
      const { data, error } = await supabase
        .from('article_comments')
        .update({
          status: 'dismissed',
          addressed_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', data.article_id] })
    },
  })
}

/**
 * Fetch all pending comments across all articles (for Review Queue)
 * Returns comments grouped by article_id for efficient lookup
 */
export function useAllPendingComments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['all-pending-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_comments')
        .select('id, article_id, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds - refresh reasonably often for review queue
  })
}

export default {
  useArticleComments,
  usePendingComments,
  useAllPendingComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useMarkCommentsAddressed,
  useMarkCommentPendingReview,
  useDismissComment,
  COMMENT_CATEGORIES,
  COMMENT_SEVERITIES,
  getSeverityConfig,
  getCategoryConfig,
}
