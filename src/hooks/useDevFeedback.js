import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hooks for managing developer feedback (bugs, questions, suggestions)
 * This is feedback TO the developer about the app, not article content feedback
 */

// Category configuration with colors and icons
export const FEEDBACK_CATEGORIES = {
  bug: { label: 'Bug', color: 'red', description: 'Something is broken' },
  question: { label: 'Question', color: 'blue', description: 'How do I do X?' },
  suggestion: { label: 'Suggestion', color: 'purple', description: 'Feature request or improvement' },
  confusion: { label: 'Confusion', color: 'orange', description: 'UI/UX is unclear' },
  other: { label: 'Other', color: 'gray', description: 'Miscellaneous feedback' },
}

// Status configuration
export const FEEDBACK_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  reviewed: { label: 'Reviewed', color: 'blue' },
  resolved: { label: 'Resolved', color: 'green' },
  wont_fix: { label: "Won't Fix", color: 'gray' },
}

/**
 * Fetch all dev feedback with optional filters
 */
export function useDevFeedback(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dev-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('dev_feedback')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`message.ilike.%${filters.search}%,page_path.ilike.%${filters.search}%`)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        // Table might not exist yet - return empty array
        if (error.code === '42P01') {
          console.warn('[DevFeedback] dev_feedback table does not exist yet. Run migration first.')
          return []
        }
        throw error
      }
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Submit new feedback
 */
export function useSubmitDevFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ category, message, pagePath, pageTitle }) => {
      const { data, error } = await supabase
        .from('dev_feedback')
        .insert({
          user_id: user.id,
          category,
          message,
          page_path: pagePath,
          page_title: pageTitle || null,
          browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['dev-feedback-stats'] })
    },
  })
}

/**
 * Update feedback status and/or add developer notes
 */
export function useUpdateDevFeedbackStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ feedbackId, status, developerNotes }) => {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      }

      // Add developer notes if provided
      if (developerNotes !== undefined) {
        updates.developer_notes = developerNotes
      }

      // Set resolved fields if marking as resolved
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString()
        updates.resolved_by = user.id
      }

      const { data, error } = await supabase
        .from('dev_feedback')
        .update(updates)
        .eq('id', feedbackId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['dev-feedback-stats'] })
    },
  })
}

/**
 * Delete feedback item
 */
export function useDeleteDevFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (feedbackId) => {
      const { error } = await supabase
        .from('dev_feedback')
        .delete()
        .eq('id', feedbackId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['dev-feedback-stats'] })
    },
  })
}

/**
 * Get feedback statistics (counts by status and category)
 */
export function useDevFeedbackStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dev-feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_feedback')
        .select('status, category')

      if (error) {
        if (error.code === '42P01') {
          return { total: 0, byStatus: {}, byCategory: {} }
        }
        throw error
      }

      const byStatus = {}
      const byCategory = {}

      data?.forEach(item => {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1
        byCategory[item.category] = (byCategory[item.category] || 0) + 1
      })

      return {
        total: data?.length || 0,
        byStatus,
        byCategory,
      }
    },
    enabled: !!user,
  })
}

/**
 * Get a single feedback item by ID
 */
export function useDevFeedbackById(feedbackId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dev-feedback', 'single', feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_feedback')
        .select('*')
        .eq('id', feedbackId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }
      return data
    },
    enabled: !!user && !!feedbackId,
  })
}

/**
 * Get helper functions for category/status config
 */
export function getCategoryConfig(category) {
  return FEEDBACK_CATEGORIES[category] || FEEDBACK_CATEGORIES.other
}

export function getStatusConfig(status) {
  return FEEDBACK_STATUSES[status] || FEEDBACK_STATUSES.pending
}

export default {
  useDevFeedback,
  useSubmitDevFeedback,
  useUpdateDevFeedbackStatus,
  useDeleteDevFeedback,
  useDevFeedbackStats,
  useDevFeedbackById,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  getCategoryConfig,
  getStatusConfig,
}
