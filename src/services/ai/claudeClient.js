/**
 * Claude AI Client for Content Humanization
 * Uses OpenRouter or Anthropic's Claude API for making content undetectable and auto-fixing quality issues
 */

class ClaudeClient {
  constructor(apiKey) {
    // Prefer OpenRouter, fall back to direct Claude API
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY
    this.useOpenRouter = !!(import.meta.env.VITE_OPENROUTER_API_KEY)
    this.baseUrl = this.useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.anthropic.com/v1'
    // OpenRouter model name for Claude
    this.model = this.useOpenRouter ? 'anthropic/claude-sonnet-4' : 'claude-sonnet-4-20250514'
  }

  /**
   * Generic chat method for custom prompts
   */
  async chat(messages, options = {}) {
    // Check if API key is set
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.warn('⚠️ Claude API key not set. Using mock response for testing.')
      return this.getMockHumanizedContent(messages)
    }

    const {
      temperature = 0.7,
      max_tokens = 4000,
    } = options

    try {
      const response = await this.makeRequest(messages, { temperature, max_tokens })
      return response

    } catch (error) {
      console.error('Claude chat error:', error)
      throw error
    }
  }

  /**
   * Make a request to Claude API (via OpenRouter or direct)
   */
  async makeRequest(messages, options = {}) {
    const { temperature = 0.7, max_tokens = 4000 } = options

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }

    if (this.useOpenRouter) {
      headers['HTTP-Referer'] = 'https://perdiav5.netlify.app'
      headers['X-Title'] = 'Perdia v5 Content Engine'
    } else {
      // Direct Anthropic API requires different headers
      headers['x-api-key'] = this.apiKey
      headers['anthropic-version'] = '2023-06-01'
      delete headers['Authorization']
    }

    const endpoint = this.useOpenRouter
      ? `${this.baseUrl}/chat/completions`
      : `${this.baseUrl}/messages`

    // OpenRouter uses OpenAI-style format, Anthropic uses its own format
    const body = this.useOpenRouter
      ? {
          model: this.model,
          messages,
          temperature,
          max_tokens,
        }
      : {
          model: this.model,
          max_tokens,
          temperature,
          messages,
        }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Unknown error'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error?.message || error.message || errorText
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`
      }
      throw new Error(`Claude API error (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()

    // OpenRouter returns OpenAI-style response, Anthropic returns its own format
    if (this.useOpenRouter) {
      return data.choices[0].message.content
    } else {
      return data.content[0].text
    }
  }

  /**
   * Mock humanized content for testing
   * CRITICAL: This must return the original content when API key is missing,
   * never a generic template that doesn't match the article!
   */
  getMockHumanizedContent(messages) {
    const userMessage = messages.find(m => m.role === 'user')?.content || ''

    // Check for various content markers used in different prompts
    // AI Revision uses "CURRENT HTML CONTENT:", humanization uses "ORIGINAL CONTENT:"
    const contentMarkers = [
      /CURRENT HTML CONTENT:\s*([\s\S]*?)(?=\n\nEDITORIAL FEEDBACK|CRITICAL|$)/i,
      /ORIGINAL CONTENT:\s*([\s\S]*?)(?=CRITICAL|===|$)/i,
      /CURRENT CONTENT:\s*([\s\S]*?)(?=QUALITY ISSUES|EDITORIAL FEEDBACK|===|$)/i,
    ]

    for (const marker of contentMarkers) {
      const contentMatch = userMessage.match(marker)
      if (contentMatch && contentMatch[1]) {
        const extractedContent = contentMatch[1].trim()
        // Only return if we got actual content, not empty string
        if (extractedContent.length > 100) {
          console.warn('⚠️ Claude API key not set - returning original content unchanged for safety')
          return extractedContent
        }
      }
    }

    // If we couldn't extract content, throw an error instead of returning wrong content
    // This prevents the client from seeing "a snippet that doesn't look like the original"
    console.error('❌ Claude API key not set and could not extract original content from prompt')
    throw new Error('CLAUDE_API_KEY_NOT_SET: Cannot perform AI revision without Claude API key. Please configure VITE_CLAUDE_API_KEY in your environment.')
  }

  /**
   * Humanize AI-generated content to make it undetectable
   */
  async humanize(content, options = {}) {
    // Check if API key is set
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.warn('⚠️ Claude API key not set. Returning original content for testing.')
      return content // Just return the original content for testing
    }

    const {
      contributorProfile = null,
      targetPerplexity = 'high',
      targetBurstiness = 'high',
    } = options

    const prompt = this.buildHumanizationPrompt(content, contributorProfile, targetPerplexity, targetBurstiness)

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.9,
        max_tokens: 4500,
      })

      return response

    } catch (error) {
      console.error('Claude humanization error:', error)
      throw error
    }
  }

  /**
   * Build prompt for humanization
   * IMPORTANT: Includes GetEducated-specific content rules
   * CRITICAL: display_name is the PUBLIC byline (real name), style_proxy is INTERNAL only
   */
  buildHumanizationPrompt(content, contributorProfile, perplexity, burstiness) {
    let styleInstructions = ''

    if (contributorProfile) {
      const style = contributorProfile.writing_style_profile || {}
      // CRITICAL: Use display_name (real name) for public byline, NEVER use style_proxy
      const publicByline = contributorProfile.display_name || contributorProfile.name
      const styleProxy = contributorProfile.style_proxy || ''

      // Build comprehensive style instructions from enhanced profile fields
      styleInstructions = `
=== GETEDUCATED AUTHOR PROFILE ===
Public Byline (REAL NAME): ${publicByline}
Internal Style Proxy: ${styleProxy} (for voice matching only - NEVER publish this name)

VOICE & TONE:
${contributorProfile.voice_description || style.style_notes || 'Professional education content writer'}

WRITING GUIDELINES:
${contributorProfile.writing_guidelines || `
- Tone: ${style.tone || 'professional'}
- Complexity: ${style.complexity_level || 'intermediate'}
- Sentence Length: ${style.sentence_length_preference || 'medium'}`}

SIGNATURE PHRASES TO USE:
${contributorProfile.signature_phrases?.map(p => `- "${p}"`).join('\n') || '- N/A'}

PHRASES TO AVOID:
${contributorProfile.phrases_to_avoid?.map(p => `- "${p}"`).join('\n') || '- N/A'}

INTRO STYLE: ${contributorProfile.intro_style || 'Professional opening'}
CONCLUSION STYLE: ${contributorProfile.conclusion_style || 'Clear summary with next steps'}
=== END AUTHOR PROFILE ===
`
    }

    return `You are a highly skilled human writer working for GetEducated.com, an online education resource. Your task is to rewrite the following AI-generated content to make it completely undetectable as AI-written while maintaining GetEducated's content standards.

${styleInstructions}

ORIGINAL CONTENT:
${content}

=== GETEDUCATED CONTENT RULES (MUST PRESERVE) ===

1. LINKING RULES:
   - All school mentions should link to GetEducated school pages (geteducated.com/online-schools/...)
   - All degree mentions should link to GetEducated degree database (geteducated.com/online-degrees/...)
   - NEVER create links to .edu school websites
   - External links ONLY to BLS, government sites, nonprofit education orgs
   - NEVER link to competitors (onlineu.com, usnews.com, etc.)

2. COST DATA:
   - Preserve all cost data exactly as written (sourced from GetEducated ranking reports)
   - Keep "in-state" and "out-of-state" cost distinctions
   - Maintain references to GetEducated's ranking methodology

3. STRUCTURE:
   - Keep "GetEducated's Picks" callout boxes
   - Preserve article navigation sections
   - Maintain FAQ sections with all questions/answers
   - Keep "How we researched this" attribution

=== END GETEDUCATED RULES ===

CRITICAL HUMANIZATION TECHNIQUES:

1. **Perplexity (Unpredictability)**: ${perplexity}
   - Use unexpected word choices and phrasings
   - Avoid predictable transitions
   - Include occasional education industry terms
   - Vary vocabulary richly

2. **Burstiness (Sentence Variation)**: ${burstiness}
   - Mix very short sentences with longer, complex ones
   - Create natural rhythm: short → long → medium → very short
   - Use fragments occasionally for emphasis
   - Vary sentence structures significantly

3. **Voice & Personality**:
   - Write as an education expert helping prospective students
   - Add empathy for readers' education and career goals
   - Include minor stylistic imperfections (starting sentences with "And" or "But")
   - Use rhetorical questions sparingly

4. **Natural Writing Patterns**:
   - Avoid overly perfect grammar (humans make small stylistic choices)
   - Use contractions naturally (don't, won't, I've)
   - NEVER use em-dashes (—) as they are a well-known AI writing indicator
   - Use commas, colons, or semicolons for natural pauses instead
   - Vary paragraph lengths significantly

5. **BANNED AI PHRASES** (Never use these):
   - "It's important to note that"
   - "In today's digital age"
   - "In conclusion"
   - "Delve into"
   - "Dive deep"
   - "At the end of the day"
   - "Game changer"
   - "Revolutionary"
   - "Cutting-edge"
   - "Leverage"
   - "Robust"
   - "Seamless"
   - "Navigate the landscape"
   - "Embark on a journey"

6. **Content Quality**:
   - Keep all factual information accurate (especially costs and accreditation)
   - Maintain the same structure and headings
   - Preserve HTML formatting and all links
   - Keep the same SEO focus
   - Ensure the content remains valuable for online education seekers

=== CRITICAL HTML FORMATTING RULES ===

Your output MUST be properly formatted HTML with:
1. <h2> tags for major section headings
2. <h3> tags for subsections
3. <p> tags wrapping EVERY paragraph of text
4. <ul> and <li> tags for bulleted lists
5. <ol> and <li> tags for numbered lists
6. <strong> or <b> tags for bold text
7. <em> or <i> tags for italic text
8. <a href="..."> tags for any links

NEVER output plain text without HTML tags. Every paragraph MUST be wrapped in <p> tags.

=== END HTML FORMATTING RULES ===

OUTPUT ONLY THE REWRITTEN HTML CONTENT. DO NOT include explanations, meta-commentary, or anything other than the pure HTML article content.`
  }

  /**
   * Auto-fix quality issues in content
   */
  async autoFixQualityIssues(content, issues, siteArticles = []) {
    const issueDescriptions = issues.map(issue => {
      const descriptions = {
        word_count_low: `Article is too short (needs to be 1500-2500 words)`,
        word_count_high: `Article is too long (needs to be 1500-2500 words)`,
        missing_internal_links: `Missing internal links (needs 3-5 links to related articles)`,
        missing_external_links: `Missing external citations (needs 2-4 authoritative sources)`,
        missing_faqs: `Missing FAQ section (needs at least 3 FAQ items)`,
        poor_readability: `Readability score is too low (needs simpler language and shorter sentences)`,
        weak_headings: `Heading structure needs improvement (missing H2/H3 hierarchy)`,
      }
      return descriptions[issue.type] || issue.type
    }).join('\n- ')

    let internalLinksContext = ''
    if (siteArticles.length > 0) {
      internalLinksContext = `

AVAILABLE ARTICLES FOR INTERNAL LINKING (use 3-5 of these where relevant):
${siteArticles.map(article => `- [${article.title}](${article.url}) - Topics: ${article.topics?.join(', ') || 'N/A'}`).join('\n')}
`
    }

    const prompt = `You are a content editor fixing quality issues in this article.

CURRENT CONTENT:
${content}

QUALITY ISSUES TO FIX:
- ${issueDescriptions}
${internalLinksContext}

=== CRITICAL HTML FORMATTING RULES ===

Your output MUST be properly formatted HTML with:
1. <h2> tags for major section headings
2. <h3> tags for subsections
3. <p> tags wrapping EVERY paragraph of text
4. <ul> and <li> tags for bulleted lists
5. <ol> and <li> tags for numbered lists
6. <strong> or <b> tags for bold text
7. <em> or <i> tags for italic text
8. <a href="..."> tags for any links

NEVER output plain text without HTML tags. Every paragraph MUST be wrapped in <p> tags.

=== END HTML FORMATTING RULES ===

INSTRUCTIONS:
1. Fix each issue listed above
2. For word count: Add or remove content naturally, maintaining quality
3. For internal links: Add 3-5 contextual links to the provided articles where genuinely relevant (use HTML <a> tags)
4. For external links: Add 2-4 citations to authoritative sources like research papers, official documentation, or reputable publications
5. For FAQs: Add a "Frequently Asked Questions" section with at least 3 relevant Q&A pairs at the end using proper HTML (<h2>Frequently Asked Questions</h2> followed by <h3> for questions and <p> for answers)
6. For readability: Simplify complex sentences, break up long paragraphs, use clearer language
7. For headings: Ensure proper H2/H3 hierarchy, make headings descriptive and keyword-rich
8. Maintain the article's tone, style, and factual accuracy
9. Keep all existing HTML formatting and ensure ALL new content is properly HTML formatted

OUTPUT ONLY THE CORRECTED HTML CONTENT. DO NOT include explanations or notes.`

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      return response

    } catch (error) {
      console.error('Claude auto-fix error:', error)
      throw error
    }
  }

  /**
   * Revise content based on editorial feedback
   * Enhanced with data context to prevent AI hallucination
   * @param {string} content - Current article HTML content
   * @param {Array} feedbackItems - Array of feedback objects with category, severity, selected_text, comment
   * @param {Object} context - Optional context data (costData, internalLinks, articleTitle)
   */
  async reviseWithFeedback(content, feedbackItems, context = {}) {
    const currentYear = new Date().getFullYear()
    const feedbackText = feedbackItems.map((item, index) => {
      return `${index + 1}. [${item.category.toUpperCase()}] ${item.severity}: "${item.selected_text}"
   Issue: ${item.comment}`
    }).join('\n\n')

    // Build data context sections based on what's provided
    let costDataSection = ''
    let internalLinksSection = ''

    // Include cost data if provided
    if (context.costData && context.costData.length > 0) {
      costDataSection = `
=== APPROVED COST DATA FROM GETEDUCATED RANKING REPORTS ===
CRITICAL: Use ONLY these numbers. Do NOT invent or estimate costs.

${context.costData.map(entry => {
  let text = `📊 ${entry.school_name} - ${entry.program_name}\n`
  if (entry.total_cost) text += `   Total Cost: $${entry.total_cost.toLocaleString()}\n`
  if (entry.in_state_cost) text += `   In-State: $${entry.in_state_cost.toLocaleString()}\n`
  if (entry.out_of_state_cost) text += `   Out-of-State: $${entry.out_of_state_cost.toLocaleString()}\n`
  if (entry.rank_position) text += `   Rank Position: #${entry.rank_position}\n`
  if (entry.ranking_reports?.report_url) text += `   Source: ${entry.ranking_reports.report_url}\n`
  if (entry.geteducated_school_url) text += `   Link to: ${entry.geteducated_school_url}\n`
  return text
}).join('\n')}
=== END APPROVED COST DATA ===
`
    }

    // Include internal links if provided
    if (context.internalLinks && context.internalLinks.length > 0) {
      internalLinksSection = `
