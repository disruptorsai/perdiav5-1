/**
 * Apply Seed Migration Script
 * Applies the missing seed data migration to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Need VITE_SUPABASE_SERVICE_ROLE_KEY for migrations.');
  console.log('URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('Service Key:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function seedMonetizationLevels() {
  console.log('\n1. Seeding monetization_levels...');

  const levels = [
    { level_name: 'Associate', level_code: 1, slug: 'associate' },
    { level_name: 'Bachelor', level_code: 2, slug: 'bachelor' },
    { level_name: 'Bachelor Completion', level_code: 3, slug: 'bachelor-completion' },
    { level_name: 'Certificate', level_code: 6, slug: 'certificate' },
    { level_name: 'Course', level_code: 399, slug: 'course' },
    { level_name: 'Diploma', level_code: 7, slug: 'diploma' },
    { level_name: 'Doctorate', level_code: 5, slug: 'doctorate' },
    { level_name: 'Graduate Certificate', level_code: 356, slug: 'graduate-certificate' },
    { level_name: 'Graduate Course', level_code: 400, slug: 'graduate-course' },
    { level_name: 'Master', level_code: 4, slug: 'master' },
    { level_name: 'Post Graduate Certificate', level_code: 362, slug: 'post-graduate-certificate' },
    { level_name: 'Professional Certificate', level_code: 393, slug: 'professional-certificate' },
    { level_name: 'Undergraduate Course', level_code: 401, slug: 'undergraduate-course' }
  ];

  for (const level of levels) {
    const { error } = await supabase
      .from('monetization_levels')
      .upsert(level, { onConflict: 'level_code' });

    if (error) {
      console.error(`  Error inserting ${level.level_name}:`, error.message);
    }
  }

  const { count } = await supabase
    .from('monetization_levels')
    .select('*', { count: 'exact', head: true });

  console.log(`  Result: ${count} rows (expected: 13)`);
}

async function seedMonetizationCategories() {
  console.log('\n2. Seeding monetization_categories...');

  const categories = [
    // Arts & Liberal Arts (category_id: 8)
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Anthropology', concentration_id: 285 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Art & Architecture (Architecture focus)', concentration_id: 18 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Digital Media Communications', concentration_id: 384 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'English', concentration_id: 21 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Fashion & Interior Design', concentration_id: 22 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Foreign Language', concentration_id: 112 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Gender Studies', concentration_id: 305 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Graphic Design', concentration_id: 20 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'History', concentration_id: 311 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Humanities', concentration_id: 23 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Liberal Arts', concentration_id: 24 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Journalism', concentration_id: 315 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Music', concentration_id: 25 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Political Science', concentration_id: 335 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Technical Writing', concentration_id: 349 },
    { category: 'Arts & Liberal Arts', category_id: 8, concentration: 'Writing', concentration_id: 27 },

    // Business (category_id: 9)
    { category: 'Business', category_id: 9, concentration: 'Accounting', concentration_id: 281 },
    { category: 'Business', category_id: 9, concentration: 'Business Administration', concentration_id: 90 },
    { category: 'Business', category_id: 9, concentration: 'Business Analytics', concentration_id: 383 },
    { category: 'Business', category_id: 9, concentration: 'Business Management', concentration_id: 29 },
    { category: 'Business', category_id: 9, concentration: 'Communications', concentration_id: 30 },
    { category: 'Business', category_id: 9, concentration: 'Construction Management', concentration_id: 290 },
    { category: 'Business', category_id: 9, concentration: 'Digital Marketing', concentration_id: 33 },
    { category: 'Business', category_id: 9, concentration: 'Entrepreneurship', concentration_id: 41 },
    { category: 'Business', category_id: 9, concentration: 'Finance', concentration_id: 28 },
    { category: 'Business', category_id: 9, concentration: 'General Business', concentration_id: 357 },
    { category: 'Business', category_id: 9, concentration: 'Hospitality Management', concentration_id: 104 },
    { category: 'Business', category_id: 9, concentration: 'Human Resources', concentration_id: 35 },
    { category: 'Business', category_id: 9, concentration: 'International Business', concentration_id: 36 },
    { category: 'Business', category_id: 9, concentration: 'Management Information Systems', concentration_id: 31 },
    { category: 'Business', category_id: 9, concentration: 'Marketing', concentration_id: 37 },
    { category: 'Business', category_id: 9, concentration: 'Nonprofit Management', concentration_id: 328 },
    { category: 'Business', category_id: 9, concentration: 'Supply Chain Operations Management', concentration_id: 38 },
    { category: 'Business', category_id: 9, concentration: 'Organizational Leadership', concentration_id: 32 },
    { category: 'Business', category_id: 9, concentration: 'Project Management', concentration_id: 39 },
    { category: 'Business', category_id: 9, concentration: 'Public Administration', concentration_id: 337 },
    { category: 'Business', category_id: 9, concentration: 'Real Estate', concentration_id: 40 },
    { category: 'Business', category_id: 9, concentration: 'Sports Management', concentration_id: 42 },
    { category: 'Business', category_id: 9, concentration: 'Technology Management', concentration_id: 105 },

    // Computer Science & IT (category_id: 11)
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Computer Information Systems', concentration_id: 55 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Information Technology', concentration_id: 56 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'IT Management', concentration_id: 58 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Computer Science', concentration_id: 289 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Database Administration', concentration_id: 53 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Data Science', concentration_id: 387 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Game Design', concentration_id: 54 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'GIS', concentration_id: 308 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Information Security', concentration_id: 52 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Network Administration', concentration_id: 354 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Software Development', concentration_id: 275 },
    { category: 'Computer Science & IT', category_id: 11, concentration: 'Web Design & Development', concentration_id: 57 },

    // Criminal Justice, Safety & Law (category_id: 16)
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Administration', concentration_id: 379 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Criminal Justice', concentration_id: 84 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Cybersecurity', concentration_id: 293 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Emergency Management', concentration_id: 296 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Fire Science', concentration_id: 301 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Forensic Science', concentration_id: 303 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Homeland Security', concentration_id: 87 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Law', concentration_id: 85 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Law Enforcement', concentration_id: 380 },
    { category: 'Criminal Justice, Safety & Law', category_id: 16, concentration: 'Paralegal', concentration_id: 332 },

    // Education (category_id: 12)
    { category: 'Education', category_id: 12, concentration: 'Adult Education', concentration_id: 364 },
    { category: 'Education', category_id: 12, concentration: 'Curriculum & Instruction', concentration_id: 292 },
    { category: 'Education', category_id: 12, concentration: 'Early Childhood Education', concentration_id: 61 },
    { category: 'Education', category_id: 12, concentration: 'Education Administration', concentration_id: 63 },
    { category: 'Education', category_id: 12, concentration: 'Educational Psychology', concentration_id: 385 },
    { category: 'Education', category_id: 12, concentration: 'Elementary Education', concentration_id: 60 },
    { category: 'Education', category_id: 12, concentration: 'ESL', concentration_id: 300 },
    { category: 'Education', category_id: 12, concentration: 'Family & Consumer Science', concentration_id: 365 },
    { category: 'Education', category_id: 12, concentration: 'General Education', concentration_id: 65 },
    { category: 'Education', category_id: 12, concentration: 'Gifted & Special Education', concentration_id: 62 },
    { category: 'Education', category_id: 12, concentration: 'Higher Education', concentration_id: 59 },
    { category: 'Education', category_id: 12, concentration: 'Instructional Design', concentration_id: 64 },
    { category: 'Education', category_id: 12, concentration: 'Library Science', concentration_id: 318 },
    { category: 'Education', category_id: 12, concentration: 'Physical Education & Coaching', concentration_id: 334 },
    { category: 'Education', category_id: 12, concentration: 'Reading & Literacy', concentration_id: 338 },
    { category: 'Education', category_id: 12, concentration: 'School Counseling', concentration_id: 340 },
    { category: 'Education', category_id: 12, concentration: 'Secondary Education (6-12)', concentration_id: 341 },
    { category: 'Education', category_id: 12, concentration: 'STEAM Education', concentration_id: 363 },
    { category: 'Education', category_id: 12, concentration: 'Teacher Leadership', concentration_id: 366 },
    { category: 'Education', category_id: 12, concentration: 'Teaching', concentration_id: 348 },

    // Engineering (category_id: 280)
    { category: 'Engineering', category_id: 280, concentration: 'Aerospace Engineering', concentration_id: 283 },
    { category: 'Engineering', category_id: 280, concentration: 'Biomedical Engineering', concentration_id: 374 },
    { category: 'Engineering', category_id: 280, concentration: 'Chemical Engineering', concentration_id: 372 },
    { category: 'Engineering', category_id: 280, concentration: 'Civil Engineering', concentration_id: 287 },
    { category: 'Engineering', category_id: 280, concentration: 'Computer Engineering', concentration_id: 298 },
    { category: 'Engineering', category_id: 280, concentration: 'Electrical Engineering', concentration_id: 295 },
    { category: 'Engineering', category_id: 280, concentration: 'Engineering Management', concentration_id: 297 },
    { category: 'Engineering', category_id: 280, concentration: 'Environmental Engineering', concentration_id: 299 },
    { category: 'Engineering', category_id: 280, concentration: 'General Engineering', concentration_id: 306 },
    { category: 'Engineering', category_id: 280, concentration: 'Industrial Engineering', concentration_id: 313 },
    { category: 'Engineering', category_id: 280, concentration: 'Manufacturing Engineering', concentration_id: 375 },
    { category: 'Engineering', category_id: 280, concentration: 'Mechanical Engineering', concentration_id: 323 },
    { category: 'Engineering', category_id: 280, concentration: 'Nuclear Engineering', concentration_id: 373 },
    { category: 'Engineering', category_id: 280, concentration: 'Software Engineering', concentration_id: 344 },
    { category: 'Engineering', category_id: 280, concentration: 'Systems Engineering', concentration_id: 347 },

    // Healthcare (category_id: 14)
    { category: 'Healthcare', category_id: 14, concentration: 'Dental Hygiene', concentration_id: 73 },
    { category: 'Healthcare', category_id: 14, concentration: 'General Healthcare', concentration_id: 361 },
    { category: 'Healthcare', category_id: 14, concentration: 'Gerontology', concentration_id: 307 },
    { category: 'Healthcare', category_id: 14, concentration: 'Health & Wellness', concentration_id: 360 },
    { category: 'Healthcare', category_id: 14, concentration: 'Health Informatics', concentration_id: 309 },
    { category: 'Healthcare', category_id: 14, concentration: 'Health Science', concentration_id: 310 },
    { category: 'Healthcare', category_id: 14, concentration: 'Healthcare Administration', concentration_id: 71 },
    { category: 'Healthcare', category_id: 14, concentration: 'Kinesiology', concentration_id: 358 },
    { category: 'Healthcare', category_id: 14, concentration: 'Medical Billing & Coding', concentration_id: 72 },
    { category: 'Healthcare', category_id: 14, concentration: 'Nutrition', concentration_id: 331 },
    { category: 'Healthcare', category_id: 14, concentration: 'Occupational Health & Safety', concentration_id: 367 },
    { category: 'Healthcare', category_id: 14, concentration: 'Pharmacy', concentration_id: 75 },
    { category: 'Healthcare', category_id: 14, concentration: 'Public Health', concentration_id: 77 },
    { category: 'Healthcare', category_id: 14, concentration: 'Radiology', concentration_id: 78 },
    { category: 'Healthcare', category_id: 14, concentration: 'Rehabilitation Therapies', concentration_id: 74 },
    { category: 'Healthcare', category_id: 14, concentration: 'Speech Language Pathology', concentration_id: 359 },

    // High School Diploma (category_id: 376)
    { category: 'High School Diploma', category_id: 376, concentration: 'General', concentration_id: 377 },
    { category: 'High School Diploma', category_id: 376, concentration: 'Specialized', concentration_id: 378 },

    // Math & Science (category_id: 15)
    { category: 'Math & Science', category_id: 15, concentration: 'Agriculture', concentration_id: 284 },
    { category: 'Math & Science', category_id: 15, concentration: 'Animal Science', concentration_id: 371 },
    { category: 'Math & Science', category_id: 15, concentration: 'Aviation', concentration_id: 368 },
    { category: 'Math & Science', category_id: 15, concentration: 'Biology', concentration_id: 369 },
    { category: 'Math & Science', category_id: 15, concentration: 'Biotechnology', concentration_id: 370 },
    { category: 'Math & Science', category_id: 15, concentration: 'Environmental Science', concentration_id: 81 },
    { category: 'Math & Science', category_id: 15, concentration: 'Forestry', concentration_id: 304 },
    { category: 'Math & Science', category_id: 15, concentration: 'Geography', concentration_id: 108 },
    { category: 'Math & Science', category_id: 15, concentration: 'Mathematics', concentration_id: 322 },
    { category: 'Math & Science', category_id: 15, concentration: 'Science', concentration_id: 83 },
    { category: 'Math & Science', category_id: 15, concentration: 'Sustainability', concentration_id: 346 },

    // Nursing (category_id: 13)
    { category: 'Nursing', category_id: 13, concentration: 'Adult Gerontology (Nurse Practitioner)', concentration_id: 390 },
    { category: 'Nursing', category_id: 13, concentration: 'General Nursing', concentration_id: 69 },
    { category: 'Nursing', category_id: 13, concentration: 'Mental Health (Nurse Practitioner)', concentration_id: 389 },
    { category: 'Nursing', category_id: 13, concentration: 'MSN', concentration_id: 326 },
    { category: 'Nursing', category_id: 13, concentration: 'Neonatal & Pediatrics', concentration_id: 392 },
    { category: 'Nursing', category_id: 13, concentration: 'Nurse Educator', concentration_id: 329 },
    { category: 'Nursing', category_id: 13, concentration: 'Nursing Informatics', concentration_id: 388 },
    { category: 'Nursing', category_id: 13, concentration: 'Nurse Practitioner', concentration_id: 330 },
    { category: 'Nursing', category_id: 13, concentration: 'Nursing Administration', concentration_id: 68 },
    { category: 'Nursing', category_id: 13, concentration: 'RN to BSN', concentration_id: 67 },
    { category: 'Nursing', category_id: 13, concentration: 'RN to MSN', concentration_id: 355 },
    { category: 'Nursing', category_id: 13, concentration: 'Womens Health', concentration_id: 391 },

    // Psychology & Human Services (category_id: 278)
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Behavioral Science', concentration_id: 386 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Counseling', concentration_id: 291 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Forensic Psychology', concentration_id: 302 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Human Services', concentration_id: 312 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Industrial Organizational Psychology', concentration_id: 314 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Marriage & Family Therapy', concentration_id: 321 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Psychology', concentration_id: 336 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Social Work', concentration_id: 342 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Sociology', concentration_id: 343 },
    { category: 'Psychology & Human Services', category_id: 278, concentration: 'Substance Abuse Counseling', concentration_id: 345 },

    // Religion & Philosophy (category_id: 279)
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Biblical Studies', concentration_id: 382 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Divinity', concentration_id: 294 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Leadership & Ministry', concentration_id: 317 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Pastoral Counseling', concentration_id: 333 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Philosophy', concentration_id: 381 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Religion', concentration_id: 339 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Theology', concentration_id: 350 },
    { category: 'Religion & Philosophy', category_id: 279, concentration: 'Worship & Music Ministry', concentration_id: 327 }
  ];

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const { error } = await supabase
      .from('monetization_categories')
      .upsert(batch, { onConflict: 'category_id,concentration_id' });

    if (error) {
      console.error(`  Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`  Inserted batch ${i / batchSize + 1} (${batch.length} rows)`);
    }
  }

  const { count } = await supabase
    .from('monetization_categories')
    .select('*', { count: 'exact', head: true });

  console.log(`  Result: ${count} rows (expected: 155)`);
}

async function seedSystemSettings() {
  console.log('\n3. Adding missing system settings...');

  const settings = [
    { key: 'default_author_id', value: 'null' },
    { key: 'auto_publish_delay_days', value: '5' },
    { key: 'max_articles_per_day', value: '100' },
    { key: 'publish_rate_limit_per_minute', value: '5' },
    { key: 'publish_delay_seconds', value: '12' }
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(setting, { onConflict: 'key', ignoreDuplicates: true });

    if (error && !error.message.includes('duplicate')) {
      console.error(`  Error inserting ${setting.key}:`, error.message);
    } else {
      console.log(`  Added/verified: ${setting.key}`);
    }
  }
}

async function verifyContributors() {
  console.log('\n4. Verifying contributors...');

  const { data: contributors, error } = await supabase
    .from('article_contributors')
    .select('name, wordpress_contributor_id, is_active')
    .order('name');

  if (error) {
    console.error('  Error:', error.message);
    return;
  }

  for (const c of contributors) {
    const wpStatus = c.wordpress_contributor_id ? `WP ID: ${c.wordpress_contributor_id}` : 'WP ID: NOT SET';
    console.log(`  ${c.name}: ${wpStatus}, Active: ${c.is_active}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('APPLYING SEED DATA MIGRATION');
  console.log('='.repeat(60));

  await seedMonetizationLevels();
  await seedMonetizationCategories();
  await seedSystemSettings();
  await verifyContributors();

  console.log('\n' + '='.repeat(60));
  console.log('SEED DATA MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log('\nRun verify-database.mjs to confirm all data is in place.');
}

main().catch(console.error);
