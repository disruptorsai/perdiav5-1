#!/usr/bin/env node
/**
 * Re-humanize articles via Claude Edge Function
 * Usage: node scripts/rehumanize-article.mjs [articleId|all]
 */

const SUPABASE_URL = 'https://nvffvcjtrgxnunncdafz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmZ2Y2p0cmd4bnVubmNkYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NjAyOTUsImV4cCI6MjA3OTUzNjI5NX0.aM5CoKqtxRPpPhGDbVroiT0OOGXyJm2H2SntdK9RsIk'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ANON_KEY}`,
  'apikey': ANON_KEY,
}

async function fetchArticles(articleId) {
  let url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,ai_reasoning`
  if (articleId === 'all') {
    url += `&status=in.(qa_review,ready_to_publish)&order=created_at.asc`
  } else {
    url += `&id=eq.${articleId}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

async function humanizeContent(content) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/claude-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'humanize',
      payload: {
        content,
        targetPerplexity: 'high',
        targetBurstiness: 'high',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Humanize failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  if (!data.success) throw new Error(`Humanize error: ${data.error}`)
  return data.data
}

async function updateArticle(id, content, reasoning) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      content,
      ai_reasoning: reasoning,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Update failed: ${res.status} - ${err}`)
  }
}

async function rehumanize(articleId) {
  console.log(`\nFetching article(s)...`)
  const articles = await fetchArticles(articleId)
  console.log(`Found ${articles.length} article(s) to re-humanize\n`)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const contentLen = article.content?.length || 0
    console.log(`[${i + 1}/${articles.length}] "${article.title}" (${contentLen} chars)`)

    if (!article.content || contentLen < 100) {
      console.log(`  SKIP - content too short`)
      continue
    }

    try {
      console.log(`  Humanizing via Claude...`)
      const humanized = await humanizeContent(article.content)
      console.log(`  Result: ${humanized.length} chars (was ${contentLen})`)

      // Update reasoning
      const updatedReasoning = {
        ...(article.ai_reasoning || {}),
        rehumanization: {
          provider: 'claude',
          rehumanized_at: new Date().toISOString(),
          original_provider: article.ai_reasoning?.decisions?.humanization?.provider || 'unknown',
          original_length: contentLen,
          new_length: humanized.length,
        },
      }

      console.log(`  Updating database...`)
      await updateArticle(article.id, humanized, updatedReasoning)
      console.log(`  ✓ Done!`)
      succeeded++
    } catch (err) {
      console.log(`  ✗ FAILED: ${err.message}`)
      failed++
    }

    // Rate limit between articles
    if (i < articles.length - 1) {
      console.log(`  Waiting 3s...`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`\n=== COMPLETE ===`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${articles.length}`)
}

// Parse args
const articleId = process.argv[2] || 'bd273baf-eb5e-4a1c-beeb-1fe28624bf64'
rehumanize(articleId).catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
