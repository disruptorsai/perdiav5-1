import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import DataForSEOClient from '../services/ai/dataForSEOClient'

/**
 * Keyword Research Hooks
 *
 * These hooks integrate DataForSEO for keyword research and connect
 * with the site catalog for intelligent keyword suggestions.
 */

// Initialize DataForSEO client
const dataForSEOClient = new DataForSEOClient()

// ========================================
// DATAFORSEO RESEARCH HOOKS
// ========================================

/**
 * Research keywords using DataForSEO
 * Returns keyword suggestions with volume, difficulty, and opportunity scores
 */
export function useDataForSEOResearch() {
  const [isResearching, setIsResearching] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  const research = useCallback(async (seedKeywords, options = {}) => {
    console.log('[useDataForSEOResearch] Starting research with:', { seedKeywords, options })
    setIsResearching(true)
    setError(null)

    try {
      console.log('[useDataForSEOResearch] Calling dataForSEOClient.getKeywordSuggestions...')
      const suggestions = await dataForSEOClient.getKeywordSuggestions(seedKeywords, {
        limit: options.limit || 50,
        includeSerp: options.includeSerp ?? false,
        ...options,
      })

      console.log('[useDataForSEOResearch] Got suggestions:', suggestions?.length || 0, 'results')
      console.log('[useDataForSEOResearch] First result sample:', suggestions?.[0])

      // Apply filters if provided
      let filteredResults = suggestions
      if (options.filters) {
        console.log('[useDataForSEOResearch] Applying filters:', options.filters)
        filteredResults = dataForSEOClient.filterKeywords(suggestions, options.filters)
        console.log('[useDataForSEOResearch] After filtering:', filteredResults?.length || 0, 'results')
      }

      // Rank by opportunity score
      const rankedResults = dataForSEOClient.rankKeywords(filteredResults)
      console.log('[useDataForSEOResearch] Ranked results:', rankedResults?.length || 0)

      setResults(rankedResults)
      console.log('[useDataForSEOResearch] Results set to state successfully')
      return rankedResults
    } catch (err) {
      console.error('[useDataForSEOResearch] ERROR:', err)
      console.error('[useDataForSEOResearch] Error message:', err.message)
      console.error('[useDataForSEOResearch] Error stack:', err.stack)
      setError(err.message || 'Failed to fetch keyword data')
      throw err
    } finally {
      console.log('[useDataForSEOResearch] Setting isResearching to false')
      setIsResearching(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    research,
    clearResults,
    results,
    isResearching,
    error,
  }
}

/**
 * Get search volume for specific keywords
 */
export function useGetSearchVolume() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getVolume = useCallback(async (keywords) => {
    setIsLoading(true)
    setError(null)

    try {
      const volumeData = await dataForSEOClient.getSearchVolume(keywords)
      return volumeData
    } catch (err) {
      console.error('Search volume error:', err)
      setError(err.message || 'Failed to fetch search volume')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { getVolume, isLoading, error }
}

// ========================================
// KEYWORD LIBRARY HOOKS (Enhanced)
// ========================================

/**
 * Fetch starred keywords
 */
export function useStarredKeywords() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['keywords', 'starred'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('*, clusters(name)')
        .eq('is_starred', true)
        .order('opportunity_score', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch queued keywords (for article generation)
 */
export function useQueuedKeywords() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['keywords', 'queued'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('keywords')
        .select('*, clusters(name)')
        .eq('is_queued', true)
        .or(`queue_expires_at.is.null,queue_expires_at.gt.${now}`)
        .order('queued_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Toggle starred status for a keyword
 */
export function useToggleStarKeyword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isStarred }) => {
      const { data, error } = await supabase
        .from('keywords')
        .update({ is_starred: isStarred })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}

/**
 * Add keyword(s) to generation queue
 */
export function useQueueKeywords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ keywordIds, expiresAt = null }) => {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('keywords')
        .update({
          is_queued: true,
          queued_at: now,
          queue_expires_at: expiresAt,
        })
        .in('id', keywordIds)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}

/**
 * Remove keyword(s) from generation queue
 */
export function useDequeueKeywords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keywordIds) => {
      const { data, error } = await supabase
        .from('keywords')
        .update({
          is_queued: false,
          queued_at: null,
          queue_expires_at: null,
        })
        .in('id', keywordIds)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}

/**
 * Save researched keywords from DataForSEO to the library
 */
export function useSaveResearchedKeywords() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ keywords, clusterId = null, autoStar = false }) => {
      const keywordsToInsert = keywords.map(kw => ({
        keyword: kw.keyword,
        search_volume: kw.search_volume,
        difficulty_score: kw.difficulty,
        opportunity_score: kw.opportunity_score,
        trend: kw.trend,
        cpc: kw.cpc,
        competition_level: kw.competition_level,
        monthly_searches: kw.monthly_searches || null,
        source: 'dataforseo',
        last_researched_at: new Date().toISOString(),
        is_starred: autoStar,
        cluster_id: clusterId,
        user_id: user?.id,
      }))

      // Use upsert to avoid duplicates
      const { data, error } = await supabase
        .from('keywords')
        .upsert(keywordsToInsert, {
          onConflict: 'keyword,cluster_id',
          ignoreDuplicates: false,
        })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}

/**
 * Update keyword with fresh DataForSEO data
 */
export function useRefreshKeywordData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keywordId) => {
      // First get the keyword
      const { data: keyword, error: fetchError } = await supabase
        .from('keywords')
        .select('keyword')
        .eq('id', keywordId)
        .single()

      if (fetchError) throw fetchError

      // Fetch fresh data from DataForSEO
      const volumeData = await dataForSEOClient.getSearchVolume([keyword.keyword])
      const freshData = volumeData[0]

      if (!freshData) {
        throw new Error('No data returned from DataForSEO')
      }

      // Calculate scores
      const difficulty = dataForSEOClient.calculateDifficulty(freshData)
      const opportunityScore = dataForSEOClient.calculateOpportunityScore(freshData)

      // Update the keyword
      const { data, error } = await supabase
        .from('keywords')
        .update({
          search_volume: freshData.search_volume,
          cpc: freshData.cpc,
          competition_level: freshData.competition,
          difficulty_score: difficulty,
          opportunity_score: opportunityScore,
          last_researched_at: new Date().toISOString(),
        })
        .eq('id', keywordId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
  })
}

