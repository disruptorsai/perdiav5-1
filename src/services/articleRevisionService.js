/**
 * Article Revision Service
 *
 * Optimized service for revising and updating existing GetEducated articles.
 * Unlike new article generation, this service:
 * - Analyzes existing content to understand structure and key points
 * - Preserves important factual information and links
 * - Updates outdated stats, costs, and information
 * - Improves SEO and readability without losing original intent
 * - Maintains GetEducated's voice and style
 */

import { supabase } from './supabaseClient'
// Use Edge Function clients for secure server-side API calls
// API keys are stored in Supabase secrets, not exposed to browser
import GrokClient from './ai/grokClient.edge'
import ClaudeClient from './ai/claudeClient.edge'
import StealthGptClient from './ai/stealthGptClient'

const grokClient = new GrokClient()
const claudeClient = new ClaudeClient()
const stealthGptClient = new StealthGptClient()

// Revision types with specific strategies
const REVISION_STRATEGIES = {
  full_rewrite: {
    name: 'Full Rewrite',
    description: 'Complete rewrite while preserving key facts and SEO',
    prompt: 'rewrite',
    requiresHumanization: true,
    preserveLinks: true,
    preserveFaqs: false,
    preserveMedia: false, // Don't force-reinsert images on full rewrite
  },
  refresh: {
    name: 'Content Refresh',
    description: 'Update stats, add new info, improve outdated sections',
    prompt: 'refresh',
    requiresHumanization: true,
    preserveLinks: true,
    preserveFaqs: true,
    preserveMedia: true, // Preserve images on refresh
  },
  seo_optimize: {
    name: 'SEO Optimization',
    description: 'Improve meta tags, headings, keyword usage',
    prompt: 'seo',
    requiresHumanization: false,
    preserveLinks: true,
    preserveFaqs: true,
    preserveMedia: true, // Preserve images on SEO
  },
  add_sections: {
    name: 'Add Sections',
    description: 'Add new sections like FAQs, comparisons, etc.',
    prompt: 'sections',
    requiresHumanization: true,
    preserveLinks: true,
    preserveFaqs: true,
    preserveMedia: true, // Preserve images when adding sections
  },
  improve_quality: {
    name: 'Quality Improvement',
    description: 'Improve readability, fix issues, enhance structure',
    prompt: 'quality',
    requiresHumanization: true,
    preserveLinks: true,
    preserveFaqs: true,
    preserveMedia: false, // Don't force-reinsert on quality improvement
  },
  update_links: {
    name: 'Update Links',
    description: 'Refresh internal and external links',
    prompt: 'links',
    requiresHumanization: false,
    preserveLinks: false,
    preserveFaqs: true,
    preserveMedia: true, // Preserve images on link updates
  },
  // Special strategy for feedback-based AI revision (from CommentableArticle)
  feedback: {
    name: 'Feedback Revision',
    description: 'Revise based on editorial feedback comments',
    prompt: 'feedback',
    requiresHumanization: false,
    preserveLinks: true,
    preserveFaqs: true,
    preserveMedia: false, // Don't auto-reinsert images - let AI handle naturally
  },
}

/**
 * Main revision service class
 */
class ArticleRevisionService {
  constructor() {
    this.currentProgress = null
  }

  /**
   * Extract media elements (images, videos, iframes) from HTML content
   * Returns an object with extracted media and their context
   */
  extractMediaElements(html) {
    if (!html) return { images: [], videos: [], iframes: [], embeds: [] }

    const media = {
      images: [],
      videos: [],
      iframes: [],
      embeds: [],
    }

    // Extract images with their surrounding context
    const imgRegex = /<img[^>]*>/gi
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0]
      // Get surrounding context (text before/after to help with placement)
      const startPos = Math.max(0, match.index - 200)
      const endPos = Math.min(html.length, match.index + imgTag.length + 200)
      const context = html.substring(startPos, endPos)

