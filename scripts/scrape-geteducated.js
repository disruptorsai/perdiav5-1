/**
 * GetEducated.com Site Scraper
 *
 * This script scrapes the entire GetEducated.com website and saves
 * the data for import into Supabase.
 *
 * Usage:
 *   node scripts/scrape-geteducated.js
 *
 * Prerequisites:
 *   npm install cheerio node-fetch p-limit xml2js
 *
 * Output:
 *   - scripts/data/geteducated-articles.json
 *   - scripts/data/geteducated-schools.json
 *   - scripts/data/geteducated-authors.json
 *   - scripts/data/geteducated-categories.json
 */

import { JSDOM } from 'jsdom';
import pLimit from 'p-limit';
import { parseStringPromise } from 'xml2js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const CONFIG = {
  baseUrl: 'https://www.geteducated.com',
  sitemaps: {
    posts: '/post-sitemap.xml',
    pages: '/page-sitemap.xml',
    pages2: '/page-sitemap2.xml',
    schools: '/schools_and_degrees-sitemap.xml',
    schools2: '/schools_and_degrees-sitemap2.xml',
    degreeCategories: '/degree_categories-sitemap.xml',
    degreeCategories2: '/degree_categories-sitemap2.xml',
    authors: '/article_contributor-sitemap.xml',
  },
  concurrency: 3, // Max concurrent requests
  delay: 1000, // Delay between requests (ms)
  outputDir: './scripts/data',
  maxRetries: 3,
  retryDelay: 5000,
};

// Rate limiter
const limit = pLimit(CONFIG.concurrency);

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry
async function fetchWithRetry(url, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.log(`  Retry ${i + 1}/${retries} for ${url}: ${error.message}`);
      if (i < retries - 1) {
        await delay(CONFIG.retryDelay);
      } else {
        throw error;
      }
    }
  }
}

// Parse sitemap XML
async function parseSitemap(sitemapUrl) {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const xml = await fetchWithRetry(sitemapUrl);
  const result = await parseStringPromise(xml);

  if (!result.urlset || !result.urlset.url) {
    return [];
  }

  return result.urlset.url.map(entry => ({
    url: entry.loc[0],
    lastmod: entry.lastmod ? entry.lastmod[0] : null,
  }));
}

// Extract text content from HTML
function htmlToText(html) {
  if (!html) return '';
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent.replace(/\s+/g, ' ').trim();
}

// Classify article type based on URL and content
function classifyContentType(url, title = '') {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  if (urlLower.includes('/online-college-ratings-and-rankings/')) return 'ranking';
  if (urlLower.includes('/careers/') || urlLower.includes('/career-center/')) return 'career';
  if (urlLower.includes('/elearning-education-blog/')) return 'blog';
  if (urlLower.includes('/top-online-colleges/')) return 'guide';
  if (urlLower.includes('/online-degrees/')) return 'degree_category';
  if (urlLower.includes('/online-schools/')) return 'school_profile';
  if (urlLower.includes('/scholarship') || urlLower.includes('/financial-aid')) return 'scholarship';
  if (titleLower.includes('how to') || urlLower.includes('how-to')) return 'how_to';
  if (titleLower.includes('best ') || titleLower.includes('top ')) return 'listicle';

  return 'other';
}

// Extract degree level from URL/title
function extractDegreeLevel(url, title = '') {
  const text = (url + ' ' + title).toLowerCase();

  if (text.includes('doctorate') || text.includes('phd') || text.includes('edd') || text.includes('dnp')) return 'doctorate';
  if (text.includes('masters') || text.includes('master\'s') || text.includes('mba') || text.includes('msw') || text.includes('mlis')) return 'masters';
  if (text.includes('bachelors') || text.includes('bachelor\'s') || text.includes('bsn')) return 'bachelors';
  if (text.includes('associate')) return 'associate';
  if (text.includes('certificate')) return 'certificate';

  return null;
}

