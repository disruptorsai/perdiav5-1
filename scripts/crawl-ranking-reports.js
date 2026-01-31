/**
 * GetEducated Ranking Reports Crawler
 *
 * This script crawls GetEducated ranking report pages and extracts
 * program cost data for the RAG system.
 *
 * Target URL: https://www.geteducated.com/online-college-ratings-and-rankings/
 *
 * Usage:
 *   node scripts/crawl-ranking-reports.js
 *
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for direct DB access
 *
 * NOTE: This script requires manual review of the actual HTML structure
 * of GetEducated ranking pages. The selectors below are placeholders
 * and should be updated based on actual page structure.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

// Load .env.local file
config({ path: '.env.local' })

// Configuration
const BASE_URL = 'https://www.geteducated.com'
const RANKINGS_INDEX = '/online-college-ratings-and-rankings/'

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
      await sleep(2000 * (i + 1)) // Exponential backoff
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
 * Parse price string to number
 */
function parsePrice(priceStr) {
  if (!priceStr) return null
  // Remove $ and commas, parse as integer
  const cleaned = priceStr.replace(/[$,]/g, '').trim()
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? null : num
}

/**
 * Extract ranking report links from the index page
 */
async function getRankingReportLinks() {
  console.log('Fetching ranking reports index...')
  const html = await fetchPage(BASE_URL + RANKINGS_INDEX)
  const $ = cheerio.load(html)

  const reportLinks = []

  // NOTE: These selectors are placeholders - update based on actual HTML structure
  // Look for links to ranking report pages
  $('a[href*="/best-buy-lists/"], a[href*="/rankings/"], a[href*="/cheapest-"]').each((i, el) => {
    const href = $(el).attr('href')
    const title = $(el).text().trim()

    if (href && title && !reportLinks.find(r => r.url === href)) {
      reportLinks.push({
        url: href.startsWith('http') ? href : BASE_URL + href,
        title: title,
      })
    }
  })

  console.log(`Found ${reportLinks.length} ranking report links`)
  return reportLinks
}

/**
 * Parse a single ranking report page
 */
async function parseRankingReport(reportUrl, reportTitle) {
  console.log(`Parsing: ${reportTitle}`)

  const html = await fetchPage(reportUrl)
  const $ = cheerio.load(html)

  const entries = []

  // Extract field of study and degree level from title
  const titleLower = reportTitle.toLowerCase()
  let degreeLevel = 'Bachelor'
  if (titleLower.includes('master') || titleLower.includes("master's") || titleLower.includes('mba')) {
    degreeLevel = 'Master'
  } else if (titleLower.includes('associate')) {
    degreeLevel = 'Associate'
  } else if (titleLower.includes('doctorate') || titleLower.includes('phd') || titleLower.includes('doctoral')) {
    degreeLevel = 'Doctorate'
  } else if (titleLower.includes('certificate')) {
    degreeLevel = 'Certificate'
  }

  // NOTE: These selectors are placeholders - update based on actual HTML structure
  // GetEducated ranking pages typically have tables or structured lists

  // Try table format
  $('table tbody tr, .ranking-entry, .school-listing').each((i, el) => {
    const $row = $(el)

    // Extract data - adjust selectors based on actual page structure
    const schoolName = $row.find('.school-name, td:nth-child(1), .college-name').text().trim()
    const programName = $row.find('.program-name, td:nth-child(2), .degree-name').text().trim()
    const totalCostStr = $row.find('.total-cost, .cost, td:contains("$")').first().text().trim()
    const accreditation = $row.find('.accreditation, .accred').text().trim()

    // Check for sponsored badge
    const isSponsored = $row.find('.sponsored, .featured, .ad').length > 0 ||
      $row.hasClass('sponsored') ||
      $row.hasClass('featured')

    // Get school URL if available
    const schoolLink = $row.find('a[href*="/online-schools/"]').attr('href')

    if (schoolName) {
      entries.push({
        school_name: schoolName,
        program_name: programName || reportTitle,
        total_cost: parsePrice(totalCostStr),
        in_state_cost: null, // May need separate parsing
        out_of_state_cost: null,
        accreditation: accreditation || null,
        rank_position: i + 1,
        is_sponsored: isSponsored,
        geteducated_school_url: schoolLink ? (schoolLink.startsWith('http') ? schoolLink : BASE_URL + schoolLink) : null,
        degree_level: degreeLevel,
      })
    }
  })

  return {
    report_title: reportTitle,
    report_url: reportUrl,
    degree_level: degreeLevel,
    field_of_study: extractFieldOfStudy(reportTitle),
    entries,
  }
}

