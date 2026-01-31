/**
 * GetEducated Schools Database Crawler
 *
 * This script crawls the GetEducated online schools directory
 * and populates the schools table for internal linking.
 *
 * Target URL: https://www.geteducated.com/online-schools/
 *
 * Usage:
 *   node scripts/crawl-schools.js
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
const SCHOOLS_INDEX = '/online-schools/'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
 * Get list of school page links from index/listing pages
 */
async function getSchoolLinks() {
  console.log('Fetching schools index...')
  const html = await fetchPage(BASE_URL + SCHOOLS_INDEX)
  const $ = cheerio.load(html)

  const schoolLinks = []

  // NOTE: Update selectors based on actual HTML structure
  // Look for links to individual school pages
  $('a[href*="/online-schools/"]').each((i, el) => {
    const href = $(el).attr('href')
    const title = $(el).text().trim()

    // Skip index page and already found links
    if (href && href !== SCHOOLS_INDEX &&
        !href.endsWith('/online-schools/') &&
        !schoolLinks.find(s => s.url === href)) {
      schoolLinks.push({
        url: href.startsWith('http') ? href : BASE_URL + href,
        title: title || 'Unknown School',
      })
    }
  })

  // Also look for alphabetical listing pages
  const letterPages = []
  $('a[href*="/online-schools/"]').each((i, el) => {
    const href = $(el).attr('href')
    if (href && href.match(/\/online-schools\/[a-z]\/?$/i)) {
      letterPages.push(href.startsWith('http') ? href : BASE_URL + href)
    }
  })

  // Crawl letter pages for more schools
  for (const letterPage of letterPages) {
    try {
      console.log(`  Checking ${letterPage}...`)
      const letterHtml = await fetchPage(letterPage)
      const $$ = cheerio.load(letterHtml)

      $$('a[href*="/online-schools/"]').each((i, el) => {
        const href = $$(el).attr('href')
        const title = $$(el).text().trim()

        if (href && !href.match(/\/online-schools\/[a-z]\/?$/i) &&
            !href.endsWith('/online-schools/') &&
            !schoolLinks.find(s => s.url === href)) {
          schoolLinks.push({
            url: href.startsWith('http') ? href : BASE_URL + href,
            title: title || 'Unknown School',
          })
        }
      })

      await sleep(1000)
    } catch (error) {
      console.error(`Error fetching letter page ${letterPage}:`, error.message)
    }
  }

  console.log(`Found ${schoolLinks.length} school links`)
  return schoolLinks
}

/**
 * Parse a single school page
 */
async function parseSchoolPage(schoolUrl, schoolTitle) {
  console.log(`Parsing: ${schoolTitle}`)

  const html = await fetchPage(schoolUrl)
  const $ = cheerio.load(html)

  // Extract school information
  // NOTE: Update selectors based on actual HTML structure

  // Look for school name in various places
  const schoolName = $('h1').first().text().trim() ||
                    $('.school-name').first().text().trim() ||
                    schoolTitle

  // Check for sponsored/paid client indicators
  const isSponsored = $('.sponsored, .featured, .partner').length > 0 ||
                      $('body').text().toLowerCase().includes('sponsored')
  const isPaidClient = $('.paid-partner, .client').length > 0

  // Try to find accreditation info
  const accreditationText = $('.accreditation, .accredited-by').text().trim()
  let accreditation = null
  if (accreditationText) {
    // Extract common accreditation abbreviations
    const accredMatches = accreditationText.match(/\b(HLC|MSCHE|NECHE|NWCCU|SACSCOC|WASC|WSCUC|AACSB|ABET|CCNE|CAEP)\b/gi)
    if (accredMatches) {
      accreditation = [...new Set(accredMatches.map(a => a.toUpperCase()))].join(', ')
    }
  }

  // Check for school logo
  const hasLogo = $('img[src*="logo"], img.school-logo, .school-logo img').length > 0

  // Try to find state/location
  const locationText = $('.location, .school-location, address').text().trim()
  const stateMatch = locationText.match(/\b([A-Z]{2})\b/)
  const locationState = stateMatch ? stateMatch[1] : null

  // Generate slug from school name
  const schoolSlug = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown'

  return {
    school_name: schoolName,
    school_slug: schoolSlug,
    geteducated_url: schoolUrl,
    is_sponsored: isSponsored,
    is_paid_client: isPaidClient,
    has_logo: hasLogo,
    accreditation: accreditation,
    location_state: locationState,
    is_active: true,
  }
}

/**
 * Save school to database
 */
async function saveSchool(school) {
  try {
    const { error } = await supabase
      .from('schools')
      .upsert(school, {
        onConflict: 'school_slug',
      })

    if (error) {
      console.error(`Error saving ${school.school_name}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error saving school ${school.school_name}:`, error)
    return false
  }
}

/**
 * Main crawler function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('GetEducated Schools Crawler')
  console.log('='.repeat(60))
  console.log()

  try {
    // Get list of schools
    const schoolLinks = await getSchoolLinks()

    if (schoolLinks.length === 0) {
      console.log('No school links found. Check the selectors in getSchoolLinks().')
      console.log('You may need to inspect the HTML structure of:')
      console.log(BASE_URL + SCHOOLS_INDEX)
      return
    }

    let savedCount = 0
    let errorCount = 0

    // Process each school
    for (let i = 0; i < schoolLinks.length; i++) {
      const link = schoolLinks[i]

      try {
        const school = await parseSchoolPage(link.url, link.title)
        const saved = await saveSchool(school)

        if (saved) {
          savedCount++
          process.stdout.write(`  [${i + 1}/${schoolLinks.length}] Saved: ${school.school_name}\r`)
        } else {
          errorCount++
        }

        // Rate limiting
        await sleep(1000)

      } catch (error) {
        console.error(`Error processing ${link.title}:`, error.message)
        errorCount++
      }

      // Progress update every 50 schools
      if ((i + 1) % 50 === 0) {
        console.log(`\nProgress: ${i + 1}/${schoolLinks.length} processed, ${savedCount} saved, ${errorCount} errors`)
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log(`Crawl Complete: ${savedCount} schools saved, ${errorCount} errors`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Crawler error:', error)
    process.exit(1)
  }
}

// Run the crawler
main()