=== APPROVED INTERNAL LINKS (GetEducated.com) ===
CRITICAL: Use ONLY these URLs for internal links. Do NOT invent URLs.

${context.internalLinks.map(link => `- [${link.title}](${link.url})`).join('\n')}

=== END APPROVED INTERNAL LINKS ===
`
    }

    const prompt = `You are a content editor revising this article based on editorial feedback.

=== CRITICAL GUARDRAILS - MUST FOLLOW ===

1. FACTUAL ACCURACY:
   - NEVER invent tuition costs, school rankings, or program details
   - If cost data is provided below, use ONLY those exact numbers
   - If NO cost data is provided, use qualitative language ("affordable", "competitive") instead of specific numbers
   - If you cannot find verified data for a claim, rewrite to avoid the claim

2. INTERNAL LINKS:
   - ONLY use URLs from the "APPROVED INTERNAL LINKS" section below
   - If no approved links are provided, do NOT add new internal links
   - NEVER invent GetEducated URLs - they will 404

3. EXTERNAL LINKS - STRICT WHITELIST:
   - ONLY link to these exact domains: bls.gov, ed.gov, nces.ed.gov, studentaid.gov, fafsa.gov, collegescorecard.ed.gov
   - Also allowed: chea.org, aacsb.edu, abet.org, cacrep.org, ccne-accreditation.org, cswe.org
   - Also allowed: collegeboard.org, acenet.edu, aacn.nche.edu, naspa.org, apa.org, nasw.org, nursingworld.org
   - NEVER link to: .edu school sites, Wikipedia, news sites, foundations, associations not listed above
   - NEVER link to: onlineu.com, usnews.com, bestcolleges.com, niche.com, or any competitor
   - If you're unsure if a link is allowed, DO NOT include it - the text will suffice without a link

