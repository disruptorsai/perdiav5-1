import { base44 } from "@/api/base44Client";

/**
 * Automatically adds internal links to article content based on Site Catalog
 * @param {string} content - HTML content of the article
 * @param {string} title - Article title for context
 * @param {array} existingKeywords - Article's target keywords
 * @returns {Promise<{content: string, linksAdded: number, linkDetails: array}>}
 */
export async function addInternalLinks(content, title, existingKeywords = []) {
  try {
    // Fetch active Site Catalog articles (increased limit to scan more of the catalog)
    const siteArticles = await base44.entities.SiteArticle.filter(
      { is_active: true },
      '-created_date',
      1000
    );

    if (siteArticles.length === 0) {
      return { content, linksAdded: 0, linkDetails: [] };
    }

    // Enhanced Relevance Scoring with excerpts and multi-level matching
    const searchTerms = [
      ...title.toLowerCase().split(/\s+/),
      ...existingKeywords.map(k => k.toLowerCase())
    ].filter(t => t.length > 3 && !['what', 'how', 'best', 'guide', 'list', '2025', 'the', 'and', 'for'].includes(t));

    const scoredArticles = siteArticles.map(article => {
      let score = 0;
      const artTitle = article.title.toLowerCase();
      const artTopics = (article.topics || []).map(t => t.toLowerCase());
      const artExcerpt = (article.excerpt || '').toLowerCase();
      const artCat = (article.category || '').toLowerCase();

      searchTerms.forEach(term => {
        // Title matches (highest weight)
        if (artTitle.includes(term)) score += 15;

        // Topic matches (high weight)
        if (artTopics.some(t => t.includes(term) || term.includes(t))) score += 10;

        // Excerpt matches (medium weight - contextual relevance)
        if (artExcerpt.includes(term)) score += 5;

        // Category matches (lower weight)
        if (artCat.includes(term)) score += 3;

        // Exact keyword match bonus
        if (artTopics.includes(term)) score += 8;
      });

      // Category similarity bonus
      const currentCategory = (content.match(/degree|program|career|job|education/i) || [])[0]?.toLowerCase();
      if (currentCategory && artCat.includes(currentCategory)) score += 7;

      // Boost random factor for variety when scores are close
      return { ...article, score: score + Math.random() * 0.5 };
    });

    // Sort by relevance score descending
    scoredArticles.sort((a, b) => b.score - a.score);

    // Prepare top 50 MOST RELEVANT catalog data for AI with enriched context
    const catalogContext = scoredArticles.slice(0, 50).map(article => ({
      url: article.url,
      title: article.title,
      topics: article.topics || [],
      excerpt: (article.excerpt || '').substring(0, 150),
      category: article.category,
      relevanceScore: Math.round(article.score)
    }));

    // Use AI to identify linking opportunities
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert at adding internal links to educational content.

ARTICLE BEING EDITED:
Title: ${title}
Keywords: ${existingKeywords.join(', ')}

CONTENT TO ADD LINKS TO:
${content}

AVAILABLE SITE CATALOG ARTICLES (to link to):
${catalogContext.map((a, i) => `${i + 1}. "${a.title}" 
   URL: ${a.url}
   Topics: ${a.topics.join(', ')}
   Category: ${a.category}
   Context: ${a.excerpt}
   Relevance: ${a.relevanceScore}/20`).join('\n\n')}

YOUR TASK:
1. Identify 3-5 natural opportunities to add internal links within the article content
2. Choose the most relevant catalog articles based on context and topic overlap
3. Select anchor text that flows naturally (2-5 words from existing content)
4. DO NOT add links to the same URL twice
5. Spread links throughout the article, not all in one section
6. Prefer linking to highly relevant topics over generic matches

Return a JSON array of link insertions:
[
  {
    "anchor_text": "exact text from article to turn into a link",
    "url": "full URL from catalog",
    "reason": "why this link is relevant",
    "catalog_title": "title of the catalog article being linked to"
  }
]

CRITICAL: The anchor_text must be EXACT text that appears in the article content (case-sensitive match).
Only return links that make contextual sense and add value for readers.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                anchor_text: { type: "string" },
                url: { type: "string" },
                reason: { type: "string" },
                catalog_title: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (!result.links || result.links.length === 0) {
      return { content, linksAdded: 0, linkDetails: [] };
    }

    // Apply links to content
    let updatedContent = content;
    let linksAdded = 0;
    const linkDetails = [];
    const usedUrls = new Set();

    for (const link of result.links) {
      // Skip if URL already used
      if (usedUrls.has(link.url)) continue;

      // Skip if anchor text not found or already a link
      if (!updatedContent.includes(link.anchor_text)) continue;
      if (updatedContent.includes(`<a href="${link.url}">${link.anchor_text}</a>`)) continue;

      // Find first occurrence and replace with link
      const anchorRegex = new RegExp(`(?<!<a[^>]*>)${escapeRegExp(link.anchor_text)}(?![^<]*<\/a>)`, 'i');
      
      if (anchorRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(
          anchorRegex,
          `<a href="${link.url}">${link.anchor_text}</a>`
        );
        
        usedUrls.add(link.url);
        linksAdded++;
        linkDetails.push({
          anchor: link.anchor_text,
          url: link.url,
          title: link.catalog_title,
          reason: link.reason
        });
      }
    }

    return {
      content: updatedContent,
      linksAdded,
      linkDetails
    };

  } catch (error) {
    console.error('Auto-linking error:', error);
    // Return original content on error
    return { content, linksAdded: 0, linkDetails: [], error: error.message };
  }
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { addInternalLinks };