/**
 * Seed Reference Data Script
 *
 * This script seeds monetization_categories, monetization_levels, and subjects tables
 * using the Supabase service role key to bypass RLS policies.
 *
 * Run: node scripts/seed-reference-data.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create client with SERVICE ROLE key to bypass RLS
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Monetization Levels (13 rows)
const monetizationLevels = [
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

// Monetization Categories (155 rows)
const monetizationCategories = [
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
  { category: 'Engineering', category_id: 280, concentration: 'General Engineering', concentration_id: 307 },
  { category: 'Engineering', category_id: 280, concentration: 'Industrial Engineering', concentration_id: 313 },
  { category: 'Engineering', category_id: 280, concentration: 'Mechanical Engineering', concentration_id: 323 },
  { category: 'Engineering', category_id: 280, concentration: 'Systems Engineering', concentration_id: 346 },

  // General Studies (category_id: 360)
  { category: 'General Studies', category_id: 360, concentration: 'General Studies', concentration_id: 359 },
  { category: 'General Studies', category_id: 360, concentration: 'Interdisciplinary Studies', concentration_id: 367 },

  // Health Sciences (category_id: 10)
  { category: 'Health Sciences', category_id: 10, concentration: 'Addiction Counseling', concentration_id: 107 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Clinical Research', concentration_id: 368 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Dental Hygiene', concentration_id: 294 },
  { category: 'Health Sciences', category_id: 10, concentration: 'General Health Science', concentration_id: 111 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Health Informatics', concentration_id: 309 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Healthcare Administration', concentration_id: 44 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Medical Lab Technology', concentration_id: 324 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Nutrition', concentration_id: 329 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Occupational Therapy', concentration_id: 330 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Pharmacy', concentration_id: 333 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Physical Therapy', concentration_id: 110 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Public Health', concentration_id: 50 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Radiology', concentration_id: 339 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Respiratory Care', concentration_id: 378 },
  { category: 'Health Sciences', category_id: 10, concentration: 'Speech Therapy', concentration_id: 345 },

  // Human Services (category_id: 13)
  { category: 'Human Services', category_id: 13, concentration: 'Child Development', concentration_id: 286 },
  { category: 'Human Services', category_id: 13, concentration: 'General Human Services', concentration_id: 306 },
  { category: 'Human Services', category_id: 13, concentration: 'Gerontology', concentration_id: 358 },
  { category: 'Human Services', category_id: 13, concentration: 'Marriage & Family Therapy', concentration_id: 320 },
  { category: 'Human Services', category_id: 13, concentration: 'Mental Health Counseling', concentration_id: 325 },
  { category: 'Human Services', category_id: 13, concentration: 'Ministry', concentration_id: 326 },
  { category: 'Human Services', category_id: 13, concentration: 'Social Work', concentration_id: 343 },

  // Nursing (category_id: 14)
  { category: 'Nursing', category_id: 14, concentration: 'BSN Completion (RN to BSN)', concentration_id: 375 },
  { category: 'Nursing', category_id: 14, concentration: 'Doctor of Nursing Practice', concentration_id: 371 },
  { category: 'Nursing', category_id: 14, concentration: 'Entry-Level Nursing', concentration_id: 370 },
  { category: 'Nursing', category_id: 14, concentration: 'LPN / LVN', concentration_id: 369 },
  { category: 'Nursing', category_id: 14, concentration: 'Master of Science in Nursing', concentration_id: 376 },
  { category: 'Nursing', category_id: 14, concentration: 'Nurse Anesthetist', concentration_id: 377 },
  { category: 'Nursing', category_id: 14, concentration: 'Nurse Educator', concentration_id: 67 },
  { category: 'Nursing', category_id: 14, concentration: 'Nurse Practitioner', concentration_id: 68 },
  { category: 'Nursing', category_id: 14, concentration: 'Nursing Administration', concentration_id: 69 },
  { category: 'Nursing', category_id: 14, concentration: 'Nursing Informatics', concentration_id: 70 },

  // Psychology (category_id: 15)
  { category: 'Psychology', category_id: 15, concentration: 'Applied Behavior Analysis', concentration_id: 284 },
  { category: 'Psychology', category_id: 15, concentration: 'Child Psychology', concentration_id: 373 },
  { category: 'Psychology', category_id: 15, concentration: 'Clinical Psychology', concentration_id: 288 },
  { category: 'Psychology', category_id: 15, concentration: 'Forensic Psychology', concentration_id: 302 },
  { category: 'Psychology', category_id: 15, concentration: 'General Psychology', concentration_id: 78 },
  { category: 'Psychology', category_id: 15, concentration: 'Industrial-Organizational Psychology', concentration_id: 312 },
  { category: 'Psychology', category_id: 15, concentration: 'School Psychology', concentration_id: 342 },
  { category: 'Psychology', category_id: 15, concentration: 'Social Psychology', concentration_id: 344 },
  { category: 'Psychology', category_id: 15, concentration: 'Sports Psychology', concentration_id: 381 },

  // Sciences (category_id: 282)
  { category: 'Sciences', category_id: 282, concentration: 'Biology', concentration_id: 109 },
  { category: 'Sciences', category_id: 282, concentration: 'Chemistry', concentration_id: 391 },
  { category: 'Sciences', category_id: 282, concentration: 'Earth Sciences', concentration_id: 392 },
  { category: 'Sciences', category_id: 282, concentration: 'Environmental Science', concentration_id: 108 },
  { category: 'Sciences', category_id: 282, concentration: 'Mathematics', concentration_id: 321 },
  { category: 'Sciences', category_id: 282, concentration: 'Physics', concentration_id: 390 },

  // Trade, Vocational & Career (category_id: 388)
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Agriculture', concentration_id: 395 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Aviation', concentration_id: 394 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Cosmetology', concentration_id: 396 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Funeral Service', concentration_id: 304 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'General Trades', concentration_id: 389 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'HVAC', concentration_id: 398 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Medical Billing & Coding', concentration_id: 106 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Medical Office Administration', concentration_id: 382 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Veterinary Technology', concentration_id: 350 },
  { category: 'Trade, Vocational & Career', category_id: 388, concentration: 'Welding', concentration_id: 397 }
];

// Subjects (CIP code mapping)
const subjects = [
  { name: 'Accounting', cip_code: '52.0301' },
  { name: 'Addiction Counseling', cip_code: '51.1501' },
  { name: 'Adult Education', cip_code: '13.1201' },
  { name: 'Aerospace Engineering', cip_code: '14.0201' },
  { name: 'Agriculture', cip_code: '01.0000' },
  { name: 'Anthropology', cip_code: '45.0201' },
  { name: 'Applied Behavior Analysis', cip_code: '42.2814' },
  { name: 'Art & Architecture', cip_code: '50.0000' },
  { name: 'Aviation', cip_code: '49.0101' },
  { name: 'Biology', cip_code: '26.0101' },
  { name: 'Biomedical Engineering', cip_code: '14.0501' },
  { name: 'Business Administration', cip_code: '52.0201' },
  { name: 'Business Analytics', cip_code: '52.1301' },
  { name: 'Business Management', cip_code: '52.0101' },
  { name: 'Chemical Engineering', cip_code: '14.0701' },
  { name: 'Chemistry', cip_code: '40.0501' },
  { name: 'Child Development', cip_code: '19.0706' },
  { name: 'Child Psychology', cip_code: '42.2703' },
  { name: 'Civil Engineering', cip_code: '14.0801' },
  { name: 'Clinical Psychology', cip_code: '42.2801' },
  { name: 'Clinical Research', cip_code: '51.0716' },
  { name: 'Communications', cip_code: '09.0101' },
  { name: 'Computer Engineering', cip_code: '14.0901' },
  { name: 'Computer Information Systems', cip_code: '11.0401' },
  { name: 'Computer Science', cip_code: '11.0701' },
  { name: 'Construction Management', cip_code: '52.2001' },
  { name: 'Cosmetology', cip_code: '12.0401' },
  { name: 'Criminal Justice', cip_code: '43.0104' },
  { name: 'Curriculum & Instruction', cip_code: '13.0301' },
  { name: 'Cybersecurity', cip_code: '11.1003' },
  { name: 'Data Science', cip_code: '30.7001' },
  { name: 'Database Administration', cip_code: '11.0802' },
  { name: 'Dental Hygiene', cip_code: '51.0602' },
  { name: 'Digital Marketing', cip_code: '52.1402' },
  { name: 'Digital Media Communications', cip_code: '09.0702' },
  { name: 'Doctor of Nursing Practice', cip_code: '51.3818' },
  { name: 'Early Childhood Education', cip_code: '13.1210' },
  { name: 'Earth Sciences', cip_code: '40.0601' },
  { name: 'Education Administration', cip_code: '13.0401' },
  { name: 'Educational Psychology', cip_code: '42.2806' },
  { name: 'Electrical Engineering', cip_code: '14.1001' },
  { name: 'Elementary Education', cip_code: '13.1202' },
  { name: 'Emergency Management', cip_code: '43.0302' },
  { name: 'Engineering Management', cip_code: '15.1501' },
  { name: 'English', cip_code: '23.0101' },
  { name: 'Entrepreneurship', cip_code: '52.0701' },
  { name: 'Environmental Engineering', cip_code: '14.1401' },
  { name: 'Environmental Science', cip_code: '03.0104' },
  { name: 'ESL', cip_code: '13.1401' },
  { name: 'Family & Consumer Science', cip_code: '19.0101' },
  { name: 'Fashion & Interior Design', cip_code: '50.0408' },
  { name: 'Finance', cip_code: '52.0801' },
  { name: 'Fire Science', cip_code: '43.0203' },
  { name: 'Foreign Language', cip_code: '16.0101' },
  { name: 'Forensic Psychology', cip_code: '42.2812' },
  { name: 'Forensic Science', cip_code: '43.0106' },
  { name: 'Funeral Service', cip_code: '12.0301' },
  { name: 'Game Design', cip_code: '50.0411' },
  { name: 'Gender Studies', cip_code: '05.0207' },
  { name: 'General Business', cip_code: '52.0101' },
  { name: 'General Education', cip_code: '13.0101' },
  { name: 'General Engineering', cip_code: '14.0101' },
  { name: 'General Health Science', cip_code: '51.0000' },
  { name: 'General Human Services', cip_code: '44.0000' },
  { name: 'General Psychology', cip_code: '42.0101' },
  { name: 'General Studies', cip_code: '24.0102' },
  { name: 'General Trades', cip_code: '46.0000' },
  { name: 'Gerontology', cip_code: '30.1101' },
  { name: 'Gifted & Special Education', cip_code: '13.1001' },
  { name: 'GIS', cip_code: '45.0702' },
  { name: 'Graphic Design', cip_code: '50.0409' },
  { name: 'Health Informatics', cip_code: '51.2706' },
  { name: 'Healthcare Administration', cip_code: '51.0701' },
  { name: 'Higher Education', cip_code: '13.0406' },
  { name: 'History', cip_code: '54.0101' },
  { name: 'Homeland Security', cip_code: '43.0301' },
  { name: 'Hospitality Management', cip_code: '52.0901' },
  { name: 'Human Resources', cip_code: '52.1001' },
  { name: 'Humanities', cip_code: '24.0103' },
  { name: 'HVAC', cip_code: '47.0201' },
  { name: 'Industrial Engineering', cip_code: '14.3501' },
  { name: 'Industrial-Organizational Psychology', cip_code: '42.2804' },
  { name: 'Information Security', cip_code: '11.1003' },
  { name: 'Information Technology', cip_code: '11.0103' },
  { name: 'Instructional Design', cip_code: '13.0501' },
  { name: 'Interdisciplinary Studies', cip_code: '30.0000' },
  { name: 'International Business', cip_code: '52.1101' },
  { name: 'IT Management', cip_code: '11.1002' },
  { name: 'Journalism', cip_code: '09.0401' },
  { name: 'Law', cip_code: '22.0101' },
  { name: 'Law Enforcement', cip_code: '43.0107' },
  { name: 'Liberal Arts', cip_code: '24.0101' },
  { name: 'Library Science', cip_code: '25.0101' },
  { name: 'LPN / LVN', cip_code: '51.3901' },
  { name: 'Management Information Systems', cip_code: '52.1201' },
  { name: 'Marketing', cip_code: '52.1401' },
  { name: 'Marriage & Family Therapy', cip_code: '51.1505' },
  { name: 'Master of Science in Nursing', cip_code: '51.3801' },
  { name: 'Mathematics', cip_code: '27.0101' },
  { name: 'Mechanical Engineering', cip_code: '14.1901' },
  { name: 'Medical Billing & Coding', cip_code: '51.0713' },
  { name: 'Medical Lab Technology', cip_code: '51.1004' },
  { name: 'Medical Office Administration', cip_code: '51.0710' },
  { name: 'Mental Health Counseling', cip_code: '51.1508' },
  { name: 'Ministry', cip_code: '39.0601' },
  { name: 'Music', cip_code: '50.0901' },
  { name: 'Network Administration', cip_code: '11.1001' },
  { name: 'Nonprofit Management', cip_code: '52.0206' },
  { name: 'Nurse Anesthetist', cip_code: '51.3804' },
  { name: 'Nurse Educator', cip_code: '51.3817' },
  { name: 'Nurse Practitioner', cip_code: '51.3805' },
  { name: 'Nursing Administration', cip_code: '51.3802' },
  { name: 'Nursing Informatics', cip_code: '51.3819' },
  { name: 'Nutrition', cip_code: '51.3101' },
  { name: 'Occupational Therapy', cip_code: '51.2306' },
  { name: 'Organizational Leadership', cip_code: '52.0213' },
  { name: 'Paralegal', cip_code: '22.0302' },
  { name: 'Pharmacy', cip_code: '51.2001' },
  { name: 'Physical Education & Coaching', cip_code: '31.0504' },
  { name: 'Physical Therapy', cip_code: '51.2308' },
  { name: 'Physics', cip_code: '40.0801' },
  { name: 'Political Science', cip_code: '45.1001' },
  { name: 'Project Management', cip_code: '52.0211' },
  { name: 'Public Administration', cip_code: '44.0401' },
  { name: 'Public Health', cip_code: '51.2201' },
  { name: 'Radiology', cip_code: '51.0911' },
  { name: 'Reading & Literacy', cip_code: '13.1315' },
  { name: 'Real Estate', cip_code: '52.1501' },
  { name: 'Respiratory Care', cip_code: '51.0908' },
  { name: 'RN to BSN', cip_code: '51.3801' },
  { name: 'School Counseling', cip_code: '13.1101' },
  { name: 'School Psychology', cip_code: '42.2805' },
  { name: 'Secondary Education', cip_code: '13.1205' },
  { name: 'Social Psychology', cip_code: '42.2707' },
  { name: 'Social Work', cip_code: '44.0701' },
  { name: 'Software Development', cip_code: '11.0201' },
  { name: 'Speech Therapy', cip_code: '51.0204' },
  { name: 'Sports Management', cip_code: '31.0504' },
  { name: 'Sports Psychology', cip_code: '42.2813' },
  { name: 'STEAM Education', cip_code: '13.1399' },
  { name: 'Supply Chain Operations Management', cip_code: '52.0203' },
  { name: 'Systems Engineering', cip_code: '14.2701' },
  { name: 'Teacher Leadership', cip_code: '13.0404' },
  { name: 'Teaching', cip_code: '13.1299' },
  { name: 'Technical Writing', cip_code: '23.1303' },
  { name: 'Technology Management', cip_code: '52.0299' },
  { name: 'Veterinary Technology', cip_code: '51.0808' },
  { name: 'Web Design & Development', cip_code: '11.0801' },
  { name: 'Welding', cip_code: '48.0508' },
  { name: 'Writing', cip_code: '23.1302' }
];

// Missing system settings
const systemSettings = [
  { key: 'default_author_id', value: JSON.stringify(null), description: 'Default author ID for article assignment' },
  { key: 'auto_publish_delay_days', value: '5', description: 'Days before unreviewed articles auto-publish' },
  { key: 'max_articles_per_day', value: '100', description: 'Maximum articles to publish per day' }
];

async function seedData() {
  console.log('============================================================');
  console.log('SEEDING REFERENCE DATA');
  console.log('Using SERVICE ROLE key to bypass RLS');
  console.log('============================================================\n');

  // 1. Seed monetization_levels
  console.log('1. Seeding monetization_levels...');
  const { data: levelsData, error: levelsError } = await supabase
    .from('monetization_levels')
    .upsert(monetizationLevels, {
      onConflict: 'level_code',
      ignoreDuplicates: false
    })
    .select();

  if (levelsError) {
    console.error('   ERROR:', levelsError.message);
    console.error('   Details:', levelsError.details);
  } else {
    console.log(`   SUCCESS: ${levelsData?.length || 0} levels upserted`);
  }

  // 2. Seed monetization_categories
  console.log('\n2. Seeding monetization_categories...');
  const { data: catsData, error: catsError } = await supabase
    .from('monetization_categories')
    .upsert(monetizationCategories, {
      onConflict: 'concentration_id',
      ignoreDuplicates: false
    })
    .select();

  if (catsError) {
    console.error('   ERROR:', catsError.message);
    console.error('   Details:', catsError.details);
  } else {
    console.log(`   SUCCESS: ${catsData?.length || 0} categories upserted`);
  }

  // 3. Seed subjects
  console.log('\n3. Seeding subjects...');
  const { data: subjectsData, error: subjectsError } = await supabase
    .from('subjects')
    .upsert(subjects, {
      onConflict: 'name',
      ignoreDuplicates: false
    })
    .select();

  if (subjectsError) {
    console.error('   ERROR:', subjectsError.message);
    console.error('   Details:', subjectsError.details);
  } else {
    console.log(`   SUCCESS: ${subjectsData?.length || 0} subjects upserted`);
  }

  // 4. Update system settings
  console.log('\n4. Updating system settings...');
  for (const setting of systemSettings) {
    const { error: settingError } = await supabase
      .from('system_settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        description: setting.description
      }, {
        onConflict: 'key',
        ignoreDuplicates: false
      });

    if (settingError) {
      console.error(`   ERROR setting ${setting.key}:`, settingError.message);
    } else {
      console.log(`   Set ${setting.key} = ${setting.value}`);
    }
  }

  // 5. Update Charity's wordpress_contributor_id
  console.log('\n5. Updating Charity wordpress_contributor_id...');
  const { error: charityError } = await supabase
    .from('article_contributors')
    .update({ wordpress_contributor_id: 163924 })
    .eq('name', 'Charity');

  if (charityError) {
    console.error('   ERROR:', charityError.message);
  } else {
    console.log('   SUCCESS: Charity wordpress_contributor_id set to 163924');
  }

  // Verification
  console.log('\n============================================================');
  console.log('VERIFICATION');
  console.log('============================================================\n');

  const { count: levelsCount } = await supabase
    .from('monetization_levels')
    .select('*', { count: 'exact', head: true });
  console.log(`monetization_levels: ${levelsCount} rows (expected: 13)`);

  const { count: catsCount } = await supabase
    .from('monetization_categories')
    .select('*', { count: 'exact', head: true });
  console.log(`monetization_categories: ${catsCount} rows (expected: 155)`);

  const { count: subjectsCount } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true });
  console.log(`subjects: ${subjectsCount} rows (expected: ~150)`);

  const { data: contributors } = await supabase
    .from('article_contributors')
    .select('name, wordpress_contributor_id');
  console.log('\nContributors wordpress_contributor_id values:');
  contributors?.forEach(c => {
    console.log(`  ${c.name}: ${c.wordpress_contributor_id || 'NOT SET'}`);
  });

  console.log('\n============================================================');
  console.log('SEEDING COMPLETE');
  console.log('============================================================');
}

seedData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
