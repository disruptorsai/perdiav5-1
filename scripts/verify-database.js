import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function finalReport() {
  console.log('======================================================================');
  console.log('        PERDIA V5 DATABASE VERIFICATION FINAL REPORT');
  console.log('======================================================================\n');

  // 1. Core Tables Status
  console.log('----------------------------------------------------------------------');
  console.log(' 1. CORE TABLE COUNTS');
  console.log('----------------------------------------------------------------------');

  const tableExpected = {
    'article_contributors': { expected: 4, critical: true },
    'monetization_categories': { expected: 155, critical: true },
    'monetization_levels': { expected: 13, critical: true },
    'subjects': { expected: 155, critical: false },
    'geteducated_articles': { expected: 1047, critical: false, note: 'Requires sitemap sync' },
    'geteducated_schools': { expected: 1754, critical: false, note: 'Requires sitemap sync' },
    'geteducated_authors': { expected: 10, critical: false, note: 'Requires sitemap sync' },
    'articles': { expected: 'any', critical: false },
    'article_monetization': { expected: 'any', critical: false },
    'content_ideas': { expected: 'any', critical: false },
    'generation_queue': { expected: 'any', critical: false },
    'system_settings': { expected: '>40', critical: true }
  };

  let issues = [];
  let warnings = [];

  for (const [table, config] of Object.entries(tableExpected)) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });

    let status = 'OK';
    let countStr = count !== null ? count.toString() : 'ERROR';

    if (error) {
      status = 'ERROR';
      issues.push(table + ': ' + error.message);
    } else if (config.expected === 'any') {
      status = 'OK';
    } else if (typeof config.expected === 'string' && config.expected.startsWith('>')) {
      const min = parseInt(config.expected.substring(1));
      if (count < min) {
        status = 'MISSING';
        if (config.critical) issues.push(table + ': Expected >' + min + ', got ' + count);
      }
    } else if (count === 0 && config.expected > 0) {
      status = config.note ? 'PENDING' : 'MISSING';
      if (config.critical) {
        issues.push(table + ': Expected ' + config.expected + ', got 0');
      } else if (config.note) {
        warnings.push(table + ': ' + config.note);
      }
    } else if (count !== config.expected && config.expected !== 'any') {
      status = 'PARTIAL';
      if (config.critical) issues.push(table + ': Expected ' + config.expected + ', got ' + count);
    }

    const statusIcon = status === 'OK' ? '[OK]' : status === 'PENDING' ? '[--]' : status === 'PARTIAL' ? '[!!]' : '[XX]';
    console.log(' ' + statusIcon + ' ' + table.padEnd(30) + countStr.padStart(8) + ' / ' + (config.expected.toString()).padEnd(10));
  }

  console.log('');

  // 2. Contributors with WordPress IDs
  console.log('----------------------------------------------------------------------');
  console.log(' 2. ARTICLE CONTRIBUTORS (WordPress Integration)');
  console.log('----------------------------------------------------------------------');

  const { data: contributors } = await supabase
    .from('article_contributors')
    .select('name, display_name, wordpress_contributor_id, is_active')
    .order('display_name');

  let allContributorsHaveWpId = true;
  if (contributors) {
    contributors.forEach(c => {
      const wpId = c.wordpress_contributor_id || 'MISSING';
      const active = c.is_active ? 'Active' : 'Inactive';
      const status = c.wordpress_contributor_id ? '[OK]' : '[XX]';
      if (!c.wordpress_contributor_id) allContributorsHaveWpId = false;
      console.log(' ' + status + ' ' + c.display_name.padEnd(20) + 'WP ID: ' + wpId.toString().padEnd(10) + active.padEnd(10));
    });
  }
  console.log('');

  // 3. Summary
  console.log('----------------------------------------------------------------------');
  console.log(' 3. SYSTEM READINESS SUMMARY');
  console.log('----------------------------------------------------------------------');

  if (issues.length > 0) {
    console.log(' CRITICAL ISSUES:');
    issues.forEach(i => console.log('   [!] ' + i));
  }

  if (warnings.length > 0) {
    console.log(' WARNINGS (Non-blocking):');
    warnings.forEach(w => console.log('   [-] ' + w));
  }

  console.log('');

  // Final verdict
  const hasBlockingIssues = issues.length > 0;
  const contributorsReady = allContributorsHaveWpId && contributors && contributors.length === 4;

  if (hasBlockingIssues) {
    console.log(' STATUS: NOT READY - Run seed migrations first');
    console.log('');
    console.log(' ACTION REQUIRED:');
    console.log(' 1. Go to Supabase Dashboard > SQL Editor');
    console.log(' 2. Run migration: 20251223100000_fix_missing_seed_data.sql');
    console.log(' 3. Re-run this verification');
  } else if (!contributorsReady) {
    console.log(' STATUS: PARTIAL - Contributors need WordPress IDs');
  } else {
    console.log(' STATUS: READY FOR CONTENT GENERATION');
    console.log('');
    console.log(' All core systems operational:');
    console.log(' [OK] 4 Contributors with WordPress IDs');
    console.log(' [OK] 155 Monetization categories');
    console.log(' [OK] 13 Monetization levels');
    console.log(' [OK] System settings configured');
    console.log('');
    console.log(' OPTIONAL - Run sitemap sync for:');
    console.log(' [-] GetEducated articles catalog (internal linking)');
    console.log(' [-] GetEducated schools (sponsorship detection)');
  }

  console.log('======================================================================');
}

finalReport().catch(console.error);