      // Extract src and alt for matching
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i)

      media.images.push({
        tag: imgTag,
        src: srcMatch?.[1] || '',
        alt: altMatch?.[1] || '',
        context: context.replace(/<[^>]*>/g, ' ').trim().substring(0, 100),
      })
    }

    // Extract video elements
    const videoRegex = /<video[^>]*>[\s\S]*?<\/video>/gi
    while ((match = videoRegex.exec(html)) !== null) {
      media.videos.push({
        tag: match[0],
        context: html.substring(Math.max(0, match.index - 100), match.index).replace(/<[^>]*>/g, ' ').trim(),
      })
    }

    // Extract iframes (YouTube, Vimeo, etc.)
    const iframeRegex = /<iframe[^>]*>[\s\S]*?<\/iframe>/gi
    while ((match = iframeRegex.exec(html)) !== null) {
      const iframeTag = match[0]
      const srcMatch = iframeTag.match(/src=["']([^"']+)["']/i)
      media.iframes.push({
        tag: iframeTag,
        src: srcMatch?.[1] || '',
        context: html.substring(Math.max(0, match.index - 100), match.index).replace(/<[^>]*>/g, ' ').trim(),
      })
    }

    // Extract embed elements
    const embedRegex = /<embed[^>]*>/gi
    while ((match = embedRegex.exec(html)) !== null) {
      media.embeds.push({
        tag: match[0],
        context: html.substring(Math.max(0, match.index - 100), match.index).replace(/<[^>]*>/g, ' ').trim(),
      })
    }

    // Also extract figure elements (which may wrap images)
    const figureRegex = /<figure[^>]*>[\s\S]*?<\/figure>/gi
    while ((match = figureRegex.exec(html)) !== null) {
      // Check if this figure contains an image we haven't captured
      if (match[0].includes('<img')) {
        const figureTag = match[0]
        const srcMatch = figureTag.match(/src=["']([^"']+)["']/i)
        // Only add if not already in images array
        if (srcMatch && !media.images.some(img => img.src === srcMatch[1])) {
          media.images.push({
            tag: figureTag,
            src: srcMatch[1],
            alt: '',
            context: 'figure element',
            isFigure: true,
          })
        }
      }
    }

    return media
  }

  /**
   * Re-insert media elements into revised content
   * Tries to place them in contextually appropriate locations
   */
  reinsertMediaElements(revisedHtml, originalMedia) {
    if (!revisedHtml) return revisedHtml

    let content = revisedHtml
    const allMedia = [
      ...originalMedia.images,
      ...originalMedia.videos,
      ...originalMedia.iframes,
      ...originalMedia.embeds,
    ]

    if (allMedia.length === 0) return content

    // Strategy: Insert media after the first relevant heading or paragraph
    // For each media item, try to find a good insertion point based on context

    for (const media of allMedia) {
      // Skip if this media tag is already in the content
      if (content.includes(media.tag)) continue

      // Try to find the best insertion point
      let inserted = false

      // 1. Try to find matching alt text or context in the new content
      if (media.alt && media.alt.length > 3) {
        const altWords = media.alt.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        for (const word of altWords) {
          // Find a paragraph containing this word
          const paragraphRegex = new RegExp(`(<p[^>]*>[^<]*${word}[^<]*<\/p>)`, 'i')
          const paragraphMatch = content.match(paragraphRegex)
          if (paragraphMatch) {
            // Insert after this paragraph
            content = content.replace(paragraphMatch[1], `${paragraphMatch[1]}\n${media.tag}`)
            inserted = true
            break
          }
        }
      }

      // 2. If not inserted yet, try to match context words
      if (!inserted && media.context) {
        const contextWords = media.context.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5)
        for (const word of contextWords) {
          const paragraphRegex = new RegExp(`(<p[^>]*>[^<]*${word}[^<]*<\/p>)`, 'i')
          const paragraphMatch = content.match(paragraphRegex)
          if (paragraphMatch) {
            content = content.replace(paragraphMatch[1], `${paragraphMatch[1]}\n${media.tag}`)
            inserted = true
            break
          }
        }
      }

      // 3. If still not inserted, add after the first H2 or at a reasonable position
      if (!inserted) {
        // For images/figures: insert after first H2
        if (media.tag.includes('<img') || media.tag.includes('<figure')) {
          const h2Match = content.match(/(<h2[^>]*>[\s\S]*?<\/h2>)/i)
          if (h2Match) {
            content = content.replace(h2Match[1], `${h2Match[1]}\n${media.tag}`)
            inserted = true
          }
        }
        // For videos/iframes: insert near the top, after intro
        else {
          const firstParagraph = content.match(/(<p[^>]*>[\s\S]*?<\/p>)/i)
          if (firstParagraph) {
            content = content.replace(firstParagraph[1], `${firstParagraph[1]}\n${media.tag}`)
            inserted = true
          }
        }
      }

      // 4. Last resort: append at the end before any FAQ section
      if (!inserted) {
        const faqMatch = content.match(/(<h2[^>]*>.*?FAQ.*?<\/h2>)/i)
        if (faqMatch) {
          content = content.replace(faqMatch[1], `${media.tag}\n${faqMatch[1]}`)
        } else {
          // Just append before closing
          content = content + `\n${media.tag}`
        }
      }
    }

    return content
  }

  /**
   * Get revision strategy details
   */
  getRevisionStrategies() {
    return REVISION_STRATEGIES
  }

  /**
   * Analyze article for revision recommendations
   */
  async analyzeArticle(article) {
    const analysis = {
      wordCount: article.word_count || 0,
      hasContent: !!article.content_text,
      contentAge: this.getContentAge(article),
      qualityIssues: [],
      recommendations: [],
      priority: 'low',
    }

    // Word count analysis
    if (analysis.wordCount < 1000) {
      analysis.qualityIssues.push({
        type: 'word_count',
        severity: 'high',
        message: 'Article is too short (under 1000 words)',
      })
      analysis.recommendations.push('add_sections')
    } else if (analysis.wordCount < 1500) {
      analysis.qualityIssues.push({
        type: 'word_count',
        severity: 'medium',
        message: 'Article could be longer (under 1500 words)',
      })
      analysis.recommendations.push('add_sections')
    }

    // Content age analysis
    if (analysis.contentAge > 365) {
      analysis.qualityIssues.push({
        type: 'outdated',
        severity: 'high',
        message: 'Content is over 1 year old and may have outdated information',
      })
      analysis.recommendations.push('refresh')
      analysis.priority = 'high'
    } else if (analysis.contentAge > 180) {
      analysis.qualityIssues.push({
        type: 'aging',
        severity: 'medium',
        message: 'Content is over 6 months old',
      })
      analysis.recommendations.push('refresh')
    }

    // Structure analysis
    if (article.heading_structure) {
      const h2Count = article.heading_structure.h2?.length || 0
      if (h2Count < 3) {
        analysis.qualityIssues.push({
          type: 'structure',
          severity: 'medium',
          message: 'Article has few H2 headings (needs better structure)',
        })
        analysis.recommendations.push('improve_quality')
      }
    }

    // FAQ analysis
    if (!article.faqs || article.faqs.length < 3) {
      analysis.qualityIssues.push({
        type: 'faqs',
        severity: 'low',
        message: 'Article has few or no FAQs',
      })
      analysis.recommendations.push('add_sections')
    }

    // Internal links analysis
    if (!article.internal_links || article.internal_links.length < 3) {
      analysis.qualityIssues.push({
        type: 'links',
        severity: 'medium',
        message: 'Article needs more internal links',
      })
      analysis.recommendations.push('update_links')
    }

    // Set priority based on issues
    const highIssues = analysis.qualityIssues.filter(i => i.severity === 'high').length
    const mediumIssues = analysis.qualityIssues.filter(i => i.severity === 'medium').length

    if (highIssues >= 2 || (highIssues >= 1 && mediumIssues >= 2)) {
      analysis.priority = 'high'
    } else if (highIssues >= 1 || mediumIssues >= 2) {
      analysis.priority = 'medium'
    }

    // Dedupe recommendations
    analysis.recommendations = [...new Set(analysis.recommendations)]

    return analysis
  }

  /**
   * Get content age in days
   */
  getContentAge(article) {
    const publishedAt = article.published_at || article.scraped_at || article.created_at
    if (!publishedAt) return 999
    const published = new Date(publishedAt)
    const now = new Date()
    return Math.floor((now - published) / (1000 * 60 * 60 * 24))
  }

  /**
   * Revise an article
   */
  async reviseArticle(articleId, options = {}) {
    const {
      revisionType = 'refresh',
      customInstructions = '',
      targetWordCount = null,
      contributorId = null,
      humanize = true,
      onProgress = () => {},
      userId = null, // Required to create review queue article
      sendToReviewQueue = true, // Whether to create an article record for review
    } = options

    const strategy = REVISION_STRATEGIES[revisionType]
    if (!strategy) {
      throw new Error(`Unknown revision type: ${revisionType}`)
    }

    try {
      // Step 1: Fetch the article
      onProgress({ stage: 'fetch', message: 'Fetching article...', progress: 5 })

      const { data: article, error } = await supabase
        .from('geteducated_articles')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error || !article) {
        throw new Error(`Article not found: ${articleId}`)
      }

      // Step 2: Ensure original version exists
      onProgress({ stage: 'version', message: 'Ensuring version history...', progress: 10 })
      await this.ensureOriginalVersion(article)

      // Step 2.5: Extract media elements from original content for preservation
      onProgress({ stage: 'media', message: 'Extracting media elements...', progress: 12 })
      const originalMedia = this.extractMediaElements(article.content_html)
      const mediaCount = originalMedia.images.length + originalMedia.videos.length +
                        originalMedia.iframes.length + originalMedia.embeds.length
      if (mediaCount > 0) {
        console.log(`[RevisionService] Found ${mediaCount} media elements to preserve`)
      }

      // Step 3: Analyze the article
      onProgress({ stage: 'analyze', message: 'Analyzing content...', progress: 15 })
      const analysis = await this.analyzeArticle(article)

      // Step 4: Build revision prompt
      onProgress({ stage: 'prompt', message: 'Building revision prompt...', progress: 20 })
      const prompt = await this.buildRevisionPrompt(article, strategy, {
        customInstructions,
        targetWordCount,
        analysis,
      })

      // Step 5: Generate revised content
      onProgress({ stage: 'generate', message: 'Generating revised content...', progress: 30 })
      const revisedContent = await this.generateRevision(prompt, article, strategy)

      // Step 6: Humanize if needed
      let finalContent = revisedContent
      if (humanize && strategy.requiresHumanization) {
        onProgress({ stage: 'humanize', message: 'Humanizing content...', progress: 60 })
        finalContent = await this.humanizeContent(revisedContent.content)
        revisedContent.content = finalContent
      }

      // Step 6.5: Re-insert preserved media elements (only if strategy.preserveMedia is true)
      // Bug fix: Don't force-reinsert images for feedback/quality revisions - causes unwanted logos
      if (mediaCount > 0 && strategy.preserveMedia) {
        onProgress({ stage: 'media_insert', message: 'Re-inserting media elements...', progress: 70 })
        revisedContent.content = this.reinsertMediaElements(revisedContent.content, originalMedia)
        console.log(`[RevisionService] Re-inserted media elements into revised content`)
      } else if (mediaCount > 0) {
        console.log(`[RevisionService] Skipping media reinsertion (preserveMedia: ${strategy.preserveMedia || false})`)
      }

      // Step 7: Update internal links
      if (revisionType === 'update_links' || !strategy.preserveLinks) {
        onProgress({ stage: 'links', message: 'Updating internal links...', progress: 75 })
        revisedContent.content = await this.updateInternalLinks(revisedContent.content, article)
      }

      // Step 8: Create new version
      onProgress({ stage: 'version', message: 'Saving new version...', progress: 85 })
      const versionId = await this.createNewVersion(article, revisedContent, {
        revisionType,
        customInstructions,
        aiModel: 'grok-beta + claude',
      })

      // Step 9: Create article record for review queue
      let reviewArticleId = null
      if (sendToReviewQueue && userId) {
        onProgress({ stage: 'review_queue', message: 'Adding to review queue...', progress: 92 })
        reviewArticleId = await this.createReviewQueueArticle(article, revisedContent, {
          userId,
          sourceVersionId: versionId,
          revisionType,
        })
        console.log(`[RevisionService] Created review queue article: ${reviewArticleId}`)
      } else if (sendToReviewQueue && !userId) {
        console.warn('[RevisionService] Cannot send to review queue without userId')
      }

      // Step 10: Update revision queue if applicable
      onProgress({ stage: 'complete', message: 'Revision complete!', progress: 100 })

      return {
        success: true,
        articleId,
        versionId,
        reviewArticleId,
        revisedContent,
        wordCount: this.countWords(revisedContent.content),
        changesSummary: revisedContent.changesSummary,
      }
    } catch (error) {
      console.error('[RevisionService] Error:', error)
      throw error
    }
  }

  /**
   * Ensure original version exists for an article
   */
  async ensureOriginalVersion(article) {
    // Check if original version exists
    const { data: existing } = await supabase
      .from('geteducated_article_versions')
      .select('id')
      .eq('article_id', article.id)
      .eq('version_type', 'original')
      .single()

    if (existing) {
      return existing.id
    }

    // Create original version
    const { data: version, error } = await supabase
      .from('geteducated_article_versions')
      .insert({
        article_id: article.id,
        version_number: 1,
        version_type: 'original',
        title: article.title,
        meta_description: article.meta_description,
        content_html: article.content_html,
        content_text: article.content_text,
        word_count: article.word_count,
        focus_keyword: article.focus_keyword,
        heading_structure: article.heading_structure,
        faqs: article.faqs,
        internal_links: article.internal_links,
        external_links: article.external_links,
        is_current: true,
        revised_by: 'system',
      })
      .select()
      .single()

    if (error) {
      console.error('[RevisionService] Error creating original version:', error)
      // Non-fatal, continue
    }

    // Update article with version reference
    if (version) {
      await supabase
        .from('geteducated_articles')
        .update({
          current_version_id: version.id,
          version_count: 1,
        })
        .eq('id', article.id)
    }

    return version?.id
  }

  /**
   * Build the revision prompt based on strategy
   */
  async buildRevisionPrompt(article, strategy, options = {}) {
    const { customInstructions, targetWordCount, analysis } = options

    // Base context about GetEducated
    const baseContext = `
You are revising an existing article from GetEducated.com, a trusted resource for online education information.

IMPORTANT RULES:
1. Maintain GetEducated's professional, helpful, and informative tone
2. Keep cost/tuition data accurate - ONLY cite data from GetEducated ranking reports
3. NEVER link directly to school websites (.edu) - always use GetEducated school profile pages
4. External links should ONLY go to government sites (BLS, ED.gov) or nonprofit sources
5. NEVER link to competitors (US News, Online U, etc.)
6. Preserve any existing monetization shortcodes
7. Use approved authors only: Tony Huffman, Kayleigh Gilbert, Sara, Charity
`

    // Article-specific context
    const articleContext = `
CURRENT ARTICLE:
Title: ${article.title}
URL: ${article.url}
Content Type: ${article.content_type || 'guide'}
Degree Level: ${article.degree_level || 'N/A'}
Subject Area: ${article.subject_area || 'N/A'}
Current Word Count: ${article.word_count || 0}
${targetWordCount ? `Target Word Count: ${targetWordCount}` : ''}

CURRENT CONTENT:
${article.content_text?.substring(0, 10000) || 'No content available'}

${article.heading_structure ? `
CURRENT STRUCTURE:
H2 Headings: ${article.heading_structure.h2?.join(', ') || 'None'}
H3 Headings: ${article.heading_structure.h3?.slice(0, 10).join(', ') || 'None'}
` : ''}

${article.faqs?.length ? `
CURRENT FAQS:
${article.faqs.slice(0, 5).map(f => `Q: ${f.question}`).join('\n')}
` : ''}

${analysis?.qualityIssues?.length ? `
IDENTIFIED ISSUES:
${analysis.qualityIssues.map(i => `- [${i.severity.toUpperCase()}] ${i.message}`).join('\n')}
` : ''}
`

    // Strategy-specific instructions
    let strategyInstructions = ''

    switch (strategy.prompt) {
      case 'rewrite':
        strategyInstructions = `
REVISION TYPE: Full Rewrite

Completely rewrite this article while:
- Keeping the same topic and main points
- Improving structure and flow
- Updating any potentially outdated information
- Adding more depth and value
- Ensuring all facts are accurate
- Targeting 2000-2500 words
- Including at least 5 H2 sections
- Adding 5-7 FAQs at the end
`
        break

      case 'refresh':
        strategyInstructions = `
REVISION TYPE: Content Refresh

Update this article to be current and accurate:
- Update any statistics, costs, or dates mentioned
- Add new relevant information if available
- Improve any weak or thin sections
- Keep the overall structure similar
- Preserve what works well
- Add 2-3 new FAQs if current FAQs are thin
`
        break

      case 'seo':
        strategyInstructions = `
REVISION TYPE: SEO Optimization

Optimize this article for search engines:
- Improve the title for click-through and keywords
- Enhance the meta description (150-160 chars)
- Ensure H2 headings include target keywords naturally
- Improve the introduction to include the focus keyword
- Add semantic keywords throughout
- Keep the content itself mostly the same
`
        break

      case 'sections':
        strategyInstructions = `
REVISION TYPE: Add Sections

Add new valuable sections to this article:
- Add a comprehensive FAQ section (5-7 questions) if missing
- Add a "Key Takeaways" or summary section
- Consider adding: comparison tables, career outlook, salary info, accreditation info
- Maintain consistency with existing tone and style
- Target adding 500-800 new words
`
        break

      case 'quality':
        strategyInstructions = `
REVISION TYPE: Quality Improvement

Improve the overall quality of this article:
- Fix any grammatical or spelling errors
- Improve sentence structure and readability
- Break up long paragraphs
- Ensure good heading hierarchy
- Add transitions between sections
- Strengthen the introduction and conclusion
`
        break

      case 'links':
        strategyInstructions = `
REVISION TYPE: Update Links

Update the internal and external links:
- Add 3-5 relevant internal links to other GetEducated articles
- Update external links to authoritative sources (BLS, .gov, .edu research)
- Remove any broken or outdated links
- Ensure anchor text is descriptive and natural
- Keep the main content unchanged
`
        break
    }

    // Custom instructions
    const customSection = customInstructions
      ? `\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`
      : ''

    // Output format
    const outputFormat = `
OUTPUT FORMAT:
Return a JSON object with:
{
  "title": "The revised title",
  "meta_description": "SEO-optimized meta description (150-160 chars)",
  "content": "The full revised HTML content with proper heading tags",
  "focus_keyword": "The primary keyword to target",
  "faqs": [{"question": "...", "answer": "..."}],
  "changesSummary": "Brief summary of what was changed"
}
`

    return `${baseContext}\n${articleContext}\n${strategyInstructions}\n${customSection}\n${outputFormat}`
  }

  /**
   * Generate the revision using AI
   */
  async generateRevision(prompt, article, strategy) {
    try {
      // Use Grok for the main generation
      const response = await grokClient.generateDraft({
        title: article.title,
        description: prompt,
        contentType: article.content_type || 'guide',
      })

      // Parse the response
      let result
      try {
        result = typeof response === 'string' ? JSON.parse(response) : response
      } catch {
        // If not JSON, treat as plain content
        result = {
          title: article.title,
          meta_description: article.meta_description,
          content: response,
          changesSummary: 'Content revised',
        }
      }

      return result
    } catch (error) {
      console.error('[RevisionService] Grok generation failed:', error)

      // Fallback to Claude
      try {
        const claudeResponse = await claudeClient.reviseWithFeedback(
          article.content_html || article.content_text,
          prompt
        )
        return {
          title: article.title,
          meta_description: article.meta_description,
          content: claudeResponse,
          changesSummary: 'Content revised using Claude',
        }
      } catch (claudeError) {
        throw new Error(`AI generation failed: ${error.message}`)
      }
    }
  }

  /**
   * Humanize content to bypass AI detection
   */
  async humanizeContent(content) {
    try {
      // Try StealthGPT first
      const humanized = await stealthGptClient.humanizeLongContent(content, {
        tone: 'College',
        mode: 'High',
      })
      return humanized
    } catch (error) {
      console.error('[RevisionService] StealthGPT failed, using Claude:', error)

      // Fallback to Claude humanization
      return await claudeClient.humanize(content)
    }
  }

  /**
   * Update internal links in content
   */
  async updateInternalLinks(content, article) {
    try {
      // Get relevant articles for linking
      const { data: relevantArticles } = await supabase
        .rpc('find_relevant_ge_articles', {
          search_topics: article.topics || [article.subject_area, article.degree_level].filter(Boolean),
          search_subject: article.subject_area,
          search_degree_level: article.degree_level,
          exclude_urls: [article.url],
          result_limit: 10,
        })

      if (!relevantArticles?.length) {
        return content
      }

      // Use Claude to insert links naturally
      const linkContext = relevantArticles.map(a =>
        `- "${a.title}" (${a.url})`
      ).join('\n')

      const linkedContent = await claudeClient.reviseWithFeedback(content, `
Add 3-5 natural internal links to this content. Use the following GetEducated articles as link targets:

${linkContext}

Rules:
- Insert links naturally within existing sentences
- Use descriptive anchor text (not "click here")
- Don't force links where they don't fit
- Spread links throughout the content
- Return the full content with links added as HTML anchor tags
`)

      return linkedContent
    } catch (error) {
      console.error('[RevisionService] Error updating links:', error)
      return content
    }
  }

  /**
   * Create a new version record
   */
  async createNewVersion(article, revisedContent, metadata = {}) {
    const { revisionType, customInstructions, aiModel } = metadata

    // Get next version number
    const { data: versions } = await supabase
      .from('geteducated_article_versions')
      .select('version_number')
      .eq('article_id', article.id)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = (versions?.[0]?.version_number || 0) + 1

    // Strip HTML for text content
    const textContent = revisedContent.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const wordCount = this.countWords(revisedContent.content)

    // Mark old versions as not current
    await supabase
      .from('geteducated_article_versions')
      .update({ is_current: false })
      .eq('article_id', article.id)

    // Create new version
    const { data: version, error } = await supabase
      .from('geteducated_article_versions')
      .insert({
        article_id: article.id,
        version_number: nextVersion,
        version_type: 'ai_revision',
        title: revisedContent.title || article.title,
        meta_description: revisedContent.meta_description || article.meta_description,
        content_html: revisedContent.content,
        content_text: textContent,
        word_count: wordCount,
        focus_keyword: revisedContent.focus_keyword,
        faqs: revisedContent.faqs,
        revision_prompt: customInstructions,
        changes_summary: revisedContent.changesSummary,
        ai_model_used: aiModel,
        is_current: true,
        revised_by: 'ai_revision',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create version: ${error.message}`)
    }

    // Update the main article
    await supabase
      .from('geteducated_articles')
      .update({
        current_version_id: version.id,
        version_count: nextVersion,
        last_revised_at: new Date().toISOString(),
        revision_status: 'revised',
        title: revisedContent.title || article.title,
        meta_description: revisedContent.meta_description || article.meta_description,
        content_html: revisedContent.content,
        content_text: textContent,
        word_count: wordCount,
        faqs: revisedContent.faqs,
      })
      .eq('id', article.id)

    return version.id
  }

  /**
   * Create an article record in the articles table for the review queue
   * This bridges revised site catalog articles to the review workflow
   */
  async createReviewQueueArticle(sourceArticle, revisedContent, options = {}) {
    const { userId, sourceVersionId, revisionType } = options

    if (!userId) {
      throw new Error('userId is required to create review queue article')
    }

    // Strip HTML for text excerpt
    const textContent = revisedContent.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Create excerpt from first ~150 chars
    const excerpt = textContent?.substring(0, 150) + (textContent?.length > 150 ? '...' : '')

    // Generate a unique slug based on source article
    const baseSlug = sourceArticle.slug || sourceArticle.title?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const slug = `${baseSlug}-revised-${Date.now()}`

    // Calculate word count
    const wordCount = this.countWords(revisedContent.content)

    // Create the article record with status qa_review
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title: `[REVISED] ${revisedContent.title || sourceArticle.title}`,
        content: revisedContent.content,
        excerpt,
        status: 'qa_review', // Go directly to review queue
        word_count: wordCount,
        quality_score: 75, // Default score for revisions
        meta_title: revisedContent.title || sourceArticle.title,
        meta_description: revisedContent.meta_description || sourceArticle.meta_description,
        focus_keyword: revisedContent.focus_keyword || sourceArticle.focus_keyword,
        slug,
        faqs: revisedContent.faqs || sourceArticle.faqs,
        user_id: userId,
        // Link back to source article
        source_ge_article_id: sourceArticle.id,
        source_ge_version_id: sourceVersionId,
        is_revision: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[RevisionService] Error creating review queue article:', error)
      throw new Error(`Failed to create review queue article: ${error.message}`)
    }

    console.log(`[RevisionService] Created review article ${article.id} for source ${sourceArticle.id}`)
    return article.id
  }

  /**
   * Count words in content
   */
  countWords(content) {
    if (!content) return 0
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.split(' ').filter(w => w.length > 0).length
  }

  /**
   * Queue an article for revision
   */
  async queueForRevision(articleId, options = {}) {
    const {
      revisionType = 'refresh',
      instructions = '',
      priority = 5,
      scheduledFor = null,
      requestedBy = 'system',
    } = options

    const { data, error } = await supabase
      .from('geteducated_revision_queue')
      .insert({
        article_id: articleId,
        revision_type: revisionType,
        instructions,
        priority,
        scheduled_for: scheduledFor,
        status: 'pending',
        requested_by: requestedBy,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to queue revision: ${error.message}`)
    }

    // Update article status
    await supabase
      .from('geteducated_articles')
      .update({ revision_status: 'queued' })
      .eq('id', articleId)

    return data
  }

  /**
   * Get revision queue
   */
  async getRevisionQueue(status = null) {
    let query = supabase
      .from('geteducated_revision_queue')
      .select(`
        *,
        article:geteducated_articles(id, title, url, word_count, content_type)
      `)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get queue: ${error.message}`)
    }

    return data
  }

  /**
   * Get version history for an article
   */
  async getVersionHistory(articleId) {
    const { data, error } = await supabase
      .from('geteducated_article_versions')
      .select('*')
      .eq('article_id', articleId)
      .order('version_number', { ascending: false })

    if (error) {
      throw new Error(`Failed to get versions: ${error.message}`)
    }

    return data
  }

  /**
   * Restore a previous version
   */
  async restoreVersion(articleId, versionId) {
    // Get the version to restore
    const { data: version, error } = await supabase
      .from('geteducated_article_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (error || !version) {
      throw new Error('Version not found')
    }

    // Mark all versions as not current
    await supabase
      .from('geteducated_article_versions')
      .update({ is_current: false })
      .eq('article_id', articleId)

    // Mark this version as current
    await supabase
      .from('geteducated_article_versions')
      .update({ is_current: true })
      .eq('id', versionId)

    // Update the main article
    await supabase
      .from('geteducated_articles')
      .update({
        current_version_id: versionId,
        title: version.title,
        meta_description: version.meta_description,
        content_html: version.content_html,
        content_text: version.content_text,
        word_count: version.word_count,
        faqs: version.faqs,
        revision_status: 'revised',
      })
      .eq('id', articleId)

    return version
  }
}

export default new ArticleRevisionService()
