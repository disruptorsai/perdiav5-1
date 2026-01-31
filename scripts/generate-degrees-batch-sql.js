/**
 * Generate optimized batch SQL for degrees data
 *
 * This version uses batch INSERT statements for better performance
 * in the Supabase dashboard.
 *
 * Run with: node scripts/generate-degrees-batch-sql.js > degrees-batch.sql
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

  return { level: 'Certificate', code: 6 };
}

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

async function generateBatchSql() {
  const excelPath = path.join(__dirname, '../docs/client/List of Client Schools and Degrees for AI Training.xlsx');

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

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

  let sql = `-- Optimized batch migration for paid school degrees
-- Data source: docs/client/List of Client Schools and Degrees for AI Training.xlsx
-- Generated: ${new Date().toISOString()}
-- Total: ${data.length} degrees across ${schoolMap.size} schools

-- This migration uses temp tables and batch inserts for efficiency
CREATE OR REPLACE FUNCTION seed_paid_degrees_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create temp table for degree data
  CREATE TEMP TABLE IF NOT EXISTS temp_degrees (
    school_name TEXT,
    program_name TEXT,
    program_slug TEXT,
    degree_level TEXT,
    degree_level_code INTEGER
  ) ON COMMIT DROP;

  -- Batch insert all degrees
`;

  // Collect all degrees for batch insert
  const allDegrees = [];
  for (const [schoolName, schoolData] of schoolMap) {
    for (const degree of schoolData.degrees) {
      allDegrees.push({
        schoolName,
        ...degree
      });
    }
  }

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < allDegrees.length; i += batchSize) {
    const batch = allDegrees.slice(i, i + batchSize);
    sql += `  INSERT INTO temp_degrees (school_name, program_name, program_slug, degree_level, degree_level_code) VALUES\n`;

    const values = batch.map(d =>
      `    ('${escapeSql(d.schoolName)}', '${escapeSql(d.name)}', '${escapeSql(d.slug)}', '${d.level}', ${d.code})`
    );

    sql += values.join(',\n') + ';\n\n';
  }

  sql += `
  -- Insert degrees that don't exist, update those that do
  INSERT INTO degrees (
    school_id, school_name, program_name, program_slug,
    degree_level, degree_level_code, is_sponsored, sponsorship_tier, is_active
  )
  SELECT
    s.id,
    t.school_name,
    t.program_name,
    t.program_slug,
    t.degree_level,
    t.degree_level_code,
    true,
    1,
    true
  FROM temp_degrees t
  JOIN schools s ON s.school_name = t.school_name
  WHERE NOT EXISTS (
    SELECT 1 FROM degrees d
    WHERE d.school_id = s.id AND d.program_name = t.program_name
  );

  -- Update existing degrees to mark as sponsored
  UPDATE degrees d
  SET is_sponsored = true, sponsorship_tier = 1, updated_at = NOW()
  FROM temp_degrees t
  JOIN schools s ON s.school_name = t.school_name
  WHERE d.school_id = s.id AND d.program_name = t.program_name;

END;
$$;

-- Execute the function
SELECT seed_paid_degrees_batch();

-- Clean up
DROP FUNCTION seed_paid_degrees_batch();

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

  console.log(sql);
}

generateBatchSql().catch(console.error);
