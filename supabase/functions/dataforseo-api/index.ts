/**
 * Supabase Edge Function: dataforseo-api
 * Server-side proxy for DataForSEO API calls
 * Keeps DataForSEO credentials secure and avoids CORS issues
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3'

interface KeywordResult {
  keyword: string
  search_volume: number
  competition: number
  competition_level: string
  cpc: number
  monthly_searches: any[]
  trend: string
  difficulty: number
  opportunity_score: number
}

/**
 * Make authenticated request to DataForSEO API
 */
async function makeDataForSEORequest(endpoint: string, payload: any) {
  const username = Deno.env.get('DATAFORSEO_USERNAME')
  const password = Deno.env.get('DATAFORSEO_PASSWORD')

  if (!username || !password) {
    throw new Error('DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD must be configured in Edge Function secrets')
  }

  const auth = btoa(`${username}:${password}`)

  const response = await fetch(`${DATAFORSEO_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`DataForSEO API error: ${error.status_message || response.statusText}`)
  }

  const data = await response.json()

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO error: ${data.status_message}`)
  }

  return data
}

/**
 * Calculate trend from monthly searches data
 */
function calculateTrend(monthlySearches: any[]): string {
  if (!monthlySearches || monthlySearches.length < 2) {
    return 'stable'
  }

  // Get last 3 months
  const recent = monthlySearches.slice(-3)
  const avgRecent = recent.reduce((sum: number, m: any) => sum + m.search_volume, 0) / recent.length

  // Get previous 3 months
  const previous = monthlySearches.slice(-6, -3)
  if (previous.length === 0) return 'stable'

  const avgPrevious = previous.reduce((sum: number, m: any) => sum + m.search_volume, 0) / previous.length

  const percentChange = ((avgRecent - avgPrevious) / avgPrevious) * 100

  if (percentChange > 20) return 'rising'
  if (percentChange < -20) return 'declining'
  return 'stable'
}

/**
 * Calculate difficulty score (0-100)
 */
function calculateDifficulty(keywordData: any): number {
  const { competition, competition_level, cpc, search_volume } = keywordData

  let score = 0

  // Competition level (0-40 points)
  if (competition_level === 'LOW') score += 10
  else if (competition_level === 'MEDIUM') score += 25
  else if (competition_level === 'HIGH') score += 40

  // CPC factor (0-30 points)
  if (cpc < 0.5) score += 5
  else if (cpc < 2) score += 15
  else if (cpc < 5) score += 25
  else score += 30

  // Volume factor (0-30 points)
  if (search_volume < 500) score += 5
  else if (search_volume < 2000) score += 15
  else if (search_volume < 10000) score += 25
  else score += 30

  return Math.min(100, score)
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(keywordData: any): number {
  const { search_volume, competition_level, cpc } = keywordData

  let score = 0

  // Volume score (0-40 points) - Sweet spot is 500-5000
  if (search_volume >= 500 && search_volume <= 5000) score += 40
  else if (search_volume > 5000 && search_volume <= 10000) score += 30
  else if (search_volume > 100 && search_volume < 500) score += 25
  else if (search_volume > 10000) score += 20
  else score += 10

  // Competition score (0-40 points) - Lower is better
  if (competition_level === 'LOW') score += 40
  else if (competition_level === 'MEDIUM') score += 20
  else score += 5

  // CPC score (0-20 points) - Moderate CPC is good
  if (cpc >= 1 && cpc <= 3) score += 20
  else if (cpc > 3 && cpc <= 5) score += 15
  else if (cpc > 0.5 && cpc < 1) score += 15
  else if (cpc > 5) score += 5
  else score += 10

  return Math.min(100, score)
}

/**
 * Process keyword results with calculated metrics
 */
function processKeywordResults(items: any[], limit: number): KeywordResult[] {
  return items
    .filter((item: any) => item.search_volume > 0)
    .map((item: any) => ({
      keyword: item.keyword,
      search_volume: item.search_volume,
      competition: item.competition,
      competition_level: item.competition_level,
      cpc: item.cpc,
      monthly_searches: item.monthly_searches,
      trend: calculateTrend(item.monthly_searches),
      difficulty: calculateDifficulty(item),
      opportunity_score: calculateOpportunityScore(item),
    }))
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, limit)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    if (!action) {
      throw new Error('Missing required parameter: action')
    }

    let result: any

    switch (action) {
      case 'getKeywordSuggestions': {
        const {
          seedKeywords,
          location = 'United States',
          language = 'English',
          limit = 50
        } = payload

        if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
          throw new Error('Missing required parameter: seedKeywords (array)')
        }

        console.log('Fetching keyword suggestions for:', seedKeywords)

        const apiPayload = [{
          location_name: location,
          language_name: language,
          keywords: seedKeywords,
          include_serp_info: false,
          sort_by: 'search_volume',
        }]

        const data = await makeDataForSEORequest(
          '/keywords_data/google_ads/keywords_for_keywords/live',
          apiPayload
        )

        const items = data.tasks?.[0]?.result?.[0]?.items || []
        result = processKeywordResults(items, limit)
        break
      }

      case 'getSearchVolume': {
        const {
          keywords,
          location = 'United States',
          language = 'English'
        } = payload

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
          throw new Error('Missing required parameter: keywords (array)')
        }

        console.log('Fetching search volume for:', keywords)

        const apiPayload = [{
          location_name: location,
          language_name: language,
          keywords: keywords,
        }]

        const data = await makeDataForSEORequest(
          '/keywords_data/google_ads/search_volume/live',
          apiPayload
        )

        const items = data.tasks?.[0]?.result || []
        result = items.map((item: any) => ({
          keyword: item.keyword,
          search_volume: item.search_volume,
          competition: item.competition,
          cpc: item.cpc,
        }))
        break
      }

      case 'getSerpAnalysis': {
        const {
          keyword,
          location = 'United States',
          language = 'English'
        } = payload

        if (!keyword) {
          throw new Error('Missing required parameter: keyword')
        }

        console.log('Fetching SERP analysis for:', keyword)

        const apiPayload = [{
          location_name: location,
          language_name: language,
          keyword: keyword,
        }]

        const data = await makeDataForSEORequest(
          '/serp/google/organic/live/advanced',
          apiPayload
        )

        const items = data.tasks?.[0]?.result?.[0]?.items || []
        result = {
          keyword,
          total_results: items.length,
          top_results: items.slice(0, 10).map((item: any) => ({
            position: item.rank_group,
            title: item.title,
            url: item.url,
            domain: item.domain,
          })),
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}. Valid actions: getKeywordSuggestions, getSearchVolume, getSerpAnalysis`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('DataForSEO API Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
