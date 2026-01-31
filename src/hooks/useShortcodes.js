import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all shortcodes
 */
export function useShortcodes(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shortcodes', filters],
    queryFn: async () => {
      let query = supabase
        .from('shortcodes')
        .select('*')
        .order('name', { ascending: true })

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch only active shortcodes
 */
export function useActiveShortcodes() {
  return useShortcodes({ isActive: true })
}

/**
 * Create a new shortcode
 */
export function useCreateShortcode() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shortcodeData) => {
      const { data, error } = await supabase
        .from('shortcodes')
        .insert({
          ...shortcodeData,
          user_id: user?.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Update a shortcode
 */
export function useUpdateShortcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('shortcodes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Toggle shortcode active status
 */
export function useToggleShortcodeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data, error } = await supabase
        .from('shortcodes')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Delete a shortcode
 */
export function useDeleteShortcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('shortcodes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}
