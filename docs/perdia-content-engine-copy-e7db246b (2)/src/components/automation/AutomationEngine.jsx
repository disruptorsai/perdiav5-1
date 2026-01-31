import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Background automation engine that runs continuously
 * Handles auto-post and full automation workflows
 */
export default function AutomationEngine() {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-for-automation'],
    queryFn: () => base44.entities.Article.list('-updated_date', 200),
    refetchInterval: 60000, // Check every minute
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas-for-automation'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }),
    refetchInterval: 120000, // Check every 2 minutes
  });

  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-duplicate-check'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: existingIdeas = [] } = useQuery({
    queryKey: ['all-ideas-for-duplicate-check'],
    queryFn: () => base44.entities.ContentIdea.list('-created_date', 200),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['wordpress-connections-automation'],
    queryFn: () => base44.entities.WordPressConnection.list(),
    refetchInterval: 120000, // Check every 2 minutes
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Article.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-for-automation'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: (data) => base44.entities.Article.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-for-automation'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const topPerformers = existingArticles
        .filter(a => a.views && a.views > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10);

      const existingTopics = [
        ...existingArticles.map(a => a.title),
        ...existingIdeas.map(i => i.title)
      ];

      const coveredKeywords = [
        ...existingArticles.flatMap(a => a.target_keywords || []),
        ...existingIdeas.flatMap(i => i.keywords || [])
      ];

      const topPerformersText = topPerformers.length > 0 
        ? `\n\nTOP PERFORMING ARTICLES (learn from these):
${topPerformers.map((a, i) => `${i + 1}. "${a.title}" - ${a.views} views, Type: ${a.type}`).join('\n')}`
        : '';

      const catalogContext = verifiedSiteArticles.slice(0, 50).map(a => 
        `"${a.title}" - ${a.category} - Topics: ${a.topics?.join(', ') || 'N/A'}`
      ).join('\n');

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      
      const prompt = `Generate 10 trending, highly relevant article ideas for GetEducated.com, an education and career guidance website.

IMPORTANT - CURRENT DATE CONTEXT:
- Current year: ${currentYear}
- Current month: ${currentMonth} ${currentYear}
- Focus on CURRENT and UPCOMING trends (${currentYear} and ${currentYear + 1})
- DO NOT reference past years like 2023 or 2024 in titles
- Use "Latest", "Current", "This Year", or ${currentYear} when appropriate

${topPerformersText}

EXISTING SITE CATALOG (topics we cover):
${catalogContext}

CRITICAL - AVOID DUPLICATE TOPICS:
We already have ${existingTopics.length} articles/ideas. DO NOT suggest topics similar to:
${existingTopics.slice(0, 30).map(t => `- ${t}`).join('\n')}

COVERED KEYWORDS:
${coveredKeywords.slice(0, 50).join(', ')}

IDEA GENERATION SOURCES:
1. Analyze trending topics in higher education, online learning, career transitions
2. Identify gaps in our existing content catalog
3. Research emerging degree programs and career paths
4. Consider seasonal education topics (enrollment periods, graduation, career planning)
5. Look for high-volume, low-competition keywords in education sector
6. Identify questions people are asking about online degrees and careers

For each NEW and UNIQUE idea, provide:
1. A compelling, SEO-friendly article title
2. A brief description (what the article will cover)
3. Suggested optimized title for SEO
4. Suggested meta description
5. Target keywords array
6. Target audience
7. Priority level (high/medium/low)
8. Suggested content type (ranking, career_guide, listicle, guide, or faq)
9. Trending score (0-100 based on current relevance)

Return as JSON array with this structure:
{
  "ideas": [
    {
      "title": "Article title",
      "description": "What this article covers",
      "suggested_title": "SEO-optimized title",
      "suggested_description": "Meta description 150-160 chars",
      "suggested_keywords": ["keyword1", "keyword2", "keyword3"],
      "target_audience": "Who this is for",
      "priority": "high/medium/low",
      "content_type": "ranking/career_guide/listicle/guide/faq",
      "trending_score": 85
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  suggested_title: { type: "string" },
                  suggested_description: { type: "string" },
                  suggested_keywords: { type: "array", items: { type: "string" } },
                  target_audience: { type: "string" },
                  priority: { type: "string" },
                  content_type: { type: "string" },
                  trending_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      const autoApproveEnabled = getSettingValue('auto_approve_ideas', 'true') === 'true';
      const ideasToSave = (result.ideas || []).map(idea => ({
        title: idea.title,
        description: idea.description,
        suggested_title: idea.suggested_title || idea.title,
        suggested_description: idea.suggested_description || idea.description,
        suggested_keywords: idea.suggested_keywords || [],
        source: "ai_generated",
        keywords: idea.suggested_keywords || [],
        content_type: idea.content_type || "guide",
        priority: idea.priority || "medium",
        trending_score: idea.trending_score || 50,
        status: autoApproveEnabled ? "approved" : "pending",
        auto_approved: autoApproveEnabled,
        notes: `AI Generated - Target: ${idea.target_audience}`
      }));

      await base44.entities.ContentIdea.bulkCreate(ideasToSave);
      queryClient.invalidateQueries({ queryKey: ['ideas-for-automation'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
      
      return ideasToSave.length;
    },
  });

  const { data: verifiedSiteArticles = [] } = useQuery({
    queryKey: ['verified-site-articles-automation'],
    queryFn: () => base44.entities.SiteArticle.filter({ is_active: true }),
  });

  const generateArticleMutation = useMutation({
    mutationFn: async (idea) => {
      const currentYear = new Date().getFullYear();
      
      // Get ALL site catalog articles for comprehensive linking
      const allLinkingContext = verifiedSiteArticles.map(a => ({
        title: a.title,
        url: a.url,
        topics: a.topics || [],
        category: a.category,
        excerpt: a.excerpt || ''
      }));
      
      const linkingContextText = allLinkingContext.map((a, i) => 
        `${i + 1}. "${a.title}" | URL: ${a.url} | Topics: ${a.topics.join(', ')} | Category: ${a.category}`
      ).join('\n');
      
      const prompt = `Create a comprehensive ${idea.content_type} article for GetEducated.com.

