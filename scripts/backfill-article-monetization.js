#!/usr/bin/env node

/**
 * Article Monetization Backfill Script
 *
 * Processes all existing articles to add monetization shortcodes
 * or mark them for review if they don't comply with new rules.
 *
 * Usage:
 *   node scripts/backfill-article-monetization.js --dry-run    # Preview changes
 *   node scripts/backfill-article-monetization.js --execute    # Apply changes
 *   node scripts/backfill-article-monetization.js --limit 10   # Process only 10 articles
 *
 * Environment:
 *   Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run') || !args.includes('--execute')
const limitArg = args.find(a => a.startsWith('--limit'))
const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1]) : null

console.log('==========================================')
console.log('  Article Monetization Backfill Script')
console.log('==========================================')
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`)
if (limit) console.log(`Limit: ${limit} articles`)
console.log('')

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  console.error('Make sure you have a .env.local file with these values')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Legacy notice for articles that can't be monetized
const LEGACY_ARTICLE_NOTE = `
<div class="legacy-article-notice" style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
  <strong>⚠️ Pre-Monetization Article</strong>
  <p style="margin: 8px 0 0 0; font-size: 14px;">
    This article was generated before the current monetization and content rules were implemented.
    It requires manual review and updates to meet GetEducated publishing standards.
  </p>
</div>
`

/**
 * Match topic to monetization category
 */
async function matchTopicToCategory(topic, degreeLevel = null) {
  if (!topic) {
    return { matched: false, error: 'No topic provided' }
  }

  const topicLower = topic.toLowerCase()

  // Fetch all active categories
  const { data: categories, error } = await supabase
    .from('monetization_categories')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return { matched: false, error: error.message }
  }

  // Score each category
  const scoredCategories = categories.map(cat => {
    let score = 0
    const categoryLower = cat.category.toLowerCase()
    const concentrationLower = cat.concentration.toLowerCase()

    // Exact concentration match (highest priority)
    if (topicLower.includes(concentrationLower)) {
      score += 100
    }

    // Exact category match
    if (topicLower.includes(categoryLower)) {
      score += 50
    }

    // Word-level matching for concentration
    const concentrationWords = concentrationLower.split(/\s+/)
    const topicWords = topicLower.split(/\s+/)

    for (const word of concentrationWords) {
      if (word.length > 3 && topicWords.some(tw => tw.includes(word) || word.includes(tw))) {
        score += 25
      }
    }

    // Word-level matching for category
    const categoryWords = categoryLower.split(/\s+/)
    for (const word of categoryWords) {
      if (word.length > 3 && topicWords.some(tw => tw.includes(word) || word.includes(tw))) {
        score += 15
      }
    }

    return { ...cat, score }
  })

  // Sort by score
  scoredCategories.sort((a, b) => b.score - a.score)
  const bestMatch = scoredCategories[0]

  if (!bestMatch || bestMatch.score === 0) {
    return { matched: false, error: 'No matching category found' }
  }

  // Get degree level code if provided
  let degreeLevelCode = null
  if (degreeLevel) {
    const { data: level } = await supabase
      .from('monetization_levels')
      .select('level_code')
      .ilike('level_name', `%${degreeLevel}%`)
      .single()

    if (level) {
      degreeLevelCode = level.level_code
    }
  }

  return {
    matched: true,
    categoryId: bestMatch.category_id,
    concentrationId: bestMatch.concentration_id,
    category: bestMatch,
    degreeLevelCode,
    confidence: bestMatch.score > 75 ? 'high' : bestMatch.score > 40 ? 'medium' : 'low',
    score: bestMatch.score,
  }
}

/**
 * Extract degree level from article content
 */
function extractDegreeLevelFromContent(article) {
  const text = `${article.title || ''} ${article.seo_title || ''} ${article.content || ''}`.toLowerCase()

  if (text.includes('associate')) return 'Associate'
  if (text.includes("bachelor's") || text.includes('bachelor') || text.includes('baccalaureate')) return "Bachelor's"
  if (text.includes("master's") || text.includes('master') || text.includes('mba') || text.includes('msn')) return "Master's"
  if (text.includes('doctorate') || text.includes('doctoral') || text.includes('phd') || text.includes('dnp')) return 'Doctorate'
  if (text.includes('certificate') || text.includes('certification')) return 'Certificate'

  return null
}

/**
 * Build CTA URL from match
 */
function buildCtaUrlFromMatch(match) {
  let url = '/online-degrees/'

  if (match.degreeLevelCode) {
    const levelSlugs = {
      1: 'associate',
      2: 'bachelor',
      3: 'bachelor',
      4: 'master',
      5: 'doctorate',
      6: 'certificate',
    }
    const levelSlug = levelSlugs[match.degreeLevelCode]
    if (levelSlug) url += `${levelSlug}/`
  }

  if (match.category) {
    const categorySlug = match.category.category?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
    const concentrationSlug = match.category.concentration?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
    if (categorySlug) url += `${categorySlug}/`
    if (concentrationSlug) url += `${concentrationSlug}/`
  }

  return url
}