// Extract subject area from URL/title
function extractSubjectArea(url, title = '') {
  const text = (url + ' ' + title).toLowerCase();

  const subjectMap = {
    'nursing': ['nursing', 'nurse', 'bsn', 'msn', 'dnp', 'rn'],
    'business': ['business', 'mba', 'management', 'accounting', 'finance', 'marketing', 'hr', 'human-resource'],
    'education': ['education', 'teaching', 'teacher', 'educational', 'curriculum', 'instruction'],
    'technology': ['technology', 'it', 'computer', 'cybersecurity', 'data-science', 'software', 'information-technology'],
    'healthcare': ['healthcare', 'health', 'medical', 'public-health', 'health-informatics'],
    'engineering': ['engineering', 'engineer', 'mechanical', 'electrical', 'civil', 'biomedical'],
    'criminal_justice': ['criminal-justice', 'law-enforcement', 'forensic'],
    'psychology': ['psychology', 'counseling', 'mental-health'],
    'social_work': ['social-work', 'msw', 'social-welfare'],
    'communications': ['communications', 'journalism', 'media'],
    'arts': ['art', 'design', 'graphic', 'music', 'film'],
    'science': ['science', 'biology', 'chemistry', 'environmental'],
    'library_science': ['library', 'mlis', 'information-science'],
  };

  for (const [subject, keywords] of Object.entries(subjectMap)) {
    if (keywords.some(kw => text.includes(kw))) {
      return subject;
    }
  }

  return null;
}

// Extract topics from content
function extractTopics(title, content, url) {
  const topics = new Set();
  const text = (title + ' ' + content).toLowerCase();

  // Common education topics
  const topicKeywords = [
    'online degree', 'online education', 'distance learning',
    'accreditation', 'aacsb', 'caep', 'ccne', 'acen',
    'tuition', 'affordable', 'cost', 'financial aid', 'scholarship',
    'career', 'job', 'salary', 'employment',
    'curriculum', 'coursework', 'program', 'credits',
    'admission', 'requirements', 'gpa', 'gre', 'gmat',
  ];

  topicKeywords.forEach(topic => {
    if (text.includes(topic)) {
      topics.add(topic);
    }
  });

  // Add subject and degree level as topics
  const degreeLevel = extractDegreeLevel(url, title);
  const subjectArea = extractSubjectArea(url, title);

  if (degreeLevel) topics.add(degreeLevel);
  if (subjectArea) topics.add(subjectArea);

  return Array.from(topics);
}

