/**
 * Collect GetEducated.com URLs from Sitemaps
 *
 * This script just collects all URLs from the sitemaps and saves them.
 * This is step 1 - no actual page scraping.
 *
 * Usage:
 *   node scripts/collect-sitemap-urls.js
 */

import { parseStringPromise } from 'xml2js';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG = {
  baseUrl: 'https://www.geteducated.com',
  outputDir: './scripts/data',
};

async function fetchSitemap(url) {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const result = await parseStringPromise(xml);

  if (!result.urlset || !result.urlset.url) {
    return [];
  }

  return result.urlset.url.map(entry => ({
    url: entry.loc[0],
    lastmod: entry.lastmod ? entry.lastmod[0] : null,
  }));
}

async function main() {
  console.log('='.repeat(60));
  console.log('GetEducated.com URL Collector');
  console.log('='.repeat(60));

  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  const allUrls = {
    articles: [],
    schools: [],
    degreeCategories: [],
    authors: [],
    collectedAt: new Date().toISOString(),
  };

  try {
    // Posts (blog articles)
    const posts = await fetchSitemap(CONFIG.baseUrl + '/post-sitemap.xml');
    allUrls.articles.push(...posts.filter(p => !p.url.endsWith('/elearning-education-blog/')));

    // Pages
    const pages = await fetchSitemap(CONFIG.baseUrl + '/page-sitemap.xml');
    allUrls.articles.push(...pages.filter(p =>
      p.url !== CONFIG.baseUrl + '/' &&
      !p.url.includes('/online-degrees/') &&
      !p.url.includes('/online-schools/')
    ));

    const pages2 = await fetchSitemap(CONFIG.baseUrl + '/page-sitemap2.xml');
    allUrls.articles.push(...pages2.filter(p =>
      !p.url.includes('/online-degrees/') &&
      !p.url.includes('/online-schools/')
    ));

    // Schools
    const schools = await fetchSitemap(CONFIG.baseUrl + '/schools_and_degrees-sitemap.xml');
    allUrls.schools.push(...schools);

    const schools2 = await fetchSitemap(CONFIG.baseUrl + '/schools_and_degrees-sitemap2.xml');
    allUrls.schools.push(...schools2);

    // Degree categories
    const degCats = await fetchSitemap(CONFIG.baseUrl + '/degree_categories-sitemap.xml');
    allUrls.degreeCategories.push(...degCats);

    const degCats2 = await fetchSitemap(CONFIG.baseUrl + '/degree_categories-sitemap2.xml');
    allUrls.degreeCategories.push(...degCats2);

    // Authors
    const authors = await fetchSitemap(CONFIG.baseUrl + '/article_contributor-sitemap.xml');
    allUrls.authors.push(...authors);

  } catch (error) {
    console.error('Error:', error.message);
  }

  // Save the collected URLs
  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-sitemap-urls.json'),
    JSON.stringify(allUrls, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log('Collection complete!');
  console.log('='.repeat(60));
  console.log(`\nFound:`);
  console.log(`  - ${allUrls.articles.length} articles/pages`);
  console.log(`  - ${allUrls.schools.length} schools`);
  console.log(`  - ${allUrls.degreeCategories.length} degree categories`);
  console.log(`  - ${allUrls.authors.length} authors`);
  console.log(`\nSaved to: ${CONFIG.outputDir}/geteducated-sitemap-urls.json`);
}

main().catch(console.error);
