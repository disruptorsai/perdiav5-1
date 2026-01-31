/**
 * IdeaDiscoveryService - Monetization-First Content Idea Discovery
 *
 * CRITICAL PRINCIPLE (per Tony Huffman's requirements):
 * "Content articles for the sake of articles and traffic isn't the goal,
 * its content and traffic we can monetize."
 *
 * This service now uses a MONETIZATION-FIRST approach:
 * 1. Load monetizable categories, concentrations, and paid schools
 * 2. Generate ideas that FIT these monetizable areas
 * 3. Validate and filter ideas by monetization potential
 * 4. Reject ideas that cannot be monetized (e.g., "space tourism", "forest ranger")
 *
 * DECEMBER 2025 UPDATE (per meeting with Tony & Justin):
 * - Start from SPONSORED SCHOOLS, not general topics
 * - Use geteducated_articles catalog with is_sponsored flag
 * - Prioritize /online-degrees/ directory pages with logos
 * - Work backwards from paid school listings
 */

import GrokClient from './ai/grokClient.edge'
import { supabase } from './supabaseClient'
import { categorizeUrl } from './sitemapService'

/**
 * Banned topic patterns - topics with NO monetization potential
 * These will be automatically rejected
 */
const BANNED_TOPIC_PATTERNS = [
  /space\s*(tourism|exploration|careers?)/i,
  /astronaut/i,
  /forest\s*ranger/i,
  /park\s*ranger/i,
  /wildlife\s*(officer|warden|conservation)/i,
  /marine\s*biology/i,  // Very niche, few online programs
  /archaeology/i,       // Very niche
  /paleontology/i,      // Very niche
  /zoology/i,           // Very niche
  /oceanography/i,      // Very niche
  /astronomy/i,         // Very niche
  /astrophysics/i,      // Very niche
]

class IdeaDiscoveryService {
  constructor() {
    this.grokClient = new GrokClient()
    this.learnedPatterns = null
    this.monetizationContext = null
  }

  // ============================================================================
  // MONETIZATION CONTEXT - The core of monetization-first approach
  // ============================================================================

  /**
   * Load monetization context: categories, concentrations, paid schools
   * This data tells the AI what topics we CAN actually monetize
   */
  async getMonetizationContext() {
    // Return cached if available and recent (5 minutes)
    if (this.monetizationContext &&
        this.monetizationContext.loadedAt > Date.now() - 5 * 60 * 1000) {
      return this.monetizationContext
    }

    try {
      // Fetch categories and concentrations
      const { data: categories, error: catError } = await supabase
        .from('monetization_categories')
        .select('category_id, concentration_id, category, concentration')
        .eq('is_active', true)
        .order('category')

      if (catError) throw catError

      // Fetch paid schools with degree counts
      const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('id, school_name, school_slug')
        .eq('is_paid_client', true)
        .eq('is_active', true)
        .order('school_name')

      if (schoolError) throw schoolError

      // Fetch degree counts per school
      const { data: degreeCounts, error: degreeError } = await supabase
        .from('paid_school_degrees')
        .select('school_name')

      // Count degrees per school
      const schoolDegreeCounts = {}
      if (degreeCounts) {
        degreeCounts.forEach(d => {
          schoolDegreeCounts[d.school_name] = (schoolDegreeCounts[d.school_name] || 0) + 1
        })
      }

      // Fetch degree levels
      const { data: levels, error: levelError } = await supabase
        .from('monetization_levels')
        .select('level_code, level_name')
        .eq('is_active', true)
        .order('level_code')

      // Group categories by name with their concentrations
      const categoryMap = new Map()
      categories?.forEach(cat => {
        if (!categoryMap.has(cat.category)) {
          categoryMap.set(cat.category, {
            id: cat.category_id,
            name: cat.category,
            concentrations: []
          })
        }
        categoryMap.get(cat.category).concentrations.push({
          id: cat.concentration_id,
          name: cat.concentration
        })
      })

      // Sort schools by degree count (most degrees first)
      const sortedSchools = schools?.map(s => ({
        ...s,
        degreeCount: schoolDegreeCounts[s.school_name] || 0
      })).sort((a, b) => b.degreeCount - a.degreeCount) || []

      this.monetizationContext = {
        categories: Array.from(categoryMap.values()),
        schools: sortedSchools,
        levels: levels || [],
        loadedAt: Date.now(),
        stats: {
          totalCategories: categoryMap.size,
          totalConcentrations: categories?.length || 0,
          totalPaidSchools: schools?.length || 0
        }
      }

      return this.monetizationContext
    } catch (error) {
      console.error('Failed to load monetization context:', error)
      return null
    }
  }

