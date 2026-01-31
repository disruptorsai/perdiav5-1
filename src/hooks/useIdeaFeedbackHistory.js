import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Idea Feedback History Hooks
 *
 * Track all approval/rejection decisions for AI learning
 */

// Rejection categories with descriptions
export const REJECTION_CATEGORIES = {
  off_topic: { label: 'Off Topic', description: 'Not relevant to GetEducated content areas', color: 'gray' },
  duplicate: { label: 'Duplicate', description: 'Similar idea or article already exists', color: 'yellow' },
  low_quality: { label: 'Low Quality', description: 'Poorly formed idea, unclear topic', color: 'red' },
  wrong_audience: { label: 'Wrong Audience', description: "Doesn't match target audience", color: 'orange' },
  not_actionable: { label: 'Not Actionable', description: "Can't be turned into useful content", color: 'purple' },
  competitive: { label: 'Competitive', description: 'Topic dominated by competitors', color: 'blue' },
  outdated: { label: 'Outdated', description: 'Topic no longer relevant', color: 'slate' },
  other: { label: 'Other', description: 'Custom reason', color: 'gray' },
}

// Decision types
export const DECISION_TYPES = {
  approved: { label: 'Approved', icon: 'CheckCircle', color: 'green' },
  rejected: { label: 'Rejected', icon: 'XCircle', color: 'red' },
  thumbs_up: { label: 'Thumbs Up', icon: 'ThumbsUp', color: 'green' },
  thumbs_down: { label: 'Thumbs Down', icon: 'ThumbsDown', color: 'red' },
}

/**
 * Fetch feedback history with filtering
 */
