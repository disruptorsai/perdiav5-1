import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all training data
 */
export function useTrainingData(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['training-data', filters],
    queryFn: async () => {
      let query = supabase
        .from('training_data')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.patternType) {
        query = query.eq('pattern_type', filters.patternType)
      }

      if (filters.appliedToSystem !== undefined) {
        query = query.eq('applied_to_system', filters.appliedToSystem)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Get training data statistics
 */
export function useTrainingStats() {
  const { data: trainingData = [] } = useTrainingData()

  return {
    total: trainingData.length,
    pending: trainingData.filter(t => t.status === 'pending').length,
    applied: trainingData.filter(t => t.applied_to_system).length,
    avgImpactScore: trainingData.length > 0
      ? Math.round(trainingData.reduce((sum, t) => sum + (t.impact_score || 0), 0) / trainingData.length)
      : 0,
    patternTypes: [...new Set(trainingData.map(t => t.pattern_type).filter(Boolean))],
  }
}

/**
 * Create training data from article revision
 */
export function useCreateTrainingData() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trainingData) => {
      const { data, error } = await supabase
        .from('training_data')
        .insert({
          ...trainingData,
          user_id: user?.id,
          status: 'pending',
          applied_to_system: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] })
    },
  })
}

/**
 * Update training data
 */
export function useUpdateTrainingData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('training_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] })
    },
  })
}

/**
 * Mark training data as applied to system
 */
export function useMarkTrainingApplied() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('training_data')
        .update({
          applied_to_system: true,
          status: 'applied',
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] })
    },
  })
}

/**
 * Delete training data
 */
export function useDeleteTrainingData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] })
    },
  })
}

/**
 * Bulk mark training data as applied
 */
export function useBulkApplyTraining() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids) => {
      const { data, error } = await supabase
        .from('training_data')
        .update({
          applied_to_system: true,
          status: 'applied',
        })
        .in('id', ids)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] })
    },
  })
}
