/**
 * Supabase Edge Function: auto-publish-scheduler
 *
 * Runs on a schedule (via pg_cron or external trigger) to auto-publish
 * articles that have passed their deadline.
 *
 * Logic:
 * 1. Query articles with status = 'ready_to_publish' AND autopublish_deadline <= NOW()
 * 2. Check risk level is LOW and quality score >= threshold
 * 3. Skip articles that have been human-reviewed (they need manual publish)
 * 4. POST to webhook for each eligible article
 * 5. Update article status to 'published'
 *
 * To schedule this function, use pg_cron in Supabase:
 *
 * -- Run every 15 minutes
 * SELECT cron.schedule(
 *   'auto-publish-articles',
 *   '0,15,30,45 * * * *',
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-publish-scheduler',
 *     headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
 *     body := '{}'::jsonb
 *   ) as request_id;
 *   $$
 * );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Webhook URL for publishing (n8n or direct WordPress)
const PUBLISH_WEBHOOK_URL = Deno.env.get('PUBLISH_WEBHOOK_URL') ||
  'https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79'

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  maxRiskLevel: 'LOW',
  minQualityScore: 80,
  maxArticlesPerRun: 10,
}

/**
 * Risk level comparison helper
 */
function isRiskLevelAcceptable(articleRisk: string, maxAllowed: string): boolean {
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const articleIndex = riskLevels.indexOf(articleRisk?.toUpperCase() || 'LOW')
  const maxIndex = riskLevels.indexOf(maxAllowed?.toUpperCase() || 'LOW')
  return articleIndex <= maxIndex
}

/**
 * Build webhook payload for article
 */
function buildWebhookPayload(article: any): Record<string, any> {
  return {
    article_id: article.id,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    slug: article.slug,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    focus_keyword: article.focus_keyword,
    contributor_name: article.article_contributors?.display_name ||
      article.article_contributors?.name ||
      article.contributor_name,
    contributor_slug: article.article_contributors?.author_page_url,
    faqs: article.faqs,
    quality_score: article.quality_score,
    word_count: article.word_count,
    status: 'publish',
    auto_published: true,
    published_at: new Date().toISOString(),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    articlesChecked: 0,
    articlesPublished: 0,
    articlesFailed: 0,
    articlesSkipped: 0,
    details: [] as any[],
    duration: 0,
  }

  try {
    // Initialize Supabase client with service role for scheduled jobs
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // For scheduled jobs, use service role key if available
    // Otherwise fall back to auth header for manual invocation
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || (Deno.env.get('SUPABASE_ANON_KEY') ?? ''),
      supabaseServiceKey ? undefined : {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    )

    // Fetch auto-publish settings
    const { data: settingsData } = await supabaseClient
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'enable_auto_publish',
        'auto_publish_days',
        'block_high_risk_publish',
        'quality_threshold_publish',
      ])

    const settings = { ...DEFAULT_SETTINGS }

    for (const setting of settingsData || []) {
      switch (setting.key) {
        case 'enable_auto_publish':
          settings.enabled = setting.value === 'true' || setting.value === true
          break
        case 'block_high_risk_publish':
          settings.maxRiskLevel = (setting.value === 'true' || setting.value === true)
            ? 'LOW'
            : 'MEDIUM'
          break
        case 'quality_threshold_publish':
          settings.minQualityScore = parseInt(setting.value, 10) || 80
          break
      }
    }

    // Check if auto-publish is enabled
    if (!settings.enabled) {
      results.details.push({
        type: 'info',
        message: 'Auto-publish is disabled in system settings',
      })
      results.duration = Date.now() - startTime

      return new Response(
        JSON.stringify(results),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get current time
    const now = new Date().toISOString()

    // Query eligible articles
    const { data: articles, error: queryError } = await supabaseClient
      .from('articles')
      .select('*, article_contributors(*)')
      .eq('status', 'ready_to_publish')
      .lte('autopublish_deadline', now)
      .or('human_reviewed.is.null,human_reviewed.eq.false')
      .order('autopublish_deadline', { ascending: true })
      .limit(settings.maxArticlesPerRun)

    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`)
    }

    results.articlesChecked = articles?.length || 0

    if (!articles || articles.length === 0) {
      results.details.push({
        type: 'info',
        message: 'No articles eligible for auto-publish',
      })
      results.duration = Date.now() - startTime

      return new Response(
        JSON.stringify(results),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`[Auto-Publish] Found ${articles.length} eligible articles`)

    // Process each article
    for (const article of articles) {
      // Check risk level
      if (!isRiskLevelAcceptable(article.risk_level, settings.maxRiskLevel)) {
        results.articlesSkipped++
        results.details.push({
          type: 'skipped',
          articleId: article.id,
          title: article.title,
          reason: `Risk level ${article.risk_level} exceeds maximum ${settings.maxRiskLevel}`,
        })
        continue
      }

      // Check quality score
      if (article.quality_score < settings.minQualityScore) {
        results.articlesSkipped++
        results.details.push({
          type: 'skipped',
          articleId: article.id,
          title: article.title,
          reason: `Quality score ${article.quality_score} below minimum ${settings.minQualityScore}`,
        })
        continue
      }

      // Check contributor (must be one of the 4 approved authors)
      const APPROVED_AUTHORS = ['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity']
      const contributorName = article.article_contributors?.name || article.contributor_name
      if (contributorName && !APPROVED_AUTHORS.includes(contributorName)) {
        results.articlesSkipped++
        results.details.push({
          type: 'skipped',
          articleId: article.id,
          title: article.title,
          reason: `Unauthorized author: ${contributorName}`,
        })
        continue
      }

      // Attempt to publish via webhook
      try {
        const payload = buildWebhookPayload(article)

        const webhookResponse = await fetch(PUBLISH_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          throw new Error(`Webhook error: ${webhookResponse.status} - ${errorText}`)
        }

        const webhookResult = await webhookResponse.json().catch(() => ({}))

        // Update article status in database
        const { error: updateError } = await supabaseClient
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            wordpress_post_id: webhookResult.post_id || null,
            published_url: webhookResult.published_url || null,
          })
          .eq('id', article.id)

        if (updateError) {
          console.error(`[Auto-Publish] Error updating article ${article.id}:`, updateError)
        }

        results.articlesPublished++
        results.details.push({
          type: 'published',
          articleId: article.id,
          title: article.title,
          webhookResponse: webhookResult,
        })

        console.log(`[Auto-Publish] Published: ${article.title}`)

      } catch (publishError) {
        results.articlesFailed++
        results.details.push({
          type: 'failed',
          articleId: article.id,
          title: article.title,
          error: publishError.message,
        })

        console.error(`[Auto-Publish] Failed to publish ${article.title}:`, publishError)
      }
    }

    results.duration = Date.now() - startTime

    console.log(`[Auto-Publish] Complete. Published: ${results.articlesPublished}, Failed: ${results.articlesFailed}, Skipped: ${results.articlesSkipped}`)

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[Auto-Publish] Error:', error)

    results.duration = Date.now() - startTime
    results.details.push({
      type: 'error',
      message: error.message,
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
