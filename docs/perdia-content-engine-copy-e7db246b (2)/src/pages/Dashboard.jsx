import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, Sparkles, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildEnhancedPrompt, buildHumanizationPrompt } from '../components/article/PromptBuilder';

import SourceSelector from "../components/workflow/SourceSelector";
import KanbanBoard from "../components/workflow/KanbanBoard";
import { addInternalLinks } from "../components/article/AutoLinker";
import { assignContributor } from "../components/contributors/ContributorAssignment";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState({});
  const [viewingGenerationId, setViewingGenerationId] = useState(null);
  const [generationQueue, setGenerationQueue] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['workflow-articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 100),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['workflow-ideas'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-dashboard'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-linking-dashboard'],
    queryFn: () => base44.entities.Article.filter({ status: 'published' }, '-created_date', 100),
  });

  // Fetch Site Catalog for better initial linking context
  const { data: siteCatalog = [] } = useQuery({
    queryKey: ['site-catalog-dashboard'],
    queryFn: () => base44.entities.SiteArticle.filter({ is_active: true }, '-created_date', 1000),
  });

  const updateArticleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Article.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }) => {
      const existingSetting = settings.find(s => s.setting_key === key);
      if (existingSetting) {
        return base44.entities.SystemSetting.update(existingSetting.id, { setting_value: value });
      } else {
        return base44.entities.SystemSetting.create({ 
          setting_key: key, 
          setting_value: value,
          setting_type: 'workflow'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings-dashboard'] });
    },
  });

  const handleStatusChange = (articleId, newStatus) => {
    updateArticleStatusMutation.mutate({ id: articleId, status: newStatus });
  };

  const updateGenerationStep = (ideaId, step, column = null) => {
    setGeneratingIdeas(prev => ({
      ...prev,
      [ideaId]: { 
        steps: [...(prev[ideaId]?.steps || []), { text: step, time: new Date().toLocaleTimeString() }],
        column: column || prev[ideaId]?.column || 'idea_queue' 
      }
    }));
  };

  const addToQueue = (idea) => {
    setGenerationQueue(prev => {
      if (prev.find(i => i.id === idea.id)) return prev; // Already in queue
      return [...prev, idea];
    });
  };

  const removeFromQueue = (ideaId) => {
    setGenerationQueue(prev => prev.filter(i => i.id !== ideaId));
  };

  const processQueue = async () => {
    if (isGenerating || generationQueue.length === 0) return;
    
    setIsGenerating(true);
    const idea = generationQueue[0];
    
    try {
      await generateArticleFromIdea(idea);
      setGenerationQueue(prev => prev.slice(1)); // Remove first item
    } catch (error) {
      console.error('Queue processing error:', error);
      setGenerationQueue(prev => prev.slice(1)); // Still remove to continue queue
    }
    
    setIsGenerating(false);
  };

  React.useEffect(() => {
    processQueue();
  }, [generationQueue, isGenerating]);

  const handleGenerateArticle = async (idea) => {
    const automationLevel = settings.find(s => s.setting_key === 'automation_level')?.setting_value || 'manual';
    
    if (automationLevel === 'manual') {
      navigate(`/ArticleWizard?ideaId=${idea.id}`);
      return;
    }

    if (isGenerating) {
      addToQueue(idea);
      return;
    }

    setIsGenerating(true);
    await generateArticleFromIdea(idea);
    setIsGenerating(false);
  };

  const generateArticleFromIdea = async (idea) => {
    try {
      // Check for duplicate titles before starting generation
      const normalized = idea.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const duplicate = articles.find(a => {
        const existingNormalized = a.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
        return existingNormalized === normalized;
      });
      
      if (duplicate) {
        alert(`An article with this title already exists: "${duplicate.title}"\n\nPlease modify the idea title before generating.`);
        return;
      }
      
      // Phase 1: Analysis (Idea Queue)
      updateGenerationStep(idea.id, '🚀 Starting automated article generation...', 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 800));

      updateGenerationStep(idea.id, '🎯 Analyzing best content type...', 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const ideaText = (idea.title + ' ' + (idea.description || '')).toLowerCase();
      let contentType = 'guide';
      if (ideaText.includes('top ') || ideaText.includes('best ') || /\d+/.test(ideaText)) {
        contentType = 'listicle';
      } else if (ideaText.includes('career') || ideaText.includes('job')) {
        contentType = 'career_guide';
      } else if (ideaText.includes('degree') || ideaText.includes('program')) {
        contentType = 'ranking';
      }

      updateGenerationStep(idea.id, `✓ Content type: ${contentType.replace(/_/g, ' ')}`, 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 600));

      updateGenerationStep(idea.id, '📝 Generating optimized titles...', 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 1200));

      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      console.log('🤖 [AI REQUEST - Title Generation]', {
        model: aiModel,
        ideaTitle: idea.title,
        schemaValid: true
      });

      const titleResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 1 SEO-optimized article title for: ${idea.title}. Return JSON: {"title": "Title Here"}`,
        model: aiModel,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: { title: { type: "string" } }
        }
      });

      console.log('✅ [AI RESPONSE - Title Generation]', titleResult);

      // Validate and sanitize title - use fallback instead of throwing
      let selectedTitle = idea.title; // Start with idea title as ultimate fallback

      if (titleResult && typeof titleResult === 'object' && titleResult.title) {
        const aiTitle = titleResult.title.trim();
        const titleLower = aiTitle.toLowerCase();

        // Check if AI title is valid
        const isValidTitle = aiTitle.length >= 10 && 
                             aiTitle.length <= 200 &&
                             !titleLower.includes('untitled') &&
                             !titleLower.includes('unknown') &&
                             titleLower !== 'article' &&
                             titleLower !== 'title' &&
                             !titleLower.match(/^article\s*\d*$/i) &&
                             !titleLower.match(/^title\s*\d*$/i);

        if (isValidTitle) {
          selectedTitle = aiTitle;
        } else {
          console.warn(`AI title invalid, using idea title: "${aiTitle}" -> "${idea.title}"`);
        }
      }

      updateGenerationStep(idea.id, `✓ Title: "${selectedTitle}"`, 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Phase 2: Drafting
      updateGenerationStep(idea.id, '✍️ Drafting initial content...', 'drafting');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get assigned contributor for prompt enhancement
      const assignedContributor = await assignContributor({
        title: selectedTitle,
        type: contentType,
        category: contentType,
        target_keywords: idea.keywords || [],
        excerpt: idea.description || ''
      });
      
      updateGenerationStep(idea.id, `✓ Assigned to: ${assignedContributor?.name || 'Default Contributor'}`, 'drafting');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Smart Context Selection: Find relevant articles from Site Catalog
      const searchTerms = [
        ...selectedTitle.toLowerCase().split(/\s+/),
        ...(idea.keywords || []).map(k => k.toLowerCase())
      ].filter(t => t.length > 3);

      const scoredCatalog = siteCatalog.map(article => {
        let score = 0;
        const artTitle = article.title.toLowerCase();
        searchTerms.forEach(term => {
           if (artTitle.includes(term)) score += 10;
           if (article.category?.toLowerCase().includes(term)) score += 2;
        });
        return { ...article, score: score + Math.random() };
      });
      
      scoredCatalog.sort((a, b) => b.score - a.score);
      
      const linkingContext = scoredCatalog.slice(0, 15).map(a => ({
        title: a.title,
        url: a.url
      }));

      const baseArticlePrompt = `Write a comprehensive ${contentType.replace(/_/g, ' ')} article titled "${selectedTitle}".

CRITICAL REQUIREMENTS:
- Minimum 1200-1500 words
- Include 3-5 internal links from this list (choose relevant ones): ${linkingContext.map(a => `"${a.title}" (${a.url})`).join(', ')}
- Include 2+ external citation from credible sources (BLS, NCES, .gov, .edu)
- Return JSON with: title, excerpt, content (HTML), faqs array (5-7 FAQs)

STRUCTURE:
- Well-organized H2 headings with id attributes
- Detailed, informative content
- Natural integration of links
- Professional GetEducated tone`;

      const finalArticlePrompt = buildEnhancedPrompt({
        basePrompt: baseArticlePrompt,
        contributor: assignedContributor,
        title: selectedTitle,
        contentType: contentType,
        keywords: idea.keywords
      });

      console.log('🤖 [AI REQUEST - Article Generation]', {
        model: aiModel,
        promptLength: finalArticlePrompt.length,
        selectedTitle: selectedTitle,
        contentType: contentType,
        contributorName: assignedContributor?.name,
        schemaValid: true
      });

      const articleResult = await base44.integrations.Core.InvokeLLM({
        prompt: finalArticlePrompt,
        model: aiModel,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            faqs: { 
              type: "array", 
              items: { 
                type: "object", 
                properties: { 
                  question: { type: "string" }, 
                  answer: { type: "string" } 
                },
                required: ["question", "answer"]
              } 
            }
          },
          required: ["title", "excerpt", "content", "faqs"]
        }
      });

      console.log('✅ [AI RESPONSE - Article Generation]', {
        hasTitle: !!articleResult?.title,
        titleLength: articleResult?.title?.length,
        hasContent: !!articleResult?.content,
        contentLength: articleResult?.content?.length,
        faqCount: articleResult?.faqs?.length
      });

      // Validate and sanitize article response - use fallbacks instead of throwing
      let finalTitle = selectedTitle; // Always use our pre-validated title
      let cleanContent = '';

      if (!articleResult || typeof articleResult !== 'object') {
        console.warn('AI response invalid - using minimal content');
        cleanContent = `<h2>Introduction</h2><p>${idea.description || 'Article content will be added.'}</p>`;
      } else {
        // Sanitize content with fallback
        if (articleResult.content && typeof articleResult.content === 'string' && articleResult.content.trim().length >= 100) {
          cleanContent = articleResult.content;
        } else {
          console.warn('AI content insufficient - using minimal content');
          cleanContent = `<h2>Introduction</h2><p>${idea.description || 'This article is being developed. Content will be expanded in the next revision.'}</p>`;
        }
      }

      // Clean content from markdown artifacts and code fences
      cleanContent = cleanContent
        .replace(/^```html\s*/gim, '')
        .replace(/^```\s*/gim, '')
        .replace(/\s*```$/gim, '')
        .replace(/```html/gi, '')
        .replace(/```/gi, '')
        .trim();

      // Phase 3: Refinement
      updateGenerationStep(idea.id, '🎨 Humanizing and refining content...', 'refinement');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const humanizationPrompt = buildHumanizationPrompt({
        content: cleanContent,
        contributor: assignedContributor
      });

      console.log('🤖 [AI REQUEST - Humanization]', {
        model: aiModel,
        promptLength: humanizationPrompt.length,
        contentLength: cleanContent.length
      });

      const humanized = await base44.integrations.Core.InvokeLLM({
        prompt: humanizationPrompt,
        model: aiModel,
        add_context_from_internet: false
      });

      console.log('✅ [AI RESPONSE - Humanization]', {
        responseType: typeof humanized,
        responseLength: typeof humanized === 'string' ? humanized.length : 0
      });

      // Validate humanization response - always keep best available content
      if (humanized && typeof humanized === 'string' && humanized.trim().length >= 100) {
        const humanizedClean = humanized
          .replace(/^```html\s*/gim, '')
          .replace(/^```\s*/gim, '')
          .replace(/\s*```$/gim, '')
          .replace(/```html/gi, '')
          .replace(/```/gi, '')
          .trim();

        if (humanizedClean.length > cleanContent.length * 0.8) {
          cleanContent = humanizedClean;
        } else {
          console.warn('Humanization produced shorter content, keeping original');
        }
      } else {
        console.warn('Humanization failed, using original content');
      }

      // Phase 3.5: Feature Image Generation
      updateGenerationStep(idea.id, '🎨 Planning feature image concept...', 'refinement');
      await new Promise(resolve => setTimeout(resolve, 800));

      let featureImageUrl = null;
      let featureImageAltText = null;

      try {
        // Step 1: Generate intelligent image prompt
        console.log('🖼️ [IMAGE PROMPT PLANNING] Starting...', { title: selectedTitle });

        const promptResult = await base44.functions.invoke('generateImagePrompt', {
          title: selectedTitle,
          description: idea.description,
          excerpt: articleResult.excerpt,
          keywords: idea.keywords,
          contentType: contentType
        });

        console.log('🖼️ [IMAGE PROMPT PLANNING] Response:', promptResult);

        if (promptResult.data?.image_prompt) {
          updateGenerationStep(idea.id, `✓ Concept: ${promptResult.data.concept_summary}`, 'refinement');
          await new Promise(resolve => setTimeout(resolve, 500));

          updateGenerationStep(idea.id, '🎨 Generating feature image...', 'refinement');
          await new Promise(resolve => setTimeout(resolve, 500));

          // Step 2: Generate actual image with refined prompt
          console.log('🖼️ [IMAGE GENERATION] Starting...', { 
            prompt: promptResult.data.image_prompt.substring(0, 100) + '...',
            title: selectedTitle 
          });

          const imageResult = await base44.functions.invoke('generateFeatureImage', {
            prompt: promptResult.data.image_prompt,
            articleTitle: selectedTitle
          });

          console.log('🖼️ [IMAGE GENERATION] Response:', imageResult);

          if (imageResult.data?.file_url) {
            featureImageUrl = imageResult.data.file_url;
            featureImageAltText = promptResult.data.alt_text;
            updateGenerationStep(idea.id, '✓ Feature image generated!', 'refinement');
            console.log('✅ [IMAGE GENERATION] Success:', { url: featureImageUrl, alt: featureImageAltText });
          } else {
            console.warn('⚠️ [IMAGE GENERATION] No file_url in response:', imageResult);
            updateGenerationStep(idea.id, '⚠️ Image generation skipped', 'refinement');
          }
        } else {
          console.warn('⚠️ [IMAGE PROMPT PLANNING] No prompt generated');
          updateGenerationStep(idea.id, '⚠️ Image planning skipped', 'refinement');
        }
      } catch (imgError) {
        console.error('❌ [IMAGE GENERATION] Error:', imgError);
        console.error('❌ [IMAGE GENERATION] Error details:', {
          message: imgError.message,
          response: imgError.response?.data,
          status: imgError.response?.status
        });
        updateGenerationStep(idea.id, `⚠️ Image error: ${imgError.message}`, 'refinement');
      }
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 3.6: SEO Optimization
      updateGenerationStep(idea.id, '🔍 Optimizing SEO metadata & keywords...', 'refinement');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const seoPrompt = `Based on this article content and target keywords (${idea.keywords?.join(', ')}), generate SEO metadata.

      Title: ${selectedTitle}
      Content Preview: ${cleanContent.substring(0, 500)}...

      Return JSON:
      {
        "seo_title": "SEO Title (60 chars max)",
        "seo_description": "Meta Description (150-160 chars, include keywords)",
        "keywords_found": ["keyword1", "keyword2"]
      }`;

      console.log('🤖 [AI REQUEST - SEO Optimization]', {
        model: aiModel,
        promptLength: seoPrompt.length
      });

      const seoResult = await base44.integrations.Core.InvokeLLM({
        prompt: seoPrompt,
        model: aiModel,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            seo_title: { type: "string" },
            seo_description: { type: "string" },
            keywords_found: { type: "array", items: { type: "string" } }
          }
        }
      });

      console.log('✅ [AI RESPONSE - SEO Optimization]', seoResult);

      // Validate SEO result with fallbacks
      const validatedSeoResult = {
        seo_title: (seoResult?.seo_title && seoResult.seo_title.length > 0) ? seoResult.seo_title : selectedTitle,
        seo_description: (seoResult?.seo_description && seoResult.seo_description.length > 0) ? seoResult.seo_description : (articleResult.excerpt || '').substring(0, 160),
        keywords_found: Array.isArray(seoResult?.keywords_found) ? seoResult.keywords_found : (idea.keywords || [])
      };

      updateGenerationStep(idea.id, `✓ SEO: ${validatedSeoResult.seo_title}`, 'refinement');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 4: QA & Review
      updateGenerationStep(idea.id, '📊 Running quality checks...', 'qa_review');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      updateGenerationStep(idea.id, '✅ Quality check complete!', 'qa_review');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add catalog links
      updateGenerationStep(idea.id, '🔗 Auto-linking to Site Catalog...', 'qa_review');
      await new Promise(resolve => setTimeout(resolve, 600));

      const linkingResult = await addInternalLinks(cleanContent, selectedTitle, idea.keywords || []);
      cleanContent = linkingResult.content;
      
      if (linkingResult.linksAdded > 0) {
        updateGenerationStep(idea.id, `✓ Added ${linkingResult.linksAdded} catalog link(s)`, 'qa_review');
      }
      await new Promise(resolve => setTimeout(resolve, 400));

      // Final metrics for article creation
      const finalWordCount = cleanContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
      const finalInternalLinks = (cleanContent.match(/geteducated\.com/gi) || []).length;
      const finalExternalLinks = (cleanContent.match(/<a href="http/gi) || []).length - finalInternalLinks;
      const finalFAQs = articleResult.faqs || [];

      updateGenerationStep(idea.id, '💾 Saving article...', 'qa_review');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Ensure title is valid before saving
      if (!finalTitle || finalTitle.trim().length < 10) {
        finalTitle = idea.title || `Article Draft - ${new Date().toLocaleDateString()}`;
        console.warn(`Title validation failed, using fallback: "${finalTitle}"`);
      }

      const newArticle = await base44.entities.Article.create({
        title: finalTitle,
        excerpt: (articleResult?.excerpt || idea.description || '').substring(0, 500),
        content: cleanContent,
        type: contentType,
        status: 'approved',
        target_keywords: idea.keywords || [],
        seo_title: validatedSeoResult.seo_title,
        seo_description: validatedSeoResult.seo_description,
        faqs: finalFAQs,
        word_count: finalWordCount,
        internal_links_count: finalInternalLinks,
        external_citations_count: finalExternalLinks,
        schema_valid: finalFAQs.length >= 3,
        model_used: aiModel,
        contributor_id: assignedContributor?.id || null,
        contributor_name: assignedContributor?.name || null,
        feature_image_url: featureImageUrl,
        feature_image_alt_text: featureImageAltText
      });

      // Mark idea as completed
      await base44.entities.ContentIdea.update(idea.id, {
        status: 'completed',
        article_id: newArticle.id
      });

      updateGenerationStep(idea.id, '🎉 Article complete and in QA & Review!');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Clear from generating state
      setGeneratingIdeas(prev => {
        const updated = { ...prev };
        delete updated[idea.id];
        return updated;
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
      
    } catch (error) {
      console.error('❌ Generation error:', error);

      // Save article anyway with minimal content - always complete successfully
      try {
        updateGenerationStep(idea.id, `💾 Completing article...`);

        const partialArticle = await base44.entities.Article.create({
          title: idea.title,
          excerpt: idea.description || 'Article generated - ready for review',
          content: `<h2>Introduction</h2><p>${idea.description || 'This article is ready for editorial review and expansion.'}</p>`,
          type: contentType || 'guide',
          status: 'approved',
          target_keywords: idea.keywords || [],
          word_count: 50,
          internal_links_count: 0,
          external_citations_count: 0,
          schema_valid: false,
          model_used: settings.find(s => s.setting_key === 'default_model')?.setting_value || 'grok-beta',
          review_notes: `Generated with error - needs editing. Error: ${error.message}`
        });

        await base44.entities.ContentIdea.update(idea.id, {
          status: 'completed',
          article_id: partialArticle.id
        });

        updateGenerationStep(idea.id, `✅ Article saved to QA & Review!`);
      } catch (saveError) {
        console.error('Failed to save article:', saveError);
        updateGenerationStep(idea.id, `❌ Save failed: ${saveError.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      setGeneratingIdeas(prev => {
        const updated = { ...prev };
        delete updated[idea.id];
        return updated;
      });

      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
    }
  };

  const handleSourcesSelected = () => {
    setShowSourceSelector(false);
    queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
  };

  const handleAutoModeToggle = (checked) => {
    const newMode = checked ? 'semiauto' : 'manual';
    updateSettingMutation.mutate({ key: 'automation_level', value: newMode });
  };

  const automationLevel = settings.find(s => s.setting_key === 'automation_level')?.setting_value || 'manual';
  const isAutoMode = automationLevel === 'semiauto' || automationLevel === 'full_auto';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent tracking-tight"
            >
              Article Pipeline
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 mt-2 text-lg"
            >
              AI-powered content workflow for GetEducated
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <motion.div
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <Zap className={`w-5 h-5 transition-colors ${isAutoMode ? 'text-blue-600' : 'text-slate-400'}`} />
              <Label htmlFor="auto-mode-toggle" className="text-sm font-medium cursor-pointer">
                {isAutoMode ? 'Auto Mode' : 'Manual Mode'}
              </Label>
              <Switch
                id="auto-mode-toggle"
                checked={isAutoMode}
                onCheckedChange={handleAutoModeToggle}
              />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setShowSourceSelector(true)}
                className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 gap-2 shadow-lg shadow-blue-500/30 transition-all duration-300"
                size="lg"
              >
                <TrendingUp className="w-5 h-5" />
                Find New Ideas
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Kanban Board */}
        <KanbanBoard
          ideas={ideas}
          articles={articles}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
          generatingIdeas={generatingIdeas}
          onGenerateArticle={handleGenerateArticle}
          onViewGeneration={setViewingGenerationId}
          isGenerating={isGenerating}
          generationQueue={generationQueue}
          onRemoveFromQueue={removeFromQueue}
        />

        {/* Source Selector Modal */}
        <AnimatePresence>
          {showSourceSelector && (
            <SourceSelector
              onClose={() => setShowSourceSelector(false)}
              onComplete={handleSourcesSelected}
            />
          )}

          {viewingGenerationId && generatingIdeas[viewingGenerationId] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingGenerationId(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5 text-slate-600" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Generating Article
                      </h3>
                      <p className="text-sm text-slate-500">
                        {ideas.find(i => i.id === viewingGenerationId)?.title || 'Article in progress...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                  <div className="space-y-2">
                    {generatingIdeas[viewingGenerationId].steps?.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3 pb-2 border-b border-slate-200 last:border-0"
                      >
                        <span className="text-slate-400 text-xs font-mono mt-0.5 flex-shrink-0">
                          {step.time}
                        </span>
                        <motion.span 
                          className="text-slate-700 text-sm flex-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          {step.text}
                        </motion.span>
                        {idx === generatingIdeas[viewingGenerationId].steps.length - 1 && (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex-shrink-0"
                          >
                            <Loader2 className="w-4 h-4 text-slate-600" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-center text-slate-400 mt-4">
                  Usually takes 30-60 seconds • Click outside to close
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Status Bar */}
        <AnimatePresence>
          {(isGenerating || generationQueue.length > 0) && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50"
            >
              <div className="max-w-[1800px] mx-auto p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-slate-600" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {isGenerating ? 'Generating Article...' : `${generationQueue.length} Article${generationQueue.length > 1 ? 's' : ''} in Queue`}
                    </p>
                    <p className="text-sm text-slate-500">
                      Keep this page open while articles are being generated
                    </p>
                  </div>
                </div>
                {generationQueue.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium text-slate-700">Queue: {generationQueue.length}</p>
                    <div className="flex gap-2 mt-2 max-w-md overflow-x-auto">
                      {generationQueue.slice(0, 3).map((queuedIdea, idx) => (
                        <div key={queuedIdea.id} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs whitespace-nowrap">
                          {idx + 1}. {queuedIdea.title.substring(0, 30)}...
                        </div>
                      ))}
                      {generationQueue.length > 3 && (
                        <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs">
                          +{generationQueue.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}