// Scrape a single article page
async function scrapeArticle(url) {
  try {
    await delay(CONFIG.delay);
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract metadata from JSON-LD
    let schemaData = null;
    const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
      try {
        schemaData = JSON.parse(jsonLdScript.textContent);
      } catch (e) {
        // JSON parse error
      }
    }

    // Extract basic info
    const title = doc.querySelector('h1')?.textContent?.trim() ||
                  doc.querySelector('title')?.textContent?.trim() || '';

    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // Extract author
    let authorName = null;
    let authorUrl = null;

    if (schemaData) {
      const articleSchema = Array.isArray(schemaData)
        ? schemaData.find(s => s['@type'] === 'Article' || s['@type'] === 'WebPage')
        : (schemaData['@graph'] || [schemaData]).find(s => s['@type'] === 'Article' || s['@type'] === 'WebPage');

      if (articleSchema?.author) {
        const author = Array.isArray(articleSchema.author) ? articleSchema.author[0] : articleSchema.author;
        authorName = author.name;
        authorUrl = author.url;
      }
    }

    // Fallback: look for author link
    if (!authorName) {
      const authorLink = doc.querySelector('a[href*="/article-contributors/"]');
      if (authorLink) {
        authorName = authorLink.textContent?.trim();
        authorUrl = authorLink.getAttribute('href');
      }
    }

    // Extract dates
    let publishedAt = null;
    let updatedAt = null;

    const timeElement = doc.querySelector('time[datetime]');
    if (timeElement) {
      publishedAt = timeElement.getAttribute('datetime');
    }

    if (schemaData) {
      const articleSchema = Array.isArray(schemaData)
        ? schemaData.find(s => s['@type'] === 'Article')
        : (schemaData['@graph'] || [schemaData]).find(s => s['@type'] === 'Article');

      if (articleSchema) {
        publishedAt = publishedAt || articleSchema.datePublished;
        updatedAt = articleSchema.dateModified;
      }
    }

    // Extract main content
    const mainContent = doc.querySelector('article') ||
                        doc.querySelector('.entry-content') ||
                        doc.querySelector('main') ||
                        doc.querySelector('#content');

    let contentHtml = '';
    let contentText = '';

    if (mainContent) {
      // Remove nav, header, footer, sidebar elements
      ['nav', 'header', 'footer', 'aside', '.sidebar', '.navigation', '.menu', 'script', 'style'].forEach(sel => {
        mainContent.querySelectorAll(sel).forEach(el => el.remove());
      });

      contentHtml = mainContent.innerHTML;
      contentText = mainContent.textContent.replace(/\s+/g, ' ').trim();
    }

    // Extract heading structure
    const headingStructure = {
      h1: [],
      h2: [],
      h3: [],
    };

    doc.querySelectorAll('h1, h2, h3').forEach(heading => {
      const level = heading.tagName.toLowerCase();
      headingStructure[level].push(heading.textContent?.trim());
    });

    // Extract FAQs (look for FAQ schema or common patterns)
    const faqs = [];

    // Check schema for FAQs
    if (schemaData) {
      const faqSchema = Array.isArray(schemaData)
        ? schemaData.find(s => s['@type'] === 'FAQPage')
        : (schemaData['@graph'] || [schemaData]).find(s => s['@type'] === 'FAQPage');

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

    if (mainContent) {
      mainContent.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        const anchorText = link.textContent?.trim();

        if (!href || !anchorText) return;

        if (href.startsWith('/') || href.includes('geteducated.com')) {
          internalLinks.push({
            url: href.startsWith('/') ? CONFIG.baseUrl + href : href,
            anchor_text: anchorText,
          });
        } else if (href.startsWith('http')) {
          const domain = new URL(href).hostname;
          externalLinks.push({
            url: href,
            anchor_text: anchorText,
            domain,
          });
        }
      });
    }

    // Extract featured image
    let featuredImageUrl = null;
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage) {
      featuredImageUrl = ogImage.getAttribute('content');
    }

    // Word count
    const wordCount = contentText.split(/\s+/).filter(w => w.length > 0).length;

    // Classify content
    const contentType = classifyContentType(url, title);
    const degreeLevel = extractDegreeLevel(url, title);
    const subjectArea = extractSubjectArea(url, title);
    const topics = extractTopics(title, contentText, url);

    // Extract categories and tags from page
    const categories = [];
    const tags = [];

    doc.querySelectorAll('a[rel="category tag"], .category a').forEach(el => {
      categories.push(el.textContent?.trim());
    });

    doc.querySelectorAll('a[rel="tag"], .tags a').forEach(el => {
      tags.push(el.textContent?.trim());
    });

    return {
      url,
      slug: url.replace(CONFIG.baseUrl, '').replace(/^\/|\/$/g, ''),
      title,
      meta_description: metaDescription,
      excerpt: contentText.substring(0, 300) + '...',
      content_html: contentHtml,
      content_text: contentText,
      word_count: wordCount,
      content_type: contentType,
      author_name: authorName,
      author_url: authorUrl,
      published_at: publishedAt,
      updated_at: updatedAt,
      heading_structure: headingStructure,
      faqs,
      internal_links: internalLinks,
      external_links: externalLinks,
      featured_image_url: featuredImageUrl,
      schema_data: schemaData,
      topics,
      primary_topic: topics[0] || null,
      degree_level: degreeLevel,
      subject_area: subjectArea,
      categories,
      tags,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

// Scrape author page
async function scrapeAuthor(url) {
  try {
    await delay(CONFIG.delay);
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract from JSON-LD
    let schemaData = null;
    const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
      try {
        schemaData = JSON.parse(jsonLdScript.textContent);
      } catch (e) {}
    }

    const name = doc.querySelector('h1')?.textContent?.trim() || '';
    const bio = doc.querySelector('.author-bio, .biography, .entry-content p')?.textContent?.trim() || '';

    // Extract credentials
    let credentials = null;
    let title = null;

    if (schemaData) {
      const personSchema = Array.isArray(schemaData)
        ? schemaData.find(s => s['@type'] === 'Person')
        : (schemaData['@graph'] || [schemaData]).find(s => s['@type'] === 'Person');

      if (personSchema) {
        title = personSchema.jobTitle;
        credentials = personSchema.honorificSuffix;
      }
    }

    // LinkedIn
    const linkedinLink = doc.querySelector('a[href*="linkedin.com"]');
    const linkedinUrl = linkedinLink?.getAttribute('href') || null;

    return {
      name,
      slug: url.replace(CONFIG.baseUrl + '/article-contributors/', '').replace(/\/$/, ''),
      title,
      credentials,
      bio,
      linkedin_url: linkedinUrl,
      profile_url: url,
    };
  } catch (error) {
    console.error(`Error scraping author ${url}:`, error.message);
    return null;
  }
}

