/**
 * Import GetEducated.com URLs to Supabase
 *
 * This script imports the sitemap URLs into Supabase with metadata
 * extracted from the URLs themselves. This gives us immediate
 * access to the URL catalog for internal linking.
 *
 * Full content scraping can be done separately/incrementally.
 *
 * Usage:
 *   node scripts/import-urls-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = './scripts/data';
const BASE_URL = 'https://www.geteducated.com';

// Classify content type based on URL
function classifyContentType(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('/online-college-ratings-and-rankings/')) return 'ranking';
  if (urlLower.includes('/careers/') || urlLower.includes('/career-center/')) return 'career';
  if (urlLower.includes('/elearning-education-blog/')) return 'blog';
  if (urlLower.includes('/top-online-colleges/')) return 'guide';
  if (urlLower.includes('/online-degrees/')) return 'degree_category';
  if (urlLower.includes('/online-schools/')) return 'school_profile';
  if (urlLower.includes('/scholarship') || urlLower.includes('/financial-aid')) return 'scholarship';
  if (urlLower.includes('how-to')) return 'how_to';

  return 'other';
}

// Extract degree level from URL
function extractDegreeLevel(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('doctorate') || urlLower.includes('phd') || urlLower.includes('-edd') || urlLower.includes('dnp')) return 'doctorate';
  if (urlLower.includes('masters') || urlLower.includes('master-') || urlLower.includes('-mba') || urlLower.includes('-msw') || urlLower.includes('-mlis')) return 'masters';
  if (urlLower.includes('bachelors') || urlLower.includes('bachelor-') || urlLower.includes('-bsn') || urlLower.includes('-bba')) return 'bachelors';
  if (urlLower.includes('associate')) return 'associate';
  if (urlLower.includes('certificate')) return 'certificate';

  return null;
}

// Extract subject area from URL
function extractSubjectArea(url) {
  const urlLower = url.toLowerCase();

  const subjectMap = {
    'nursing': ['nursing', 'nurse', 'bsn', 'msn', 'dnp', '-rn-'],
    'business': ['business', 'mba', 'management', 'accounting', 'finance', 'marketing', 'human-resource', '-hr-'],
    'education': ['education', 'teaching', 'teacher', 'educational', 'curriculum', 'instruction', '-med-', '-edd-'],
    'technology': ['technology', '-it-', 'computer', 'cybersecurity', 'data-science', 'software', 'information-technology'],
    'healthcare': ['healthcare', 'health', 'medical', 'public-health', 'health-informatics'],
    'engineering': ['engineering', 'engineer', 'mechanical', 'electrical', 'civil', 'biomedical'],
    'criminal_justice': ['criminal-justice', 'law-enforcement', 'forensic'],
    'psychology': ['psychology', 'counseling', 'mental-health'],
    'social_work': ['social-work', 'msw', 'social-welfare'],
    'communications': ['communications', 'journalism', 'media'],
    'arts': ['art-', 'design', 'graphic', 'music', 'film'],
    'science': ['science', 'biology', 'chemistry', 'environmental'],
    'library_science': ['library', 'mlis', 'information-science'],
  };

  for (const [subject, keywords] of Object.entries(subjectMap)) {
    if (keywords.some(kw => urlLower.includes(kw))) {
      return subject;
    }
  }

  return null;
}

// Extract title from slug
function extractTitleFromSlug(slug) {
  // Remove common prefixes
  let title = slug
    .replace(/^online-/, '')
    .replace(/^best-/, '')
    .replace(/^affordable-/, '')
    .replace(/^cheapest-/, '')
    .replace(/^top-/, '');

  // Convert to title case
  title = title
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return title;
}

// Extract topics from URL
function extractTopics(url) {
  const topics = new Set();
  const urlLower = url.toLowerCase();

  // Common education topics
  const topicKeywords = [
    'online', 'degree', 'education', 'accreditation', 'aacsb', 'caep', 'ccne',
    'affordable', 'cost', 'scholarship', 'career', 'job', 'program',
    'admission', 'requirements',
  ];

  topicKeywords.forEach(topic => {
    if (urlLower.includes(topic)) {
      topics.add(topic);
    }
  });

  // Add degree level and subject as topics
  const degreeLevel = extractDegreeLevel(url);
  const subjectArea = extractSubjectArea(url);

  if (degreeLevel) topics.add(degreeLevel);
  if (subjectArea) topics.add(subjectArea.replace('_', ' '));

  return Array.from(topics);
}

async function main() {
  console.log('='.repeat(60));
  console.log('GetEducated.com URL Import to Supabase');
  console.log('='.repeat(60));

  // Load URL data
  const filepath = path.join(DATA_DIR, 'geteducated-sitemap-urls.json');
  let urlData;

  try {
    const content = await fs.readFile(filepath, 'utf-8');
    urlData = JSON.parse(content);
  } catch (error) {
    console.error('Could not load URL data:', error.message);
    console.log('Run collect-sitemap-urls.js first.');
    process.exit(1);
  }

  // Stats
  let stats = {
    articles: { total: 0, imported: 0, errors: 0 },
    schools: { total: 0, imported: 0, errors: 0 },
    authors: { total: 0, imported: 0, errors: 0 },
  };

  // Import Authors
  console.log('\n1. Importing authors...');
  stats.authors.total = urlData.authors.length;

  for (const { url, lastmod } of urlData.authors) {
    const slug = url.replace(BASE_URL + '/article-contributors/', '').replace(/\/$/, '');
    const name = extractTitleFromSlug(slug);

    const { error } = await supabase
      .from('geteducated_authors')
      .upsert({
        name,
        slug,
        profile_url: url,
      }, { onConflict: 'slug' });

    if (error) {
      console.error(`  Error: ${name}:`, error.message);
      stats.authors.errors++;
    } else {
      stats.authors.imported++;
    }
  }
  console.log(`  Imported: ${stats.authors.imported}/${stats.authors.total}`);

  // Import Schools
  console.log('\n2. Importing schools...');
  stats.schools.total = urlData.schools.length;

  // Batch insert schools
  const schoolBatchSize = 100;
  for (let i = 0; i < urlData.schools.length; i += schoolBatchSize) {
    const batch = urlData.schools.slice(i, i + schoolBatchSize);

    const schoolRecords = batch.map(({ url, lastmod }) => {
      const slug = url.replace(BASE_URL + '/online-schools/', '').replace(/\/$/, '');
      const name = extractTitleFromSlug(slug);

      return {
        name,
        slug,
        url,
      };
    });

    const { error, data } = await supabase
      .from('geteducated_schools')
      .upsert(schoolRecords, { onConflict: 'url' });

    if (error) {
      console.error(`  Batch error at ${i}:`, error.message);
      stats.schools.errors += batch.length;
    } else {
      stats.schools.imported += batch.length;
    }

    if ((i + schoolBatchSize) % 500 === 0 || i + schoolBatchSize >= urlData.schools.length) {
      console.log(`  Progress: ${Math.min(i + schoolBatchSize, urlData.schools.length)}/${urlData.schools.length}`);
    }
  }
  console.log(`  Imported: ${stats.schools.imported}/${stats.schools.total}`);

  // Import Articles
  console.log('\n3. Importing articles...');
  stats.articles.total = urlData.articles.length;

  const articleBatchSize = 50;
  for (let i = 0; i < urlData.articles.length; i += articleBatchSize) {
    const batch = urlData.articles.slice(i, i + articleBatchSize);

    const articleRecords = batch.map(({ url, lastmod }) => {
      const slug = url.replace(BASE_URL + '/', '').replace(/\/$/, '');
      const title = extractTitleFromSlug(slug.split('/').pop());
      const contentType = classifyContentType(url);
      const degreeLevel = extractDegreeLevel(url);
      const subjectArea = extractSubjectArea(url);
      const topics = extractTopics(url);

      return {
        url,
        slug,
        title,
        content_type: contentType,
        degree_level: degreeLevel,
        subject_area: subjectArea,
        topics: topics.length > 0 ? topics : null,
        primary_topic: topics[0] || null,
        updated_at: lastmod,
      };
    });

    const { error } = await supabase
      .from('geteducated_articles')
      .upsert(articleRecords, { onConflict: 'url' });

    if (error) {
      console.error(`  Batch error at ${i}:`, error.message);
      stats.articles.errors += batch.length;
    } else {
      stats.articles.imported += batch.length;
    }

    if ((i + articleBatchSize) % 200 === 0 || i + articleBatchSize >= urlData.articles.length) {
      console.log(`  Progress: ${Math.min(i + articleBatchSize, urlData.articles.length)}/${urlData.articles.length}`);
    }
  }
  console.log(`  Imported: ${stats.articles.imported}/${stats.articles.total}`);

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`Authors:  ${stats.authors.imported}/${stats.authors.total} (${stats.authors.errors} errors)`);
  console.log(`Schools:  ${stats.schools.imported}/${stats.schools.total} (${stats.schools.errors} errors)`);
  console.log(`Articles: ${stats.articles.imported}/${stats.articles.total} (${stats.articles.errors} errors)`);

  // Verify counts
  console.log('\nVerifying database counts...');

  const tables = [
    'geteducated_authors',
    'geteducated_schools',
    'geteducated_articles',
  ];

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    console.log(`  ${table}: ${count || 0} rows`);
  }

  console.log('\nImport complete!');
  console.log('\nNote: Run the full scraper later to populate content_html, content_text,');
  console.log('and other detailed fields for AI training purposes.');
}

main().catch(console.error);