/**
 * Extract field of study from report title
 */
function extractFieldOfStudy(title) {
  const titleLower = title.toLowerCase()

  // Map common keywords to fields
  const fieldMappings = {
    'accounting': 'Accounting',
    'business': 'Business Administration',
    'mba': 'MBA',
    'nursing': 'Nursing',
    'education': 'Education',
    'criminal justice': 'Criminal Justice',
    'psychology': 'Psychology',
    'computer science': 'Computer Science',
    'information technology': 'Information Technology',
    'engineering': 'Engineering',
    'healthcare': 'Healthcare Administration',
    'social work': 'Social Work',
    'counseling': 'Counseling',
    'marketing': 'Marketing',
    'finance': 'Finance',
    'human resources': 'Human Resources',
  }

  for (const [keyword, field] of Object.entries(fieldMappings)) {
    if (titleLower.includes(keyword)) {
      return field
    }
  }

  return 'General Studies'
}

/**
 * Save ranking report and entries to database
 */
async function saveRankingReport(report) {
  try {
    // Insert or update ranking report
    const { data: reportData, error: reportError } = await supabase
      .from('ranking_reports')
      .upsert({
        report_title: report.report_title,
        report_url: report.report_url,
        degree_level: report.degree_level,
        field_of_study: report.field_of_study,
        last_crawled_at: new Date().toISOString(),
      }, {
        onConflict: 'report_url',
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error saving report:', reportError)
      return 0
    }

    const reportId = reportData.id

    // Insert entries (use insert, not upsert since no unique constraint exists)
    let savedCount = 0
    for (const entry of report.entries) {
      const { error: entryError } = await supabase
        .from('ranking_report_entries')
        .insert({
          report_id: reportId,
          school_name: entry.school_name,
          program_name: entry.program_name,
          total_cost: entry.total_cost,
          in_state_cost: entry.in_state_cost,
          out_of_state_cost: entry.out_of_state_cost,
          accreditation: entry.accreditation,
          rank_position: entry.rank_position,
          is_sponsored: entry.is_sponsored,
          geteducated_school_url: entry.geteducated_school_url,
          degree_level: entry.degree_level,
        })

      if (entryError) {
        console.error(`Error saving entry for ${entry.school_name}:`, entryError)
      } else {
        savedCount++
      }
    }

    return savedCount
  } catch (error) {
    console.error('Error saving ranking report:', error)
    return 0
  }
}

/**
 * Main crawler function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('GetEducated Ranking Reports Crawler')
  console.log('='.repeat(60))
  console.log()

  try {
    // Get list of ranking reports
    const reportLinks = await getRankingReportLinks()

    if (reportLinks.length === 0) {
      console.log('No ranking reports found. Check the selectors in getRankingReportLinks().')
      console.log('You may need to inspect the HTML structure of:')
      console.log(BASE_URL + RANKINGS_INDEX)
      return
    }

    let totalReports = 0
    let totalEntries = 0

    // Process each report
    for (const link of reportLinks) {
      try {
        const report = await parseRankingReport(link.url, link.title)

        if (report.entries.length > 0) {
          const savedCount = await saveRankingReport(report)
          totalReports++
          totalEntries += savedCount
          console.log(`  -> Saved ${savedCount} entries from ${report.report_title}`)
        } else {
          console.log(`  -> No entries found in ${link.title}`)
          console.log('     Check the selectors in parseRankingReport()')
        }

        // Rate limiting - be nice to the server
        await sleep(1500)

      } catch (error) {
        console.error(`Error processing ${link.title}:`, error.message)
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log(`Crawl Complete: ${totalReports} reports, ${totalEntries} entries saved`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Crawler error:', error)
    process.exit(1)
  }
}

// Run the crawler
main()