// ========================================
// SITE CATALOG ANALYSIS HOOKS
// ========================================

/**
 * Analyze site catalog to find keyword/content gaps
 * Returns suggestions based on existing content patterns
 */
export function useCatalogAnalysis() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['catalog-analysis'],
    queryFn: async () => {
      // Get content type and subject distribution
      const { data: articles, error } = await supabase
        .from('geteducated_articles')
        .select('content_type, subject_area, degree_level, topics, primary_topic')

      if (error) throw error

      // Analyze content gaps
      const subjectCounts = {}
      const degreeCounts = {}
      const topicCounts = {}
      const contentTypeCounts = {}

      articles.forEach(article => {
        // Count subjects
        if (article.subject_area) {
          subjectCounts[article.subject_area] = (subjectCounts[article.subject_area] || 0) + 1
        }

        // Count degree levels
        if (article.degree_level) {
          degreeCounts[article.degree_level] = (degreeCounts[article.degree_level] || 0) + 1
        }

        // Count content types
        if (article.content_type) {
          contentTypeCounts[article.content_type] = (contentTypeCounts[article.content_type] || 0) + 1
        }

        // Count topics
        if (article.topics && Array.isArray(article.topics)) {
          article.topics.forEach(topic => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1
          })
        }
        if (article.primary_topic) {
          topicCounts[article.primary_topic] = (topicCounts[article.primary_topic] || 0) + 1
        }
      })

      // Sort and identify gaps (subjects with fewer articles)
      const sortedSubjects = Object.entries(subjectCounts)
        .sort((a, b) => a[1] - b[1])
        .map(([subject, count]) => ({ subject, count }))

      const sortedDegrees = Object.entries(degreeCounts)
        .sort((a, b) => a[1] - b[1])
        .map(([degree, count]) => ({ degree, count }))

      const sortedTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50) // Top 50 topics
        .map(([topic, count]) => ({ topic, count }))

      // Generate keyword suggestions based on gaps
      const suggestions = generateKeywordSuggestions(sortedSubjects, sortedDegrees, sortedTopics)

      return {
        totalArticles: articles.length,
        subjectDistribution: sortedSubjects,
        degreeDistribution: sortedDegrees,
        topTopics: sortedTopics,
        contentTypeDistribution: contentTypeCounts,
        suggestions,
        gaps: {
          underrepresentedSubjects: sortedSubjects.slice(0, 5),
          underrepresentedDegrees: sortedDegrees.slice(0, 3),
        },
      }
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Generate keyword suggestions based on catalog analysis
 */
function generateKeywordSuggestions(subjects, degrees, topics) {
  const suggestions = []

  // Suggest keywords for underrepresented subjects
  subjects.slice(0, 5).forEach(({ subject, count }) => {
    suggestions.push({
      type: 'subject_gap',
      keyword: `online ${subject} degree`,
      reason: `Only ${count} articles about ${subject}`,
      priority: count < 10 ? 'high' : 'medium',
    })
    suggestions.push({
      type: 'subject_gap',
      keyword: `best ${subject} programs online`,
      reason: `Expand ${subject} coverage`,
      priority: count < 10 ? 'high' : 'medium',
    })
  })

  // Suggest keywords for degree levels
  degrees.slice(0, 3).forEach(({ degree, count }) => {
    suggestions.push({
      type: 'degree_gap',
      keyword: `affordable ${degree} degree online`,
      reason: `Only ${count} ${degree} articles`,
      priority: count < 20 ? 'high' : 'medium',
    })
  })

  // Suggest long-tail variations of top topics
  topics.slice(0, 10).forEach(({ topic }) => {
    suggestions.push({
      type: 'topic_expansion',
      keyword: `how to become a ${topic}`,
      reason: `Expand on popular topic: ${topic}`,
      priority: 'medium',
    })
    suggestions.push({
      type: 'topic_expansion',
      keyword: `${topic} salary guide`,
      reason: `Career content for ${topic}`,
      priority: 'medium',
    })
  })

  return suggestions
}

