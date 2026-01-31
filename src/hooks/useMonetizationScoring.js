import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { monetizationEngine } from '../services/monetizationEngine'

/**
 * Hook to calculate monetization score for an idea
 * Uses the MonetizationEngine.matchTopicToCategory() method
 */
export function useCalculateMonetizationScore() {
  return useMutation({
    mutationFn: async ({ title, description }) => {
      // Combine title and description as the topic
      const topic = `${title || ''} ${description || ''}`.trim()

      if (!topic) {
        return {
          score: 0,
          confidence: 'unscored',
          categoryId: null,
          concentrationId: null,
          degreeLevel: null,
        }
      }

      // Use the monetization engine's topic matching
      const result = await monetizationEngine.matchTopicToCategory(topic)

      if (!result.matched) {
        return {
          score: 0,
          confidence: 'low',
          categoryId: null,
          concentrationId: null,
          degreeLevel: null,
        }
      }

      return {
        score: result.score || 0,
        confidence: result.confidence || 'low',
        categoryId: result.categoryId,
        concentrationId: result.concentrationId,
        degreeLevel: result.degreeLevelCode,
        category: result.category,
      }
    },
  })
}

/**
 * Hook to score and update an existing idea's monetization potential
 */
export function useUpdateIdeaMonetizationScore() {
  const queryClient = useQueryClient()
  const calculateScore = useCalculateMonetizationScore()

  return useMutation({
    mutationFn: async ({ ideaId, title, description }) => {
      // Calculate score
      const scoring = await calculateScore.mutateAsync({ title, description })

      // Update in database
      const { data, error } = await supabase
        .from('content_ideas')
        .update({
          monetization_score: scoring.score,
          monetization_confidence: scoring.confidence,
          monetization_category_id: scoring.categoryId,
          monetization_concentration_id: scoring.concentrationId,
          monetization_degree_level: scoring.degreeLevel,
          monetization_matched_at: new Date().toISOString(),
        })
        .eq('id', ideaId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Hook to batch score all unscored ideas
 */
export function useBatchScoreIdeas() {
  const queryClient = useQueryClient()
  const calculateScore = useCalculateMonetizationScore()

  return useMutation({
    mutationFn: async () => {
      // Fetch unscored ideas
      const { data: ideas, error: fetchError } = await supabase
        .from('content_ideas')
        .select('id, title, description')
        .or('monetization_score.is.null,monetization_score.eq.0')

      if (fetchError) throw fetchError

      if (!ideas || ideas.length === 0) {
        return { scored: 0 }
      }

      let scored = 0

      for (const idea of ideas) {
        try {
          const scoring = await calculateScore.mutateAsync({
            title: idea.title,
            description: idea.description,
          })

          await supabase
            .from('content_ideas')
            .update({
              monetization_score: scoring.score,
              monetization_confidence: scoring.confidence,
              monetization_category_id: scoring.categoryId,
              monetization_concentration_id: scoring.concentrationId,
              monetization_degree_level: scoring.degreeLevel,
              monetization_matched_at: new Date().toISOString(),
            })
            .eq('id', idea.id)

          scored++
        } catch (error) {
          console.error(`Failed to score idea ${idea.id}:`, error)
        }
      }

      return { scored, total: ideas.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Helper to get monetization score badge color
 */
export function getMonetizationBadgeColor(confidence) {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

/**
 * Helper to get monetization score label
 */
export function getMonetizationLabel(confidence, score) {
  if (confidence === 'unscored' || score === null || score === undefined) {
    return 'Unscored'
  }

  switch (confidence) {
    case 'high':
      return `High ($${score})`
    case 'medium':
      return `Medium ($${score})`
    case 'low':
      return `Low ($${score})`
    default:
      return `Score: ${score}`
  }
}
