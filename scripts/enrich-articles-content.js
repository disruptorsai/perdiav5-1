/**
 * Enrich GetEducated Articles with Full Content
 *
 * This script fetches articles from Supabase that don't have content yet,
 * scrapes their full content, and updates the database directly.
 *
 * Usage:
 *   node scripts/enrich-articles-content.js
 *   node scripts/enrich-articles-content.js --limit=50
 *   node scripts/enrich-articles-content.js --batch=2
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
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
const batchArg = args.find(a => a.startsWith('--batch='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1]) : 5;

// Configuration
const CONFIG = {
  delay: 800, // Delay between requests (ms)
  timeout: 30000, // Request timeout
  maxRetries: 2,
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with timeout and retry
async function fetchWithRetry(url, retries = CONFIG.maxRetries) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      if (i < retries) {
        console.log(`    Retry ${i + 1}/${retries}: ${error.message}`);
        await delay(2000);
      } else {
        throw error;
      }
    }
  }
}

// Scrape article content using cheerio (much faster than JSDOM)
async function scrapeArticle(url) {
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  // Extract JSON-LD schema
  let schemaData = null;
  const jsonLdScript = $('script[type="application/ld+json"]').first().html();
  if (jsonLdScript) {
    try {
      schemaData = JSON.parse(jsonLdScript);
    } catch (e) {}
  }

  // Extract title
  const title = $('h1').first().text().trim() || $('title').text().trim() || '';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content') || '';

  // Extract author from schema or page
  let authorName = null;
  if (schemaData) {
    const schemas = schemaData['@graph'] || (Array.isArray(schemaData) ? schemaData : [schemaData]);
    const articleSchema = schemas.find(s => s['@type'] === 'Article' || s['@type'] === 'WebPage');
    if (articleSchema?.author) {
      const author = Array.isArray(articleSchema.author) ? articleSchema.author[0] : articleSchema.author;
      authorName = author.name;
    }
  }
  if (!authorName) {
    authorName = $('a[href*="/article-contributors/"]').first().text().trim() || null;
  }

  // Extract dates from schema
  let publishedAt = null;
  let updatedAt = null;
  if (schemaData) {
    const schemas = schemaData['@graph'] || (Array.isArray(schemaData) ? schemaData : [schemaData]);
    const articleSchema = schemas.find(s => s['@type'] === 'Article');
    if (articleSchema) {
      publishedAt = articleSchema.datePublished;
      updatedAt = articleSchema.dateModified;
    }
  }

  // Remove unwanted elements before extracting content
  $('nav, header, footer, aside, .sidebar, .navigation, .menu, script, style, .share-buttons, .author-box, .related-posts').remove();

  // Extract main content
  const mainContent = $('article').length ? $('article') :
                      $('.entry-content').length ? $('.entry-content') :
                      $('main').length ? $('main') : $('#content');

  let contentHtml = mainContent.html() || '';
  let contentText = mainContent.text().replace(/\s+/g, ' ').trim();

  // Extract heading structure
  const headingStructure = { h1: [], h2: [], h3: [] };
  $('h1, h2, h3').each((i, el) => {
    const level = el.tagName.toLowerCase();
    const text = $(el).text().trim();
    if (text && headingStructure[level].length < 20) {
      headingStructure[level].push(text);
    }
  });

  // Extract FAQs from schema
  const faqs = [];
  if (schemaData) {
    const schemas = schemaData['@graph'] || (Array.isArray(schemaData) ? schemaData : [schemaData]);
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
    if (faqSchema?.mainEntity) {
      faqSchema.mainEntity.forEach(item => {
        if (item['@type'] === 'Question') {
          faqs.push({
            question: item.name,
            answer: item.acceptedAnswer?.text || '',
          });
        }
      });
    }
  }

  // Extract internal and external links
  const internalLinks = [];
  const externalLinks = [];
  mainContent.find('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    const anchorText = $(el).text().trim();
    if (!href || !anchorText || anchorText.length < 3) return;

    if (href.startsWith('/') || href.includes('geteducated.com')) {
      const fullUrl = href.startsWith('/') ? 'https://www.geteducated.com' + href : href;
      if (internalLinks.length < 50) {
        internalLinks.push({ url: fullUrl, anchor_text: anchorText });
      }
    } else if (href.startsWith('http')) {
      try {
        const domain = new URL(href).hostname;
        if (externalLinks.length < 30) {
          externalLinks.push({ url: href, anchor_text: anchorText, domain });
        }
      } catch (e) {}
    }
  });

  // Featured image
  const featuredImageUrl = $('meta[property="og:image"]').attr('content') || null;

  // Word count
  const wordCount = contentText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    title,
    meta_description: metaDescription,
    excerpt: contentText.substring(0, 300) + (contentText.length > 300 ? '...' : ''),
    content_html: contentHtml.substring(0, 500000),
    content_text: contentText.substring(0, 200000),
    word_count: wordCount,
    author_name: authorName,
    published_at: publishedAt,
    heading_structure: headingStructure,
    faqs: faqs.length > 0 ? faqs : null,
    internal_links: internalLinks.length > 0 ? internalLinks : null,
    external_links: externalLinks.length > 0 ? externalLinks : null,
    featured_image_url: featuredImageUrl,
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('GetEducated Article Content Enrichment');
  console.log('='.repeat(60));
  console.log(`Settings: limit=${LIMIT}, batch=${BATCH_SIZE}`);

  // Get articles without content
  const { data: articles, error } = await supabase
    .from('geteducated_articles')
    .select('id, url, title')
    .is('content_text', null)
    .limit(LIMIT);

  if (error) {
    console.error('Error fetching articles:', error.message);
    process.exit(1);
  }

  console.log(`\nFound ${articles.length} articles without content\n`);

  if (articles.length === 0) {
    console.log('All articles already have content!');
    return;
  }

  let success = 0;
  let errors = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}`);

    // Process batch sequentially to be nice to the server
    for (const article of batch) {
      const shortUrl = article.url.replace('https://www.geteducated.com/', '/');
      console.log(`  Fetching: ${shortUrl.substring(0, 55)}...`);

      try {
        await delay(CONFIG.delay);
        const content = await scrapeArticle(article.url);

        // Update in database
        const { error: updateError } = await supabase
          .from('geteducated_articles')
          .update(content)
          .eq('id', article.id);

        if (updateError) {
          console.log(`    -> DB Error: ${updateError.message}`);
          errors++;
        } else {
          console.log(`    -> OK (${content.word_count} words)`);
          success++;
        }
      } catch (err) {
        console.log(`    -> Error: ${err.message}`);
        errors++;
      }
    }

    // Save checkpoint
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (success / (elapsed / 60)).toFixed(1);
    console.log(`  Progress: ${success + errors}/${articles.length} | ${success} OK, ${errors} errors | ${elapsed}s | ${rate}/min`);
  }

  // Final stats
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('Enrichment Complete');
  console.log('='.repeat(60));
  console.log(`Total: ${success + errors} articles processed`);
  console.log(`Success: ${success}`);
  console.log(`Errors: ${errors}`);
  console.log(`Time: ${totalTime}s`);

  // Check remaining
  const { count } = await supabase
    .from('geteducated_articles')
    .select('*', { count: 'exact', head: true })
    .is('content_text', null);

  console.log(`\nRemaining articles without content: ${count}`);

  if (count > 0) {
    console.log(`\nRun again to continue: node scripts/enrich-articles-content.js --limit=${Math.min(count, 100)}`);
  }
}

main().catch(console.error);
