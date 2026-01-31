/**
 * GetEducated Data Import Script
 *
 * Imports schools and degrees data from GetEducated database exports
 * into the Perdia v5 monetization system.
 *
 * Usage:
 *   node scripts/import-geteducated-data.js --schools path/to/schools.csv
 *   node scripts/import-geteducated-data.js --degrees path/to/degrees.csv
 *   node scripts/import-geteducated-data.js --all path/to/data/
 *
 * Expected CSV formats:
 *
 * Schools CSV columns:
 *   school_name, school_slug, geteducated_url, official_website,
 *   is_paid_client, is_sponsored, has_logo, school_type, accreditation,
 *   location_city, location_state, total_programs, online_programs
 *
 * Degrees CSV columns:
 *   school_name, program_name, program_slug, degree_level, degree_level_code,
 *   category, category_id, concentration, concentration_id, geteducated_url,
 *   is_sponsored, has_logo, sponsorship_tier, program_format, total_credits,
 *   estimated_duration
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Parse CSV file into array of objects
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

/**
 * Import schools from CSV
 */
async function importSchools(filePath) {
  console.log(`\nImporting schools from: ${filePath}`)

  const records = parseCSV(filePath)
  console.log(`Found ${records.length} school records`)

  let imported = 0
  let updated = 0
  let errors = 0

  for (const record of records) {
    try {
      const schoolData = {
        school_name: record.school_name,
        school_slug: record.school_slug || generateSlug(record.school_name),
        geteducated_url: record.geteducated_url || `/online-schools/${generateSlug(record.school_name)}/`,
        official_website: record.official_website || null,
        is_paid_client: parseBoolean(record.is_paid_client),
        is_sponsored: parseBoolean(record.is_sponsored),
        has_logo: parseBoolean(record.has_logo),
        school_type: record.school_type || null,
        accreditation: record.accreditation || null,
        location_city: record.location_city || null,
        location_state: record.location_state || null,
        total_programs: parseInt(record.total_programs) || 0,
        online_programs: parseInt(record.online_programs) || 0,
        is_active: true,
      }

      // Upsert based on school_slug (unique)
      const { data, error } = await supabase
        .from('schools')
        .upsert(schoolData, {
          onConflict: 'school_slug',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error(`Error importing school "${record.school_name}":`, error.message)
        errors++
      } else {
        imported++
        if (imported % 50 === 0) {
          console.log(`  Processed ${imported} schools...`)
        }
      }
    } catch (err) {
      console.error(`Failed to process school "${record.school_name}":`, err.message)
      errors++
    }
  }

  console.log(`\nSchools import complete:`)
  console.log(`  Imported/Updated: ${imported}`)
  console.log(`  Errors: ${errors}`)

  return { imported, updated, errors }
}

/**
 * Import degrees/programs from CSV
 */
async function importDegrees(filePath) {
  console.log(`\nImporting degrees from: ${filePath}`)

  const records = parseCSV(filePath)
  console.log(`Found ${records.length} degree records`)

  // First, build a map of school names to IDs
  const { data: schools } = await supabase
    .from('schools')
    .select('id, school_name, school_slug')

  const schoolMap = new Map()
  if (schools) {
    for (const school of schools) {
      schoolMap.set(school.school_name.toLowerCase(), school.id)
      schoolMap.set(school.school_slug.toLowerCase(), school.id)
    }
  }

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    try {
      // Find school ID
      let schoolId = null
      const schoolKey = (record.school_name || '').toLowerCase()
      const schoolSlugKey = (record.school_slug || '').toLowerCase()

      schoolId = schoolMap.get(schoolKey) || schoolMap.get(schoolSlugKey)

      if (!schoolId && record.school_name) {
        // Create school if it doesn't exist
        const newSchool = {
          school_name: record.school_name,
          school_slug: generateSlug(record.school_name),
          geteducated_url: `/online-schools/${generateSlug(record.school_name)}/`,
          is_active: true,
        }

        const { data: createdSchool, error: createError } = await supabase
          .from('schools')
          .insert(newSchool)
          .select('id')
          .single()

        if (createdSchool) {
          schoolId = createdSchool.id
          schoolMap.set(schoolKey, schoolId)
          console.log(`  Created new school: ${record.school_name}`)
        }
      }

      if (!schoolId) {
        console.warn(`  Skipping degree "${record.program_name}" - school not found: ${record.school_name}`)
        skipped++
        continue
      }

      const degreeData = {
        school_id: schoolId,
        school_name: record.school_name,
        program_name: record.program_name,
        program_slug: record.program_slug || generateSlug(record.program_name),
        degree_level: record.degree_level || 'Bachelor',
        degree_level_code: parseInt(record.degree_level_code) || mapDegreeLevelToCode(record.degree_level),
        category: record.category || null,
        category_id: parseInt(record.category_id) || null,
        concentration: record.concentration || null,
        concentration_id: parseInt(record.concentration_id) || null,
        geteducated_url: record.geteducated_url || null,
        is_sponsored: parseBoolean(record.is_sponsored),
        has_logo: parseBoolean(record.has_logo),
        sponsorship_tier: parseInt(record.sponsorship_tier) || 0,
        program_format: record.program_format || '100% Online',
        total_credits: parseInt(record.total_credits) || null,
        estimated_duration: record.estimated_duration || null,
        is_active: true,
      }

      const { error } = await supabase
        .from('degrees')
        .insert(degreeData)

      if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
          skipped++
        } else {
          console.error(`Error importing degree "${record.program_name}":`, error.message)
          errors++
        }
      } else {
        imported++
        if (imported % 100 === 0) {
          console.log(`  Processed ${imported} degrees...`)
        }
      }
    } catch (err) {
      console.error(`Failed to process degree "${record.program_name}":`, err.message)
      errors++
    }
  }

  console.log(`\nDegrees import complete:`)
  console.log(`  Imported: ${imported}`)
  console.log(`  Skipped (duplicates): ${skipped}`)
  console.log(`  Errors: ${errors}`)

  return { imported, skipped, errors }
}

