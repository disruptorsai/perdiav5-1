/**
 * Initialize Original Versions for GetEducated Articles
 *
 * This script creates the initial "original" version for all articles
 * that have content but don't have a version record yet.
 *
 * Usage:
 *   node scripts/initialize-article-versions.js
 *   node scripts/initialize-article-versions.js --limit=100
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 1000;

async function main() {
  console.log('='.repeat(60));
  console.log('Initialize Original Versions for GetEducated Articles');
  console.log('='.repeat(60));

  // Get articles that have content but no version yet
  const { data: articles, error: fetchError } = await supabase
    .from('geteducated_articles')
    .select('id, title, meta_description, content_html, content_text, word_count, focus_keyword, heading_structure, faqs, internal_links, external_links, scraped_at, created_at')
    .not('content_text', 'is', null)
    .is('current_version_id', null)
    .limit(LIMIT);

  if (fetchError) {
    console.error('Error fetching articles:', fetchError.message);
    process.exit(1);
  }

  console.log(`\nFound ${articles.length} articles without versions\n`);

  if (articles.length === 0) {
    console.log('All articles already have versions!');
    return;
  }

  let success = 0;
  let errors = 0;

  // Process articles in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}...`);

    // Prepare version records
    const versions = batch.map(article => ({
      article_id: article.id,
      version_number: 1,
      version_type: 'original',
      title: article.title,
      meta_description: article.meta_description,
      content_html: article.content_html,
      content_text: article.content_text,
      word_count: article.word_count,
      focus_keyword: article.focus_keyword,
      heading_structure: article.heading_structure,
      faqs: article.faqs,
      internal_links: article.internal_links,
      external_links: article.external_links,
      is_current: true,
      revised_by: 'system',
      created_at: article.scraped_at || article.created_at || new Date().toISOString(),
    }));

    // Insert versions
    const { data: insertedVersions, error: insertError } = await supabase
      .from('geteducated_article_versions')
      .insert(versions)
      .select('id, article_id');

    if (insertError) {
      console.error(`  Batch insert error: ${insertError.message}`);
      errors += batch.length;
      continue;
    }

    // Update articles with version references
    for (const version of insertedVersions) {
      const { error: updateError } = await supabase
        .from('geteducated_articles')
        .update({
          current_version_id: version.id,
          version_count: 1,
          revision_status: 'original',
        })
        .eq('id', version.article_id);

      if (updateError) {
        console.error(`  Update error for ${version.article_id}: ${updateError.message}`);
        errors++;
      } else {
        success++;
      }
    }

    console.log(`  Batch complete: ${insertedVersions.length} versions created`);
  }

  // Final stats
  console.log('\n' + '='.repeat(60));
  console.log('Initialization Complete');
  console.log('='.repeat(60));
  console.log(`Total processed: ${articles.length}`);
  console.log(`Success: ${success}`);
  console.log(`Errors: ${errors}`);

  // Check remaining
  const { count } = await supabase
    .from('geteducated_articles')
    .select('*', { count: 'exact', head: true })
    .not('content_text', 'is', null)
    .is('current_version_id', null);

  console.log(`\nRemaining articles without versions: ${count}`);

  if (count > 0) {
    console.log(`\nRun again to continue: node scripts/initialize-article-versions.js --limit=${count}`);
  }
}

main().catch(console.error);
