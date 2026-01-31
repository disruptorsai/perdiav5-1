import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all revisions for an article
 */
export function useArticleRevisions(articleId) {
  return useQuery({
    queryKey: ['article-revisions', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_revisions')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!articleId,
  })
}

/**
 * Fetch all revisions (for review queue comment counts)
 */
export function useAllRevisions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['all-revisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_revisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Get comment count for an article
 */
export function useArticleCommentCount(articleId) {
  const { data: revisions = [] } = useArticleRevisions(articleId)
  return revisions.length
}

/**
 * Create a new revision/comment
 */
export function useCreateRevision() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (revisionData) => {
      // Get the next version number for this article
      const { data: existingRevisions } = await supabase
        .from('article_revisions')
        .select('version_number')
        .eq('article_id', revisionData.article_id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersion = existingRevisions?.[0]?.version_number
        ? existingRevisions[0].version_number + 1
        : 1

      const { data, error } = await supabase
        .from('article_revisions')
        .insert({
          article_id: revisionData.article_id,
          selected_text: revisionData.selected_text,
          comment: revisionData.comment,
          category: revisionData.category,
          severity: revisionData.severity,
          version_number: nextVersion,
          status: 'pending',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-revisions', data.article_id] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
    },
  })
}

/**
 * Update a revision/comment
 */
export function useUpdateRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('article_revisions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-revisions', data.article_id] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
    },
  })
}

/**
 * Mark a revision as addressed
 */
export function useMarkRevisionAddressed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('article_revisions')
        .update({ status: 'addressed' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-revisions', data.article_id] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
    },
  })
}

/**
 * Delete a revision/comment
 */
export function useDeleteRevision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, articleId }) => {
      const { error } = await supabase
        .from('article_revisions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { articleId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article-revisions', data.articleId] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
    },
  })
}

/**
 * Bulk mark all revisions for an article as addressed
 */
export function useBulkMarkAddressed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      const { data, error } = await supabase
        .from('article_revisions')
        .update({ status: 'addressed' })
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article-revisions', articleId] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
    },
  })
}
