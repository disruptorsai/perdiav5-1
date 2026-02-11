import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'
import GenerationService from '../services/generationService'
import { stripImagesFromHtml } from '../utils/contentUtils'
import { searchCostData, formatCostDataForPrompt } from '../services/costDataService'
import { stripUnapprovedLinks } from '../services/validation/linkValidator'

const generationService = new GenerationService()

/**
 * Load humanization settings from database and apply to GenerationService
 */
async function loadHumanizationSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'humanization_provider',
        'stealthgpt_tone',
        'stealthgpt_mode',
        'stealthgpt_detector',
        'stealthgpt_business',
        'stealthgpt_double_passing',
      ])

    if (error) {
      console.warn('[Generation] Could not load humanization settings:', error.message)
      return
    }

    // Convert array to object
    const settingsMap = {}
    settings?.forEach(s => {
      settingsMap[s.key] = s.value
    })

    // Apply provider setting
    if (settingsMap.humanization_provider) {
      generationService.setHumanizationProvider(settingsMap.humanization_provider)
    }

    // Apply StealthGPT settings
    generationService.setStealthGptSettings({
      tone: settingsMap.stealthgpt_tone || 'College',
      mode: settingsMap.stealthgpt_mode || 'High',
      detector: settingsMap.stealthgpt_detector || 'gptzero',
      business: settingsMap.stealthgpt_business === 'true',
      doublePassing: settingsMap.stealthgpt_double_passing === 'true',
    })

    console.log('[Generation] Humanization settings loaded from database')
  } catch (err) {
    console.warn('[Generation] Error loading humanization settings:', err)
  }
}

/**
 * Generate complete article from content idea with full pipeline
 * Includes: Grok draft → StealthGPT humanize → Internal linking → Quality QA → Auto-fix loop → Save
 */
export function useGenerateArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ idea, options, onProgress }) => {
      // Load latest humanization settings before generation
      await loadHumanizationSettings()

      // Generate complete article with full pipeline
      const articleData = await generationService.generateArticleComplete(
        idea,
        {
          contentType: options?.contentType || 'guide',
          targetWordCount: options?.targetWordCount || 2000,
          autoAssignContributor: options?.autoAssignContributor !== false,
          addInternalLinks: options?.addInternalLinks !== false,
          autoFix: options?.autoFix !== false,
          maxFixAttempts: options?.maxFixAttempts || 3,
        },
        onProgress
      )

      // Save to database
      const savedArticle = await generationService.saveArticle(
        articleData,
        idea.id,
        user.id
      )

      return savedArticle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Auto-fix quality issues in an article
 */
export function useAutoFixQuality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, content, issues }) => {
      // Use generationService to fix issues
      const fixedContent = await generationService.autoFixQualityIssues(
        content,
        issues,
        []
      )

      // Recalculate quality metrics
      const metrics = generationService.calculateQualityMetrics(fixedContent, [])

      // Update article in database
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: fixedContent,
          quality_score: metrics.score,
          word_count: metrics.word_count,
          risk_flags: metrics.issues.map(i => i.type),
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}

/**
 * Revise article with editorial feedback
 * Enhanced with validation to ensure AI actually addressed feedback items
 * Per GetEducated issue report - addresses Issues 5 & 6 (edits not sticking, missing links)
 *
 * ENHANCED: Now fetches cost data and internal links to prevent AI hallucination
 * Per feedback from Charity Derrow testing (Feb 2026)
 */