/**
 * Import ranking report entries from CSV
 */
async function importRankingEntries(filePath) {
  console.log(`\nImporting ranking entries from: ${filePath}`)

  const records = parseCSV(filePath)
  console.log(`Found ${records.length} ranking entry records`)

  let imported = 0
  let errors = 0

  for (const record of records) {
    try {
      const entryData = {
        school_name: record.school_name,
        program_name: record.program_name,
        degree_level: record.degree_level || null,
        total_cost: parseFloat(record.total_cost) || null,
        in_state_cost: parseFloat(record.in_state_cost) || null,
        out_of_state_cost: parseFloat(record.out_of_state_cost) || null,
        accreditation: record.accreditation || null,
        rank_position: parseInt(record.rank_position) || null,
        is_sponsored: parseBoolean(record.is_sponsored),
        geteducated_school_url: record.geteducated_school_url || null,
        notes: record.notes || null,
      }

      const { error } = await supabase
        .from('ranking_report_entries')
        .insert(entryData)

      if (error) {
        console.error(`Error importing entry "${record.school_name} - ${record.program_name}":`, error.message)
        errors++
      } else {
        imported++
        if (imported % 100 === 0) {
          console.log(`  Processed ${imported} entries...`)
        }
      }
    } catch (err) {
      console.error(`Failed to process entry:`, err.message)
      errors++
    }
  }

  console.log(`\nRanking entries import complete:`)
  console.log(`  Imported: ${imported}`)
  console.log(`  Errors: ${errors}`)

  return { imported, errors }
}

/**
 * Generate sample data for testing
 */
