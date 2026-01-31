/**
 * Supabase Edge Function: generate-article
 * Orchestrates the two-pass AI generation pipeline (Grok → Claude) server-side
 * This keeps API keys secure and prevents browser exposure
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { ideaId, userId, options = {} } = await req.json()

    // Validate inputs
    if (!ideaId || !userId) {
      throw new Error('Missing required parameters: ideaId and userId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialize AI clients with server-side keys
    const grokApiKey = Deno.env.get('GROK_API_KEY')
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')

    if (!grokApiKey || !claudeApiKey) {
      throw new Error('AI API keys not configured in Edge Function secrets')
    }

    // Fetch the content idea
    const { data: idea, error: ideaError } = await supabaseClient
      .from('content_ideas')
      .select('*')
      .eq('id', ideaId)
      .single()

    if (ideaError || !idea) {
      throw new Error(`Content idea not found: ${ideaError?.message}`)
    }

    console.log('Starting article generation for:', idea.title)

    // STAGE 1: Generate draft with Grok
    console.log('Stage 1: Generating draft with Grok...')
    const draftData = await generateDraftWithGrok(idea, grokApiKey, options)

    // STAGE 2: Auto-assign contributor
    console.log('Stage 2: Auto-assigning contributor...')
    const contributor = await assignContributor(supabaseClient, idea, options.contentType || 'guide')

    // STAGE 3: Humanize with Claude
    console.log('Stage 3: Humanizing content with Claude...')
    const claudeClient = new Anthropic({ apiKey: claudeApiKey })
    const humanizedContent = await humanizeWithClaude(
      claudeClient,
      draftData.content,
      contributor
    )

    // STAGE 4: Add internal links (if enabled)
    let finalContent = humanizedContent
    if (options.addInternalLinks !== false) {
      console.log('Stage 4: Adding internal links...')
      const siteArticles = await getRelevantSiteArticles(supabaseClient, draftData.title)
      if (siteArticles.length >= 3) {
        finalContent = await addInternalLinks(claudeClient, humanizedContent, siteArticles)
      }
    }

    // STAGE 5: Calculate quality metrics
    console.log('Stage 5: Calculating quality metrics...')
    const qualityMetrics = calculateQualityMetrics(finalContent, draftData.faqs)

    // STAGE 6: Save article to database
    console.log('Stage 6: Saving article...')
    const articleData = {
      title: draftData.title,
      content: finalContent,
      excerpt: draftData.excerpt,
      meta_title: draftData.meta_title,
      meta_description: draftData.meta_description,
      focus_keyword: draftData.focus_keyword,
      slug: generateSlug(draftData.title),
      faqs: draftData.faqs,
      contributor_id: contributor?.id || null,
      contributor_name: contributor?.name || null,
      word_count: qualityMetrics.word_count,
      quality_score: qualityMetrics.score,
      risk_flags: qualityMetrics.issues.map(i => i.type),
      status: 'drafting',
      user_id: userId,
    }

    const { data: article, error: saveError } = await supabaseClient
      .from('articles')
      .insert(articleData)
      .select()
      .single()

    if (saveError) throw saveError

    // Update the content idea
    await supabaseClient
      .from('content_ideas')
      .update({ article_id: article.id, status: 'completed' })
      .eq('id', ideaId)

    console.log('Article generation complete:', article.id)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        article,
        metrics: qualityMetrics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Article generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// ===============================================
// HELPER FUNCTIONS
// ===============================================

async function generateDraftWithGrok(idea: any, apiKey: string, options: any) {
  const contentType = options.contentType || 'guide'
  const targetWordCount = options.targetWordCount || 2000

  const structures: Record<string, string> = {
    guide: `
- Introduction (why this matters)
- Main sections with H2 headings
- Step-by-step instructions or explanations
- Examples and use cases
- Best practices
- Common mistakes to avoid
- Conclusion with key takeaways`,
    listicle: `
- Engaging introduction
- Clear list items with H2 headings
- Each item should have 2-3 paragraphs of explanation
- Use numbers or bullets
- Conclusion that ties it together`,
    ranking: `
- Introduction explaining ranking criteria
- Ranked list items (e.g., #1, #2, #3)
- Each item with pros/cons
- Clear explanation of why it's ranked that way
- Conclusion with winner summary`,
    explainer: `
- Introduction (what is this?)
- Background/context
- How it works
- Why it matters
- Real-world examples
- Conclusion`,
    review: `
- Introduction
- Overview of product/service
- Features breakdown
- Pros and cons
- Who it's for
- Final verdict`,
  }

  const prompt = `Generate a comprehensive ${contentType} article based on this content idea.

CONTENT IDEA:
Title: ${idea.title}
Description: ${idea.description || 'Not provided'}
${idea.keyword_research_data ? `Primary Keyword: ${idea.keyword_research_data.primary_keyword}` : ''}
${idea.seed_topics ? `Topics to cover: ${idea.seed_topics.join(', ')}` : ''}

REQUIREMENTS:
- Target word count: ${targetWordCount} words
- Content type: ${contentType}
- Include an engaging introduction that hooks the reader
- Use clear headings and subheadings (H2, H3)
- Write in a conversational, natural tone
- Include specific examples and actionable insights
- Vary sentence length (short punchy sentences mixed with longer explanatory ones)
- Avoid generic phrases like "In conclusion", "It's important to note"
- Make it valuable and informative

STRUCTURE:
${structures[contentType] || structures.guide}

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Compelling article title (60-70 characters)",
  "excerpt": "Brief 1-2 sentence summary (150-160 characters)",
  "content": "Full article in HTML format with proper heading tags",
  "meta_title": "SEO-optimized title (50-60 characters)",
  "meta_description": "SEO description (150-160 characters)",
  "focus_keyword": "Primary keyword for SEO",
  "faqs": [
    {"question": "Question 1", "answer": "Answer 1"},
    {"question": "Question 2", "answer": "Answer 2"},
    {"question": "Question 3", "answer": "Answer 3"}
  ]
}

Generate the article now:`

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer who creates high-quality, engaging articles. You write in a natural, conversational style with varied sentence structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Grok API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  return JSON.parse(content)
}

async function assignContributor(supabase: any, idea: any, contentType: string) {
  const { data: contributors, error } = await supabase
    .from('article_contributors')
    .select('*')

  if (error || !contributors || contributors.length === 0) {
    console.error('Error fetching contributors:', error)
    return null
  }

  // Score each contributor
  const scoredContributors = contributors.map((contributor: any) => {
    let score = 0

    // Check expertise areas
    const ideaTopics = idea.seed_topics || []
    const expertiseMatch = contributor.expertise_areas?.some((area: string) =>
      ideaTopics.some((topic: string) => topic.toLowerCase().includes(area.toLowerCase()))
    )
    if (expertiseMatch) score += 50

    // Check content type match
    if (contributor.content_types?.includes(contentType)) {
      score += 30
    }

    // Check title for keyword matches
    const titleWords = idea.title.toLowerCase().split(' ')
    const titleMatch = contributor.expertise_areas?.some((area: string) =>
      titleWords.some((word: string) => word.includes(area.toLowerCase()))
    )
    if (titleMatch) score += 20

    return { contributor, score }
  })

  // Sort and return best match
  scoredContributors.sort((a: any, b: any) => b.score - a.score)
  return scoredContributors[0].contributor
}

async function humanizeWithClaude(client: any, content: string, contributor: any) {
  let styleInstructions = ''

  if (contributor) {
    const style = contributor.writing_style_profile || {}
    styleInstructions = `
WRITER PERSONA:
Name: ${contributor.name}
Tone: ${style.tone || 'professional'}
Complexity: ${style.complexity_level || 'intermediate'}
Sentence Length: ${style.sentence_length_preference || 'medium'}
`
  }

  const prompt = `You are a highly skilled human writer. Your task is to rewrite the following AI-generated content to make it completely undetectable as AI-written. The content must read as if it was written by a real human with personality, expertise, and natural writing patterns.

${styleInstructions}

ORIGINAL CONTENT:
${content}

CRITICAL HUMANIZATION TECHNIQUES:

1. **Perplexity (Unpredictability)**: high
   - Use unexpected word choices and phrasings
   - Avoid predictable transitions
   - Include occasional colloquialisms or industry-specific terms
   - Vary vocabulary richly

2. **Burstiness (Sentence Variation)**: high
   - Mix very short sentences with longer, complex ones
   - Create natural rhythm: short → long → medium → very short
   - Use fragments occasionally for emphasis
   - Vary sentence structures significantly

3. **Voice & Personality**:
   - Add subtle personal touches ("I've found that...", "In my experience...")
   - Include minor imperfections (starting sentences with "And" or "But")
   - Use rhetorical questions sparingly
   - Show emotion where appropriate

4. **Natural Writing Patterns**:
   - Avoid overly perfect grammar (humans make small stylistic choices)
   - Use contractions naturally (don't, won't, I've)
   - Include em-dashes for emphasis—like this
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

6. **Content Quality**:
   - Keep all factual information accurate
   - Maintain the same structure and headings
   - Preserve HTML formatting
   - Keep the same SEO focus
   - Ensure the content remains valuable and informative

OUTPUT ONLY THE REWRITTEN HTML CONTENT. DO NOT include explanations, meta-commentary, or anything other than the pure HTML article content.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4500,
    temperature: 0.9,
    messages: [{ role: 'user', content: prompt }]
  })

  return response.content[0].text
}

async function getRelevantSiteArticles(supabase: any, articleTitle: string) {
  const { data: articles, error } = await supabase
    .from('site_articles')
    .select('*')
    .order('times_linked_to', { ascending: true })
    .limit(30)

  if (error || !articles) return []

  // Score articles by relevance
  const titleWords = articleTitle.toLowerCase().split(' ').filter((w: string) => w.length > 3)

  const scoredArticles = articles.map((article: any) => {
    let score = 0

    const articleTitleWords = article.title.toLowerCase().split(' ')
    const commonWords = titleWords.filter((word: string) =>
      articleTitleWords.some((aw: string) => aw.includes(word))
    )
    score += commonWords.length * 10

    if (article.topics && article.topics.length > 0) {
      const topicMatches = article.topics.filter((topic: string) =>
        titleWords.some((word: string) => topic.toLowerCase().includes(word))
      )
      score += topicMatches.length * 15
    }

    return { article, score }
  })

  scoredArticles.sort((a: any, b: any) => b.score - a.score)

  return scoredArticles
    .filter((a: any) => a.score > 0)
    .slice(0, 5)
    .map((a: any) => a.article)
}

async function addInternalLinks(client: any, content: string, siteArticles: any[]) {
  const prompt = `Add 3-5 contextual internal links to this article content.

ARTICLE CONTENT:
${content}

AVAILABLE ARTICLES TO LINK TO:
${siteArticles.map(a => `- [${a.title}](${a.url})`).join('\n')}

INSTRUCTIONS:
1. Add links where they are genuinely relevant and helpful to the reader
2. Use natural anchor text (not "click here" or URLs)
3. Distribute links throughout the article, not all in one section
4. Use HTML <a> tags: <a href="URL">anchor text</a>
5. Aim for 3-5 links total
6. Do not force links where they don't fit naturally

OUTPUT ONLY THE UPDATED HTML CONTENT with links added.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })

    return response.content[0].text
  } catch (error) {
    console.error('Error adding internal links:', error)
    return content
  }
}

function calculateQualityMetrics(content: string, faqs: any[] = []) {
  const issues: any[] = []
  let score = 100

  // Strip HTML for word count
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = textContent.split(' ').length

  // Word count check (1500-2500)
  if (wordCount < 1500) {
    issues.push({ type: 'word_count_low', severity: 'major' })
    score -= 15
  } else if (wordCount > 2500) {
    issues.push({ type: 'word_count_high', severity: 'minor' })
    score -= 5
  }

  // Internal links check (3-5)
  const internalLinks = (content.match(/<a href/gi) || []).length
  if (internalLinks < 3) {
    issues.push({ type: 'missing_internal_links', severity: 'major' })
    score -= 15
  }

  // External links check (2-4)
  const externalLinkMatches = content.match(/href="http/gi) || []
  const externalLinks = externalLinkMatches.length
  if (externalLinks < 2) {
    issues.push({ type: 'missing_external_links', severity: 'minor' })
    score -= 10
  }

  // FAQ check (at least 3)
  if (!faqs || faqs.length < 3) {
    issues.push({ type: 'missing_faqs', severity: 'minor' })
    score -= 10
  }

  // Heading structure check
  const h2Count = (content.match(/<h2/gi) || []).length
  if (h2Count < 3) {
    issues.push({ type: 'weak_headings', severity: 'minor' })
    score -= 10
  }

  // Readability
  const sentences = textContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
  const avgSentenceLength = textContent.split(' ').length / sentences.length
  if (avgSentenceLength > 25) {
    issues.push({ type: 'poor_readability', severity: 'minor' })
    score -= 10
  }

  return {
    score: Math.max(0, score),
    word_count: wordCount,
    issues,
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}
