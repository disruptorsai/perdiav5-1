/**
 * Monetization Hooks for GetEducated
 * React Query hooks for monetization category/shortcode operations
 *
 * Includes hooks for:
 * - Monetization categories and levels
 * - Program selection via MonetizationEngine
 * - Shortcode generation and validation
 * - Business rule compliance checking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import {
  matchTopicToMonetization,
  validateShortcodeParams,
  checkMonetizationCompliance,
  generateShortcode,
  generateDegreeTableShortcode,
  generateDegreeOfferShortcode,
  insertShortcodeInContent,
  SHORTCODE_TYPES,
} from '../services/shortcodeService'
import {
  MonetizationEngine,
  MonetizationValidator,
  monetizationEngine,
  monetizationValidator,
  ARTICLE_SLOT_CONFIGS,
} from '../services/monetizationEngine'

/**
 * Fetch all monetization categories
 */
export function useMonetizationCategories(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['monetization-categories', filters],
    queryFn: async () => {
      let query = supabase
        .from('monetization_categories')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`category.ilike.%${filters.search}%,concentration.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch all monetization levels
 */
export function useMonetizationLevels() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['monetization-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monetization_levels')
        .select('*')
        .eq('is_active', true)
        .order('level_code', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Get unique category names for dropdown
 */
export function useCategoryNames() {
  const { data: categories = [] } = useMonetizationCategories()

  const uniqueCategories = [...new Set(categories.map(c => c.category))].sort()

  return uniqueCategories.map(name => ({
    label: name,
    value: categories.find(c => c.category === name)?.category_id,
  }))
}

/**
 * Get concentrations for a specific category
 */
export function useConcentrations(categoryId) {
  const { data: categories = [] } = useMonetizationCategories()

  if (!categoryId) return []

  return categories
    .filter(c => c.category_id === categoryId)
    .map(c => ({
      label: c.concentration,
      value: c.concentration_id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Match article topic to monetization category
 */
export function useMatchMonetization() {
  return useMutation({
    mutationFn: async ({ topic, degreeLevel }) => {
      return matchTopicToMonetization(topic, degreeLevel)
    },
  })
}

/**
 * Validate shortcode parameters
 */
export function useValidateShortcode() {
  return useMutation({
    mutationFn: async (params) => {
      return validateShortcodeParams(params)
    },
  })
}

/**
 * Hook to manage monetization for an article
 */
export function useArticleMonetization(articleId) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch existing monetization placements
  const { data: placements, isLoading } = useQuery({
    queryKey: ['article-monetization', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_monetization')
        .select(`
          *,
          monetization_categories(*),
          monetization_levels(*)
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!articleId,
  })

  // Add monetization placement
  const addPlacement = useMutation({
    mutationFn: async ({ categoryId, levelId, position, shortcode }) => {
      const { data, error } = await supabase
        .from('article_monetization')
        .insert({
          article_id: articleId,
          category_id: categoryId,
          level_id: levelId,
          position_in_article: position,
          shortcode_output: shortcode,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-monetization', articleId] })
    },
  })

  // Remove monetization placement
  const removePlacement = useMutation({
    mutationFn: async (placementId) => {
      const { error } = await supabase
        .from('article_monetization')
        .delete()
        .eq('id', placementId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-monetization', articleId] })
    },
  })

  return {
    placements: placements || [],
    isLoading,
    addPlacement,
    removePlacement,
  }
}

/**
 * Hook to auto-generate monetization for an article
 */
export function useAutoMonetization() {
  return useMutation({
    mutationFn: async ({ article, content }) => {
      // Match topic to category
      const match = await matchTopicToMonetization(article.title)

      if (!match.matched) {
        return {
          success: false,
          error: match.error || 'Could not match topic to category',
        }
      }

      // Insert shortcode into content
      const updatedContent = insertShortcodeInContent(
        content,
        match.shortcode,
        'after_intro'
      )

      // Optionally add a second shortcode mid-content for longer articles
      const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
      let finalContent = updatedContent

      if (wordCount > 1500) {
        finalContent = insertShortcodeInContent(
          updatedContent,
          match.shortcode,
          'mid_content'
        )
      }

      return {
        success: true,
        content: finalContent,
        match,
        shortcodesAdded: wordCount > 1500 ? 2 : 1,
      }
    },
  })
}

/**
 * Hook to check monetization compliance
 */
export function useMonetizationCompliance(content) {
  if (!content) {
    return {
      hasMonetization: false,
      monetizationCount: 0,
      shortcodes: [],
      isCompliant: false,
      recommendation: 'No content to check',
    }
  }

  return checkMonetizationCompliance(content)
}

/**
 * Shortcode builder hook - helps create shortcodes from selections
 */
export function useShortcodeBuilder() {
  const { data: levels = [] } = useMonetizationLevels()

  const buildShortcode = (categoryId, concentrationId, levelCode = null) => {
    return generateShortcode({ categoryId, concentrationId, levelCode })
  }

  const buildDegreeTableShortcode = (params) => {
    return generateDegreeTableShortcode(params)
  }

  const buildDegreeOfferShortcode = (params) => {
    return generateDegreeOfferShortcode(params)
  }

  const getLevelCode = (levelName) => {
    const level = levels.find(l =>
      l.level_name.toLowerCase() === levelName.toLowerCase()
    )
    return level?.level_code || null
  }

  return {
    buildShortcode,
    buildDegreeTableShortcode,
    buildDegreeOfferShortcode,
    getLevelCode,
    levels,
    SHORTCODE_TYPES,
  }
}

// ============================================
// NEW MONETIZATION ENGINE HOOKS
// ============================================

/**
 * Hook to generate full monetization for an article using MonetizationEngine
 * Returns shortcodes with selected programs for each slot
 */
export function useGenerateMonetization() {
  return useMutation({
    mutationFn: async ({
      articleId,
      categoryId,
      concentrationId,
      degreeLevelCode,
      articleType = 'default',
      customSlots = null,
    }) => {
      return monetizationEngine.generateMonetization({
        articleId,
        categoryId,
        concentrationId,
        degreeLevelCode,
        articleType,
        slots: customSlots,
      })
    },
  })
}

/**
 * Hook to match article topic to monetization category
 * Uses the enhanced matching algorithm in MonetizationEngine
 */
export function useMatchTopicToCategory() {
  return useMutation({
    mutationFn: async ({ topic, degreeLevel }) => {
      return monetizationEngine.matchTopicToCategory(topic, degreeLevel)
    },
  })
}

/**
 * Hook to validate monetization against business rules
 * Checks for blocked domains, proper link destinations, cost attribution, etc.
 */
export function useValidateMonetization() {
  return useMutation({
    mutationFn: async ({ monetizationOutput, articleContent }) => {
      return monetizationValidator.validate(monetizationOutput, articleContent)
    },
  })
}

/**
 * Fetch programs (degrees) with filtering for monetization
 */
export function usePrograms(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['programs', filters],
    queryFn: async () => {
      let query = supabase
        .from('degrees')
        .select(`
          *,
          schools(
            id,
            school_name,
            school_slug,
            geteducated_url,
            is_sponsored,
            has_logo
          )
        `)
        .eq('is_active', true)
        .order('is_sponsored', { ascending: false })
        .order('sponsorship_tier', { ascending: false })
        .order('program_name', { ascending: true })

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.concentrationId) {
        query = query.eq('concentration_id', filters.concentrationId)
      }

      if (filters.degreeLevelCode) {
        query = query.eq('degree_level_code', filters.degreeLevelCode)
      }

      if (filters.sponsoredOnly) {
        query = query.eq('is_sponsored', true)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch schools with filtering
 */
export function useSchools(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('is_sponsored', { ascending: false })
        .order('school_name', { ascending: true })

      if (filters.sponsoredOnly) {
        query = query.eq('is_sponsored', true)
      }

      if (filters.paidClientsOnly) {
        query = query.eq('is_paid_client', true)
      }

      if (filters.search) {
        query = query.ilike('school_name', `%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Hook to get available slot configurations for article types
 */
export function useSlotConfigurations() {
  return {
    slotConfigs: ARTICLE_SLOT_CONFIGS,
    articleTypes: Object.keys(ARTICLE_SLOT_CONFIGS),
    getConfigForType: (articleType) => {
      return ARTICLE_SLOT_CONFIGS[articleType] || ARTICLE_SLOT_CONFIGS.default
    },
  }
}

/**
 * Combined hook for full monetization workflow
 * Matches topic -> generates shortcodes -> validates -> returns result
 */
export function useFullMonetizationWorkflow() {
  const matchTopic = useMatchTopicToCategory()
  const generateMonetization = useGenerateMonetization()
  const validateMonetization = useValidateMonetization()

  const runWorkflow = async ({
    articleId,
    topic,
    degreeLevel,
    articleType = 'default',
    content = '',
  }) => {
    // Step 1: Match topic to category
    const match = await matchTopic.mutateAsync({ topic, degreeLevel })

    if (!match.matched) {
      return {
        success: false,
        error: match.error || 'Could not match topic to category',
        step: 'match',
      }
    }

    // Step 2: Generate monetization with program selection
    const monetization = await generateMonetization.mutateAsync({
      articleId,
      categoryId: match.categoryId,
      concentrationId: match.concentrationId,
      degreeLevelCode: match.degreeLevelCode,
      articleType,
    })

    if (!monetization.success) {
      return {
        success: false,
        error: monetization.error || 'Monetization generation failed',
        step: 'generate',
        match,
      }
    }

    // Step 3: Validate against business rules
    const validation = await validateMonetization.mutateAsync({
      monetizationOutput: monetization,
      articleContent: content,
    })

    return {
      success: true,
      match,
      monetization,
      validation,
      hasBlockingIssues: validation.blockingIssues?.length > 0,
    }
  }

  return {
    runWorkflow,
    isLoading: matchTopic.isPending || generateMonetization.isPending || validateMonetization.isPending,
    matchTopic,
    generateMonetization,
    validateMonetization,
  }
}

export default {
  useMonetizationCategories,
  useMonetizationLevels,
  useCategoryNames,
  useConcentrations,
  useMatchMonetization,
  useValidateShortcode,
  useArticleMonetization,
  useAutoMonetization,
  useMonetizationCompliance,
  useShortcodeBuilder,
  // New MonetizationEngine hooks
  useGenerateMonetization,
  useMatchTopicToCategory,
  useValidateMonetization,
  usePrograms,
  useSchools,
  useSlotConfigurations,
  useFullMonetizationWorkflow,
}