export function useReviseArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, content, feedbackItems, articleTitle, articleTopics }) => {
      // Strip images from content before sending to AI
      // Per Bug #3: Prevents logos/images from appearing in AI-revised content
      const contentWithoutImages = stripImagesFromHtml(content)

      // Analyze feedback to determine what data we need to fetch
      const feedbackText = feedbackItems.map(f => f.comment.toLowerCase()).join(' ')
      const needsCostData = feedbackText.includes('cost') ||
                           feedbackText.includes('tuition') ||
                           feedbackText.includes('price') ||
                           feedbackText.includes('afford') ||
                           feedbackText.includes('$')
      const needsLinks = feedbackText.includes('link') ||
                        feedbackText.includes('source') ||
                        feedbackText.includes('cite') ||
                        feedbackText.includes('reference') ||
                        feedbackText.includes('ranking report')

      // Build context with real data from database
      const context = {
        costData: [],
        internalLinks: [],
        articleTitle: articleTitle || '',
      }

      // Fetch cost data if feedback mentions costs/tuition/prices
      if (needsCostData) {
        try {
          console.log('[useReviseArticle] Fetching cost data for:', articleTitle)
          const costData = await searchCostData(articleTitle || '', { limit: 10 })
          context.costData = costData
          console.log(`[useReviseArticle] Found ${costData.length} cost data entries`)
        } catch (err) {
          console.warn('[useReviseArticle] Could not fetch cost data:', err)
        }
      }

      // Fetch internal links if feedback mentions links/sources
      if (needsLinks) {
        try {
          console.log('[useReviseArticle] Fetching internal links for:', articleTitle)
          const relevantArticles = await generationService.getRelevantSiteArticles(
            articleTitle || '',
            15,
            { topics: articleTopics || [] }
          )
          context.internalLinks = relevantArticles.map(a => ({
            title: a.title,
            url: a.url,
            topics: a.topics,
          }))
          console.log(`[useReviseArticle] Found ${context.internalLinks.length} internal links`)
        } catch (err) {
          console.warn('[useReviseArticle] Could not fetch internal links:', err)
        }
      }

      // Use Claude to revise based on feedback WITH context data
      let revisedContent = await generationService.claude.reviseWithFeedback(
        contentWithoutImages,
        feedbackItems,
        context
      )

      // STRICT LINK CLEANUP: Strip any unapproved external links the AI may have added
      const linkCleanup = stripUnapprovedLinks(revisedContent)
      if (linkCleanup.removedLinks.length > 0) {
        console.warn(`[useReviseArticle] Stripped ${linkCleanup.removedLinks.length} unapproved links:`,
          linkCleanup.removedLinks.map(l => `${l.url} (${l.reason})`))
        revisedContent = linkCleanup.cleanedContent
      }

      // Import validation dynamically to avoid circular dependencies
      const { validateRevision, generateValidationSummary } = await import('../utils/revisionValidator')

      // Validate that the AI actually made the requested changes
      const validation = validateRevision(content, revisedContent, feedbackItems)

      console.log('[useReviseArticle] Validation result:', validation)

      // Update article with revised content and mark as revision
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: revisedContent,
          is_revision: true  // Mark as revised so it shows in Revised tab
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error

      // Update feedback items based on validation results
      for (const item of validation.items) {
        const updateData = {
          ai_revised: true,
          ai_validation_status: item.status,
          ai_validation_evidence: item.evidence.join('; '),
          ai_validation_warnings: item.warnings.join('; ') || null,
        }

        // Only mark as 'addressed' if validation passed
        if (item.status === 'addressed') {
          updateData.status = 'addressed'
        } else if (item.status === 'failed') {
          // Keep status as 'pending' but mark that AI attempted revision
          updateData.status = 'pending_review'
          updateData.ai_revision_failed = true
        } else {
          // Partial - mark for manual review
          updateData.status = 'pending_review'
        }

        await supabase
          .from('article_revisions')
          .update(updateData)
          .eq('id', item.id)
      }

      // Return extended result with validation info
      return {
        ...data,
        validationResult: validation,
        validationSummary: generateValidationSummary(validation),
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
      queryClient.invalidateQueries({ queryKey: ['revisions'] })
      queryClient.invalidateQueries({ queryKey: ['article-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['all-revisions'] })
      queryClient.invalidateQueries({ queryKey: ['review-articles'] })  // Refresh review queue
    },
  })
}

/**
 * Humanize content using StealthGPT (primary) or Claude (fallback)
 */
export function useHumanizeContent() {
  return useMutation({
    mutationFn: async ({ content, contributorStyle, contributorName }) => {
      // Load latest humanization settings before processing
      await loadHumanizationSettings()

      const humanizedContent = await generationService.humanizeContent(
        content,
        {
          writingStyle: contributorStyle,
          contributorName: contributorName
        }
      )

      return { content: humanizedContent }
    },
  })
}

/**
 * Revise content based on feedback comments
 * Per GetEducated spec section 8.3.3 - Article Review UI Requirements
 * Bundles article text + comments as context and sends to AI for revision
 *
 * ENHANCED: Now fetches cost data and internal links to prevent AI hallucination
 */
export function useReviseWithFeedback() {
  return useMutation({
    mutationFn: async ({ content, title, feedbackItems, contentType, focusKeyword, topics = [] }) => {
      // Strip images from content before sending to AI
      // Per Bug #3: Prevents logos/images from appearing in AI-revised content
      const contentWithoutImages = stripImagesFromHtml(content)

      // Format feedback items for the prompt
      const feedbackText = feedbackItems
        .map((item, i) => `${i + 1}. ${item.comment}`)
        .join('\n')

      // Check if any feedback is about links
      const feedbackLower = feedbackText.toLowerCase()
      const needsLinks = feedbackLower.includes('link') ||
                         feedbackLower.includes('source') ||
                         feedbackLower.includes('cite') ||
                         feedbackLower.includes('reference') ||
                         feedbackLower.includes('ranking report')

      // Check if any feedback is about costs/tuition
      const needsCostData = feedbackLower.includes('cost') ||
                            feedbackLower.includes('tuition') ||
                            feedbackLower.includes('price') ||
                            feedbackLower.includes('afford') ||
                            feedbackLower.includes('$')

      // Fetch cost data if feedback mentions costs/tuition
      let costDataContext = ''
      if (needsCostData) {
        try {
          console.log('[useReviseWithFeedback] Fetching cost data for:', title)
          const costData = await searchCostData(title || '', { limit: 10 })
          if (costData.length > 0) {
            costDataContext = `
=== APPROVED COST DATA FROM GETEDUCATED RANKING REPORTS ===
CRITICAL: Use ONLY these numbers. Do NOT invent or estimate costs.

${costData.map(entry => {
  let text = `📊 ${entry.school_name} - ${entry.program_name}\n`
  if (entry.total_cost) text += `   Total Cost: $${entry.total_cost.toLocaleString()}\n`
  if (entry.in_state_cost) text += `   In-State: $${entry.in_state_cost.toLocaleString()}\n`
  if (entry.out_of_state_cost) text += `   Out-of-State: $${entry.out_of_state_cost.toLocaleString()}\n`
  if (entry.ranking_reports?.report_url) text += `   Source: ${entry.ranking_reports.report_url}\n`
  return text
}).join('\n')}
=== END APPROVED COST DATA ===
`
            console.log(`[useReviseWithFeedback] Found ${costData.length} cost data entries`)
          }
        } catch (e) {
          console.warn('[useReviseWithFeedback] Could not fetch cost data:', e)
        }
      }

      // If link-related, fetch relevant internal links
      let internalLinkContext = ''
      if (needsLinks) {
        try {
          const relevantArticles = await generationService.getRelevantSiteArticles(title, 10, { topics })
          if (relevantArticles.length > 0) {
            internalLinkContext = `
=== APPROVED INTERNAL LINKS (GetEducated.com) ===
CRITICAL: Use ONLY these URLs for internal links. Do NOT invent URLs.

${relevantArticles.map(a => `- [${a.title}](${a.url})`).join('\n')}

=== END APPROVED INTERNAL LINKS ===
`
          }
        } catch (e) {
          console.warn('[useReviseWithFeedback] Could not fetch internal links:', e)
        }
      }

      // STRICT LINK WHITELIST - tightened Feb 2026 to prevent ANY unapproved links
      const linkingRules = `
=== STRICT EXTERNAL LINK WHITELIST (ONLY these domains are allowed) ===

ALLOWED DOMAINS - Government:
- bls.gov (Bureau of Labor Statistics)
- ed.gov, nces.ed.gov, studentaid.gov, fafsa.gov, collegescorecard.ed.gov

ALLOWED DOMAINS - Accreditation Bodies:
- chea.org, aacsb.edu, abet.org, cacrep.org, ccne-accreditation.org, cswe.org

ALLOWED DOMAINS - Nonprofit/Professional:
- collegeboard.org, acenet.edu, aacn.nche.edu, naspa.org
- apa.org, nasw.org, nursingworld.org

NEVER LINK TO (will be automatically stripped):
- ANY .edu school websites (use GetEducated school pages instead)
- ANY foundation sites (nursingfoundation.org, etc.)
- ANY association not listed above
- Wikipedia, news sites, blogs
- Competitors: onlineu.com, usnews.com, bestcolleges.com, niche.com, petersons.com, princetonreview.com

CRITICAL: If unsure whether a link is allowed, DO NOT include it.
The text can stand alone without a hyperlink. Unapproved links will be stripped.

=== END LINK WHITELIST ===
`

      const prompt = `You are revising an article based on editorial feedback.

ARTICLE TITLE: ${title}
CONTENT TYPE: ${contentType || 'guide'}
FOCUS KEYWORD: ${focusKeyword || 'N/A'}

=== CRITICAL GUARDRAILS - MUST FOLLOW ===

1. FACTUAL ACCURACY:
   - NEVER invent tuition costs, school rankings, or program details
   - If cost data is provided below, use ONLY those exact numbers
   - If NO cost data is provided, use qualitative language ("affordable", "competitive") instead of specific numbers

2. LINKS:
   - ONLY use URLs from the "APPROVED INTERNAL LINKS" section below (if provided)
   - NEVER invent GetEducated URLs - they will 404
   - Follow the linking rules strictly

3. DATES:
   - The current year is ${new Date().getFullYear()}
   - Use current year for any "current year" references

=== END GUARDRAILS ===
${costDataContext}${internalLinkContext}${linkingRules}
EDITORIAL FEEDBACK TO ADDRESS:
${feedbackText}

CURRENT ARTICLE CONTENT:
${contentWithoutImages}

INSTRUCTIONS:
1. Carefully address ALL the feedback items listed above
2. Maintain the article's overall structure and tone
3. Keep all existing HTML formatting intact
4. Do not remove existing content unless specifically requested
5. Make changes that directly respond to the feedback
6. Ensure the article remains coherent and well-organized
7. Keep the content length similar unless asked to expand/reduce
8. STRICTLY follow the linking rules - never link to competitors or .edu sites
9. If feedback asks for cost/tuition data, ONLY use numbers from APPROVED COST DATA above

OUTPUT ONLY THE COMPLETE REVISED HTML CONTENT (no explanations, no commentary).`

      // Use Claude to revise with feedback
      let revisedContent = await generationService.claude.chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      // STRICT LINK CLEANUP: Strip any unapproved external links the AI may have added
      const linkCleanup = stripUnapprovedLinks(revisedContent)
      if (linkCleanup.removedLinks.length > 0) {
        console.warn(`[useReviseWithFeedback] Stripped ${linkCleanup.removedLinks.length} unapproved links:`,
          linkCleanup.removedLinks.map(l => `${l.url} (${l.reason})`))
        revisedContent = linkCleanup.cleanedContent
      }

      return { content: revisedContent }
    },
  })
}

/**
 * Generate ideas from a topic
 */
export function useGenerateIdeas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ topic, count = 5 }) => {
      const ideas = await generationService.generateIdeas(topic, count)
      return ideas
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Run compliance update on an article
 * Per Dec 22, 2025 meeting - "Update" button for automatic compliance pass
 * Fixes shortcodes, monetization, internal links, and formatting
 * WITHOUT rewriting prose content
 */
export function useComplianceUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ article, options = {}, onProgress }) => {
      // Run compliance update
      const result = await generationService.runComplianceUpdate(article, {
        ...options,
        onProgress,
      })

      if (!result.success) {
        throw new Error('Compliance update failed')
      }

      // Update article in database
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: result.content,
          quality_score: result.quality_score,
          word_count: result.word_count,
          risk_flags: result.quality_issues.map(i => i.type),
          ai_reasoning: result.ai_reasoning,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)
        .select()
        .single()

      if (error) throw error

      return {
        article: data,
        updates: result.updates,
        reasoning: result.ai_reasoning,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.article.id] })
    },
  })
}

