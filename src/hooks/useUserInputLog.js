/**
 * User Input Audit Log Hook
 * Provides access to the immutable audit log of all user-entered text
 * Purpose: Query, search, and manually log user input for backup/recovery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

// Input types matching the database enum
export const INPUT_TYPES = {
  ARTICLE_COMMENT: 'article_comment',
  REVISION_REQUEST: 'revision_request',
  REVISION_FEEDBACK: 'revision_feedback',
  IDEA_FEEDBACK: 'idea_feedback',
  SETTING_CHANGE: 'setting_change',
  QUALITY_NOTE: 'quality_note',
  PUBLISH_NOTE: 'publish_note',
  GENERAL_NOTE: 'general_note',
  VERSION_NOTE: 'version_note',
  CONTRIBUTOR_NOTE: 'contributor_note',
}

/**
 * Fetch user input logs with filtering
 */
export function useUserInputLog(filters = {}) {
  const { user } = useAuth()
  const {
    inputType,
    articleId,
    ideaId,
    searchTerm,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters

  return useQuery({
    queryKey: ['user-input-log', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_input_audit_log')
        .select(`
          *,
          articles(title),
          content_ideas(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (inputType) {
        query = query.eq('input_type', inputType)
      }

      if (articleId) {
        query = query.eq('article_id', articleId)
      }

      if (ideaId) {
        query = query.eq('idea_id', ideaId)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      if (searchTerm) {
        query = query.textSearch('search_vector', searchTerm)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Fetch logs for a specific article
 */
export function useArticleInputLog(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-input-log', 'article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_input_audit_log')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Fetch logs for a specific content idea
 */
export function useIdeaInputLog(ideaId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-input-log', 'idea', ideaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_input_audit_log')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user && !!ideaId,
  })
}

/**
 * Get summary statistics for user input logs
 */
export function useUserInputLogStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-input-log', 'stats'],
    queryFn: async () => {
      // Get counts by input type
      const { data: typeCounts, error: typeError } = await supabase
        .from('user_input_audit_log')
        .select('input_type')
        .eq('user_id', user.id)

      if (typeError) throw typeError

      // Count by type
      const countsByType = typeCounts.reduce((acc, row) => {
        acc[row.input_type] = (acc[row.input_type] || 0) + 1
        return acc
      }, {})

      // Get total count
      const { count, error: countError } = await supabase
        .from('user_input_audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) throw countError

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentCount, error: recentError } = await supabase
        .from('user_input_audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      if (recentError) throw recentError

      return {
        total: count,
        recentCount,
        byType: countsByType,
      }
    },
    enabled: !!user,
  })
}

/**
 * Manually log user input
 * Use this for cases not covered by database triggers
 */
export function useLogUserInput() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      inputType,
      inputText,
      inputContext = {},
      sourceTable = null,
      sourceRecordId = null,
      articleId = null,
      ideaId = null,
    }) => {
      if (!inputText || inputText.trim() === '') {
        throw new Error('Input text is required')
      }

      const { data, error } = await supabase
        .from('user_input_audit_log')
        .insert({
          input_type: inputType,
          input_text: inputText,
          input_context: inputContext,
          source_table: sourceTable,
          source_record_id: sourceRecordId,
          article_id: articleId,
          idea_id: ideaId,
          user_id: user.id,
          user_email: user.email,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-input-log'] })
      if (data.article_id) {
        queryClient.invalidateQueries({
          queryKey: ['user-input-log', 'article', data.article_id],
        })
      }
      if (data.idea_id) {
        queryClient.invalidateQueries({
          queryKey: ['user-input-log', 'idea', data.idea_id],
        })
      }
    },
  })
}

/**
 * Search user input logs by text
 */
export function useSearchUserInputLog(searchTerm, options = {}) {
  const { user } = useAuth()
  const { limit = 50 } = options

  return useQuery({
    queryKey: ['user-input-log', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        return []
      }

      const { data, error } = await supabase
        .from('user_input_audit_log')
        .select(`
          *,
          articles(title),
          content_ideas(title)
        `)
        .eq('user_id', user.id)
        .textSearch('search_vector', searchTerm)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    enabled: !!user && !!searchTerm && searchTerm.trim().length > 0,
  })
}

/**
 * Export user input logs (for backup)
 */
export function useExportUserInputLog() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ startDate, endDate, inputTypes } = {}) => {
      let query = supabase
        .from('user_input_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      if (inputTypes && inputTypes.length > 0) {
        query = query.in('input_type', inputTypes)
      }

      const { data, error } = await query

      if (error) throw error

      // Format as JSON for export
      return {
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
        logs: data,
      }
    },
  })
}

/**
 * Get the most recent user inputs
 */
export function useRecentUserInputs(limit = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-input-log', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_input_audit_log')
        .select(`
          *,
          articles(title),
          content_ideas(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

// Utility function to log user input (can be used outside of React components)
export async function logUserInput({
  inputType,
  inputText,
  inputContext = {},
  sourceTable = null,
  sourceRecordId = null,
  articleId = null,
  ideaId = null,
}) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('Cannot log user input: no authenticated user')
    return null
  }

  if (!inputText || inputText.trim() === '') {
    console.warn('Cannot log user input: empty text')
    return null
  }

  const { data, error } = await supabase
    .from('user_input_audit_log')
    .insert({
      input_type: inputType,
      input_text: inputText,
      input_context: inputContext,
      source_table: sourceTable,
      source_record_id: sourceRecordId,
      article_id: articleId,
      idea_id: ideaId,
      user_id: user.id,
      user_email: user.email,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to log user input:', error)
    return null
  }

  return data
}
