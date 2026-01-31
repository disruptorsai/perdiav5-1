/**
 * Setup pg_cron job for auto-publish scheduler
 *
 * This script sets up the cron job to call the auto-publish-scheduler
 * Edge Function every 15 minutes.
 *
 * Usage:
 *   node scripts/setup-cron.js
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('='.repeat(60))
  console.log('pg_cron Setup for Auto-Publish Scheduler')
  console.log('='.repeat(60))
  console.log()

  try {
    // Check if pg_cron extension is enabled
    console.log('Checking pg_cron extension...')
    const { data: extensions, error: extError } = await supabase.rpc('check_extensions', {})

    if (extError) {
      // Try direct query approach
      console.log('Using direct query to check extensions...')
    }

    // Check if cron job already exists
    console.log('Checking for existing cron job...')
    const { data: existingJobs, error: jobError } = await supabase
      .from('cron.job')
      .select('*')
      .eq('jobname', 'auto-publish-articles')

    if (jobError) {
      console.log('Note: Cannot query cron.job table directly.')
      console.log('The cron job may need to be set up via Supabase Dashboard.')
      console.log()
      console.log('Please run this SQL in the Supabase SQL Editor:')
      console.log()
      console.log(`
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job (every 15 minutes)
SELECT cron.schedule(
  'auto-publish-articles',
  '0,15,30,45 * * * *',
  $$
  SELECT net.http_post(
    url := '${supabaseUrl}/functions/v1/auto-publish-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'timestamp', now()
    )
  ) as request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job;
      `)
      return
    }

    if (existingJobs && existingJobs.length > 0) {
      console.log('Cron job already exists!')
      console.log(existingJobs)
      return
    }

    console.log('Cron job not found. Creating...')

    // This would need RPC function or direct SQL execution
    // which isn't available through the Supabase JS client
    console.log()
    console.log('Please run the following SQL in Supabase Dashboard SQL Editor:')
    console.log()
    console.log(`
SELECT cron.schedule(
  'auto-publish-articles',
  '0,15,30,45 * * * *',
  $$
  SELECT net.http_post(
    url := '${supabaseUrl}/functions/v1/auto-publish-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'timestamp', now()
    )
  ) as request_id;
  $$
);
    `)

    console.log()
    console.log('After running the SQL, verify with:')
    console.log('  SELECT * FROM cron.job;')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
