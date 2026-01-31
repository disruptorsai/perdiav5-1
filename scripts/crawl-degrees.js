/**
 * GetEducated Degrees Database Crawler
 *
 * This script crawls the GetEducated online degrees directory
 * and populates the degrees table for monetization matching.
 *
 * Target URL: https://www.geteducated.com/online-degrees/
 *
 * Usage:
 *   node scripts/crawl-degrees.js
 *
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for direct DB access
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

// Load .env.local file
config({ path: '.env.local' })

// Configuration
const BASE_URL = 'https://www.geteducated.com'
const DEGREES_INDEX = '/online-degrees/'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Degree level mapping
const DEGREE_LEVELS = {
  'associate': { code: 1, name: 'Associate' },
  'bachelor': { code: 2, name: 'Bachelor' },
  'master': { code: 3, name: 'Master' },
  'doctorate': { code: 4, name: 'Doctorate' },
  'doctoral': { code: 4, name: 'Doctorate' },
  'phd': { code: 4, name: 'Doctorate' },
  'certificate': { code: 5, name: 'Certificate' },
  'diploma': { code: 6, name: 'Diploma' },
  'mba': { code: 3, name: 'Master' },
  'msn': { code: 3, name: 'Master' },
  'bsn': { code: 2, name: 'Bachelor' },
  'aas': { code: 1, name: 'Associate' },
}

/**
 * Fetch a page with retry logic
 */
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message)
      if (i === retries - 1) throw error
      await sleep(2000 * (i + 1))
    }
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get category/concentration from subjects table
 */
async function getSubjectMapping(fieldOfStudy, concentration) {
  const { data, error } = await supabase
    .from('subjects')
    .select('category_id, concentration_id')
    .ilike('field_of_study_label', `%${fieldOfStudy}%`)
    .ilike('concentration_label', `%${concentration}%`)
    .limit(1)
    .single()

  if (error || !data) {
    // Try broader match
    const { data: broader } = await supabase
      .from('subjects')
      .select('category_id, concentration_id')
      .ilike('concentration_label', `%${concentration}%`)
      .limit(1)
      .single()

    return broader || null
  }

  return data
}

/**
 * Detect degree level from text
 */
function detectDegreeLevel(text) {
  const textLower = text.toLowerCase()

  for (const [keyword, level] of Object.entries(DEGREE_LEVELS)) {
    if (textLower.includes(keyword)) {
      return level
    }
  }

  return { code: 2, name: 'Bachelor' } // Default
}

/**
 * Get list of degree category pages
 */
async function getDegreeCategoryLinks() {
  console.log('Fetching degrees index...')
  const html = await fetchPage(BASE_URL + DEGREES_INDEX)
  const $ = cheerio.load(html)

  const categoryLinks = []

  // Look for category/subject area links
  // NOTE: Update selectors based on actual HTML structure
  $('a[href*="/online-degrees/"]').each((i, el) => {
    const href = $(el).attr('href')
    const title = $(el).text().trim()

    if (href &&
        !href.endsWith('/online-degrees/') &&
        !categoryLinks.find(c => c.url === href) &&
        title.length > 0) {
      categoryLinks.push({
        url: href.startsWith('http') ? href : BASE_URL + href,
        title: title,
      })
    }
  })

  console.log(`Found ${categoryLinks.length} degree category links`)
  return categoryLinks
}

/**
 * Parse a degree listing page
 */