4. DATES:
   - Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
   - The current year is ${currentYear}
   - ALWAYS use ${currentYear} for "current year" references

=== END GUARDRAILS ===
${costDataSection}${internalLinksSection}
CURRENT HTML CONTENT:
${content}

EDITORIAL FEEDBACK TO ADDRESS:
${feedbackText}

=== CRITICAL HTML FORMATTING RULES ===

Your output MUST be properly formatted HTML with:
1. <h2> tags for major section headings
2. <h3> tags for subsections
3. <p> tags wrapping EVERY paragraph of text
4. <ul> and <li> tags for bulleted lists
5. <ol> and <li> tags for numbered lists
6. <strong> or <b> tags for bold text
7. <em> or <i> tags for italic text
8. <a href="..."> tags for any links

NEVER output plain text without HTML tags. Every paragraph MUST be wrapped in <p> tags.

=== END HTML FORMATTING RULES ===

INSTRUCTIONS:
1. Address each piece of feedback carefully
2. If feedback asks for cost/tuition data, ONLY use numbers from APPROVED COST DATA above
3. If feedback asks for links, ONLY use URLs from APPROVED INTERNAL LINKS above
4. If you cannot fulfill a request with approved data, explain what you CAN do instead
5. Maintain the overall structure and tone
6. Keep all other content unchanged
7. Preserve HTML formatting

