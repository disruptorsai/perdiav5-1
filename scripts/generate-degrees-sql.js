/**
 * Generate SQL migration for degrees data
 *
 * This script reads the Excel file and outputs SQL INSERT statements
 * that can be run in the Supabase dashboard.
 *
 * Run with: node scripts/generate-degrees-sql.js > degrees-output.sql
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  if (name.includes('doctorate') || name.includes('doctoral') || name.includes('ph.d') || name.includes('edd') || name.includes('dba') || name.includes('dnp') || name.includes('d.n.p') || name.includes('doctor of')) {
    return { level: 'Doctorate', code: 5 };
  }
  if (name.includes('master') || name.includes('mba') || name.includes('msn') || name.includes('m.s.n') || name.includes('med') || name.includes('m.ed') || name.includes('mpa') || name.includes('mph') || name.includes('msw') || name.includes('m.s.w')) {
    return { level: 'Master', code: 4 };
  }
  if (name.includes('bachelor') || name.includes('b.a.') || name.includes('b.s.') || name.includes('bba') || name.includes('bsn') || name.includes('b.s.n')) {
    return { level: 'Bachelor', code: 2 };
  }
  if (name.includes('associate') || name.includes('a.a.') || name.includes('a.s.') || name.includes('aas')) {
    return { level: 'Associate', code: 1 };
  }
  if (name.includes('certificate') || name.includes('certification') || name.includes('endorsement') || name.includes('credential')) {
    return { level: 'Certificate', code: 6 };
  }

  // Default to Certificate for unmatched
  return { level: 'Certificate', code: 6 };
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str) {
  return str.replace(/'/g, "''");
}

async function generateDegreesSql() {
  // Read Excel file
  const excelPath = path.join(__dirname, '../docs/client/List of Client Schools and Degrees for AI Training.xlsx');

  console.error('Reading Excel file:', excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.error(`Found ${data.length} rows in Excel file`);

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

    const degreeInfo = extractDegreeLevel(degreeName);
    schoolMap.get(schoolName).degrees.push({
      name: degreeName,
      slug: slugify(degreeName),
      ...degreeInfo,
    });
  }

  console.error(`Parsed ${schoolMap.size} unique schools`);

  // Generate SQL
  let sql = `-- Auto-generated migration for paid school degrees
-- Data source: docs/client/List of Client Schools and Degrees for AI Training.xlsx
-- Generated: ${new Date().toISOString()}
-- Total: ${data.length} degrees across ${schoolMap.size} schools

-- This migration uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION seed_paid_degrees_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  school_uuid UUID;
  existing_degree_id UUID;
BEGIN
`;

  // Generate inserts for each school
  for (const [schoolName, schoolData] of schoolMap) {
    sql += `
  -- ${schoolName} (${schoolData.degrees.length} degrees)
  SELECT id INTO school_uuid FROM schools WHERE school_name = '${escapeSql(schoolName)}';

  IF school_uuid IS NOT NULL THEN
`;

    for (const degree of schoolData.degrees) {
      sql += `    -- ${degree.name}
    SELECT id INTO existing_degree_id FROM degrees
    WHERE school_id = school_uuid AND program_name = '${escapeSql(degree.name)}';

    IF existing_degree_id IS NULL THEN
      INSERT INTO degrees (
        school_id, school_name, program_name, program_slug,
        degree_level, degree_level_code, is_sponsored, sponsorship_tier, is_active
      ) VALUES (
        school_uuid,
        '${escapeSql(schoolName)}',
        '${escapeSql(degree.name)}',
        '${escapeSql(degree.slug)}',
        '${degree.level}',
        ${degree.code},
        true, 1, true
      );
    ELSE
      UPDATE degrees SET is_sponsored = true, sponsorship_tier = 1, updated_at = NOW()
      WHERE id = existing_degree_id;
    END IF;
`;
    }

    sql += `  END IF;
`;
  }

  sql += `
END;
$$;

-- Execute the function
SELECT seed_paid_degrees_data();

-- Clean up
DROP FUNCTION seed_paid_degrees_data();

-- Verify results
DO $$
DECLARE
  degree_count INTEGER;
  school_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO degree_count FROM degrees WHERE is_sponsored = true;
  SELECT COUNT(*) INTO school_count FROM schools WHERE is_paid_client = true;
  RAISE NOTICE 'Sponsored degrees: %, Paid schools: %', degree_count, school_count;
END;
$$;
`;

  // Output to stdout
  console.log(sql);

  console.error('\\nSQL generation complete!');
  console.error('The SQL has been output to stdout.');
  console.error('To save: node scripts/generate-degrees-sql.js > supabase/migrations/20251217000001_seed_paid_degrees.sql');
}

generateDegreesSql().catch(console.error);
