/**
 * Supabase Edge Function: stealthgpt-humanize
 * Proxies StealthGPT API calls to avoid CORS issues
 * Keeps StealthGPT API key secure on server-side
 *
 * USAGE:
 * POST with JSON body containing: prompt, tone, mode, business, detector
 *
 * DEPLOYMENT:
 * supabase secrets set STEALTHGPT_API_KEY=your-stealthgpt-api-key
 * supabase functions deploy stealthgpt-humanize
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const STEALTHGPT_API_URL = 'https://stealthgpt.ai/api/stealthify'

interface StealthGptRequest {
  prompt: string
  tone?: 'Standard' | 'HighSchool' | 'College' | 'PhD'
  mode?: 'Low' | 'Medium' | 'High'
  business?: boolean
  detector?: 'gptzero' | 'turnitin'
  rephrase?: boolean
  isMultilingual?: boolean
}

interface StealthGptResponse {
  result?: string
  howLikelyToBeDetected?: number
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    )
  }

  try {
    // Parse request body
    const body: StealthGptRequest = await req.json()

    // Validate required parameters
    if (!body.prompt || typeof body.prompt !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: prompt (string)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get API key from environment
    const stealthGptApiKey = Deno.env.get('STEALTHGPT_API_KEY')

    if (!stealthGptApiKey) {
      console.error('STEALTHGPT_API_KEY not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'STEALTHGPT_API_KEY not configured in Edge Function secrets',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Build the payload for StealthGPT
    const payload = {
      prompt: body.prompt,
      tone: body.tone || 'College',
      mode: body.mode || 'High',
      business: body.business !== undefined ? body.business : true,
      detector: body.detector || 'gptzero',
      rephrase: body.rephrase !== undefined ? body.rephrase : true,
      isMultilingual: body.isMultilingual || false,
    }

    console.log(`[StealthGPT Proxy] Processing request - tone: ${payload.tone}, mode: ${payload.mode}, business: ${payload.business}`)
    console.log(`[StealthGPT Proxy] Content length: ${body.prompt.length} chars`)

    // Make request to StealthGPT API
    const response = await fetch(STEALTHGPT_API_URL, {
      method: 'POST',
      headers: {
        'api-token': stealthGptApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // Handle non-OK responses from StealthGPT
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[StealthGPT Proxy] API error: ${response.status} - ${errorText}`)

      return new Response(
        JSON.stringify({
          success: false,
          error: `StealthGPT API error: ${response.status}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status >= 500 ? 502 : response.status,
        }
      )
    }

    // Parse StealthGPT response
    const data: StealthGptResponse = await response.json()

    if (!data.result) {
      console.error('[StealthGPT Proxy] Empty result from API')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'StealthGPT returned empty result',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log(`[StealthGPT Proxy] Success - Detection score: ${data.howLikelyToBeDetected || 'N/A'}`)

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        result: data.result,
        howLikelyToBeDetected: data.howLikelyToBeDetected,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[StealthGPT Proxy] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
