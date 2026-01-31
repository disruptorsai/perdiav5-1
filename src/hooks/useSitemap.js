import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  syncFromSitemap,
  getCatalogStats,
  getRelevantArticles,
} from '../services/sitemapService'

/**
 * Hook for sitemap sync operations
 */
export function useSitemapSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ maxPages = 5000, onProgress } = {}) => {
      const results = await syncFromSitemap({
        maxPages,
        onProgress,
        fetchPageContent: false, // Don't crawl pages for now
      })
      return results
    },
    onSuccess: () => {
      // Invalidate catalog stats after sync
      queryClient.invalidateQueries({ queryKey: ['catalog-stats'] })
      queryClient.invalidateQueries({ queryKey: ['geteducated-articles'] })
    },
  })
}

/**
 * Hook for fetching catalog statistics
 */
export function useCatalogStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['catalog-stats'],
    queryFn: async () => {
      const stats = await getCatalogStats()
      return stats
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for searching relevant articles for internal linking
 */
export function useRelevantArticles(topic, options = {}) {
  const { user } = useAuth()
  const { limit = 10, preferSponsored = true, enabled = true } = options

  return useQuery({
    queryKey: ['relevant-articles', topic, limit, preferSponsored],
    queryFn: async () => {
      if (!topic) return []
      const articles = await getRelevantArticles(topic, {
        limit,
        preferSponsored,
      })
      return articles
    },
    enabled: !!user && !!topic && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export default {
  useSitemapSync,
  useCatalogStats,
  useRelevantArticles,
}