// Scrape school page
async function scrapeSchool(url) {
  try {
    await delay(CONFIG.delay);
    const html = await fetchWithRetry(url);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const name = doc.querySelector('h1')?.textContent?.trim() || '';
    const description = doc.querySelector('.school-description, .entry-content p')?.textContent?.trim() || '';

    // Extract official website if present
    const officialLink = doc.querySelector('a[href]:not([href*="geteducated"])');
    const officialWebsite = officialLink?.getAttribute('href') || null;

    // Featured image
    const featuredImage = doc.querySelector('.featured-image img, .school-logo img');
    const featuredImageUrl = featuredImage?.getAttribute('src') || null;

    return {
      name,
      slug: url.replace(CONFIG.baseUrl + '/online-schools/', '').replace(/\/$/, ''),
      url,
      official_website: officialWebsite,
      description,
      featured_image_url: featuredImageUrl,
    };
  } catch (error) {
    console.error(`Error scraping school ${url}:`, error.message);
    return null;
  }
}

// Main scraping function
async function main() {
  console.log('='.repeat(60));
  console.log('GetEducated.com Site Scraper');
  console.log('='.repeat(60));

  // Ensure output directory exists
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  // Collect all URLs from sitemaps
  console.log('\n1. Collecting URLs from sitemaps...\n');

  const allUrls = {
    articles: [],
    schools: [],
    degreeCategories: [],
    authors: [],
  };

  // Fetch all sitemaps
  try {
    // Posts (blog articles)
    const posts = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.posts);
    allUrls.articles.push(...posts.filter(p => !p.url.endsWith('/elearning-education-blog/')));

    // Pages (rankings, guides, etc.)
    const pages = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.pages);
    allUrls.articles.push(...pages.filter(p =>
      p.url !== CONFIG.baseUrl + '/' &&
      !p.url.includes('/online-degrees/') &&
      !p.url.includes('/online-schools/')
    ));

    const pages2 = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.pages2);
    allUrls.articles.push(...pages2.filter(p =>
      !p.url.includes('/online-degrees/') &&
      !p.url.includes('/online-schools/')
    ));

    // Schools
    const schools = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.schools);
    allUrls.schools.push(...schools);

    const schools2 = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.schools2);
    allUrls.schools.push(...schools2);

    // Degree categories
    const degCats = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.degreeCategories);
    allUrls.degreeCategories.push(...degCats);

    const degCats2 = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.degreeCategories2);
    allUrls.degreeCategories.push(...degCats2);

    // Authors
    const authors = await parseSitemap(CONFIG.baseUrl + CONFIG.sitemaps.authors);
    allUrls.authors.push(...authors);

  } catch (error) {
    console.error('Error fetching sitemaps:', error.message);
  }

  console.log(`Found:`);
  console.log(`  - ${allUrls.articles.length} articles/pages`);
  console.log(`  - ${allUrls.schools.length} schools`);
  console.log(`  - ${allUrls.degreeCategories.length} degree categories`);
  console.log(`  - ${allUrls.authors.length} authors`);

  // Scrape authors first
  console.log('\n2. Scraping authors...\n');
  const authorsData = [];

  for (let i = 0; i < allUrls.authors.length; i++) {
    const { url } = allUrls.authors[i];
    console.log(`  [${i + 1}/${allUrls.authors.length}] ${url}`);
    const author = await scrapeAuthor(url);
    if (author) authorsData.push(author);
  }

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-authors.json'),
    JSON.stringify(authorsData, null, 2)
  );
  console.log(`  Saved ${authorsData.length} authors`);

  // Scrape articles (most important for training and linking)
  console.log('\n3. Scraping articles...\n');
  const articlesData = [];

  // Limit to reasonable batch for testing
  const articleUrls = allUrls.articles.slice(0, 500); // Adjust as needed

  for (let i = 0; i < articleUrls.length; i++) {
    const { url, lastmod } = articleUrls[i];
    console.log(`  [${i + 1}/${articleUrls.length}] ${url}`);

    const article = await limit(() => scrapeArticle(url));
    if (article) {
      article.sitemap_lastmod = lastmod;
      articlesData.push(article);
    }

    // Save checkpoint every 50 articles
    if ((i + 1) % 50 === 0) {
      await fs.writeFile(
        path.join(CONFIG.outputDir, 'geteducated-articles-checkpoint.json'),
        JSON.stringify(articlesData, null, 2)
      );
      console.log(`  Checkpoint saved: ${articlesData.length} articles`);
    }
  }

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-articles.json'),
    JSON.stringify(articlesData, null, 2)
  );
  console.log(`  Saved ${articlesData.length} articles`);

  // Scrape schools (sample)
  console.log('\n4. Scraping schools (sample)...\n');
  const schoolsData = [];

  const schoolUrls = allUrls.schools.slice(0, 100); // Sample

  for (let i = 0; i < schoolUrls.length; i++) {
    const { url } = schoolUrls[i];
    console.log(`  [${i + 1}/${schoolUrls.length}] ${url}`);

    const school = await limit(() => scrapeSchool(url));
    if (school) schoolsData.push(school);
  }

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-schools.json'),
    JSON.stringify(schoolsData, null, 2)
  );
  console.log(`  Saved ${schoolsData.length} schools`);

  // Save URL lists for later
  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-all-urls.json'),
    JSON.stringify(allUrls, null, 2)
  );

  // Extract and deduplicate categories/tags from articles
  const allCategories = new Map();
  const allTags = new Map();

  articlesData.forEach(article => {
    (article.categories || []).forEach(cat => {
      if (cat && !allCategories.has(cat)) {
        allCategories.set(cat, {
          name: cat,
          slug: cat.toLowerCase().replace(/\s+/g, '-'),
          article_count: 0,
        });
      }
      if (cat) allCategories.get(cat).article_count++;
    });

    (article.tags || []).forEach(tag => {
      if (tag && !allTags.has(tag)) {
        allTags.set(tag, {
          name: tag,
          slug: tag.toLowerCase().replace(/\s+/g, '-'),
          usage_count: 0,
        });
      }
      if (tag) allTags.get(tag).usage_count++;
    });
  });

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-categories.json'),
    JSON.stringify(Array.from(allCategories.values()), null, 2)
  );

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'geteducated-tags.json'),
    JSON.stringify(Array.from(allTags.values()), null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log('Scraping complete!');
  console.log('='.repeat(60));
  console.log('\nOutput files:');
  console.log(`  - ${CONFIG.outputDir}/geteducated-articles.json`);
  console.log(`  - ${CONFIG.outputDir}/geteducated-schools.json`);
  console.log(`  - ${CONFIG.outputDir}/geteducated-authors.json`);
  console.log(`  - ${CONFIG.outputDir}/geteducated-categories.json`);
  console.log(`  - ${CONFIG.outputDir}/geteducated-tags.json`);
  console.log(`  - ${CONFIG.outputDir}/geteducated-all-urls.json`);
}

main().catch(console.error);
