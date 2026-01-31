/**
 * Import Paid Schools and Degrees from Excel
 *
 * This script imports the paid schools/degrees from the client Excel file
 * and marks them as paid clients in the database.
 *
 * Run with: node scripts/import-paid-schools.js
 *
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --verbose    Show detailed progress
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a URL-friendly slug from a name
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract degree level from degree name
 */
function extractDegreeLevel(degreeName) {
  const name = degreeName.toLowerCase();

  if (name.includes('doctorate') || name.includes('doctoral') || name.includes('ph.d') || name.includes('edd') || name.includes('dba') || name.includes('dnp')) {
    return { level: 'Doctorate', code: 5 };
  }
  if (name.includes('master') || name.includes('mba') || name.includes('msn') || name.includes('med') || name.includes('mpa') || name.includes('mph') || name.includes('msw')) {
    return { level: 'Master', code: 4 };
  }
  if (name.includes('bachelor') || name.includes('b.a.') || name.includes('b.s.') || name.includes('bba') || name.includes('bsn')) {
    return { level: 'Bachelor', code: 2 };
  }
  if (name.includes('associate') || name.includes('a.a.') || name.includes('a.s.')) {
    return { level: 'Associate', code: 1 };
  }
  if (name.includes('certificate') || name.includes('certification') || name.includes('endorsement')) {
    return { level: 'Certificate', code: 6 };
  }

  // Default to Certificate for unmatched
  return { level: 'Certificate', code: 6 };
}

/**
 * Main import function
 */
async function importPaidSchools() {
  console.log('='.repeat(60));
  console.log('IMPORT PAID SCHOOLS AND DEGREES');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made to the database\n');
  }

  // Read Excel file
  const excelPath = path.join(__dirname, '../docs/client/List of Client Schools and Degrees for AI Training.xlsx');
  console.log(`\nReading: ${excelPath}`);

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} rows in Excel file`);

  // Group by school
  const schoolMap = new Map();

  for (const row of data) {
    const schoolName = row['School Name']?.trim();
    const degreeName = row['Name']?.trim();

    if (!schoolName || !degreeName) continue;

    if (!schoolMap.has(schoolName)) {
      schoolMap.set(schoolName, {
        name: schoolName,
        slug: slugify(schoolName),
        degrees: [],
      });
    }

    schoolMap.get(schoolName).degrees.push({
      name: degreeName,
      ...extractDegreeLevel(degreeName),
    });
  }

  console.log(`\nParsed ${schoolMap.size} unique schools`);

  // Count degrees by level
  const levelCounts = { Doctorate: 0, Master: 0, Bachelor: 0, Associate: 0, Certificate: 0 };
  for (const school of schoolMap.values()) {
    for (const degree of school.degrees) {
      levelCounts[degree.level]++;
    }
  }

  console.log('\nDegree breakdown:');
  for (const [level, count] of Object.entries(levelCounts)) {
    console.log(`  ${level}: ${count}`);
  }

  if (VERBOSE) {
    console.log('\nFirst 10 schools:');
    let i = 0;
    for (const [name, school] of schoolMap) {
      if (i++ >= 10) break;
      console.log(`  - ${name} (${school.degrees.length} degrees)`);
    }
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Use without --dry-run to import data.');
    return;
  }

  // Import to database
  console.log('\n--- IMPORTING TO DATABASE ---\n');

  let schoolsCreated = 0;
  let schoolsUpdated = 0;
  let degreesCreated = 0;
  let errors = 0;

  for (const [schoolName, schoolData] of schoolMap) {
    try {
      // Check if school exists
      const { data: existingSchool, error: fetchError } = await supabase
        .from('schools')
        .select('id, school_name')
        .eq('school_name', schoolName)
        .single();

      let schoolId;

      if (existingSchool) {
        // Update existing school to mark as paid
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            is_paid_client: true,
            is_sponsored: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSchool.id);

        if (updateError) {
          console.error(`Error updating ${schoolName}:`, updateError.message);
          errors++;
          continue;
        }

        schoolId = existingSchool.id;
        schoolsUpdated++;
        if (VERBOSE) console.log(`Updated: ${schoolName}`);

      } else {
        // Create new school
        const { data: newSchool, error: insertError } = await supabase
          .from('schools')
          .insert({
            school_name: schoolName,
            school_slug: schoolData.slug,
            geteducated_url: `/online-schools/${schoolData.slug}/`,
            is_paid_client: true,
            is_sponsored: true,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating ${schoolName}:`, insertError.message);
          errors++;
          continue;
        }

        schoolId = newSchool.id;
        schoolsCreated++;
        if (VERBOSE) console.log(`Created: ${schoolName}`);
      }

      // Import degrees for this school
      for (const degree of schoolData.degrees) {
        // Check if degree exists
        const { data: existingDegree } = await supabase
          .from('degrees')
          .select('id')
          .eq('school_id', schoolId)
          .eq('program_name', degree.name)
          .single();

        if (existingDegree) {
          // Update existing
          await supabase
            .from('degrees')
            .update({
              is_sponsored: true,
              sponsorship_tier: 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDegree.id);
        } else {
          // Create new degree
          const { error: degreeError } = await supabase
            .from('degrees')
            .insert({
              school_id: schoolId,
              school_name: schoolName,
              program_name: degree.name,
              program_slug: slugify(degree.name),
              degree_level: degree.level,
              degree_level_code: degree.code,
              is_sponsored: true,
              sponsorship_tier: 1,
              is_active: true,
            });

          if (degreeError) {
            if (VERBOSE) console.error(`  Error creating degree "${degree.name}":`, degreeError.message);
            errors++;
          } else {
            degreesCreated++;
          }
        }
      }

      // Progress indicator
      if (!VERBOSE && (schoolsCreated + schoolsUpdated) % 50 === 0) {
        process.stdout.write('.');
      }

    } catch (err) {
      console.error(`\nError processing ${schoolName}:`, err.message);
      errors++;
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nSchools created: ${schoolsCreated}`);
  console.log(`Schools updated: ${schoolsUpdated}`);
  console.log(`Degrees created: ${degreesCreated}`);
  console.log(`Errors: ${errors}`);

  // Verify counts
  const { count: schoolCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('is_paid_client', true);

  const { count: degreeCount } = await supabase
    .from('degrees')
    .select('*', { count: 'exact', head: true })
    .eq('is_sponsored', true);

  console.log(`\nDatabase verification:`);
  console.log(`  Paid schools in DB: ${schoolCount}`);
  console.log(`  Sponsored degrees in DB: ${degreeCount}`);
}

// Run
importPaidSchools().catch(console.error);