/**
 * Generate GE Picks shortcode
 */
function generateGePicksShortcode(params) {
  const {
    category,
    concentration,
    level,
    header = "GetEducated's Picks",
    ctaButton = "View More Degrees",
    ctaUrl,
  } = params

  let shortcode = `[su_ge-picks category="${category}" concentration="${concentration}"`

  if (level) {
    shortcode += ` level="${level}"`
  }

  shortcode += ` header="${header}"`
  shortcode += ` cta-button="${ctaButton}"`

  if (ctaUrl) {
    shortcode += ` cta-url="${ctaUrl}"`
  }

  shortcode += `][/su_ge-picks]`

  return shortcode
}

/**
 * Generate Quick Degree Find shortcode
 */
function generateQuickDegreeFindShortcode(params = {}) {
  const { type = 'simple', header = 'Browse Now' } = params
  return `[su_ge-qdf type="${type}" header="${header}"][/su_ge-qdf]`
}

/**
 * Insert shortcode into content
 */
function insertShortcodeInContent(content, shortcode, position = 'after_intro') {
  if (!content || !shortcode) return content

  const wrappedShortcode = `\n<p class="monetization-block">${shortcode}</p>\n`

  switch (position) {
    case 'after_intro': {
      const firstParagraphEnd = content.indexOf('</p>')
      if (firstParagraphEnd !== -1) {
        return content.slice(0, firstParagraphEnd + 4) + wrappedShortcode + content.slice(firstParagraphEnd + 4)
      }
      return wrappedShortcode + content
    }

    case 'mid_content': {
      const h2Matches = [...content.matchAll(/<h2[^>]*>.*?<\/h2>/gi)]
      if (h2Matches.length >= 2) {
        const midIndex = Math.floor(h2Matches.length / 2)
        const midH2 = h2Matches[midIndex]
        const insertPos = midH2.index + midH2[0].length
        return content.slice(0, insertPos) + wrappedShortcode + content.slice(insertPos)
      }
      const midPoint = Math.floor(content.length / 2)
      const nextParagraph = content.indexOf('</p>', midPoint)
      if (nextParagraph !== -1) {
        return content.slice(0, nextParagraph + 4) + wrappedShortcode + content.slice(nextParagraph + 4)
      }
      return content + wrappedShortcode
    }

    default:
      return content + wrappedShortcode
  }
}

/**
 * Check if content already has monetization
 */