/**
 * Batch compliance update for multiple articles
 * Per Dec 22, 2025 meeting - refresh all existing articles with new rules
 */
export function useBatchComplianceUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleIds, options = {}, onProgress }) => {
      const results = {
        successful: [],
        failed: [],
      }

      const total = articleIds.length

      for (let i = 0; i < articleIds.length; i++) {
        const articleId = articleIds[i]

        try {
          // Fetch the article
          const { data: article, error: fetchError } = await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single()

          if (fetchError) throw fetchError

          // Run compliance update
          const result = await generationService.runComplianceUpdate(article, {
            ...options,
            onProgress: (progress) => {
              if (onProgress) {
                const overallProgress = ((i + progress.percentage / 100) / total) * 100
                onProgress({
                  message: `[${i + 1}/${total}] ${progress.message}`,
                  percentage: overallProgress,
                  current: i + 1,
                  total,
                })
              }
            },
          })

          // Update article
          const { data: updated, error: updateError } = await supabase
            .from('articles')
            .update({
              content: result.content,
              quality_score: result.quality_score,
              word_count: result.word_count,
              risk_flags: result.quality_issues.map(iss => iss.type),
              ai_reasoning: result.ai_reasoning,
              updated_at: new Date().toISOString(),
            })
            .eq('id', articleId)
            .select()
            .single()

          if (updateError) throw updateError

          results.successful.push({
            articleId,
            title: article.title,
            updates: result.updates,
          })

        } catch (error) {
          console.error(`[BatchUpdate] Failed for article ${articleId}:`, error)
          results.failed.push({
            articleId,
            error: error.message,
          })
        }
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Get contributors (for display)
 */
export function useContributors() {
  return {
    queryKey: ['contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_contributors')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
  }
}