Title: ${idea.title}
Description: ${idea.description}
Target Keywords: ${idea.keywords?.join(', ')}

CRITICAL - DATE CONTEXT:
- Current year: ${currentYear}
- Use CURRENT data and statistics (${currentYear})
- DO NOT use outdated years like 2023 or 2024
- Reference "latest", "current", or ${currentYear} data

CRITICAL - WORD COUNT REQUIREMENT:
- Article MUST be 2000-3000 words minimum
- This is a HARD requirement - do not generate shorter content
- Count carefully and ensure you meet this target
- Write detailed, comprehensive content - not filler

CRITICAL - INTERNAL LINKING RULES - VERIFIED SITE CATALOG:
You have access to the COMPLETE GetEducated.com site catalog (${allLinkingContext.length} articles):
${linkingContextText}

STRICT REQUIREMENTS FOR INTERNAL LINKS:
- Choose 3-5 MOST RELEVANT articles from the catalog above based on topic overlap
- ONLY use URLs from the list above - DO NOT create fictional URLs
- Place links on EXISTING WORDS/PHRASES in your article (anchor text), NOT as standalone URLs
- Example: Turn "online degree programs" into <a href="URL">online degree programs</a>
- Select anchor text that naturally describes the linked article's content
- Distribute links throughout the article (intro, body sections, conclusion)
- Prioritize articles in the same category or with overlapping topics

Write a complete, SEO-optimized article that reads as NATURALLY HUMAN-WRITTEN:

CONTENT STRUCTURE:
- Engaging introduction (200-300 words)
- 5-7 well-structured sections with H2/H3 headings (use id attributes)
- Each section 300-500 words with detailed information
- 2-3 internal links to VERIFIED articles (placed on existing anchor text, not standalone URLs)
- External citations from authoritative sources (BLS, NCES, .edu, .gov) with current ${currentYear} data
- Natural keyword integration
- Clear, actionable content with specific examples
- Compelling conclusion (150-200 words)

HUMAN-LIKE WRITING STYLE (CRITICAL):
- Vary sentence lengths dramatically (5-word fragments, then 35-word sentences)
- Use contractions: don't, won't, it's, you'll, can't
- Address reader as "you" — make it conversational
- Start some sentences with "And" or "But"
- Use em dashes for emphasis — like this
- Add rhetorical questions occasionally
- Avoid AI phrases: NO "Furthermore", "Moreover", "In conclusion", "It's worth noting"
- Mix formal expertise with conversational tone
- Use specific, vivid vocabulary over generic terms
- Make it sound like an experienced education writer, not a robot

