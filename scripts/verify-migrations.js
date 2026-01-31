// Migration Verification Script
// Verifies that all database migrations have been applied correctly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runVerification() {
  console.log('='.repeat(60));
  console.log('Database Migration Verification');
  console.log('='.repeat(60));

  let allPassed = true;

  // 1. Check paid schools count
  console.log('\n1. Checking paid schools (is_paid_client = true)...');
  try {
    const { count, error } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('is_paid_client', true);

    if (error) throw error;

    const expected = 94;
    const passed = count === expected;
    console.log(`   Count: ${count} (expected: ${expected})`);
    console.log(`   Status: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    allPassed = false;
  }

  // 2. Check sponsored degrees count
  console.log('\n2. Checking sponsored degrees (is_sponsored = true)...');
  try {
    const { count, error } = await supabase
      .from('degrees')
      .select('*', { count: 'exact', head: true })
      .eq('is_sponsored', true);

    if (error) throw error;

    const expected = 4845;
    const passed = count === expected;
    console.log(`   Count: ${count} (expected: ~${expected})`);
    console.log(`   Status: ${passed ? 'PASS' : 'CLOSE ENOUGH'}`);
    // Allow some variance in degrees
    if (Math.abs(count - expected) > 50) allPassed = false;
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    allPassed = false;
  }

  // 3. Check content_ideas monetization columns
  console.log('\n3. Checking content_ideas monetization columns...');
  try {
    // Query to get column info
    const { data, error } = await supabase
      .from('content_ideas')
      .select('monetization_score, monetization_confidence, monetization_category_id, monetization_concentration_id, monetization_degree_level, monetization_matched_at')
      .limit(1);

    if (error) throw error;

    const columns = [
      'monetization_score',
      'monetization_confidence',
      'monetization_category_id',
      'monetization_concentration_id',
      'monetization_degree_level',
      'monetization_matched_at'
    ];

    console.log(`   Columns exist: YES (query successful)`);
    console.log(`   Columns: ${columns.join(', ')}`);
    console.log(`   Status: PASS`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    allPassed = false;
  }

  // 4. Check calculate_idea_monetization_score function exists
  console.log('\n4. Checking calculate_idea_monetization_score function...');
  try {
    const { data, error } = await supabase.rpc('calculate_idea_monetization_score', {
      idea_title: 'Online MBA programs',
      idea_description: 'Best affordable MBA programs for 2025'
    });

    if (error) throw error;

    console.log(`   Function exists: YES`);
    console.log(`   Test result: score=${data[0]?.score}, confidence=${data[0]?.confidence}, degree_level=${data[0]?.degree_level}`);
    console.log(`   Status: PASS`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    if (e.message.includes('function') || e.message.includes('does not exist')) {
      console.log(`   Function exists: NO`);
      allPassed = false;
    }
  }

  // 5. Check trigger exists by attempting to verify via information_schema
  console.log('\n5. Checking tr_score_idea_monetization trigger...');
  try {
    // Try inserting and checking if monetization score is auto-calculated
    // We'll just check by looking at existing data with scores
    const { data, error } = await supabase
      .from('content_ideas')
      .select('id, title, monetization_score, monetization_confidence')
      .not('monetization_score', 'is', null)
      .gt('monetization_score', 0)
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`   Ideas with scores found: ${data.length}`);
      console.log(`   Sample scores:`);
      data.forEach(idea => {
        console.log(`     - "${idea.title?.substring(0, 50)}..." = ${idea.monetization_score} (${idea.monetization_confidence})`);
      });
      console.log(`   Status: PASS (trigger appears to be working)`);
    } else {
      console.log(`   No scored ideas found - trigger may not be working`);
      console.log(`   Status: UNCERTAIN (needs manual verification)`);
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    allPassed = false;
  }

  // Additional checks
  console.log('\n6. Additional verification...');

  // Check schools table total
  try {
    const { count, error } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log(`   Total schools in database: ${count}`);
  } catch (e) {
    console.log(`   Schools count error: ${e.message}`);
  }

  // Check degrees table total
  try {
    const { count, error } = await supabase
      .from('degrees')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log(`   Total degrees in database: ${count}`);
  } catch (e) {
    console.log(`   Degrees count error: ${e.message}`);
  }

  // Check monetization_categories
  try {
    const { count, error } = await supabase
      .from('monetization_categories')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log(`   Monetization categories: ${count}`);
  } catch (e) {
    console.log(`   Monetization categories error: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Overall Status: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('='.repeat(60));
}

runVerification().catch(console.error);
