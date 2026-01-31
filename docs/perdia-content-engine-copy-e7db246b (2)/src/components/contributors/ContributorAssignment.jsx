import { base44 } from "@/api/base44Client";

/**
 * Intelligent contributor assignment based on article content
 * Maps article topics/keywords to contributor expertise areas
 */

// Contributor expertise mapping - defines who writes what
const CONTRIBUTOR_EXPERTISE = {
  'tony-huffman': {
    keywords: ['ranking', 'enrollment', 'affordability', 'cost', 'value', 'best online', 'top programs', 'comparison', 'tuition', 'financial aid', 'scholarships'],
    categories: ['rankings', 'degree_guides'],
    types: ['ranking', 'listicle']
  },
  'kayleigh-gilbert': {
    keywords: ['accreditation', 'diploma mill', 'scam', 'legitimacy', 'consumer protection', 'advocacy', 'quality assurance', 'legitimate', 'recognized', 'fraud'],
    categories: ['school_reviews', 'guides'],
    types: ['guide', 'faq']
  },
  'dr-julia-tell': {
    keywords: ['instructional design', 'elearning', 'course design', 'pedagogy', 'learning outcomes', 'curriculum', 'teaching methods', 'educational technology', 'online teaching'],
    categories: ['guides', 'resources'],
    types: ['guide']
  },
  'kif-richmann': {
    keywords: ['career', 'job outlook', 'salary', 'employment', 'career path', 'professional development', 'skills', 'workforce', 'career change', 'job growth'],
    categories: ['career_guides'],
    types: ['career_guide', 'guide']
  },
  'melanie-krol': {
    keywords: ['leadership', 'ministry', 'faith-based', 'christian education', 'instructional', 'strategy', 'administration', 'educational leadership'],
    categories: ['degree_guides', 'guides'],
    types: ['guide', 'ranking']
  },
  'alicia-carrasco': {
    keywords: ['alternative education', 'non-traditional', 'transformational', 'experiential learning', 'adult education', 'life experience', 'competency-based'],
    categories: ['guides', 'resources'],
    types: ['guide', 'faq']
  },
  'daniel-catena': {
    keywords: ['digital marketing', 'content strategy', 'seo', 'marketing', 'business', 'entrepreneurship', 'communication'],
    categories: ['career_guides', 'guides'],
    types: ['guide', 'listicle']
  },
  'sarah-raines': {
    keywords: ['accessibility', 'ada compliance', 'inclusive education', 'universal design', 'digital course', 'online course creation', 'educational content'],
    categories: ['guides', 'resources'],
    types: ['guide']
  },
  'wei-luo': {
    keywords: ['online learning', 'distance education', 'degree programs', 'general education', 'trends', 'technology', 'virtual learning', 'mooc'],
    categories: ['degree_guides', 'guides'],
    types: ['guide', 'listicle']
  }
};

/**
 * Calculate match score between article and contributor
 */
function calculateContributorScore(article, contributor, contributorSlug) {
  let score = 0;
  const expertise = CONTRIBUTOR_EXPERTISE[contributorSlug];
  
  if (!expertise) return 0;

  // Title and content text for analysis
  const articleText = `${article.title} ${article.excerpt || ''} ${(article.target_keywords || []).join(' ')}`.toLowerCase();

  // Check keyword matches (highest weight)
  expertise.keywords.forEach(keyword => {
    if (articleText.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

  // Check category match
  if (expertise.categories.includes(article.category)) {
    score += 15;
  }

  // Check type match
  if (expertise.types.includes(article.type)) {
    score += 8;
  }

  // Check target keywords overlap
  (article.target_keywords || []).forEach(kw => {
    expertise.keywords.forEach(expKw => {
      if (kw.toLowerCase().includes(expKw.toLowerCase()) || expKw.toLowerCase().includes(kw.toLowerCase())) {
        score += 5;
      }
    });
  });

  return score;
}

/**
 * Auto-assign the best contributor for an article
 * @param {Object} article - Article object with title, type, keywords, etc.
 * @returns {Promise<Object>} - Contributor object or null
 */
export async function assignContributor(article) {
  try {
    // Fetch all active contributors
    const contributors = await base44.entities.ArticleContributor.filter({ is_active: true });
    
    if (!contributors || contributors.length === 0) {
      console.warn('No contributors found in system');
      return null;
    }

    // Calculate scores for each contributor
    const scoredContributors = contributors.map(contributor => ({
      contributor,
      score: calculateContributorScore(article, contributor, contributor.slug)
    }));

    // Sort by score descending
    scoredContributors.sort((a, b) => b.score - a.score);

    // Return best match
    const bestMatch = scoredContributors[0];
    
    if (bestMatch.score === 0) {
      // No good match, default to Wei Luo (general online learning)
      const defaultContributor = contributors.find(c => c.slug === 'wei-luo');
      return defaultContributor || contributors[0];
    }

    console.log(`Auto-assigned contributor: ${bestMatch.contributor.name} (score: ${bestMatch.score})`);
    return bestMatch.contributor;
    
  } catch (error) {
    console.error('Error assigning contributor:', error);
    return null;
  }
}

/**
 * Get contributor for display in UI
 */
export async function getContributorById(contributorId) {
  if (!contributorId) return null;
  try {
    const contributors = await base44.entities.ArticleContributor.filter({ id: contributorId });
    return contributors[0] || null;
  } catch (error) {
    console.error('Error fetching contributor:', error);
    return null;
  }
}