  /**
   * Build the monetization context section for AI prompts
   * This is CRITICAL - it tells the AI what we can monetize
   */
  buildMonetizationPromptSection(context) {
    if (!context) return ''

    let section = `

=== MONETIZATION REQUIREMENTS (CRITICAL - READ CAREFULLY) ===

GetEducated.com ONLY makes money when content leads to degree program signups.
Topics with no connection to our paid schools/degrees are WORTHLESS.

Every idea you suggest MUST:
1. Match one of our monetizable categories below
2. Be relevant to online degree programs
3. Target prospective online students
4. Have potential to drive degree signups

=== MONETIZABLE CATEGORIES (ONLY suggest topics in these areas) ===
`

    // Add categories with concentrations
    context.categories.forEach((cat, index) => {
      const concentrations = cat.concentrations.map(c => c.name).join(', ')
      section += `\n${index + 1}. ${cat.name}: ${concentrations}`
    })

    section += `

=== PAID SCHOOLS (mention these when relevant) ===
Top schools by program count:
`

    // Add top 25 paid schools
    context.schools.slice(0, 25).forEach(school => {
      section += `- ${school.school_name} (${school.degreeCount} online programs)\n`
    })

    section += `
=== DEGREE LEVELS ===
`
    context.levels.forEach(level => {
      section += `- ${level.level_name}\n`
    })

    section += `
=== BANNED TOPICS (NEVER suggest these - zero monetization potential) ===
- Space careers, astronomy, astrophysics
- Forest/park ranger careers
- Wildlife conservation careers
- Marine biology, oceanography
- Archaeology, paleontology
- Any topic that can't connect to online degree programs
- Any topic where we have ZERO paid schools offering related degrees

=== END MONETIZATION REQUIREMENTS ===
`

    return section
  }

  // ============================================================================
  // MONETIZATION VALIDATION - Filter out non-monetizable ideas
  // ============================================================================