async function parseDegreeListingPage(pageUrl, categoryTitle) {
  console.log(`Parsing category: ${categoryTitle}`)

  const html = await fetchPage(pageUrl)
  const $ = cheerio.load(html)

  const degrees = []

  // Extract field of study from category title
  const fieldOfStudy = categoryTitle.replace(/online|degrees?|programs?/gi, '').trim()

  // NOTE: Update selectors based on actual HTML structure
  // Look for individual degree/program listings

  $('.degree-listing, .program-item, article, .school-program').each((i, el) => {
    const $item = $(el)

    // Extract program name
    const programName = $item.find('h2, h3, .program-name, .degree-title').first().text().trim()

    // Extract school name
    const schoolName = $item.find('.school-name, .college-name, .university').first().text().trim()

    // Find GetEducated URL
    const degreeLink = $item.find('a[href*="/online-degrees/"]').attr('href')
    const geteducatedUrl = degreeLink ?
      (degreeLink.startsWith('http') ? degreeLink : BASE_URL + degreeLink) :
      null

    // Detect degree level
    const fullText = programName + ' ' + categoryTitle
    const degreeLevel = detectDegreeLevel(fullText)

    // Check for sponsorship
    const isSponsored = $item.find('.sponsored, .featured, .partner').length > 0 ||
                        $item.hasClass('sponsored')

    // Extract sponsorship tier (1=highest, 3=lowest)
    let sponsorshipTier = null
    if (isSponsored) {
      if ($item.hasClass('premium') || $item.find('.premium').length > 0) {
        sponsorshipTier = 1
      } else if ($item.hasClass('featured') || $item.find('.featured').length > 0) {
        sponsorshipTier = 2
      } else {
        sponsorshipTier = 3
      }
    }

    if (programName || schoolName) {
      degrees.push({
        program_name: programName || categoryTitle,
        school_name: schoolName || 'Unknown',
        geteducated_url: geteducatedUrl,
        degree_level: degreeLevel.name,
        degree_level_code: degreeLevel.code,
        category: fieldOfStudy,
        is_sponsored: isSponsored,
        sponsorship_tier: sponsorshipTier,
        is_active: true,
      })
    }
  })

  // Also check for pagination and crawl additional pages
  const nextPage = $('a.next, a[rel="next"], .pagination a:contains("Next")').attr('href')
  if (nextPage) {
    const nextUrl = nextPage.startsWith('http') ? nextPage : BASE_URL + nextPage
    try {
      await sleep(1000)
      const moreDegrees = await parseDegreeListingPage(nextUrl, categoryTitle)
      degrees.push(...moreDegrees)
    } catch (error) {
      console.error(`Error fetching next page:`, error.message)
    }
  }

  return degrees
}

/**
 * Save degree to database
 */
async function saveDegree(degree) {
  try {
    // Try to find matching category/concentration
    const subjectMapping = await getSubjectMapping(
      degree.category,
      degree.program_name
    )

    const degreeData = {
      ...degree,
      category_id: subjectMapping?.category_id || null,
      concentration_id: subjectMapping?.concentration_id || null,
    }

    const { error } = await supabase
      .from('degrees')
      .insert(degreeData)

    if (error) {
      // Duplicate - skip
      if (error.code === '23505') {
        return false
      }
      console.error(`Error saving degree:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error saving degree:`, error)
    return false
  }
}

/**
 * Main crawler function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('GetEducated Degrees Crawler')
  console.log('='.repeat(60))
  console.log()

  try {
    // Get list of degree categories
    const categoryLinks = await getDegreeCategoryLinks()

    if (categoryLinks.length === 0) {
      console.log('No category links found. Check the selectors in getDegreeCategoryLinks().')
      console.log('You may need to inspect the HTML structure of:')
      console.log(BASE_URL + DEGREES_INDEX)
      return
    }

    let totalDegrees = 0
    let savedCount = 0
    let errorCount = 0

    // Process each category
    for (const category of categoryLinks) {
      try {
        const degrees = await parseDegreeListingPage(category.url, category.title)

        console.log(`  Found ${degrees.length} degrees in ${category.title}`)

        for (const degree of degrees) {
          const saved = await saveDegree(degree)
          if (saved) {
            savedCount++
          } else {
            errorCount++
          }
        }

        totalDegrees += degrees.length

        // Rate limiting
        await sleep(1500)

      } catch (error) {
        console.error(`Error processing category ${category.title}:`, error.message)
        errorCount++
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log(`Crawl Complete:`)
    console.log(`  Total degrees found: ${totalDegrees}`)
    console.log(`  Successfully saved: ${savedCount}`)
    console.log(`  Errors/Duplicates: ${errorCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Crawler error:', error)
    process.exit(1)
  }
}

// Run the crawler
main()