export function useFeedbackHistory(filters = {}) {
  const { user } = useAuth()
  const { decision, limit = 100, includeUsedForTraining = true } = filters

  return useQuery({
    queryKey: ['idea-feedback-history', filters],
    queryFn: async () => {
      let query = supabase
        .from('idea_feedback_history')
        .select('*')
        .order('decided_at', { ascending: false })
        .limit(limit)

      if (decision) {
        query = query.eq('decision', decision)
      }

      if (!includeUsedForTraining) {
        query = query.eq('used_for_training', false)
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
 * Get feedback ready for AI learning (not yet used for training)
 */
export function useUntrainedFeedback(limit = 100) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['untrained-feedback', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feedback_for_learning', {
        p_limit: limit,
      })

      if (error) {
        // Fallback to direct query if RPC not available
        const { data: fallback, error: fallbackError } = await supabase
          .from('idea_feedback_history')
          .select('*')
          .eq('used_for_training', false)
          .order('decided_at', { ascending: false })
          .limit(limit)

        if (fallbackError) throw fallbackError
        return fallback || []
      }

      return data || []
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Get feedback statistics
 */
export function useFeedbackStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['feedback-stats'],
    queryFn: async () => {
      // Get counts by decision type
      const { data: decisionCounts } = await supabase
        .from('idea_feedback_history')
        .select('decision')

      // Get counts by rejection category
      const { data: categoryCounts } = await supabase
        .from('idea_feedback_history')
        .select('rejection_category')
        .not('rejection_category', 'is', null)

      // Get counts by source
      const { data: sourceCounts } = await supabase
        .from('idea_feedback_history')
        .select('idea_source, decision')

      // Get untrained count
      const { count: untrainedCount } = await supabase
        .from('idea_feedback_history')
        .select('*', { count: 'exact', head: true })
        .eq('used_for_training', false)

      // Calculate statistics
      const byDecision = {}
      const byCategory = {}
      const bySource = {}

      ;(decisionCounts || []).forEach(row => {
        byDecision[row.decision] = (byDecision[row.decision] || 0) + 1
      })

      ;(categoryCounts || []).forEach(row => {
        if (row.rejection_category) {
          byCategory[row.rejection_category] = (byCategory[row.rejection_category] || 0) + 1
        }
      })

      ;(sourceCounts || []).forEach(row => {
        const source = row.idea_source || 'unknown'
        if (!bySource[source]) {
          bySource[source] = { approved: 0, rejected: 0, thumbs_up: 0, thumbs_down: 0 }
        }
        bySource[source][row.decision] = (bySource[source][row.decision] || 0) + 1
      })

      return {
        total: (decisionCounts || []).length,
        untrained: untrainedCount || 0,
        byDecision,
        byCategory,
        bySource,
        approvalRate: byDecision.approved && byDecision.rejected
          ? Math.round((byDecision.approved / (byDecision.approved + byDecision.rejected)) * 100)
          : null,
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })
}

/**
 * Record feedback decision (approve, reject, thumbs up/down)
 */
export function useRecordFeedback() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      ideaId,
      decision,
      rejectionCategory = null,
      rejectionReason = null,
      feedbackNotes = null,
    }) => {
      // Try using RPC function first
      const { data, error } = await supabase.rpc('record_idea_feedback', {
        p_idea_id: ideaId,
        p_decision: decision,
        p_rejection_category: rejectionCategory,
        p_rejection_reason: rejectionReason,
        p_feedback_notes: feedbackNotes,
      })

      if (error) {
        // Fallback: Insert history and update idea directly
        // Get idea details for snapshot
        const { data: idea } = await supabase
          .from('content_ideas')
          .select('title, description, source, content_type, target_keywords')
          .eq('id', ideaId)
          .single()

        if (!idea) throw new Error('Idea not found')

        // Insert feedback history
        const { data: history, error: historyError } = await supabase
          .from('idea_feedback_history')
          .insert({
            idea_id: ideaId,
            decision,
            rejection_category: rejectionCategory,
            rejection_reason: rejectionReason,
            idea_title: idea.title,
            idea_description: idea.description,
            idea_source: idea.source,
            idea_content_type: idea.content_type,
            idea_keywords: idea.target_keywords,
            feedback_notes: feedbackNotes,
            decided_by: user?.id,
          })
          .select()
          .single()

        if (historyError) throw historyError

        // Update the idea
        const updates = {
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        }

        if (decision === 'approved') {
          updates.status = 'approved'
          updates.feedback_notes = feedbackNotes
        } else if (decision === 'rejected') {
          updates.status = 'rejected'
          updates.rejection_category = rejectionCategory
          updates.rejection_reason = rejectionReason
          updates.feedback_notes = feedbackNotes
        }

        // Update feedback score
        const { data: current } = await supabase
          .from('content_ideas')
          .select('feedback_score')
          .eq('id', ideaId)
          .single()

        const scoreChange = ['approved', 'thumbs_up'].includes(decision) ? 1 : -1
        updates.feedback_score = (current?.feedback_score || 0) + scoreChange

        await supabase
          .from('content_ideas')
          .update(updates)
          .eq('id', ideaId)

        return history
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
      queryClient.invalidateQueries({ queryKey: ['idea-feedback-history'] })
      queryClient.invalidateQueries({ queryKey: ['untrained-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] })
    },
  })
}

/**
 * Get AI learning sessions
 */
export function useLearningSessionsQuery(sessionType = 'idea_generation') {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['learning-sessions', sessionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .select('*')
        .eq('session_type', sessionType)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Get the active learning session for a type
 */
export function useActiveLearningSession(sessionType = 'idea_generation') {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['active-learning-session', sessionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .select('*')
        .eq('session_type', sessionType)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data || null
    },
    enabled: !!user,
  })
}

/**
 * Create a new AI learning session
 */
export function useCreateLearningSession() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      sessionType,
      feedbackIds,
      originalPrompt,
      improvedPrompt,
      improvementNotes,
      learnedPatterns,
    }) => {
      const approvedCount = feedbackIds.filter(async (id) => {
        const { data } = await supabase
          .from('idea_feedback_history')
          .select('decision')
          .eq('id', id)
          .single()
        return ['approved', 'thumbs_up'].includes(data?.decision)
      }).length

      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .insert({
          session_type: sessionType,
          feedback_count: feedbackIds.length,
          approved_count: approvedCount,
          rejected_count: feedbackIds.length - approvedCount,
          feedback_ids: feedbackIds,
          original_prompt: originalPrompt,
          improved_prompt: improvedPrompt,
          improvement_notes: improvementNotes,
          learned_patterns: learnedPatterns || {},
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      // Mark feedback as used for training
      if (feedbackIds.length > 0) {
        await supabase.rpc('mark_feedback_as_trained', {
          p_feedback_ids: feedbackIds,
          p_session_id: data.id,
        }).catch(() => {
          // Fallback if RPC doesn't exist
          supabase
            .from('idea_feedback_history')
            .update({ used_for_training: true, training_batch_id: data.id })
            .in('id', feedbackIds)
        })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active-learning-session'] })
      queryClient.invalidateQueries({ queryKey: ['untrained-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] })
    },
  })
}

/**
 * Activate a learning session (apply its improvements)
 */
export function useActivateLearningSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, sessionType }) => {
      // Deactivate all other sessions of this type
      await supabase
        .from('ai_learning_sessions')
        .update({ is_active: false })
        .eq('session_type', sessionType)
        .eq('is_active', true)

      // Activate the selected session
      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .update({
          is_active: true,
          applied_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['active-learning-session'] })
    },
  })
}

/**
 * Delete a learning session
 */
export function useDeleteLearningSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId) => {
      const { error } = await supabase
        .from('ai_learning_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-sessions'] })
    },
  })
}
