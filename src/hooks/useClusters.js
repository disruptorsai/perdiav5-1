import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all clusters
 */
export function useClusters(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['clusters', filters],
    queryFn: async () => {
      let query = supabase
        .from('clusters')
        .select('*')
        .order('name', { ascending: true })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch a single cluster by ID
 */
export function useCluster(clusterId) {
  return useQuery({
    queryKey: ['cluster', clusterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clusters')
        .select('*, keywords(*)')
        .eq('id', clusterId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!clusterId,
  })
}

/**
 * Get cluster statistics
 */
export function useClusterStats() {
  const { data: clusters = [] } = useClusters()

  return {
    total: clusters.length,
    active: clusters.filter(c => c.status === 'active').length,
    totalKeywords: clusters.reduce((sum, c) => sum + (c.keyword_count || 0), 0),
    totalArticles: clusters.reduce((sum, c) => sum + (c.article_count || 0), 0),
  }
}

/**
 * Create a new cluster
 */
export function useCreateCluster() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clusterData) => {
      const { data, error } = await supabase
        .from('clusters')
        .insert({
          ...clusterData,
          user_id: user?.id,
          keyword_count: 0,
          article_count: 0,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] })
    },
  })
}

/**
 * Update a cluster
 */
export function useUpdateCluster() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('clusters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] })
      queryClient.invalidateQueries({ queryKey: ['cluster', data.id] })
    },
  })
}

/**
 * Delete a cluster
 */
export function useDeleteCluster() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('clusters')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] })
    },
  })
}

/**
 * Update cluster keyword and article counts
 */
export function useUpdateClusterCounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clusterId) => {
      // Get keyword count
      const { count: keywordCount, error: kwError } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .eq('cluster_id', clusterId)

      if (kwError) throw kwError

      // Get article count
      const { count: articleCount, error: artError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('cluster_id', clusterId)

      if (artError) throw artError

      // Update cluster
      const { data, error } = await supabase
        .from('clusters')
        .update({
          keyword_count: keywordCount || 0,
          article_count: articleCount || 0,
        })
        .eq('id', clusterId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] })
      queryClient.invalidateQueries({ queryKey: ['cluster', data.id] })
    },
  })
}
