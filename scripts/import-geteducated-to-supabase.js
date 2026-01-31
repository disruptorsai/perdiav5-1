/**
 * Import GetEducated.com Scraped Data to Supabase
 *
 * This script imports the JSON data scraped from GetEducated.com
 * into the Supabase database tables.
 *
 * Usage:
 *   node scripts/import-geteducated-to-supabase.js
 *
 * Prerequisites:
 *   - Run the scraper first: node scripts/scrape-geteducated.js
 *   - Run the migration: 20250107000000_geteducated_site_catalog.sql
 *   - Set environment variables:
 *     - SUPABASE_URL
 *     - SUPABASE_SERVICE_KEY (service role key for admin access)
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
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = './scripts/data';

// Helper to chunk arrays for batch inserts
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function loadJsonFile(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Could not load ${filename}: ${error.message}`);
    return [];
  }
}

async function importAuthors() {
  console.log('\n1. Importing authors...');
  const authors = await loadJsonFile('geteducated-authors.json');

  if (authors.length === 0) {
    console.log('   No authors to import');
    return new Map();
  }

  const authorMap = new Map();

  for (const author of authors) {
    const { data, error } = await supabase
      .from('geteducated_authors')
      .upsert({
        name: author.name,
        slug: author.slug,
        title: author.title,
        credentials: author.credentials,
        bio: author.bio,
        linkedin_url: author.linkedin_url,
        profile_url: author.profile_url,
      }, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      console.error(`   Error importing author ${author.name}:`, error.message);
    } else if (data) {
      authorMap.set(author.name, data.id);
      console.log(`   Imported: ${author.name}`);
    }
  }

  console.log(`   Total: ${authorMap.size} authors`);
  return authorMap;
}

async function importCategories() {
  console.log('\n2. Importing categories...');
  const categories = await loadJsonFile('geteducated-categories.json');

  if (categories.length === 0) {
    console.log('   No categories to import');
    return new Map();
  }

  const categoryMap = new Map();

  for (const category of categories) {
    const { data, error } = await supabase
      .from('geteducated_categories')
      .upsert({
        name: category.name,
        slug: category.slug,
        article_count: category.article_count || 0,
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`   Error importing category ${category.name}:`, error.message);
    } else if (data) {
      categoryMap.set(category.name, data.id);
    }
  }

  console.log(`   Total: ${categoryMap.size} categories`);
  return categoryMap;
}

async function importTags() {
  console.log('\n3. Importing tags...');
  const tags = await loadJsonFile('geteducated-tags.json');

  if (tags.length === 0) {
    console.log('   No tags to import');
    return new Map();
  }

  const tagMap = new Map();

  for (const tag of tags) {
    const { data, error } = await supabase
      .from('geteducated_tags')
      .upsert({
        name: tag.name,
        slug: tag.slug,
        usage_count: tag.usage_count || 0,
      }, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      console.error(`   Error importing tag ${tag.name}:`, error.message);
    } else if (data) {
      tagMap.set(tag.name, data.id);
    }
  }

  console.log(`   Total: ${tagMap.size} tags`);
  return tagMap;
}

async function importSchools() {
  console.log('\n4. Importing schools...');
  const schools = await loadJsonFile('geteducated-schools.json');

  if (schools.length === 0) {
    console.log('   No schools to import');
    return new Map();
  }

  const schoolMap = new Map();

  for (const school of schools) {
    const { data, error } = await supabase
      .from('geteducated_schools')
      .upsert({
        name: school.name,
        slug: school.slug,
        url: school.url,
        official_website: school.official_website,
        description: school.description,
        featured_image_url: school.featured_image_url,
      }, { onConflict: 'url' })
      .select()
      .single();

    if (error) {
      console.error(`   Error importing school ${school.name}:`, error.message);
    } else if (data) {
      schoolMap.set(school.name, data.id);
    }
  }

  console.log(`   Total: ${schoolMap.size} schools`);
  return schoolMap;
}

async function importArticles(authorMap, categoryMap, tagMap) {
  console.log('\n5. Importing articles...');
  const articles = await loadJsonFile('geteducated-articles.json');

  if (articles.length === 0) {
    console.log('   No articles to import');
    return;
  }

  let imported = 0;
  let errors = 0;

  // Process in batches
  const batches = chunk(articles, 50);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`   Batch ${batchIndex + 1}/${batches.length}...`);

    for (const article of batch) {
      // Find author ID
      const authorId = article.author_name ? authorMap.get(article.author_name) : null;

      // Prepare article data
      const articleData = {
        url: article.url,
        slug: article.slug,
        title: article.title,
        meta_description: article.meta_description,
        excerpt: article.excerpt,
        content_html: article.content_html,
        content_text: article.content_text,
        word_count: article.word_count,
        content_type: article.content_type,
        author_id: authorId,
        author_name: article.author_name,
        published_at: article.published_at,
        updated_at: article.updated_at,
        heading_structure: article.heading_structure,
        faqs: article.faqs?.length > 0 ? article.faqs : null,
        internal_links: article.internal_links?.length > 0 ? article.internal_links : null,
        external_links: article.external_links?.length > 0 ? article.external_links : null,
        featured_image_url: article.featured_image_url,
        schema_data: article.schema_data,
        topics: article.topics?.length > 0 ? article.topics : null,
        primary_topic: article.primary_topic,
        degree_level: article.degree_level,
        subject_area: article.subject_area,
      };

      const { data, error } = await supabase
        .from('geteducated_articles')
        .upsert(articleData, { onConflict: 'url' })
        .select()
        .single();

      if (error) {
        console.error(`   Error importing article ${article.url}:`, error.message);
        errors++;
        continue;
      }

      imported++;

      // Link categories
      if (article.categories?.length > 0 && data) {
        for (const catName of article.categories) {
          const catId = categoryMap.get(catName);
          if (catId) {
            await supabase
              .from('geteducated_article_categories')
              .upsert({
                article_id: data.id,
                category_id: catId,
              }, { onConflict: 'article_id,category_id' });
          }
        }
      }

      // Link tags
      if (article.tags?.length > 0 && data) {
        for (const tagName of article.tags) {
          const tagId = tagMap.get(tagName);
          if (tagId) {
            await supabase
              .from('geteducated_article_tags')
              .upsert({
                article_id: data.id,
                tag_id: tagId,
              }, { onConflict: 'article_id,tag_id' });
          }
        }
      }
    }
  }

  console.log(`   Imported: ${imported} articles`);
  console.log(`   Errors: ${errors}`);
}

async function updateAuthorArticleCounts() {
  console.log('\n6. Updating author article counts...');

  const { data: authors } = await supabase
    .from('geteducated_authors')
    .select('id, name');

  if (!authors) return;

  for (const author of authors) {
    const { count } = await supabase
      .from('geteducated_articles')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', author.id);

    await supabase
      .from('geteducated_authors')
      .update({ articles_count: count || 0 })
      .eq('id', author.id);
  }

  console.log('   Done');
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));

  const tables = [
    'geteducated_authors',
    'geteducated_categories',
    'geteducated_tags',
    'geteducated_schools',
    'geteducated_articles',
  ];

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    console.log(`${table}: ${count || 0} rows`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('GetEducated.com Data Import to Supabase');
  console.log('='.repeat(60));

  try {
    // Import in order (authors first since articles reference them)
    const authorMap = await importAuthors();
    const categoryMap = await importCategories();
    const tagMap = await importTags();
    await importSchools();
    await importArticles(authorMap, categoryMap, tagMap);
    await updateAuthorArticleCounts();
    await printSummary();

    console.log('\nImport complete!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
