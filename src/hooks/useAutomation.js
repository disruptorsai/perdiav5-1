import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all generation queue items
 */
export function useGenerationQueue(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['generation-queue', filters],
    queryFn: async () => {
      let query = supabase
        .from('generation_queue')
        .select('*, content_ideas(title, description, seed_topics)')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  })
}

/**
 * Get queue statistics
 */
export function useQueueStats() {
  const { data: queue = [] } = useGenerationQueue()

  return {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    processing: queue.filter(q => q.status === 'processing').length,
    completed: queue.filter(q => q.status === 'completed').length,
    failed: queue.filter(q => q.status === 'failed').length,
  }
}

/**
 * Add item to generation queue
 */
export function useAddToQueue() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contentIdeaId, priority = 0 }) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('generation_queue')
        .insert({
          content_idea_id: contentIdeaId,
          user_id: user.id,
          status: 'pending',
          priority,
          progress_percentage: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Bulk add items to queue
 */
export function useBulkAddToQueue() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items) => {
      if (!user) throw new Error('User not authenticated')

      const queueItems = items.map((item, index) => ({
        content_idea_id: item.contentIdeaId,
        user_id: user.id,
        status: 'pending',
        priority: item.priority || 0,
        progress_percentage: 0,
      }))

      const { data, error } = await supabase
        .from('generation_queue')
        .insert(queueItems)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Update queue item status
 */
export function useUpdateQueueStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, progress, stage, error }) => {
      const updates = { status }

      if (progress !== undefined) updates.progress_percentage = progress
      if (stage !== undefined) updates.current_stage = stage
      if (error !== undefined) updates.error_message = error

      if (status === 'processing' && !updates.started_at) {
        updates.started_at = new Date().toISOString()
      }
      if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error: dbError } = await supabase
        .from('generation_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (dbError) throw dbError
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
    },
  })
}

/**
 * Update queue item priority
 */
export function useUpdateQueuePriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, priority }) => {
      const { data, error } = await supabase
        .from('generation_queue')
        .update({ priority })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
    },
  })
}

/**
 * Remove item from queue
 */
export function useRemoveFromQueue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('generation_queue')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
    },
  })
}

/**
 * Clear completed items from queue
 */
export function useClearCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('generation_queue')
        .delete()
        .eq('status', 'completed')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
    },
  })
}

/**
 * Retry failed item
 */
export function useRetryQueueItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('generation_queue')
        .update({
          status: 'pending',
          progress_percentage: 0,
          current_stage: null,
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
    },
  })
}