async function generateSampleData() {
  console.log('\nGenerating sample data for testing...')

  // Sample schools
  const sampleSchools = [
    {
      school_name: 'University of Florida',
      school_slug: 'university-of-florida',
      geteducated_url: '/online-schools/university-of-florida/',
      official_website: 'https://www.ufl.edu',
      is_paid_client: true,
      is_sponsored: true,
      has_logo: true,
      school_type: 'Public',
      accreditation: 'SACSCOC',
      location_city: 'Gainesville',
      location_state: 'FL',
      total_programs: 150,
      online_programs: 75,
      is_active: true,
    },
    {
      school_name: 'Arizona State University',
      school_slug: 'arizona-state-university',
      geteducated_url: '/online-schools/arizona-state-university/',
      official_website: 'https://www.asu.edu',
      is_paid_client: true,
      is_sponsored: true,
      has_logo: true,
      school_type: 'Public',
      accreditation: 'HLC',
      location_city: 'Tempe',
      location_state: 'AZ',
      total_programs: 200,
      online_programs: 120,
      is_active: true,
    },
    {
      school_name: 'Southern New Hampshire University',
      school_slug: 'southern-new-hampshire-university',
      geteducated_url: '/online-schools/southern-new-hampshire-university/',
      official_website: 'https://www.snhu.edu',
      is_paid_client: true,
      is_sponsored: true,
      has_logo: true,
      school_type: 'Private',
      accreditation: 'NECHE',
      location_city: 'Manchester',
      location_state: 'NH',
      total_programs: 300,
      online_programs: 250,
      is_active: true,
    },
    {
      school_name: 'Western Governors University',
      school_slug: 'western-governors-university',
      geteducated_url: '/online-schools/western-governors-university/',
      official_website: 'https://www.wgu.edu',
      is_paid_client: false,
      is_sponsored: false,
      has_logo: true,
      school_type: 'Private',
      accreditation: 'NWCCU',
      location_city: 'Salt Lake City',
      location_state: 'UT',
      total_programs: 80,
      online_programs: 80,
      is_active: true,
    },
    {
      school_name: 'Purdue University Global',
      school_slug: 'purdue-university-global',
      geteducated_url: '/online-schools/purdue-university-global/',
      official_website: 'https://www.purdueglobal.edu',
      is_paid_client: true,
      is_sponsored: true,
      has_logo: true,
      school_type: 'Public',
      accreditation: 'HLC',
      location_city: 'West Lafayette',
      location_state: 'IN',
      total_programs: 180,
      online_programs: 160,
      is_active: true,
    },
  ]

  // Insert schools
  for (const school of sampleSchools) {
    const { error } = await supabase
      .from('schools')
      .upsert(school, { onConflict: 'school_slug' })

    if (error) {
      console.error(`Error inserting school ${school.school_name}:`, error.message)
    }
  }

  // Get school IDs for degrees
  const { data: schools } = await supabase
    .from('schools')
    .select('id, school_name')

  const schoolIdMap = new Map(schools?.map(s => [s.school_name, s.id]) || [])

  // Sample degrees
  const sampleDegrees = [
    // Business degrees
    {
      school_name: 'University of Florida',
      program_name: 'Online MBA',
      degree_level: 'Master',
      degree_level_code: 4,
      category: 'Business',
      category_id: 2,
      concentration: 'Business Administration',
      concentration_id: 101,
      is_sponsored: true,
      sponsorship_tier: 3,
    },
    {
      school_name: 'Arizona State University',
      program_name: 'Online Bachelor of Science in Business Administration',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Business',
      category_id: 2,
      concentration: 'Business Administration',
      concentration_id: 101,
      is_sponsored: true,
      sponsorship_tier: 2,
    },
    {
      school_name: 'Southern New Hampshire University',
      program_name: 'Online BS in Accounting',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Business',
      category_id: 2,
      concentration: 'Accounting',
      concentration_id: 102,
      is_sponsored: true,
      sponsorship_tier: 3,
    },
    // Nursing degrees
    {
      school_name: 'Purdue University Global',
      program_name: 'RN to BSN Online',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Nursing',
      category_id: 10,
      concentration: 'Nursing',
      concentration_id: 201,
      is_sponsored: true,
      sponsorship_tier: 2,
    },
    {
      school_name: 'Western Governors University',
      program_name: 'Online MSN - Family Nurse Practitioner',
      degree_level: 'Master',
      degree_level_code: 4,
      category: 'Nursing',
      category_id: 10,
      concentration: 'Nursing',
      concentration_id: 201,
      is_sponsored: false,
      sponsorship_tier: 0,
    },
    // Education degrees
    {
      school_name: 'Arizona State University',
      program_name: 'Online Master of Education',
      degree_level: 'Master',
      degree_level_code: 4,
      category: 'Education',
      category_id: 5,
      concentration: 'Education',
      concentration_id: 301,
      is_sponsored: true,
      sponsorship_tier: 2,
    },
    {
      school_name: 'Western Governors University',
      program_name: 'Online BS in Elementary Education',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Education',
      category_id: 5,
      concentration: 'Teaching',
      concentration_id: 302,
      is_sponsored: false,
      sponsorship_tier: 0,
    },
    // Computer Science degrees
    {
      school_name: 'Southern New Hampshire University',
      program_name: 'Online BS in Computer Science',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Computer Science & IT',
      category_id: 3,
      concentration: 'Computer Science',
      concentration_id: 401,
      is_sponsored: true,
      sponsorship_tier: 3,
    },
    {
      school_name: 'University of Florida',
      program_name: 'Online MS in Computer Science',
      degree_level: 'Master',
      degree_level_code: 4,
      category: 'Computer Science & IT',
      category_id: 3,
      concentration: 'Computer Science',
      concentration_id: 401,
      is_sponsored: true,
      sponsorship_tier: 2,
    },
    // Healthcare degrees
    {
      school_name: 'Purdue University Global',
      program_name: 'Online BS in Health Science',
      degree_level: 'Bachelor',
      degree_level_code: 2,
      category: 'Healthcare',
      category_id: 7,
      concentration: 'Health Science',
      concentration_id: 501,
      is_sponsored: true,
      sponsorship_tier: 1,
    },
  ]

  // Insert degrees
  for (const degree of sampleDegrees) {
    const schoolId = schoolIdMap.get(degree.school_name)
    if (!schoolId) {
      console.warn(`School not found for degree: ${degree.program_name}`)
      continue
    }

    const { error } = await supabase
      .from('degrees')
      .insert({
        ...degree,
        school_id: schoolId,
        program_slug: generateSlug(degree.program_name),
        geteducated_url: `/online-degrees/${degree.degree_level.toLowerCase()}/${generateSlug(degree.concentration)}/`,
        has_logo: true,
        program_format: '100% Online',
        is_active: true,
      })

    if (error && error.code !== '23505') {
      console.error(`Error inserting degree ${degree.program_name}:`, error.message)
    }
  }

  console.log('\nSample data generation complete!')
  console.log(`  Schools: ${sampleSchools.length}`)
  console.log(`  Degrees: ${sampleDegrees.length}`)
}

