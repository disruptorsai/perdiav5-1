/**
 * Batch Recalculate Quality Scores
 *
 * Runs the new simplified quality score algorithm on all existing articles.
 *
 * Usage: node scripts/recalculate-quality-scores.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Blocked competitors list
const BLOCKED_COMPETITORS = [
  'onlineu.com', 'usnews.com', 'affordablecollegesonline.com',
  'toponlinecollegesusa.com', 'bestcolleges.com', 'niche.com',
  'collegeconfidential.com', 'cappex.com', 'collegeraptor.com',
  'collegesimply.com', 'graduateguide.com', 'gradschools.com',
  'petersons.com', 'princetonreview.com', 'collegexpress.com',
]

// Default thresholds
const THRESHOLDS = {
  minWordCount: 800,
  maxWordCount: 2500,
  minInternalLinks: 3,
  minExternalLinks: 1,
  requireHeadings: true,
  minHeadingCount: 3,
}

/**
 * Extract links from HTML content
 */
function extractLinks(content) {
  if (!content) return []
  const links = []
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }
  return links
}

/**
 * Validate a single URL
 */
function validateLink(url) {
  if (!url || url.startsWith('#') || url.startsWith('/')) {
    return { isValid: true, type: url?.startsWith('/') ? 'internal' : 'anchor' }
  }

  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.toLowerCase()
  } catch {
    return { isValid: false, type: 'invalid' }
  }

  // Check if internal
  if (domain.includes('geteducated.com')) {
    return { isValid: true, type: 'internal' }
  }

  // Check for .edu
  if (domain.endsWith('.edu')) {
    return { isValid: false, type: 'external', blocked: true }
  }

  // Check for competitors
  for (const competitor of BLOCKED_COMPETITORS) {
    if (domain === competitor || domain.endsWith('.' + competitor)) {
      return { isValid: false, type: 'external', blocked: true }
    }
  }

  return { isValid: true, type: 'external' }
}

/**
 * Calculate quality score for an article
 */
function calculateQualityScore(content, article) {
  if (!content) {
    return { score: 0, checks: {}, issues: [], canPublish: false }
  }

  const t = THRESHOLDS

  // Word count
  const plainText = content.replace(/<[^>]*>/g, '')
  const wordCount = plainText.split(/\s+/).filter(w => w).length

  // Links analysis
  const links = extractLinks(content)
  let internalLinks = 0
  let externalLinks = 0
  let bannedLinks = []

  for (const url of links) {
    const validation = validateLink(url)
    if (validation.type === 'internal') {
      internalLinks++
    } else if (validation.type === 'external') {
      if (validation.blocked) {
        bannedLinks.push(url)
      } else {
        externalLinks++
      }
    }
  }

  // Headings
  const h2Count = (content.match(/<h2/gi) || []).length
  const h3Count = (content.match(/<h3/gi) || []).length
  const totalHeadings = h2Count + h3Count

  // Author
  const hasAuthor = !!(article?.contributor_id)

  // Build checks
  const checks = {
    wordCount: {
      passed: wordCount >= t.minWordCount && wordCount <= t.maxWordCount,
      critical: false,
    },
    internalLinks: {
      passed: internalLinks >= t.minInternalLinks,
      critical: true,
    },
    externalLinks: {
      passed: externalLinks >= t.minExternalLinks,
      critical: false,
    },
    headings: {
      passed: totalHeadings >= t.minHeadingCount,
      critical: false,
    },
    bannedLinks: {
      passed: bannedLinks.length === 0,
      critical: true,
    },
    authorAssigned: {
      passed: hasAuthor,
      critical: false,
    },
  }

  // Calculate score
  const totalChecks = Object.keys(checks).length
  const passedChecks = Object.values(checks).filter(c => c.passed).length
  const score = Math.round((passedChecks / totalChecks) * 100)

  // Check critical failures
  const criticalFailed = Object.values(checks).some(c => c.critical && !c.passed)

  // Build issues
  const issues = []
  if (!checks.wordCount.passed) {
    issues.push({ description: `Word count: ${wordCount} (target: ${t.minWordCount}-${t.maxWordCount})`, critical: false })
  }
  if (!checks.internalLinks.passed) {
    issues.push({ description: `Internal links: ${internalLinks} (need ${t.minInternalLinks}+)`, critical: true })
  }
  if (!checks.externalLinks.passed) {
    issues.push({ description: `External citations: ${externalLinks} (need ${t.minExternalLinks}+)`, critical: false })
  }
  if (!checks.headings.passed) {
    issues.push({ description: `Headings: ${totalHeadings} (need ${t.minHeadingCount}+)`, critical: false })
  }
  if (!checks.bannedLinks.passed) {
    issues.push({ description: `Banned links found: ${bannedLinks.slice(0, 3).join(', ')}`, critical: true })
  }
  if (!checks.authorAssigned.passed) {
    issues.push({ description: 'No author assigned', critical: false })
  }

  return { score, issues, canPublish: !criticalFailed, word_count: wordCount }
}

async function main() {
  console.log('🔄 Fetching articles from database...')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, content, contributor_id, quality_score, title')
    .not('content', 'is', null)

  if (error) {
    console.error('Failed to fetch articles:', error)
    process.exit(1)
  }

  console.log(`📊 Found ${articles.length} articles to recalculate\n`)

  let updated = 0
  let unchanged = 0
  let errors = 0

  for (const article of articles) {
    const result = calculateQualityScore(article.content, article)
    const oldScore = article.quality_score || 0
    const newScore = result.score

    if (oldScore !== newScore) {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          quality_score: newScore,
          quality_issues: result.issues,
        })
        .eq('id', article.id)

      if (updateError) {
        console.error(`  ❌ Error updating "${article.title?.slice(0, 40)}...": ${updateError.message}`)
        errors++
      } else {
        const change = newScore - oldScore
        const arrow = change > 0 ? '↑' : '↓'
        console.log(`  ${arrow} "${article.title?.slice(0, 50)}..." ${oldScore} → ${newScore} (${change > 0 ? '+' : ''}${change})`)
        updated++
      }
    } else {
      unchanged++
    }
  }

  console.log('\n✅ Recalculation complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   Unchanged: ${unchanged}`)
  console.log(`   Errors: ${errors}`)
}

main().catch(console.error)