function hasMonetization(content) {
  if (!content) return false
  return /\[su_ge-picks/.test(content) || /\[su_ge-qdf/.test(content)
}

/**
 * Create article_monetization record
 */
async function createMonetizationRecord(articleId, match, shortcodeOutput) {
  // Get category UUID
  const { data: category } = await supabase
    .from('monetization_categories')
    .select('id')
    .eq('category_id', match.categoryId)
    .eq('concentration_id', match.concentrationId)
    .single()

  if (!category) return

  // Get level UUID
  let levelId = null
  if (match.degreeLevelCode) {
    const { data: level } = await supabase
      .from('monetization_levels')
      .select('id')
      .eq('level_code', match.degreeLevelCode)
      .single()

    if (level) levelId = level.id
  }

  // Check for existing record
  const { data: existing } = await supabase
    .from('article_monetization')
    .select('id')
    .eq('article_id', articleId)
    .single()

  if (existing) {
    await supabase
      .from('article_monetization')
      .update({
        category_id: category.id,
        level_id: levelId,
        shortcode_output: shortcodeOutput,
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('article_monetization')
      .insert({
        article_id: articleId,
        category_id: category.id,
        level_id: levelId,
        position_in_article: 'after_intro',
        shortcode_output: shortcodeOutput,
      })
  }
}

/**
 * Mark article for review
 */
async function markArticleForReview(article, reason) {
  const updatedContent = LEGACY_ARTICLE_NOTE + (article.content || '')

  await supabase
    .from('articles')
    .update({
      status: 'qa_review',
      content: updatedContent,
      risk_level: 'HIGH',
      updated_at: new Date().toISOString(),
      quality_score_details: {
        ...(article.quality_score_details || {}),
        backfill_review_reason: reason,
        backfill_date: new Date().toISOString(),
        needs_manual_monetization: true,
      },
    })
    .eq('id', article.id)
}

/**
 * Process a single article
 */
async function processArticle(article) {
  const result = {
    id: article.id,
    title: article.title || article.seo_title || 'Untitled',
    status: 'pending',
    action: null,
    reason: null,
  }

  try {
    // Skip published articles
    if (article.status === 'published') {
      result.status = 'skipped'
      result.action = 'none'
      result.reason = 'Already published - manual review required'
      return result
    }

    // Check if already monetized
    if (hasMonetization(article.content)) {
      result.status = 'skipped'
      result.action = 'none'
      result.reason = 'Already has monetization shortcodes'
      return result
    }

    // Match topic to category
    const topic = article.title || article.seo_title || ''
    const degreeLevel = extractDegreeLevelFromContent(article)
    const match = await matchTopicToCategory(topic, degreeLevel)

    if (!match.matched) {
      result.status = 'marked_for_review'
      result.action = 'add_note'
      result.reason = `No matching category: ${match.error}`

      if (!isDryRun) {
        await markArticleForReview(article, result.reason)
      }
      return result
    }

    // Low confidence match needs review
    if (match.confidence === 'low') {
      result.status = 'marked_for_review'
      result.action = 'add_note'
      result.reason = `Low confidence match (score: ${match.score}) to "${match.category.concentration}"`

      if (!isDryRun) {
        await markArticleForReview(article, result.reason)
      }
      return result
    }

    // Generate shortcode
    const ctaUrl = buildCtaUrlFromMatch(match)
    const shortcode = generateGePicksShortcode({
      category: match.categoryId,
      concentration: match.concentrationId,
      level: match.degreeLevelCode,
      header: "GetEducated's Picks",
      ctaButton: "View More Degrees",
      ctaUrl,
    })

    // Insert shortcode
    let updatedContent = article.content || ''
    updatedContent = insertShortcodeInContent(updatedContent, shortcode, 'after_intro')

    // Add QDF for long articles
    const wordCount = (updatedContent.match(/\S+/g) || []).length
    if (wordCount > 1500) {
      const qdfShortcode = generateQuickDegreeFindShortcode({ type: 'simple', header: 'Find Your Degree' })
      updatedContent = insertShortcodeInContent(updatedContent, qdfShortcode, 'mid_content')
    }

    // Update article
    if (!isDryRun) {
      await supabase
        .from('articles')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      await createMonetizationRecord(article.id, match, shortcode)
    }

    result.status = 'updated'
    result.action = 'monetized'
    result.reason = `Matched to ${match.category.concentration} (${match.confidence})`

    return result

  } catch (error) {
    result.status = 'error'
    result.action = 'none'
    result.reason = error.message
    return result
  }
}

/**
 * Main backfill function
 */
async function runBackfill() {
  const stats = {
    processed: 0,
    updated: 0,
    markedForReview: 0,
    skipped: 0,
    errors: 0,
  }

  console.log('Fetching articles...')

  // Fetch articles
  let query = supabase
    .from('articles')
    .select('*')
    .in('status', ['idea', 'drafting', 'refinement', 'qa_review', 'ready_to_publish'])
    .order('created_at', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: articles, error } = await query

  if (error) {
    console.error('ERROR: Failed to fetch articles:', error.message)
    process.exit(1)
  }

  if (!articles || articles.length === 0) {
    console.log('No articles found to process.')
    return
  }

  console.log(`Found ${articles.length} articles to process.`)
  console.log('')

  // Process each article
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const progress = `[${i + 1}/${articles.length}]`

    const result = await processArticle(article)
    stats.processed++

    const title = result.title.length > 50 ? result.title.substring(0, 47) + '...' : result.title
    const icon = result.status === 'updated' ? '✓' :
                 result.status === 'marked_for_review' ? '!' :
                 result.status === 'skipped' ? '-' : 'x'

    console.log(`${progress} ${icon} ${title}`)
    if (result.reason) {
      console.log(`        └─ ${result.reason}`)
    }

    switch (result.status) {
      case 'updated': stats.updated++; break
      case 'marked_for_review': stats.markedForReview++; break
      case 'skipped': stats.skipped++; break
      case 'error': stats.errors++; break
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Summary
  console.log('')
  console.log('==========================================')
  console.log('  SUMMARY')
  console.log('==========================================')
  console.log(`Mode:              ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Processed:         ${stats.processed}`)
  console.log(`Updated:           ${stats.updated}`)
  console.log(`Marked for Review: ${stats.markedForReview}`)
  console.log(`Skipped:           ${stats.skipped}`)
  console.log(`Errors:            ${stats.errors}`)
  console.log('==========================================')

  if (isDryRun && (stats.updated > 0 || stats.markedForReview > 0)) {
    console.log('')
    console.log('This was a DRY RUN. To apply changes, run:')
    console.log('  node scripts/backfill-article-monetization.js --execute')
  }
}

// Run the backfill
runBackfill().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
