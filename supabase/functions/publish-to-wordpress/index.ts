/**
 * Supabase Edge Function: publish-to-wordpress
 * Publishes articles to WordPress via REST API
 *
 * IMPORTANT: This function now includes server-side validation to prevent
 * publishing articles with unknown shortcodes or missing monetization.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Allowlist of valid shortcode tags
 * MUST match the allowlist in src/services/shortcodeService.js
 */
const ALLOWED_SHORTCODE_TAGS = [
  'ge_monetization',
  'degree_table',
  'degree_offer',
  'ge_internal_link',
  'ge_external_cited',
]

/**
 * Extract all shortcode-like tokens from content
 */
function extractAllShortcodeLikeTokens(content: string): Array<{ tag: string; raw: string; position: number }> {
  if (!content) return []

  const tokens: Array<{ tag: string; raw: string; position: number }> = []
  const shortcodeRegex = /\[(\/?)([\w-]+)([^\]]*)\]/gi
  let match

  while ((match = shortcodeRegex.exec(content)) !== null) {
    tokens.push({
      raw: match[0],
      tag: match[2].toLowerCase(),
      position: match.index,
    })
  }

  return tokens
}

/**
 * Find unknown shortcodes in content
 */
function findUnknownShortcodes(content: string): Array<{ tag: string; raw: string }> {
  const allTokens = extractAllShortcodeLikeTokens(content)
  return allTokens.filter(token => !ALLOWED_SHORTCODE_TAGS.includes(token.tag))
}

/**
 * Check if content has monetization shortcodes
 */
function hasMonetizationShortcodes(content: string): boolean {
  if (!content) return false
  const monetizationTags = ['ge_monetization', 'degree_table', 'degree_offer']
  const tokens = extractAllShortcodeLikeTokens(content)
  return tokens.some(token => monetizationTags.includes(token.tag))
}

/**
 * Validate article content before publishing
 */
function validateContentForPublish(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for unknown shortcodes
  const unknownShortcodes = findUnknownShortcodes(content)
  if (unknownShortcodes.length > 0) {
    const uniqueTags = [...new Set(unknownShortcodes.map(s => s.tag))]
    errors.push(`Unknown shortcode(s) detected: ${uniqueTags.join(', ')}. These are not valid GetEducated shortcodes and cannot be published.`)
  }

  // Check for monetization shortcodes
  if (!hasMonetizationShortcodes(content)) {
    errors.push('Article has no monetization shortcodes (degree_table or degree_offer). Cannot publish without monetization.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleId, connectionId } = await req.json()

    if (!articleId || !connectionId) {
      throw new Error('Missing required parameters: articleId and connectionId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch the article
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleError?.message}`)
    }

    // VALIDATION: Check content before publishing
    // This is a server-side guardrail - even if client-side validation is bypassed,
    // we will not publish invalid content
    if (article.content) {
      const validation = validateContentForPublish(article.content)
      if (!validation.isValid) {
        console.error('Content validation failed:', validation.errors)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Content validation failed',
            validationErrors: validation.errors,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Article has no content',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch WordPress connection
    const { data: connection, error: connError } = await supabaseClient
      .from('wordpress_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connError || !connection) {
      throw new Error(`WordPress connection not found: ${connError?.message}`)
    }

    if (!connection.is_active) {
      throw new Error('WordPress connection is not active')
    }

    console.log('Publishing article to WordPress:', article.title)

    // Prepare WordPress post data
    const postData = {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      status: connection.default_post_status || 'draft',
      meta: {
        _yoast_wpseo_title: article.meta_title || article.title,
        _yoast_wpseo_metadesc: article.meta_description || article.excerpt,
        _yoast_wpseo_focuskw: article.focus_keyword || '',
      },
    }

    if (connection.default_category_id) {
      postData.categories = [connection.default_category_id]
    }

    // Authenticate based on auth type
    let authHeader = ''
    if (connection.auth_type === 'basic_auth' || connection.auth_type === 'application_password') {
      const credentials = btoa(`${connection.username}:${connection.password}`)
      authHeader = `Basic ${credentials}`
    } else if (connection.auth_type === 'jwt') {
      // JWT would require additional token endpoint call
      throw new Error('JWT authentication not yet implemented')
    }

    // Publish to WordPress
    const wpResponse = await fetch(`${connection.site_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(postData),
    })

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text()
      throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`)
    }

    const wpPost = await wpResponse.json()

    // Update article in database
    const { error: updateError } = await supabaseClient
      .from('articles')
      .update({
        wordpress_post_id: wpPost.id,
        published_url: wpPost.link,
        published_at: new Date().toISOString(),
        status: 'published',
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Error updating article:', updateError)
      // Don't throw - post was successful
    }

    console.log('Article published successfully:', wpPost.link)

    return new Response(
      JSON.stringify({
        success: true,
        wordpress_post_id: wpPost.id,
        published_url: wpPost.link,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('WordPress publishing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