OUTPUT ONLY THE REVISED HTML CONTENT.`

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      return response

    } catch (error) {
      console.error('Claude revision error:', error)
      throw error
    }
  }

  /**
   * Extract learning patterns from feedback for AI training
   */
  async extractLearningPatterns(originalContent, revisedContent, feedbackItems) {
    const prompt = `Analyze the differences between original and revised content to extract learning patterns for future content generation.

ORIGINAL CONTENT:
${originalContent.substring(0, 1000)}...

REVISED CONTENT:
${revisedContent.substring(0, 1000)}...

FEEDBACK THAT WAS ADDRESSED:
${feedbackItems.map(f => `- ${f.category}: ${f.comment}`).join('\n')}

TASK:
Extract 3-5 specific, actionable patterns or rules that should be applied to future content generation to avoid these issues.

FORMAT AS JSON:
{
  "patterns": [
    {
      "category": "style|structure|accuracy|seo|other",
      "pattern": "Specific pattern or rule learned",
      "example": "Example of how to apply this",
      "impact_score": 0-100
    }
  ]
}

Generate the patterns now:`

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.6,
        max_tokens: 2000,
      })

      const parsed = JSON.parse(response)
      return parsed.patterns

    } catch (error) {
      console.error('Claude pattern extraction error:', error)
      throw error
    }
  }
}

export default ClaudeClient
