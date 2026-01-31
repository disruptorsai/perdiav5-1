/**
 * AI Revisions Hook
 * Manages AI revision history and training data for the GetEducated workflow
 * Per spec section 8.4: AI Training & Revision Log
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Fetch AI revisions for a specific article
 */
export function useArticleRevisions(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ai-revisions', 'article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_revisions')
        .select(`
          *,
          articles(title, status)
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Fetch all AI revisions with filtering
 */
export function useAIRevisions(filters = {}) {
  const { user } = useAuth()
  const { includeInTraining, revisionType, limit = 50 } = filters

  return useQuery({
    queryKey: ['ai-revisions', 'all', filters],
    queryFn: async () => {
      let query = supabase
        .from('ai_revisions')
        .select(`
          *,
          articles(title, status, contributor_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (includeInTraining !== undefined) {
        query = query.eq('include_in_training', includeInTraining)
      }

      if (revisionType) {
        query = query.eq('revision_type', revisionType)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get statistics about AI revisions
 */
export function useAIRevisionStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ai-revisions', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_revisions')
        .select('id, include_in_training, revision_type, created_at')

      if (error) throw error

      const stats = {
        total: data.length,
        includedInTraining: data.filter(r => r.include_in_training).length,
        excludedFromTraining: data.filter(r => !r.include_in_training).length,
        byType: {},
        last7Days: 0,
        last30Days: 0,
      }

      const now = new Date()
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      for (const revision of data) {
        // Count by type
        const type = revision.revision_type || 'unknown'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by date
        const createdAt = new Date(revision.created_at)
        if (createdAt >= sevenDaysAgo) stats.last7Days++
        if (createdAt >= thirtyDaysAgo) stats.last30Days++
      }

      return stats
    },
    enabled: !!user,
  })
}

/**
 * Create a new AI revision record with full context for RLHF training
 */
export function useCreateAIRevision() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      articleId,
      previousVersion,
      revisedVersion,
      commentsSnapshot = [],
      revisionType = 'feedback',
      modelUsed = 'claude-sonnet-4',
      // Enhanced context for RLHF
      articleContext = {},  // { title, focus_keyword, content_type, contributor_name, contributor_style }
      promptUsed = null,    // The actual prompt sent to AI
      qualityDelta = null,  // { before, after, improvement }
    }) => {
      // Calculate word counts for context
      const wordCountBefore = previousVersion ? previousVersion.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0
      const wordCountAfter = revisedVersion ? revisedVersion.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0

      const fullContext = {
        ...articleContext,
        word_count_before: wordCountBefore,
        word_count_after: wordCountAfter,
        word_count_delta: wordCountAfter - wordCountBefore,
      }

      const { data, error } = await supabase
        .from('ai_revisions')
        .insert({
          article_id: articleId,
          previous_version: previousVersion,
          revised_version: revisedVersion,
          comments_snapshot: commentsSnapshot,
          triggered_by_user: user?.id,
          revision_type: revisionType,
          model_used: modelUsed,
          include_in_training: true, // Default to include per Kayleigh's requirements
          // New enhanced fields
          article_context: fullContext,
          prompt_used: promptUsed,
          quality_delta: qualityDelta,
          applied: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['ai-revisions', 'article', data.article_id] })
    },
  })
}

/**
 * Update an AI revision (primarily for toggling include_in_training)
 */
export function useUpdateAIRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ revisionId, updates }) => {
      const { data, error } = await supabase
        .from('ai_revisions')
        .update(updates)
        .eq('id', revisionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['ai-revisions', 'article', data.article_id] })
    },
  })
}

/**
 * Toggle include_in_training flag for a revision
 */
export function useToggleTrainingInclusion() {
  const updateRevision = useUpdateAIRevision()

  return useMutation({
    mutationFn: async ({ revisionId, currentValue }) => {
      return updateRevision.mutateAsync({
        revisionId,
        updates: { include_in_training: !currentValue },
      })
    },
  })
}

/**
 * Delete an AI revision
 */
export function useDeleteAIRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (revisionId) => {
      const { error } = await supabase
        .from('ai_revisions')
        .delete()
        .eq('id', revisionId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
    },
  })
}

/**
 * Rollback an AI revision - marks it as rolled back and returns previous content
 * This preserves the revision record for training data audit
 */
export function useRollbackAIRevision() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ revisionId, articleId }) => {
      // First get the revision to get the previous version
      const { data: revision, error: fetchError } = await supabase
        .from('ai_revisions')
        .select('previous_version, article_id')
        .eq('id', revisionId)
        .single()

      if (fetchError) throw fetchError

      // Mark the revision as rolled back
      const { data, error } = await supabase
        .from('ai_revisions')
        .update({
          applied: false,
          rolled_back_at: new Date().toISOString(),
          rolled_back_by: user?.id,
          include_in_training: false, // Don't include rolled back revisions in training
        })
        .eq('id', revisionId)
        .select()
        .single()

      if (error) throw error

      return {
        revision: data,
        previousContent: revision.previous_version,
        articleId: revision.article_id,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['ai-revisions', 'article', data.articleId] })
    },
  })
}

/**
 * Re-apply a rolled back revision
 */
export function useReapplyAIRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ revisionId }) => {
      // Get the revision to return the revised version
      const { data: revision, error: fetchError } = await supabase
        .from('ai_revisions')
        .select('revised_version, article_id')
        .eq('id', revisionId)
        .single()

      if (fetchError) throw fetchError

      // Mark it as applied again
      const { data, error } = await supabase
        .from('ai_revisions')
        .update({
          applied: true,
          rolled_back_at: null,
          rolled_back_by: null,
          include_in_training: true, // Re-include in training
        })
        .eq('id', revisionId)
        .select()
        .single()

      if (error) throw error

      return {
        revision: data,
        revisedContent: revision.revised_version,
        articleId: revision.article_id,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['ai-revisions', 'article', data.articleId] })
    },
  })
}

/**
 * Bulk update training inclusion for multiple revisions
 */
export function useBulkUpdateTrainingInclusion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ revisionIds, includeInTraining }) => {
      const { data, error } = await supabase
        .from('ai_revisions')
        .update({ include_in_training: includeInTraining })
        .in('id', revisionIds)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-revisions'] })
    },
  })
}

/**
 * Export AI revisions for training (get all included revisions)
 */
export function useExportTrainingData() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ai-revisions', 'export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_revisions')
        .select(`
          id,
          article_id,
          previous_version,
          revised_version,
          comments_snapshot,
          revision_type,
          model_used,
          created_at,
          articles(title, focus_keyword, content_type)
        `)
        .eq('include_in_training', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Format for training export
      return data.map(revision => ({
        id: revision.id,
        articleId: revision.article_id,
        articleTitle: revision.articles?.title,
        focusKeyword: revision.articles?.focus_keyword,
        contentType: revision.articles?.content_type,
        beforeContent: revision.previous_version,
        afterContent: revision.revised_version,
        feedback: revision.comments_snapshot,
        revisionType: revision.revision_type,
        model: revision.model_used,
        timestamp: revision.created_at,
      }))
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export default {
  useArticleRevisions,
  useAIRevisions,
  useAIRevisionStats,
  useCreateAIRevision,
  useUpdateAIRevision,
  useToggleTrainingInclusion,
  useDeleteAIRevision,
  useRollbackAIRevision,
  useReapplyAIRevision,
  useBulkUpdateTrainingInclusion,
  useExportTrainingData,
}
