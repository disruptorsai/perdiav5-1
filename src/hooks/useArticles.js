import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all articles (shared workspace - all users see all articles)
 */
export function useArticles(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.contributor_id) {
        query = query.eq('contributor_id', filters.contributor_id)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user,
    refetchOnMount: 'always', // Always refetch when navigating back to ensure fresh data
    staleTime: 0, // Consider data immediately stale for navigation
  })
}

/**
 * Fetch a single article by ID
 */
export function useArticle(articleId) {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .eq('id', articleId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!articleId,
  })
}

/**
 * Create a new article
 * Note: In development mode (no auth), user_id is omitted to avoid foreign key errors
 */
export function useCreateArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleData) => {
      // Check if we're using the mock/anonymous user (no real auth)
      const isAnonymousUser = user?.id === '00000000-0000-0000-0000-000000000000'

      const insertData = {
        ...articleData,
        // Only include user_id if it's a real authenticated user
        ...(isAnonymousUser ? {} : { user_id: user.id }),
      }

      const { data, error } = await supabase
        .from('articles')
        .insert(insertData)
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
 * Update an existing article
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, updates }) => {
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
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}

/**
 * Delete an article
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Update article status (for Kanban drag-and-drop)
 */
export function useUpdateArticleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, status }) => {
      const { data, error } = await supabase
        .from('articles')
        .update({ status })
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
 * Approve article for publishing (marks as human reviewed with initials)
 */
export function useApproveArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, initials }) => {
      const { data, error } = await supabase
        .from('articles')
        .update({
          human_reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          approved_by_initials: initials,
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
 * Publish article to WordPress
 */
export function usePublishArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, connectionId }) => {
      // Call Supabase Edge Function for WordPress publishing
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
        body: { articleId, connectionId }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', variables.articleId] })
    },
  })
}