Return as JSON:
{
  "title": "Final title",
  "content": "Full HTML content",
  "excerpt": "Brief summary (150 chars)",
  "target_keywords": ["keyword1", "keyword2"],
  "word_count": 2500
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" },
            target_keywords: { type: "array", items: { type: "string" } },
            word_count: { type: "number" }
          }
        }
      });

      // Final duplicate check before creating
      const finalTitle = result.title || idea.title;
      const normalized = finalTitle.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const existingArticles = await base44.entities.Article.list();
      const duplicate = existingArticles.find(a => {
        const existingNormalized = a.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
        return existingNormalized === normalized;
      });
      
      if (duplicate) {
        console.log(`Duplicate detected: "${finalTitle}" matches "${duplicate.title}". Skipping creation.`);
        await base44.entities.ContentIdea.update(idea.id, { 
          status: 'rejected',
          notes: `Duplicate of existing article: ${duplicate.title}` 
        });
        return null;
      }
      
      const article = await base44.entities.Article.create({
        title: finalTitle,
        content: result.content,
        excerpt: result.excerpt,
        type: idea.content_type,
        status: 'draft',
        target_keywords: result.target_keywords || idea.keywords,
        word_count: result.word_count || 0,
        cluster_id: idea.cluster_id,
      });

      await base44.entities.ContentIdea.update(idea.id, { 
        status: 'completed',
        article_id: article.id 
      });

      return article;
    },
  });

  // Get settings
  const getSettingValue = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const automationLevel = getSettingValue('automation_level', 'manual');
  const autoPostEnabled = getSettingValue('auto_post_enabled', 'false') === 'true';
  const autoPostDays = parseInt(getSettingValue('auto_post_days', '5'));

  // WordPress auto-post logic
  useEffect(() => {
    if (!autoPostEnabled) return;

    // Check Posting Block Window
    const blockStart = getSettingValue('posting_block_start');
    const blockEnd = getSettingValue('posting_block_end');

    if (blockStart && blockEnd) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMinute] = blockStart.split(':').map(Number);
      const [endHour, endMinute] = blockEnd.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      let isBlocked = false;
      if (startTime < endTime) {
         isBlocked = currentTime >= startTime && currentTime < endTime;
      } else {
         // Crosses midnight
         isBlocked = currentTime >= startTime || currentTime < endTime;
      }

      if (isBlocked) {
         console.log(`Auto-posting blocked due to time window (${blockStart} - ${blockEnd}).`);
         return;
      }
    }

    // Find articles ready for WordPress publishing
    const articlesToPublish = articles.filter(a => 
      a.status === 'approved' && 
      (!a.publish_status || a.publish_status === 'pending')
    );
    
    // Check if there's a valid default connection
    const defaultConnection = connections.find(c => c.is_default && c.connection_status === 'connected');
    if (!defaultConnection) return;

    // Publish articles to WordPress
    articlesToPublish.forEach(async (article) => {
      try {
        console.log(`Auto-posting article to WordPress: ${article.title}`);
        await base44.functions.invoke('postArticleToWordPress', { articleId: article.id });
        queryClient.invalidateQueries({ queryKey: ['articles-for-automation'] });
      } catch (error) {
        console.error(`Failed to auto-post article ${article.id}:`, error);
      }
    });
  }, [articles, autoPostEnabled, connections]);

  // Automated idea generation logic
  useEffect(() => {
    const autoGenerateIdeas = getSettingValue('auto_generate_ideas', 'false') === 'true';
    const ideaQueueMin = parseInt(getSettingValue('idea_queue_minimum', '5'));
    
    if (!autoGenerateIdeas) return;
    if (ideas.length >= ideaQueueMin) return;
    if (generateIdeasMutation.isPending) return;

    console.log(`Idea queue low (${ideas.length}/${ideaQueueMin}). Generating new ideas...`);
    generateIdeasMutation.mutate();
  }, [ideas.length, settings]);

  // Full automation logic
  useEffect(() => {
    if (automationLevel !== 'full_auto') return;

    // Auto-generate articles from approved ideas
    const maxConcurrentGeneration = parseInt(getSettingValue('max_concurrent_generation', '2'));
    const articlesInProgress = articles.filter(a => a.status === 'draft' || a.status === 'in_review').length;
    
    // Helper function to check for duplicate titles
    const isDuplicateTitle = (titleToCheck) => {
      const normalized = titleToCheck.toLowerCase().trim().replace(/[^\w\s]/g, '');
      return articles.some(a => {
        const existingNormalized = a.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
        return existingNormalized === normalized || 
               existingNormalized.includes(normalized) ||
               normalized.includes(existingNormalized);
      });
    };
    
    if (articlesInProgress < maxConcurrentGeneration) {
      const ideasToGenerate = ideas.slice(0, maxConcurrentGeneration - articlesInProgress);
      ideasToGenerate.forEach(idea => {
        if (!isDuplicateTitle(idea.title) && !generateArticleMutation.isPending) {
          console.log(`Auto-generating article for: ${idea.title}`);
          generateArticleMutation.mutate(idea);
        } else {
          console.log(`Skipping duplicate title: ${idea.title}`);
        }
      });
    }

    // Auto-approve high-quality drafts
    const autoApproveArticles = getSettingValue('auto_approve_articles', 'true') === 'true';
    if (autoApproveArticles) {
      const draftsToReview = articles.filter(a => 
        (a.status === 'draft' || a.status === 'in_review') && 
        a.word_count > 1500
      );
      
      draftsToReview.forEach(article => {
        const wordCountOk = article.word_count >= 850;
        const hasContent = article.content && article.content.length > 3000;
        const hasKeywords = article.target_keywords && article.target_keywords.length > 0;
        const hasInternalLinks = (article.internal_links_count || 0) >= 2;
        const hasExternalLinks = (article.external_citations_count || 0) >= 1;
        
        const qualityScore = [wordCountOk, hasContent, hasKeywords, hasInternalLinks, hasExternalLinks]
          .filter(Boolean).length;
        
        if (qualityScore >= 4) {
          console.log(`Auto-approving article: ${article.title} (quality score: ${qualityScore}/5)`);
          updateArticleMutation.mutate({
            id: article.id,
            data: { 
              status: 'approved', 
              auto_publish_at: new Date(Date.now() + autoPostDays * 24 * 60 * 60 * 1000).toISOString() 
            }
          });
        }
      });
    }
  }, [automationLevel, ideas, articles, settings]);

  // This component doesn't render anything
  return null;
}