/**
 * Get existing keywords for a topic to avoid duplicates
 */
export function useExistingKeywordsForTopic(topic) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['keywords', 'topic', topic],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('keyword')
        .ilike('keyword', `%${topic}%`)

      if (error) throw error
      return data?.map(k => k.keyword) || []
    },
    enabled: !!user && !!topic,
  })
}

// ========================================
// KEYWORD STATS HOOKS (Enhanced)
// ========================================

/**
 * Get enhanced keyword statistics
 */
export function useKeywordResearchStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['keywords', 'research-stats'],
    queryFn: async () => {
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('is_starred, is_queued, source, opportunity_score, search_volume, difficulty_score')

      if (error) throw error

      const stats = {
        total: keywords.length,
        starred: keywords.filter(k => k.is_starred).length,
        queued: keywords.filter(k => k.is_queued).length,
        fromDataForSEO: keywords.filter(k => k.source === 'dataforseo').length,
        fromCatalog: keywords.filter(k => k.source === 'catalog_analysis').length,
        manual: keywords.filter(k => k.source === 'manual').length,
        avgOpportunityScore: 0,
        avgSearchVolume: 0,
        avgDifficulty: 0,
        highOpportunity: 0,
      }

      // Calculate averages
      const withOpportunity = keywords.filter(k => k.opportunity_score != null)
      const withVolume = keywords.filter(k => k.search_volume != null)
      const withDifficulty = keywords.filter(k => k.difficulty_score != null)

      if (withOpportunity.length > 0) {
        stats.avgOpportunityScore = Math.round(
          withOpportunity.reduce((sum, k) => sum + k.opportunity_score, 0) / withOpportunity.length
        )
        stats.highOpportunity = withOpportunity.filter(k => k.opportunity_score >= 70).length
      }

      if (withVolume.length > 0) {
        stats.avgSearchVolume = Math.round(
          withVolume.reduce((sum, k) => sum + k.search_volume, 0) / withVolume.length
        )
      }

      if (withDifficulty.length > 0) {
        stats.avgDifficulty = Math.round(
          withDifficulty.reduce((sum, k) => sum + k.difficulty_score, 0) / withDifficulty.length
        )
      }

      return stats
    },
    enabled: !!user,
  })
}

// ========================================
// GENERATION INTEGRATION HOOKS
// ========================================

/**
 * Create content ideas from queued keywords
 */
export function useCreateIdeasFromKeywords() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keywordIds) => {
      // Get the keywords
      const { data: keywords, error: fetchError } = await supabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)

      if (fetchError) throw fetchError

      // Create content ideas for each keyword
      const ideas = keywords.map(kw => ({
        title: generateIdeaTitle(kw.keyword),
        description: `Article targeting keyword: "${kw.keyword}" with ${kw.search_volume?.toLocaleString() || 'unknown'} monthly searches`,
        status: 'pending',
        source: 'keyword_research',
        seed_topics: [kw.keyword],
        keyword_research_data: {
          primary_keyword: kw.keyword,
          search_volume: kw.search_volume,
          difficulty: kw.difficulty_score,
          opportunity_score: kw.opportunity_score,
          trend: kw.trend,
          cpc: kw.cpc,
        },
        user_id: user?.id,
      }))

      const { data, error } = await supabase
        .from('content_ideas')
        .insert(ideas)
        .select()

      if (error) throw error

      // Mark keywords as processed (remove from queue)
      await supabase
        .from('keywords')
        .update({ is_queued: false, queued_at: null, queue_expires_at: null })
        .in('id', keywordIds)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] })
    },
  })
}

/**
 * Generate a content idea title from a keyword
 */
function generateIdeaTitle(keyword) {
  const lowerKeyword = keyword.toLowerCase()

  // Detect keyword type and generate appropriate title
  if (lowerKeyword.includes('how to')) {
    return keyword.charAt(0).toUpperCase() + keyword.slice(1)
  }

  if (lowerKeyword.includes('best')) {
    return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' in 2025'
  }

  if (lowerKeyword.includes('salary') || lowerKeyword.includes('pay')) {
    return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ': Complete Guide'
  }

  if (lowerKeyword.includes('degree') || lowerKeyword.includes('program')) {
    return 'Guide to ' + keyword.charAt(0).toUpperCase() + keyword.slice(1)
  }

  if (lowerKeyword.includes('career') || lowerKeyword.includes('job')) {
    return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Career Path'
  }

  // Default: capitalize and add "Guide"
  return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' - Complete Guide'
}
