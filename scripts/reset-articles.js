/**
 * Reset Articles Script for Perdia v5
 *
 * This script deletes all articles and related records from the database
 * to start fresh with the new validation system.
 *
 * Tables to delete from (in order due to FK constraints):
 * 1. article_comments (FK to articles, ai_revisions)
 * 2. ai_revisions (FK to articles)
 * 3. article_revisions (FK to articles)
 * 4. internal_links (FK to articles)
 * 5. external_links (FK to articles)
 * 6. training_data (FK to articles)
 * 7. generation_queue (FK to articles, content_ideas)
 * 8. articles (main table)
 * 9. Update content_ideas (reset article_id and status)
 *
 * Usage: node scripts/reset-articles.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function countRecords(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    // Table might not exist
    if (error.code === '42P01') {
      return 0;
    }
    console.warn(`Warning: Could not count ${tableName}: ${error.message}`);
    return 0;
  }
  return count || 0;
}

async function deleteFromTable(tableName, condition = null) {
  let query = supabase.from(tableName).delete();

  if (condition) {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  }

  const { error, count } = await query;

  if (error) {
    if (error.code === '42P01') {
      console.log(`  - ${tableName}: Table does not exist (skipped)`);
      return 0;
    }
    throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
  }

  return count || 0;
}

async function main() {
  console.log('============================================');
  console.log('  PERDIA V5 - ARTICLE DATABASE RESET');
  console.log('============================================\n');

  // Step 1: Count current records
  console.log('Step 1: Counting current records...\n');

  const tables = [
    'articles',
    'article_comments',
    'ai_revisions',
    'article_revisions',
    'internal_links',
    'external_links',
    'training_data',
    'generation_queue'
  ];

  const initialCounts = {};
  for (const table of tables) {
    initialCounts[table] = await countRecords(table);
    console.log(`  - ${table}: ${initialCounts[table]} records`);
  }

  // Count content ideas that will be reset
  const { count: completedIdeasCount, error: ideaCountError } = await supabase
    .from('content_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  if (!ideaCountError) {
    console.log(`  - content_ideas (completed): ${completedIdeasCount || 0} records to reset`);
  }

  const { count: linkedIdeasCount, error: linkedCountError } = await supabase
    .from('content_ideas')
    .select('*', { count: 'exact', head: true })
    .not('article_id', 'is', null);

  if (!linkedCountError) {
    console.log(`  - content_ideas (with article_id): ${linkedIdeasCount || 0} records to reset`);
  }

  console.log('\n--------------------------------------------\n');
  console.log('Step 2: Deleting related records (child tables first)...\n');

  const deleteCounts = {};

  // Delete in order of dependencies (children first)

  // 2a. article_comments (references articles AND ai_revisions)
  try {
    const { data: deletedComments, error: commentsError } = await supabase
      .from('article_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (commentsError && commentsError.code !== '42P01') {
      throw commentsError;
    }
    deleteCounts['article_comments'] = deletedComments?.length || 0;
    console.log(`  - Deleted ${deleteCounts['article_comments']} article_comments`);
  } catch (err) {
    console.log(`  - article_comments: ${err.message}`);
    deleteCounts['article_comments'] = 0;
  }

  // 2b. ai_revisions (references articles)
  try {
    const { data: deletedRevisions, error: revisionsError } = await supabase
      .from('ai_revisions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (revisionsError && revisionsError.code !== '42P01') {
      throw revisionsError;
    }
    deleteCounts['ai_revisions'] = deletedRevisions?.length || 0;
    console.log(`  - Deleted ${deleteCounts['ai_revisions']} ai_revisions`);
  } catch (err) {
    console.log(`  - ai_revisions: ${err.message}`);
    deleteCounts['ai_revisions'] = 0;
  }

  // 2c. article_revisions (references articles)
  try {
    const { data: deletedArticleRevisions, error: artRevError } = await supabase
      .from('article_revisions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (artRevError && artRevError.code !== '42P01') {
      throw artRevError;
    }
    deleteCounts['article_revisions'] = deletedArticleRevisions?.length || 0;
    console.log(`  - Deleted ${deleteCounts['article_revisions']} article_revisions`);
  } catch (err) {
    console.log(`  - article_revisions: ${err.message}`);
    deleteCounts['article_revisions'] = 0;
  }

  // 2d. internal_links (references articles)
  try {
    const { data: deletedInternalLinks, error: intLinkError } = await supabase
      .from('internal_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (intLinkError && intLinkError.code !== '42P01') {
      throw intLinkError;
    }
    deleteCounts['internal_links'] = deletedInternalLinks?.length || 0;
    console.log(`  - Deleted ${deleteCounts['internal_links']} internal_links`);
  } catch (err) {
    console.log(`  - internal_links: ${err.message}`);
    deleteCounts['internal_links'] = 0;
  }

  // 2e. external_links (references articles)
  try {
    const { data: deletedExternalLinks, error: extLinkError } = await supabase
      .from('external_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (extLinkError && extLinkError.code !== '42P01') {
      throw extLinkError;
    }
    deleteCounts['external_links'] = deletedExternalLinks?.length || 0;
    console.log(`  - Deleted ${deleteCounts['external_links']} external_links`);
  } catch (err) {
    console.log(`  - external_links: ${err.message}`);
    deleteCounts['external_links'] = 0;
  }

  // 2f. training_data (references articles)
  try {
    const { data: deletedTraining, error: trainingError } = await supabase
      .from('training_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (trainingError && trainingError.code !== '42P01') {
      throw trainingError;
    }
    deleteCounts['training_data'] = deletedTraining?.length || 0;
    console.log(`  - Deleted ${deleteCounts['training_data']} training_data`);
  } catch (err) {
    console.log(`  - training_data: ${err.message}`);
    deleteCounts['training_data'] = 0;
  }

  // 2g. generation_queue (references articles via generated_article_id)
  try {
    const { data: deletedQueue, error: queueError } = await supabase
      .from('generation_queue')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (queueError && queueError.code !== '42P01') {
      throw queueError;
    }
    deleteCounts['generation_queue'] = deletedQueue?.length || 0;
    console.log(`  - Deleted ${deleteCounts['generation_queue']} generation_queue entries`);
  } catch (err) {
    console.log(`  - generation_queue: ${err.message}`);
    deleteCounts['generation_queue'] = 0;
  }

  console.log('\n--------------------------------------------\n');
  console.log('Step 3: Deleting all articles...\n');

  // 3. Delete all articles
  try {
    const { data: deletedArticles, error: articlesError } = await supabase
      .from('articles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (articlesError) {
      throw articlesError;
    }
    deleteCounts['articles'] = deletedArticles?.length || 0;
    console.log(`  - Deleted ${deleteCounts['articles']} articles`);
  } catch (err) {
    console.error(`  - ERROR deleting articles: ${err.message}`);
    deleteCounts['articles'] = 0;
  }

  console.log('\n--------------------------------------------\n');
  console.log('Step 4: Resetting content_ideas...\n');

  // 4. Reset content_ideas that have article_id or status='completed'
  let resetCount = 0;

  try {
    // First, update ideas with article_id to clear it and reset status
    const { data: resetWithArticleId, error: resetError1 } = await supabase
      .from('content_ideas')
      .update({
        article_id: null,
        status: 'approved'
      })
      .not('article_id', 'is', null)
      .select();

    if (resetError1) {
      throw resetError1;
    }
    resetCount += resetWithArticleId?.length || 0;
    console.log(`  - Reset ${resetWithArticleId?.length || 0} content_ideas with article_id`);

    // Then, update completed ideas that don't have article_id
    const { data: resetCompleted, error: resetError2 } = await supabase
      .from('content_ideas')
      .update({ status: 'approved' })
      .eq('status', 'completed')
      .select();

    if (resetError2) {
      throw resetError2;
    }
    resetCount += resetCompleted?.length || 0;
    console.log(`  - Reset ${resetCompleted?.length || 0} content_ideas with status='completed'`);
  } catch (err) {
    console.error(`  - ERROR resetting content_ideas: ${err.message}`);
  }

  console.log('\n============================================');
  console.log('  RESET COMPLETE - SUMMARY');
  console.log('============================================\n');

  console.log('Records deleted:');
  for (const [table, count] of Object.entries(deleteCounts)) {
    console.log(`  - ${table}: ${count} records deleted`);
  }
  console.log(`  - content_ideas: ${resetCount} records reset to 'approved'`);

  console.log('\n--------------------------------------------\n');
  console.log('Step 5: Verifying deletion...\n');

  // Verify counts are now 0
  for (const table of tables) {
    const count = await countRecords(table);
    console.log(`  - ${table}: ${count} records remaining`);
  }

  console.log('\n============================================');
  console.log('  DATABASE RESET COMPLETE');
  console.log('============================================\n');
}

main().catch(console.error);