// Helper functions
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
  }
  return false
}

function mapDegreeLevelToCode(level) {
  const levelMap = {
    'associate': 1,
    'bachelor': 2,
    'bachelor completion': 3,
    'master': 4,
    'doctorate': 5,
    'certificate': 6,
    'diploma': 7,
    'graduate certificate': 356,
    'post graduate certificate': 362,
    'professional certificate': 393,
    'course': 399,
    'graduate course': 400,
    'undergraduate course': 401,
  }
  return levelMap[(level || '').toLowerCase()] || 2
}

// CLI handling
const args = process.argv.slice(2)

async function main() {
  console.log('===========================================')
  console.log('GetEducated Data Import Script')
  console.log('===========================================')

  if (args.includes('--sample')) {
    await generateSampleData()
    return
  }

  if (args.includes('--schools')) {
    const idx = args.indexOf('--schools')
    const filePath = args[idx + 1]
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('Please provide a valid schools CSV file path')
      process.exit(1)
    }
    await importSchools(filePath)
  }

  if (args.includes('--degrees')) {
    const idx = args.indexOf('--degrees')
    const filePath = args[idx + 1]
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('Please provide a valid degrees CSV file path')
      process.exit(1)
    }
    await importDegrees(filePath)
  }

  if (args.includes('--rankings')) {
    const idx = args.indexOf('--rankings')
    const filePath = args[idx + 1]
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('Please provide a valid rankings CSV file path')
      process.exit(1)
    }
    await importRankingEntries(filePath)
  }

  if (args.includes('--all')) {
    const idx = args.indexOf('--all')
    const dirPath = args[idx + 1]
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error('Please provide a valid directory path')
      process.exit(1)
    }

    const schoolsFile = path.join(dirPath, 'schools.csv')
    const degreesFile = path.join(dirPath, 'degrees.csv')
    const rankingsFile = path.join(dirPath, 'rankings.csv')

    if (fs.existsSync(schoolsFile)) {
      await importSchools(schoolsFile)
    }
    if (fs.existsSync(degreesFile)) {
      await importDegrees(degreesFile)
    }
    if (fs.existsSync(rankingsFile)) {
      await importRankingEntries(rankingsFile)
    }
  }

  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/import-geteducated-data.js --schools path/to/schools.csv
  node scripts/import-geteducated-data.js --degrees path/to/degrees.csv
  node scripts/import-geteducated-data.js --rankings path/to/rankings.csv
  node scripts/import-geteducated-data.js --all path/to/data/
  node scripts/import-geteducated-data.js --sample  (generate sample test data)

Expected CSV formats:

Schools CSV columns:
  school_name, school_slug, geteducated_url, official_website,
  is_paid_client, is_sponsored, has_logo, school_type, accreditation,
  location_city, location_state, total_programs, online_programs

Degrees CSV columns:
  school_name, program_name, program_slug, degree_level, degree_level_code,
  category, category_id, concentration, concentration_id, geteducated_url,
  is_sponsored, has_logo, sponsorship_tier, program_format, total_credits,
  estimated_duration

Rankings CSV columns:
  school_name, program_name, degree_level, total_cost, in_state_cost,
  out_of_state_cost, accreditation, rank_position, is_sponsored,
  geteducated_school_url, notes
`)
  }

  console.log('\n===========================================')
  console.log('Import complete!')
  console.log('===========================================')
}

main().catch(console.error)