  /**
   * Validate an idea's monetization potential
   * Returns a score 0-100 and matched category info
   */
  async validateIdeaMonetization(idea) {
    const context = await this.getMonetizationContext()
    if (!context) {
      return { score: 0, confidence: 'unknown', reason: 'Failed to load monetization context' }
    }

    const titleLower = (idea.title || '').toLowerCase()
    const descLower = (idea.description || '').toLowerCase()
    const combined = `${titleLower} ${descLower}`

    // Check against banned patterns first
    for (const pattern of BANNED_TOPIC_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          score: 0,
          confidence: 'banned',
          reason: `Topic matches banned pattern: ${pattern}`,
          matchedCategory: null
        }
      }
    }

    // Score against categories and concentrations
    let bestMatch = null
    let bestScore = 0

    for (const category of context.categories) {
      let categoryScore = 0

      // Check category name match
      const categoryWords = category.name.toLowerCase().split(/\s+/)
      for (const word of categoryWords) {
        if (word.length > 3 && combined.includes(word)) {
          categoryScore += 15
        }
      }

      // Check concentration matches
      for (const conc of category.concentrations) {
        const concLower = conc.name.toLowerCase()

        // Exact concentration match is high value
        if (combined.includes(concLower)) {
          categoryScore += 40
        } else {
          // Word-level matching
          const concWords = concLower.split(/\s+/)
          for (const word of concWords) {
            if (word.length > 3 && combined.includes(word)) {
              categoryScore += 10
            }
          }
        }
      }

      if (categoryScore > bestScore) {
        bestScore = categoryScore
        bestMatch = {
          categoryId: category.id,
          categoryName: category.name,
          score: categoryScore
        }
      }
    }

    // Cap score at 100
    const finalScore = Math.min(100, bestScore)

    // Determine confidence level
    let confidence = 'low'
    if (finalScore >= 60) confidence = 'high'
    else if (finalScore >= 30) confidence = 'medium'

    return {
      score: finalScore,
      confidence,
      matchedCategory: bestMatch,
      reason: bestMatch
        ? `Matches category: ${bestMatch.categoryName}`
        : 'No category match found'
    }
  }

  /**
   * Filter ideas by monetization score
   * Rejects ideas below the minimum threshold
   */
  async filterByMonetization(ideas, minScore = 25) {
    const results = []
    const rejected = []

    for (const idea of ideas) {
      const validation = await this.validateIdeaMonetization(idea)

      if (validation.score >= minScore) {
        results.push({
          ...idea,
          monetization_score: validation.score,
          monetization_confidence: validation.confidence,
          monetization_category: validation.matchedCategory?.categoryName || null,
          monetization_category_id: validation.matchedCategory?.categoryId || null
        })
      } else {
        rejected.push({
          ...idea,
          rejection_reason: validation.reason,
          monetization_score: validation.score
        })
      }
    }

    // Log rejections for debugging
    if (rejected.length > 0) {
      console.log(`[IdeaDiscovery] Rejected ${rejected.length} ideas for low monetization:`)
      rejected.forEach(r => {
        console.log(`  - "${r.title}" (score: ${r.monetization_score}, reason: ${r.rejection_reason})`)
      })
    }

    return { accepted: results, rejected }
  }

  // ============================================================================
  // LEARNING PATTERNS - User feedback integration
  // ============================================================================

  /**
   * Load active learning session patterns
   */
  async loadLearnedPatterns() {
    try {
      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .select('learned_patterns, improved_prompt, improvement_notes')
        .eq('session_type', 'idea_generation')
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.warn('Failed to load learning session:', error)
        return null
      }

      this.learnedPatterns = data
      return data
    } catch (error) {
      console.warn('Error loading learned patterns:', error)
      return null
    }
  }

  /**
   * Build learning context for the prompt
   */
  buildLearningContext(patterns) {
    if (!patterns?.learned_patterns) return ''

    const lp = patterns.learned_patterns
    let context = '\n\n=== LEARNED PREFERENCES FROM USER FEEDBACK ===\n'

    if (lp.goodPatterns?.length > 0) {
      context += `\nWHAT WORKS WELL (prioritize these patterns):\n`
      lp.goodPatterns.forEach(p => { context += `- ${p}\n` })
    }

    if (lp.badPatterns?.length > 0) {
      context += `\nWHAT TO AVOID (do not suggest ideas with these patterns):\n`
      lp.badPatterns.forEach(p => { context += `- ${p}\n` })
    }

    if (lp.preferredTopics?.length > 0) {
      context += `\nPREFERRED TOPIC AREAS:\n${lp.preferredTopics.join(', ')}\n`
    }

    if (lp.avoidTopics?.length > 0) {
      context += `\nTOPICS TO AVOID:\n${lp.avoidTopics.join(', ')}\n`
    }

    if (lp.titlePatterns) {
      if (lp.titlePatterns.good?.length > 0) {
        context += `\nGOOD TITLE PATTERNS:\n`
        lp.titlePatterns.good.forEach(p => { context += `- ${p}\n` })
      }
      if (lp.titlePatterns.bad?.length > 0) {
        context += `\nBAD TITLE PATTERNS (avoid):\n`
        lp.titlePatterns.bad.forEach(p => { context += `- ${p}\n` })
      }
    }

    if (lp.preferredContentTypes?.length > 0) {
      context += `\nPREFERRED CONTENT TYPES: ${lp.preferredContentTypes.join(', ')}\n`
    }

    if (patterns.improved_prompt) {
      context += `\nADDITIONAL INSTRUCTIONS:\n${patterns.improved_prompt}\n`
    }

    context += '\n=== END LEARNED PREFERENCES ===\n'

    return context
  }

  // ============================================================================
  // MAIN DISCOVERY METHOD - Monetization-First Approach
  // ============================================================================

  /**
   * Discover new content ideas with MONETIZATION-FIRST approach
   *
   * @param {Object} options - Discovery options
   * @param {string[]} options.sources - Sources to search
   * @param {string} options.customTopic - Optional topic focus (still must be monetizable)
   * @param {string[]} options.existingTopics - Topics to avoid
   * @param {boolean} options.strictMonetization - If true, only return high-monetization ideas
   * @param {number} options.minMonetizationScore - Minimum score to accept (default: 25)
   * @returns {Promise<Object>} Object with accepted ideas and rejected ideas
   */
  async discoverIdeas({
    sources = ['reddit', 'news', 'trends', 'general'],
    customTopic = '',
    existingTopics = [],
    coveredKeywords = [],
    topPerformingArticles = [],
    useLearnedPatterns = true,
    strictMonetization = true,
    minMonetizationScore = 25
  }) {
    // Load monetization context FIRST
    const monetizationContext = await this.getMonetizationContext()
    if (!monetizationContext) {
      throw new Error('Failed to load monetization context - cannot generate ideas without knowing what we can monetize')
    }

    // Load learned patterns if enabled
    let learningContext = ''
    if (useLearnedPatterns) {
      const patterns = await this.loadLearnedPatterns()
      learningContext = this.buildLearningContext(patterns)
    }

    // Build monetization section for prompt
    const monetizationSection = this.buildMonetizationPromptSection(monetizationContext)

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const sourceDescriptions = {
      reddit: 'Reddit discussions in r/college, r/careerguidance, r/education, r/gradschool, r/MBA, r/nursing',
      news: 'Current news about higher education, online learning, career trends',
      trends: 'Google Trends for education keywords, emerging career searches',
      general: 'Evergreen content opportunities, seasonal education trends'
    }

    const selectedSources = sources
      .filter(s => sourceDescriptions[s])
      .map(s => sourceDescriptions[s])
      .join('\n- ')

    const topArticlesContext = topPerformingArticles.length > 0
      ? `\n\nTop performing articles (generate similar quality topics):\n${topPerformingArticles.map(a => `- "${a.title}"`).join('\n')}`
      : ''

    const existingTopicsContext = existingTopics.length > 0
      ? `\n\nAVOID these existing topics:\n${existingTopics.slice(0, 50).map(t => `- ${t}`).join('\n')}`
      : ''

    const customTopicContext = customTopic
      ? `\n\nUSER REQUESTED FOCUS: "${customTopic}" - but it MUST still fit our monetizable categories!`
      : ''

    const prompt = `You are a content strategist for GetEducated.com, a website about ONLINE EDUCATION and ONLINE DEGREES.
Today is ${currentDate}.

${monetizationSection}

Your task: Generate 12 MONETIZABLE content ideas by researching current trends.

SOURCES TO RESEARCH:
- ${selectedSources}
${customTopicContext}
${topArticlesContext}
${existingTopicsContext}
${learningContext}

REQUIREMENTS FOR EACH IDEA:
1. MUST match one of our monetizable categories (Business, Healthcare, Education, IT, etc.)
2. MUST be relevant to ONLINE DEGREE programs
3. MUST target prospective online students
4. Should be timely/trending but ONLY within our monetizable areas
5. Should drive degree signups, not just traffic

For each idea, specify:
- "monetization_category": Which of our categories this fits (REQUIRED)
- "degree_level": Which degree levels this targets (Associate, Bachelor, Master, etc.)
- "content_type": guide, listicle, career_guide, ranking, explainer, review
- "why_monetizable": Brief explanation of monetization potential

Return a JSON object:
{
  "ideas": [
    {
      "title": "SEO-optimized title (50-60 chars)",
      "description": "2-3 sentences explaining the topic",
      "monetization_category": "Business|Healthcare|Education|Computer Science & IT|etc.",
      "degree_level": "Bachelor|Master|etc.",
      "content_type": "guide|listicle|career_guide|ranking|explainer|review",
      "target_keywords": ["keyword1", "keyword2"],
      "why_monetizable": "This drives signups for X programs at Y schools",
      "trending_reason": "Why this is timely",
      "source": "reddit|news|trends|general"
    }
  ]
}

Generate exactly 12 ideas. EVERY idea must be monetizable - no exceptions.`

    try {
      const response = await this.grokClient.generateWithWebContext(prompt)

      // Parse response
      let ideas = []
      try {
        let cleanResponse = response
        if (typeof response === 'string') {
          cleanResponse = response.trim()
          const openMatch = cleanResponse.match(/^```(?:json|JSON)?\s*\n?/)
          if (openMatch) {
            cleanResponse = cleanResponse.slice(openMatch[0].length)
          }
          const closeMatch = cleanResponse.match(/\n?```\s*$/)
          if (closeMatch) {
            cleanResponse = cleanResponse.slice(0, -closeMatch[0].length)
          }
          cleanResponse = cleanResponse.trim()
        }
        const parsed = typeof cleanResponse === 'string' ? JSON.parse(cleanResponse) : cleanResponse
        ideas = parsed.ideas || parsed || []
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          ideas = parsed.ideas || []
        }
      }

      // Clean and validate ideas
      const cleanedIdeas = ideas
        .filter(idea => idea.title && idea.description)
        .map(idea => ({
          title: this.cleanTitle(idea.title, idea.description),
          description: idea.description?.trim() || '',
          content_type: this.validateContentType(idea.content_type),
          target_keywords: Array.isArray(idea.target_keywords) ? idea.target_keywords : [],
          search_intent: idea.search_intent || 'informational',
          estimated_search_volume: idea.estimated_search_volume || 'medium',
          trending_reason: idea.trending_reason || '',
          why_monetizable: idea.why_monetizable || '',
          ai_monetization_category: idea.monetization_category || null,
          ai_degree_level: idea.degree_level || null,
          source: idea.source || 'general',
          discovered_at: new Date().toISOString()
        }))

      // Apply monetization filtering if strict mode enabled
      if (strictMonetization) {
        const { accepted, rejected } = await this.filterByMonetization(cleanedIdeas, minMonetizationScore)

        console.log(`[IdeaDiscovery] Generated ${cleanedIdeas.length} ideas, accepted ${accepted.length}, rejected ${rejected.length}`)

        return {
          ideas: accepted,
          rejected,
          stats: {
            generated: cleanedIdeas.length,
            accepted: accepted.length,
            rejected: rejected.length,
            monetizationContext: monetizationContext.stats
          }
        }
      }

      return {
        ideas: cleanedIdeas,
        rejected: [],
        stats: {
          generated: cleanedIdeas.length,
          accepted: cleanedIdeas.length,
          rejected: 0,
          monetizationContext: monetizationContext.stats
        }
      }
    } catch (error) {
      console.error('Idea discovery error:', error)
      throw new Error(`Failed to discover ideas: ${error.message}`)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '')

    if (s1 === s2) return 1.0
    if (s1.length === 0 || s2.length === 0) return 0.0

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    const editDistance = this.getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  getEditDistance(s1, s2) {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  /**
   * Filter out duplicate ideas
   */
  filterDuplicates(ideas, existingTitles, threshold = 0.7) {
    return ideas.filter(idea => {
      const isDuplicate = existingTitles.some(existing => {
        const similarity = this.calculateSimilarity(idea.title, existing)
        return similarity > threshold
      })
      return !isDuplicate
    })
  }

  /**
   * Validate content type
   */
  validateContentType(type) {
    const validTypes = ['guide', 'listicle', 'career_guide', 'ranking', 'explainer', 'review']
    return validTypes.includes(type) ? type : 'guide'
  }

  /**
   * Auto-detect content type from title
   */
  detectContentType(title) {
    const lowerTitle = title.toLowerCase()

    if (/\d+\s*(best|top|ways|tips|steps|things)/.test(lowerTitle)) {
      return 'listicle'
    }
    if (/(career|job|salary|profession|work)/.test(lowerTitle)) {
      return 'career_guide'
    }
    if (/(rank|best\s+\w+\s+program|top\s+\w+\s+school|vs|versus|comparison)/.test(lowerTitle)) {
      return 'ranking'
    }
    if (/(what\s+is|how\s+does|explained|understanding|guide\s+to)/.test(lowerTitle)) {
      return 'explainer'
    }
    if (/(review|worth\s+it|honest|experience)/.test(lowerTitle)) {
      return 'review'
    }

    return 'guide'
  }

  /**
   * Generate SEO-optimized title
   */
  async generateOptimizedTitle(idea, existingTitles = []) {
    const prompt = `Generate an SEO-optimized article title for this topic:

Original idea: "${idea.title}"
Description: "${idea.description}"
Target keywords: ${idea.target_keywords?.join(', ') || 'N/A'}
Content type: ${idea.content_type}

Requirements:
- 50-60 characters ideal length
- Include primary keyword near the beginning
- Make it compelling and click-worthy
- Avoid clickbait - be accurate and helpful
- Must be DIFFERENT from these existing titles:
${existingTitles.slice(0, 20).map(t => `- ${t}`).join('\n')}

Return ONLY the optimized title, nothing else.`

    try {
      const response = await this.grokClient.generate(prompt)
      const title = response.trim().replace(/^["']|["']$/g, '')
      return title || idea.title
    } catch (error) {
      console.error('Title optimization error:', error)
      return idea.title
    }
  }

  /**
   * Get monetization stats for display
   */
  async getMonetizationStats() {
    const context = await this.getMonetizationContext()
    return context?.stats || null
  }

  // ============================================================================
  // SPONSORED-FIRST DISCOVERY - December 2025 Update
  // Per meeting with Tony & Justin: Start from sponsored schools, not topics
  // ============================================================================

  /**
   * Get sponsored degree listings from the site catalog
   * These are /online-degrees/ pages where schools have paid listings (logos displayed)
   *
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Sponsored listings sorted by school count
   */
  async getSponsoredListings(options = {}) {
    const {
      limit = 50,
      category = null,
      minSponsoredCount = 1,
      includeStale = false,
    } = options

    try {
      let query = supabase
        .from('geteducated_articles')
        .select('*')
        .eq('content_type', 'degree_directory')  // Only /online-degrees/ pages
        .eq('is_sponsored', true)
        .gte('sponsored_school_count', minSponsoredCount)
        .order('sponsored_school_count', { ascending: false })

      if (category) {
        query = query.eq('subject_area', category)
      }

      if (!includeStale) {
        query = query.neq('is_stale', true)
      }

      const { data, error } = await query.limit(limit)

      if (error) {
        console.error('[IdeaDiscovery] Failed to fetch sponsored listings:', error)
        return []
      }

      console.log(`[IdeaDiscovery] Found ${data?.length || 0} sponsored degree listings`)
      return data || []

    } catch (error) {
      console.error('[IdeaDiscovery] Error in getSponsoredListings:', error)
      return []
    }
  }

  /**
   * Generate content ideas starting from SPONSORED listings
   * This is the NEW approach per December 2025 meeting
   *
   * Flow:
   * 1. Fetch sponsored /online-degrees/ pages (pages with school logos)
   * 2. Extract category/concentration/level from each
   * 3. Generate content ideas that would LEAD readers to these sponsored pages
   * 4. Validate search demand
   *
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated ideas with stats
   */
  async discoverFromSponsoredListings(options = {}) {
    const {
      limit = 20,
      category = null,
      existingTopics = [],
      useAI = true,
    } = options

    console.log('[IdeaDiscovery] Starting SPONSORED-FIRST discovery...')

    // 1. Get sponsored listings from catalog
    const sponsoredListings = await this.getSponsoredListings({
      limit: 100,
      category,
      minSponsoredCount: 1,
    })

    if (sponsoredListings.length === 0) {
      console.warn('[IdeaDiscovery] No sponsored listings found - catalog may need sync')
      return {
        ideas: [],
        stats: {
          sponsoredListingsFound: 0,
          ideasGenerated: 0,
          warning: 'No sponsored listings in catalog. Run sitemap sync first.',
        },
      }
    }

    // 2. Generate ideas for each sponsored listing
    const allIdeas = []
    const processedCategories = new Set()

    for (const listing of sponsoredListings.slice(0, 30)) {
      // Extract category info from the listing
      const categoryInfo = this.extractCategoryFromListing(listing)

      // Avoid duplicate categories
      const categoryKey = `${categoryInfo.category}-${categoryInfo.concentration}-${categoryInfo.level}`
      if (processedCategories.has(categoryKey)) continue
      processedCategories.add(categoryKey)

      // Generate template-based ideas
      const templateIdeas = this.generateTemplateIdeasForListing(listing, categoryInfo)
      allIdeas.push(...templateIdeas)
    }

    // 3. Use AI to generate additional ideas if enabled
    let aiIdeas = []
    if (useAI && sponsoredListings.length > 0) {
      aiIdeas = await this.generateAIIdeasFromSponsored(sponsoredListings.slice(0, 15), existingTopics)
    }

    // 4. Combine and deduplicate
    const combinedIdeas = [...allIdeas, ...aiIdeas]
    const dedupedIdeas = this.deduplicateIdeas(combinedIdeas, existingTopics)

    // 5. Sort by monetization potential
    const sortedIdeas = dedupedIdeas
      .sort((a, b) => (b.sponsored_school_count || 0) - (a.sponsored_school_count || 0))
      .slice(0, limit)

    console.log(`[IdeaDiscovery] Generated ${sortedIdeas.length} ideas from ${sponsoredListings.length} sponsored listings`)

    return {
      ideas: sortedIdeas,
      stats: {
        sponsoredListingsFound: sponsoredListings.length,
        templateIdeas: allIdeas.length,
        aiIdeas: aiIdeas.length,
        finalIdeas: sortedIdeas.length,
        topCategories: Array.from(processedCategories).slice(0, 5),
      },
    }
  }

  /**
   * Extract category/concentration/level from a listing URL
   */
  extractCategoryFromListing(listing) {
    // Use the sitemap categorization
    if (listing.url) {
      const category = categorizeUrl(listing.url)
      return {
        category: listing.subject_area || category.category || null,
        concentration: category.concentration || null,
        level: listing.degree_level || category.level || null,
      }
    }

    // Fallback to listing fields
    return {
      category: listing.subject_area || null,
      concentration: listing.primary_topic || null,
      level: listing.degree_level || null,
    }
  }

  /**
   * Generate template-based ideas for a sponsored listing
   * These are proven content formats that lead to degree signups
   */
  generateTemplateIdeasForListing(listing, categoryInfo) {
    const { category, concentration, level } = categoryInfo
    const ideas = []

    // Skip if missing key info
    if (!concentration && !category) return ideas

    const topic = concentration || category
    const levelName = level ? this.levelCodeToName(level) : 'Degree'

    // Template 1: Best programs guide
    ideas.push({
      title: `Best Online ${levelName} in ${this.titleCase(topic)} Programs`,
      description: `Comprehensive guide to the top accredited online ${levelName.toLowerCase()} programs in ${topic}. Compare tuition, outcomes, and program features.`,
      content_type: 'ranking',
      monetization_category: category,
      degree_level: level,
      target_keywords: [`online ${topic} degree`, `best ${topic} programs`, `${topic} ${levelName.toLowerCase()}`],
      source: 'sponsored_listing',
      source_url: listing.url,
      is_sponsored_topic: true,
      sponsored_school_count: listing.sponsored_school_count || 0,
      monetization_score: 90,
    })

    // Template 2: Cheapest/affordable guide
    ideas.push({
      title: `Cheapest Online ${levelName} in ${this.titleCase(topic)}`,
      description: `Find the most affordable accredited online ${topic} programs. Compare tuition costs, financial aid options, and total program expenses.`,
      content_type: 'ranking',
      monetization_category: category,
      degree_level: level,
      target_keywords: [`cheap ${topic} degree`, `affordable ${topic} programs`, `low cost ${topic}`],
      source: 'sponsored_listing',
      source_url: listing.url,
      is_sponsored_topic: true,
      sponsored_school_count: listing.sponsored_school_count || 0,
      monetization_score: 85,
    })

    // Template 3: Career guide
    ideas.push({
      title: `${this.titleCase(topic)} Career Guide: Jobs, Salary & Outlook`,
      description: `Explore ${topic} careers including job descriptions, salary expectations, growth projections, and how an online ${levelName.toLowerCase()} can help you advance.`,
      content_type: 'career_guide',
      monetization_category: category,
      degree_level: level,
      target_keywords: [`${topic} careers`, `${topic} jobs`, `${topic} salary`],
      source: 'sponsored_listing',
      source_url: listing.url,
      is_sponsored_topic: true,
      sponsored_school_count: listing.sponsored_school_count || 0,
      monetization_score: 75,
    })

    // Template 4: How to become guide
    ideas.push({
      title: `How to Become a ${this.titleCase(topic)} Professional`,
      description: `Step-by-step guide to entering the ${topic} field including education requirements, certifications, and career path options.`,
      content_type: 'guide',
      monetization_category: category,
      degree_level: level,
      target_keywords: [`how to become ${topic}`, `${topic} requirements`, `${topic} certification`],
      source: 'sponsored_listing',
      source_url: listing.url,
      is_sponsored_topic: true,
      sponsored_school_count: listing.sponsored_school_count || 0,
      monetization_score: 70,
    })

    return ideas
  }

  /**
   * Use AI to generate additional ideas from sponsored listings
   */
  async generateAIIdeasFromSponsored(listings, existingTopics = []) {
    // Build context of sponsored categories
    const sponsoredContext = listings.map(l => {
      const info = this.extractCategoryFromListing(l)
      return `- ${info.category || 'Unknown'} / ${info.concentration || l.title} / ${info.level || 'Various'} (${l.sponsored_school_count || '?'} schools)`
    }).join('\n')

    const existingContext = existingTopics.length > 0
      ? `\n\nAVOID these existing topics:\n${existingTopics.slice(0, 30).map(t => `- ${t}`).join('\n')}`
      : ''

    const prompt = `You are a content strategist for GetEducated.com.

CRITICAL: We ONLY make money when content leads to degree program signups.
We have PAID SCHOOL LISTINGS in these categories - content MUST target these:

${sponsoredContext}

Generate 10 SEO-optimized content ideas that will:
1. Attract prospective students searching for these degree types
2. Lead them to explore our sponsored school listings
3. Answer their questions and build trust

FOCUS on:
- "How to become X" guides
- Salary and career outlook articles
- Program comparison guides
- Accreditation explainers
- ROI and career advancement articles
${existingContext}

Return JSON array:
[
  {
    "title": "SEO title (50-60 chars)",
    "description": "2-3 sentence description",
    "content_type": "guide|ranking|career_guide|explainer",
    "monetization_category": "which category from the list above",
    "degree_level": "associate|bachelor|master|doctorate|certificate",
    "target_keywords": ["keyword1", "keyword2"],
    "why_monetizable": "brief explanation"
  }
]`

    try {
      const response = await this.grokClient.generate(prompt)

      // Parse response
      let ideas = []
      try {
        let cleanResponse = response.trim()
        // Remove markdown code blocks
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
        ideas = JSON.parse(cleanResponse)
        if (!Array.isArray(ideas)) {
          ideas = ideas.ideas || []
        }
      } catch (e) {
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0])
        }
      }

      // Mark as AI-generated from sponsored and clean titles
      return ideas.map(idea => ({
        ...idea,
        title: this.cleanTitle(idea.title, idea.description),
        source: 'ai_from_sponsored',
        is_sponsored_topic: true,
        monetization_score: 80,
        discovered_at: new Date().toISOString(),
      }))

    } catch (error) {
      console.error('[IdeaDiscovery] AI generation from sponsored failed:', error)
      return []
    }
  }

  /**
   * Deduplicate ideas and filter out existing topics
   */
  deduplicateIdeas(ideas, existingTopics = []) {
    const seen = new Set(existingTopics.map(t => t.toLowerCase()))
    const result = []

    for (const idea of ideas) {
      const titleLower = idea.title.toLowerCase()

      // Check similarity to seen titles
      let isDuplicate = false
      for (const existing of seen) {
        if (this.calculateSimilarity(titleLower, existing) > 0.7) {
          isDuplicate = true
          break
        }
      }

      if (!isDuplicate) {
        seen.add(titleLower)
        result.push(idea)
      }
    }

    return result
  }

  /**
   * Convert degree level code to readable name
   */
  levelCodeToName(level) {
    const map = {
      'associate': 'Associate Degree',
      'bachelor': 'Bachelor\'s Degree',
      'bachelors': 'Bachelor\'s Degree',
      'master': 'Master\'s Degree',
      'masters': 'Master\'s Degree',
      'doctorate': 'Doctoral Degree',
      'doctoral': 'Doctoral Degree',
      'phd': 'PhD',
      'certificate': 'Certificate',
      'diploma': 'Diploma',
    }
    return map[level?.toLowerCase()] || level || 'Degree'
  }

  /**
   * Title case helper
   */
  titleCase(str) {
    if (!str) return ''
    return str.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Clean and validate title to ensure it's a proper SEO title
   * - Removes trailing periods (titles shouldn't end with periods)
   * - Truncates overly long titles that look like descriptions
   * - Ensures title starts with uppercase
   * - Extracts title from description-like text
   */
  cleanTitle(title, description = '') {
    if (!title) return ''

    let cleaned = title.trim()

    // Remove trailing period if present (titles shouldn't end with periods)
    if (cleaned.endsWith('.')) {
      cleaned = cleaned.slice(0, -1).trim()
    }

    // If title is too long (> 80 chars), it might be a description
    // Try to extract a proper title
    if (cleaned.length > 80) {
      // Check if it starts with a number pattern like "10 Best..." or "5 Ways..."
      const numberMatch = cleaned.match(/^(\d+\s+(?:Best|Top|Ways|Steps|Tips|Reasons|Types)\s+.{10,60}?)(?:\s*[-:;,]|$)/i)
      if (numberMatch) {
        cleaned = numberMatch[1].trim()
      } else {
        // Try to find a natural break point (colon, dash, or first sentence)
        const colonIndex = cleaned.indexOf(':')
        const dashIndex = cleaned.indexOf(' - ')

        if (colonIndex > 20 && colonIndex < 70) {
          // Use everything before the colon as the title
          cleaned = cleaned.substring(0, colonIndex).trim()
        } else if (dashIndex > 20 && dashIndex < 70) {
          // Use everything before the dash as the title
          cleaned = cleaned.substring(0, dashIndex).trim()
        } else {
          // Just truncate at a word boundary around 60 chars
          const truncateAt = cleaned.lastIndexOf(' ', 60)
          if (truncateAt > 30) {
            cleaned = cleaned.substring(0, truncateAt).trim()
          } else {
            cleaned = cleaned.substring(0, 60).trim()
          }
        }
      }
    }

    // Ensure title starts with uppercase
    if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
      cleaned = cleaned[0].toUpperCase() + cleaned.slice(1)
    }

    // Remove double spaces
    cleaned = cleaned.replace(/\s+/g, ' ')

    return cleaned
  }

  /**
   * Check monetization potential from catalog
   * Returns warning if topic has no sponsored schools
   */
  async checkMonetizationFromCatalog(topic) {
    const topicLower = topic.toLowerCase()

    const { data, error } = await supabase
      .from('geteducated_articles')
      .select('is_sponsored, sponsored_school_count, url')
      .eq('content_type', 'degree_directory')
      .or(`title.ilike.%${topicLower}%,primary_topic.ilike.%${topicLower}%`)
      .eq('is_sponsored', true)
      .limit(5)

    if (error || !data || data.length === 0) {
      return {
        canMonetize: false,
        warning: `No sponsored schools found for "${topic}". Content may not generate revenue.`,
        sponsoredCount: 0,
        relatedListings: [],
      }
    }

    const totalSponsored = data.reduce((sum, d) => sum + (d.sponsored_school_count || 0), 0)

    return {
      canMonetize: true,
      warning: null,
      sponsoredCount: totalSponsored,
      relatedListings: data.map(d => d.url),
    }
  }
}

export default IdeaDiscoveryService
