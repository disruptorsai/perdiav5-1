/**
 * DataForSEO Client for Keyword Research
 * Uses Supabase Edge Function to proxy requests (avoids CORS and keeps credentials secure)
 */

import { supabase } from '../supabaseClient'

class DataForSEOClient {
  constructor() {
    // Get the Supabase URL for Edge Function calls
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    this.functionName = 'dataforseo-api'
    console.log('[DataForSEO] Client initialized with URL:', this.supabaseUrl)
  }

  /**
   * Call the DataForSEO Edge Function
   */
  async callEdgeFunction(action, payload) {
    console.log('[DataForSEO] callEdgeFunction started:', { action, payload })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[DataForSEO] Session error:', sessionError)
      throw new Error(`Session error: ${sessionError.message}`)
    }

    if (!session) {
      console.error('[DataForSEO] No session found - user not authenticated')
      throw new Error('User must be authenticated to use DataForSEO')
    }

    console.log('[DataForSEO] Session found, user:', session.user?.email)

    const url = `${this.supabaseUrl}/functions/v1/${this.functionName}`
    console.log('[DataForSEO] Calling Edge Function at:', url)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, payload }),
      })

      console.log('[DataForSEO] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[DataForSEO] Error response body:', errorText)
        throw new Error(`Edge Function error (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('[DataForSEO] Response JSON:', result)

      if (!result.success) {
        console.error('[DataForSEO] API returned error:', result.error)
        throw new Error(result.error || 'Unknown error from DataForSEO')
      }

      console.log('[DataForSEO] Success! Data received:', result.data?.length || 0, 'items')
      return result.data
    } catch (fetchError) {
      console.error('[DataForSEO] Fetch error:', fetchError)
      throw fetchError
    }
  }

  /**
   * Get keyword suggestions based on seed keywords
   */
  async getKeywordSuggestions(seedKeywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
      limit = 50,
    } = options

    const keywords = Array.isArray(seedKeywords) ? seedKeywords : [seedKeywords]

    try {
      const results = await this.callEdgeFunction('getKeywordSuggestions', {
        seedKeywords: keywords,
        location,
        language,
        limit,
      })

      return results
    } catch (error) {
      console.error('DataForSEO keyword suggestions error:', error)
      throw error
    }
  }

  /**
   * Get search volume for specific keywords
   */
  async getSearchVolume(keywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options

    const keywordArray = Array.isArray(keywords) ? keywords : [keywords]

    try {
      const results = await this.callEdgeFunction('getSearchVolume', {
        keywords: keywordArray,
        location,
        language,
      })

      return results
    } catch (error) {
      console.error('DataForSEO search volume error:', error)
      throw error
    }
  }

  /**
   * Get SERP analysis (optional, uses more credits)
   */
  async getSerpAnalysis(keyword, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options

    try {
      const result = await this.callEdgeFunction('getSerpAnalysis', {
        keyword,
        location,
        language,
      })

      return result
    } catch (error) {
      console.error('DataForSEO SERP analysis error:', error)
      throw error
    }
  }

  /**
   * Filter keywords by criteria (client-side filtering)
   */
  filterKeywords(keywords, criteria = {}) {
    const {
      minSearchVolume = 100,
      maxSearchVolume = Infinity,
      maxDifficulty = 70,
      minOpportunityScore = 50,
      excludeKeywords = [],
      trend = null,
    } = criteria

    return keywords.filter(kw => {
      if (kw.search_volume < minSearchVolume) return false
      if (kw.search_volume > maxSearchVolume) return false
      if (kw.difficulty > maxDifficulty) return false
      if (kw.opportunity_score < minOpportunityScore) return false

      if (excludeKeywords.some(excluded =>
        kw.keyword.toLowerCase().includes(excluded.toLowerCase())
      )) {
        return false
      }

      if (trend && kw.trend !== trend) return false

      return true
    })
  }

  /**
   * Rank keywords by opportunity score (client-side sorting)
   */
  rankKeywords(keywords) {
    return keywords.sort((a, b) => b.opportunity_score - a.opportunity_score)
  }
}

export default DataForSEOClient
