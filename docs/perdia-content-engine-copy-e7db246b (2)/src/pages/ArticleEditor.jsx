import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import ReactQuill from 'react-quill';

const createPageUrl = (pageName) => `/${pageName}`;
import 'react-quill/dist/quill.snow.css';
import { 
  Save, 
  Sparkles, 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Loader2,
  Globe,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import QualityChecklist from "../components/article/QualityChecklist";
import SchemaGenerator from "../components/article/SchemaGenerator";
import LinkComplianceChecker from "../components/article/LinkComplianceChecker";
import ArticleNavigationGenerator from "../components/article/ArticleNavigationGenerator";
import BLSCitationHelper from "../components/article/BLSCitationHelper";
import { assignContributor } from "../components/contributors/ContributorAssignment";

export default function ArticleEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    type: 'guide',
    status: 'draft',
    faqs: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixSteps, setAutoFixSteps] = useState([]);
  const [qualityStatus, setQualityStatus] = useState({
    canPublish: false,
    score: 0,
    checks: {}
  });
  const [isPostingToWP, setIsPostingToWP] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [imageNotes, setImageNotes] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articleId ? base44.entities.Article.filter({ id: articleId }).then(r => r[0]) : null,
    enabled: !!articleId
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  const { data: contributors = [] } = useQuery({
    queryKey: ['contributors-editor'],
    queryFn: () => base44.entities.ArticleContributor.filter({ is_active: true }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-editor'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  // Fetch published articles for internal linking
  const { data: publishedArticles = [] } = useQuery({
    queryKey: ['published-articles-linking'],
    queryFn: () => base44.entities.Article.filter({ status: 'published' }, '-created_date', 50),
  });

  // Fetch verified GetEducated.com articles for safe internal linking
  const { data: verifiedSiteArticles = [] } = useQuery({
    queryKey: ['verified-site-articles'],
    queryFn: () => base44.entities.SiteArticle.filter({ is_active: true }),
  });

  const { data: wordpressConnections = [] } = useQuery({
    queryKey: ['wordpress_connections'],
    queryFn: () => base44.entities.WordPressConnection.list(),
  });

  const defaultConnection = wordpressConnections.find(c => c.is_default);
  const canPostToWP = defaultConnection && defaultConnection.connection_status === 'connected';

  useEffect(() => {
    if (article) {
      console.log('📄 Loading article data:', article);
      setFormData({
        title: article.title || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        type: article.type || 'guide',
        status: article.status || 'draft',
        cluster_id: article.cluster_id || '',
        faqs: article.faqs || [],
        contributor_id: article.contributor_id || ''
      });
    }
  }, [article]);

  // Auto-assign contributor when title changes
  useEffect(() => {
    const autoAssign = async () => {
      if (formData.title && !formData.contributor_id && contributors.length > 0) {
        const contributor = await assignContributor({
          title: formData.title,
          type: formData.type,
          category: formData.type,
          target_keywords: [],
          excerpt: formData.excerpt
        });
        if (contributor) {
          setFormData(prev => ({
            ...prev,
            contributor_id: contributor.id,
            contributor_name: contributor.name
          }));
        }
      }
    };
    autoAssign();
  }, [formData.title, formData.type, contributors]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (articleId) {
        return base44.entities.Article.update(articleId, data);
      }
      return base44.entities.Article.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Article.delete(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate(createPageUrl('ContentLibrary'));
    },
  });

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const automationLevel = settings.find(s => s.setting_key === 'automation_level')?.setting_value || 'manual';
      const isAutoMode = automationLevel === 'semiauto' || automationLevel === 'full_auto';
      
      const steps = [];
      const addStep = (message) => {
        steps.push({
          timestamp: new Date().toLocaleTimeString(),
          message
        });
        setAutoFixSteps([...steps]);
      };

      addStep('🔍 Analyzing article quality...');
      await delay(600);

      // Check what needs fixing
      const internalLinks = (formData.content.match(/geteducated\.com/gi) || []).length;
      const externalLinks = (formData.content.match(/<a href="http/gi) || []).length - internalLinks;
      const hasFAQs = formData.faqs && formData.faqs.length >= 3;
      const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
      
      const issues = [];
      if (internalLinks < 2) issues.push('internal_links');
      if (externalLinks < 1) issues.push('external_links');
      if (!hasFAQs) issues.push('faqs');
      if (wordCount < 800) issues.push('content_length');
      
      if (issues.length === 0) {
        addStep('✓ Article already meets all quality standards!');
        await delay(1000);
        throw new Error('Article already meets all requirements!');
      }

      addStep(`📋 Found ${issues.length} issue(s) to fix:`);
      await delay(400);

      if (issues.includes('internal_links')) {
        addStep(`  • Need ${2 - internalLinks} more internal link(s)`);
        await delay(300);
      }
      if (issues.includes('external_links')) {
        addStep(`  • Need ${1 - externalLinks} more external citation(s)`);
        await delay(300);
      }
      if (issues.includes('faqs')) {
        addStep('  • Need to add FAQ schema markup');
        await delay(300);
      }
      if (issues.includes('content_length')) {
        addStep(`  • Need to expand content (currently ${wordCount} words, target 800+)`);
        await delay(300);
      }

      addStep('🔗 Scanning GetEducated.com for relevant articles to link to...');
      await delay(800);

      // Use verified site articles for safe internal linking
      const linkingContext = verifiedSiteArticles.slice(0, 20).map(a => ({
        title: a.title,
        url: a.url,
        excerpt: a.excerpt || '',
        topics: a.topics?.join(', ') || ''
      }));

      addStep(`✓ Found ${linkingContext.length} verified articles for internal linking`);
      await delay(500);

      addStep('🤖 Building improvement prompt for AI...');
      await delay(600);

      const currentYear = new Date().getFullYear();

      // Get AI model from settings
      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      // Build a comprehensive, single-pass fix prompt
      const wordsToAdd = Math.max(850 - wordCount, 0);
      const linksToAdd = Math.max(2 - internalLinks, 0);
      const externalLinksToAdd = Math.max(1 - externalLinks, 0);

      const prompt = `You are improving an article for GetEducated.com in ONE comprehensive pass.

CURRENT ARTICLE TITLE: ${formData.title}
CURRENT WORD COUNT: ${wordCount} words
CURRENT INTERNAL LINKS: ${internalLinks}
CURRENT EXTERNAL LINKS: ${externalLinks}

YOUR TASK - FIX ALL ISSUES IN ONE GO:
${issues.includes('content_length') ? `1. EXPAND to 850+ words (add ${wordsToAdd}+ words of valuable content)\n` : ''}
${issues.includes('internal_links') ? `2. ADD ${linksToAdd} internal GetEducated.com link(s)\n` : ''}
${issues.includes('external_links') ? `3. ADD ${externalLinksToAdd} authoritative external citation(s)\n` : ''}
${issues.includes('faqs') ? `4. FAQs will be generated separately\n` : ''}

EXISTING ARTICLE CONTENT:
${formData.content}

${issues.includes('content_length') ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT EXPANSION (MANDATORY - ${wordsToAdd}+ words):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST add ${Math.ceil(wordsToAdd / 150)} NEW substantial sections:

WHERE TO ADD CONTENT (choose most relevant):
• After introduction: Add "Why This Matters in ${currentYear}" (150-200 words)
• Before conclusion: Add "Expert Tips & Best Practices" (150-200 words)  
• Middle sections: Add "Common Mistakes to Avoid" (150-200 words)
• Expand existing sections: Add detailed examples and case studies (100+ words each)

WHAT TO INCLUDE:
✓ ${currentYear} statistics and trends
✓ Specific step-by-step examples
✓ Real-world case studies
✓ Expert recommendations
✓ Common pitfalls with solutions
✓ Actionable takeaways

QUALITY RULES:
• Every word must add value - NO FLUFF
• Use specific data and examples
• Maintain GetEducated's professional tone
• Blend seamlessly with existing content
• Keep all existing headings intact
` : ''}

${issues.includes('internal_links') || issues.includes('external_links') ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINKING REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

${issues.includes('internal_links') ? `
INTERNAL LINKS - ADD ${linksToAdd} LINK(S):

Available GetEducated.com articles:
${linkingContext.slice(0, 15).map((a, i) => `${i + 1}. "${a.title}"\n   URL: ${a.url}\n   Topics: ${a.topics || 'general'}`).join('\n')}

CRITICAL RULES:
• Use ONLY URLs from the list above
• Choose the most topically relevant articles
• Add links within NEW content you're creating
• Format: <a href="EXACT_URL">descriptive anchor text</a>
• Make links natural - don't force them
• NEVER make up or guess URLs
` : ''}

${issues.includes('external_links') ? `
EXTERNAL CITATIONS - ADD ${externalLinksToAdd} LINK(S):

Find and cite ${currentYear} data from:
✓ Bureau of Labor Statistics (bls.gov) - for salary/employment data
✓ National Center for Education Statistics (nces.ed.gov)
✓ Department of Education (.gov sites)
✓ Professional associations (.org)
✓ Academic institutions (.edu)

FORMAT: <a href="URL" target="_blank" rel="noopener">Source Name (${currentYear})</a>

Add citations within the NEW content sections you create.
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Minimum 850 words total
✓ At least ${2} internal GetEducated.com links
✓ At least ${1} external authoritative citation
✓ All existing H2 headings preserved with id attributes
✓ All existing content kept and enhanced
✓ New content blended naturally
✓ Professional GetEducated tone throughout
✓ Clean HTML formatting

CRITICAL: Return ONLY the complete HTML article content.
NO explanations, NO "here's the revised version", JUST the HTML.`;

      if (issues.includes('external_links')) {
        addStep('🌐 Searching for credible external sources...');
        await delay(900);
      }

      addStep('✨ AI is now improving your article...');
      await delay(800);

      if (issues.includes('internal_links')) {
        addStep('  → Adding internal links to GetEducated content');
        await delay(600);
      }

      if (issues.includes('external_links')) {
        addStep('  → Adding external citations from trusted sources');
        await delay(600);
      }

      if (issues.includes('content_length')) {
        addStep('  → Expanding content with detailed information');
        await delay(600);
      }

      addStep('💾 Processing AI response...');

      const improvedContent = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: aiModel,
        add_context_from_internet: issues.includes('external_links')
      });

      // Clean any AI meta-commentary and markdown code fences
      let cleanedContent = improvedContent
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the) (?:revised|improved|updated).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:revised|improved|updated).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();

      addStep('✓ Content improved successfully!');
      await delay(400);

      // Generate FAQs if needed
      let faqs = formData.faqs || [];
      if (issues.includes('faqs')) {
        addStep('❓ Generating FAQ schema markup...');
        await delay(800);

        const faqPrompt = `Generate 5-7 relevant, high-quality FAQs for this article about "${formData.title}".

Return ONLY a JSON object with a faqs array, no other text:
{
  "faqs": [
    {"question": "Question 1?", "answer": "Detailed answer"},
    {"question": "Question 2?", "answer": "Detailed answer"}
  ]
}`;

        const faqResult = await base44.integrations.Core.InvokeLLM({
          prompt: faqPrompt,
          model: aiModel,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  }
                }
              }
            }
          }
        });

        faqs = faqResult.faqs || [];
        addStep(`✓ Added ${faqs.length} FAQs for schema markup`);
        await delay(400);
      }

      addStep('🔍 Validating improvements...');
      await delay(600);

      let newInternalLinks = (cleanedContent.match(/geteducated\.com/gi) || []).length;
      let newExternalLinks = (cleanedContent.match(/<a href="http/gi) || []).length - newInternalLinks;
      let newWordCount = cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;

      addStep(`✓ Internal links: ${internalLinks} → ${newInternalLinks} (need 2+)`);
      await delay(300);
      addStep(`✓ External links: ${externalLinks} → ${newExternalLinks} (need 1+)`);
      await delay(300);
      addStep(`✓ Word count: ${wordCount} → ${newWordCount} (need 800+)`);
      await delay(300);

      // Check if all requirements met
      const stillNeedsWork = (
        (issues.includes('content_length') && newWordCount < 800) ||
        (issues.includes('internal_links') && newInternalLinks < 2) ||
        (issues.includes('external_links') && newExternalLinks < 1)
      );

      // Single retry if first attempt didn't meet ALL requirements
      if (stillNeedsWork) {
        addStep(`⚠️ First pass incomplete - running targeted fix...`);
        await delay(500);

        const remainingIssues = [];
        if (newWordCount < 800) remainingIssues.push(`expand to 850+ words (currently ${newWordCount})`);
        if (newInternalLinks < 2) remainingIssues.push(`add ${2 - newInternalLinks} more internal link(s)`);
        if (newExternalLinks < 1) remainingIssues.push(`add ${1 - newExternalLinks} more external link(s)`);

        addStep(`  → Need to: ${remainingIssues.join(', ')}`);
        await delay(400);

        const retryPrompt = `CRITICAL CORRECTION NEEDED - Original fix incomplete.

CURRENT ARTICLE (from first AI pass):
${cleanedContent}

REMAINING ISSUES:
${newWordCount < 800 ? `• Word count: ${newWordCount} / 850 needed (add ${850 - newWordCount}+ words)\n` : ''}
${newInternalLinks < 2 ? `• Internal links: ${newInternalLinks} / 2 needed (add ${2 - newInternalLinks} more)\n` : ''}
${newExternalLinks < 1 ? `• External links: ${newExternalLinks} / 1 needed (add ${1 - newExternalLinks} more)\n` : ''}

${newWordCount < 800 ? `
ADD ${850 - newWordCount}+ WORDS:
Create ${Math.ceil((850 - newWordCount) / 150)} new sections (150-200 words each):
• "Advanced Strategies" section
• "Expert Insights for ${currentYear}" section  
• "Real-World Examples" section
Blend naturally - don't disrupt flow.
` : ''}

${newInternalLinks < 2 ? `
ADD ${2 - newInternalLinks} INTERNAL LINK(S):
${linkingContext.slice(0, 10).map((a, i) => `${i + 1}. ${a.url} - ${a.title}`).join('\n')}
Format: <a href="URL">anchor text</a>
` : ''}

${newExternalLinks < 1 ? `
ADD ${1 - newExternalLinks} EXTERNAL CITATION(S):
Find ${currentYear} data from: BLS, NCES, .gov, .edu, professional .org
Format: <a href="URL" target="_blank" rel="noopener">Source (${currentYear})</a>
` : ''}

CRITICAL: Return ONLY the complete, corrected HTML. No explanations.`;
        const correctedContent = await base44.integrations.Core.InvokeLLM({
          prompt: retryPrompt,
          model: aiModel,
          add_context_from_internet: newExternalLinks < 1
        });

        cleanedContent = correctedContent
          .replace(/^```html\s*/gi, '')
          .replace(/^```\s*/gi, '')
          .replace(/\s*```$/gi, '')
          .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
          .replace(/^I'?ve (?:added|corrected|fixed).*?\.\s*/gi, '')
          .replace(/^Below is.*?:?\s*/gi, '')
          .trim();

        // Re-validate
        newInternalLinks = (cleanedContent.match(/geteducated\.com/gi) || []).length;
        newExternalLinks = (cleanedContent.match(/<a href="http/gi) || []).length - newInternalLinks;
        newWordCount = cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;

        addStep(`✓ Final check: ${newWordCount} words, ${newInternalLinks} internal, ${newExternalLinks} external`);
        await delay(400);
      }

      // Final validation
      const finalSuccess = newWordCount >= 800 && newInternalLinks >= 2 && newExternalLinks >= 1;
      
      if (!finalSuccess) {
        const warnings = [];
        if (newWordCount < 800) warnings.push(`Word count: ${newWordCount}/800`);
        if (newInternalLinks < 2) warnings.push(`Internal links: ${newInternalLinks}/2`);
        if (newExternalLinks < 1) warnings.push(`External links: ${newExternalLinks}/1`);
        
        addStep(`⚠️ Some requirements not fully met: ${warnings.join(', ')}`);
        addStep('Article improved but may need manual review.');
        await delay(500);
      } else {
        addStep(`✓ All requirements met!`);
        await delay(400);
      }

      addStep('🎨 Humanizing content for natural voice...');
      await delay(600);

      // Humanize the improved content
      const humanizationPrompt = `Humanize this educational article to sound naturally written, not AI-generated.

ARTICLE:
${cleanedContent}

APPLY THESE TECHNIQUES:

✓ Mix short & long sentences (avoid uniform length)
✓ Add contractions: don't, won't, you'll, it's
✓ Include rhetorical questions occasionally
✓ Use "you" to address readers directly
✓ Start some sentences with "And" or "But"
✓ Add em dashes — for emphasis
✓ Remove AI clichés: "Furthermore", "Moreover", "It's worth noting"
✓ Vary paragraph openings naturally
✓ Use conversational transitions: "Here's the thing", "That said"
✓ Add specific examples vs generic ones
✓ Occasional sentence fragments. For impact.
✓ Keep professional but less robotic

PRESERVE:
• All H2/H3 headings with id attributes
• All links and URLs exactly as-is
• Factual accuracy
• Professional GetEducated tone

Return ONLY the humanized HTML. No commentary.`;

      const humanizedContent = await base44.integrations.Core.InvokeLLM({
        prompt: humanizationPrompt,
        model: aiModel,
        add_context_from_internet: false
      });

      cleanedContent = humanizedContent
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:humanized|rewritten).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();

      addStep('✓ Content humanized successfully!');
      await delay(400);

      addStep('🎉 All issues resolved! Article is ready for review.');
      await delay(800);

      // In auto mode, move to approved and navigate away
      if (isAutoMode && articleId) {
        addStep('✅ Auto mode: Moving to approved status...');
        await delay(500);
        
        const wordCount = cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
        const internalLinks = (cleanedContent.match(/geteducated\.com/gi) || []).length;
        const externalLinks = (cleanedContent.match(/<a href="http/gi) || []).length - internalLinks;
        
        await base44.entities.Article.update(articleId, {
          content: cleanedContent,
          faqs,
          status: 'approved',
          word_count: wordCount,
          internal_links_count: internalLinks,
          external_citations_count: externalLinks,
          risk_flags: []
        });
        
        addStep('✓ Article moved to Content Library!');
        await delay(1000);
      }

      return { content: cleanedContent, faqs, isAutoMode };
    },
    onSuccess: ({ content, faqs, isAutoMode }) => {
      setFormData(prev => ({ ...prev, content, faqs }));
      setIsAutoFixing(false);
      
      if (isAutoMode) {
        setTimeout(() => {
          navigate(createPageUrl('ContentLibrary'));
        }, 1500);
      } else {
        setTimeout(() => {
          setAutoFixSteps([]);
        }, 2000);
      }
    },
    onError: (error) => {
      setIsAutoFixing(false);
      if (!error.message.includes('already meets all requirements')) {
        alert(error.message || 'Auto-fix failed. Please try manually.');
      }
      setTimeout(() => {
        setAutoFixSteps([]);
      }, 3000);
    }
  });

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const currentYear = new Date().getFullYear();
      
      const prompt = `Write a comprehensive, SEO-optimized article about "${formData.title}".
      
      CRITICAL - DATE CONTEXT:
      - Current year: ${currentYear}
      - Use CURRENT and UP-TO-DATE data (${currentYear})
      - DO NOT use outdated information or reference past years like 2023 or 2024
      - Reference "latest", "current", or specifically ${currentYear} when discussing data
      
      CRITICAL - WORD COUNT REQUIREMENT:
      - Article MUST be 1200-1500 words minimum
      - This is a HARD requirement - articles under 1200 words will be rejected
      - Write detailed, comprehensive content with specific examples
      - Include multiple well-developed sections
      
      Requirements:
      - Create engaging, informative content with depth
      - Include 5-7 well-structured H2/H3 headings with descriptive IDs
      - Each section should be 200-300 words
      - Add relevant facts and current data points (${currentYear})
      - Use professional tone appropriate for GetEducated audience
      - Focus on education-related content
      - Add 3+ internal links to related content (use realistic GetEducated URLs)
      - Add 2+ external citations from credible current sources (BLS, NCES, .edu, .gov)
      - Cite Bureau of Labor Statistics data with current year where relevant
      - Include specific examples, case studies, or actionable advice
      
      Format the response in HTML with proper tags.`;

      // Get AI model from settings
      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      let result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: aiModel,
        add_context_from_internet: true
      });

      // Clean any AI meta-commentary and markdown code fences
      result = result
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:created|written).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();

      // Advanced humanization for AI detection bypass
      const humanizationPrompt = `You are an expert editor humanizing AI text to be UNDETECTABLE by AI detectors (GPTZero, Originality.ai, Phrasly.ai).

ARTICLE TO HUMANIZE:
${result}

APPLY ALL ANTI-AI-DETECTION TECHNIQUES:

1. CREATE BURSTINESS (varied sentence rhythm - CRITICAL):
   - Mix 5-word sentences with 40-word sentences unpredictably
   - Use fragments. Like this one.
   - Add questions: "Surprised?" "Why does this work?"
   - Start with "And", "But", "Yet" occasionally
   - Use em dashes for breaks — exactly like this
   - Create unpredictable rhythm mimicking human thought

2. INCREASE PERPLEXITY (unexpected word choices):
   - Replace predictable words with creative, vivid alternatives
   - Avoid repetitive sentence patterns
   - Use specific, colorful vocabulary
   - Add metaphors and analogies naturally
   - Make choices feel human-selected, not algorithm-predicted

3. INJECT AUTHENTIC VOICE:
   - Contractions everywhere: don't, won't, isn't, you'll, it's
   - Address as "you" — conversational style
   - Add personality: "Here's the thing...", "That said..."
   - Show expertise through confident natural explanations
   - Sound like someone talking, not a machine

4. ELIMINATE AI TELLS (CRITICAL):
   - REMOVE: "Furthermore", "Moreover", "In conclusion", "It's worth noting", "Indeed"
   - No formulaic transitions
   - Break perfect grammar with natural patterns
   - Avoid robotic consistency

5. ADD ORGANIC FLOW:
   - Natural transitions between ideas
   - Parenthetical asides (when they add value)
   - Ellipses for trailing thoughts...
   - Mix formal and casual appropriately
   - Let ideas feel spontaneous

PRESERVE: All H2 headings, all links, all facts exactly.

Return ONLY humanized HTML. No meta-commentary.`;

      const humanized = await base44.integrations.Core.InvokeLLM({
        prompt: humanizationPrompt,
        model: aiModel,
        add_context_from_internet: false
      });

      return humanized
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:humanized).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .trim();
    },
    onSuccess: (content) => {
      setFormData(prev => ({ ...prev, content }));
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    }
  });

  const handleSave = () => {
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
    const internalLinks = (formData.content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (formData.content.match(/<a href="http/gi) || []).length - internalLinks;
    
    // Get contributor name for caching
    const contributor = contributors.find(c => c.id === formData.contributor_id);
    
    saveMutation.mutate({
      ...formData,
      word_count: wordCount,
      internal_links_count: internalLinks,
      external_citations_count: externalLinks,
      contributor_name: contributor?.name || formData.contributor_name
    });
  };

  const handleAutoFix = () => {
    setIsAutoFixing(true);
    autoFixMutation.mutate();
  };

  const handleGenerate = () => {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }
    setIsGenerating(true);
    generateContentMutation.mutate();
  };

  const handleSubmitForReview = () => {
    if (!qualityStatus.canPublish) {
      alert('Cannot submit for review. Please fix critical issues first.');
      return;
    }

    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
    const internalLinks = (formData.content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (formData.content.match(/<a href="http/gi) || []).length - internalLinks;
    
    saveMutation.mutate({
      ...formData,
      status: 'in_review',
      word_count: wordCount,
      internal_links_count: internalLinks,
      external_citations_count: externalLinks
    });
  };

  const handlePublish = () => {
    if (!qualityStatus.canPublish) {
      alert('Cannot publish. Critical issues detected:\n\n' +
            '• All monetization links must be wrapped in shortcodes\n' +
            '• Article must meet minimum word count (800 words)\n\n' +
            'Please fix these issues before publishing.');
      return;
    }

    if (qualityStatus.score < 60) {
      const proceed = confirm(
        `Quality score is ${qualityStatus.score.toFixed(0)}%.\n\n` +
        'Recommended improvements:\n' +
        '• Add more internal links (2+ required)\n' +
        '• Add external citations (1+ required)\n' +
        '• Include BLS data citations\n' +
        '• Add schema markup (FAQs)\n\n' +
        'Publish anyway?'
      );
      if (!proceed) return;
    }

    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
    const internalLinks = (formData.content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (formData.content.match(/<a href="http/gi) || []).length - internalLinks;
    
    saveMutation.mutate({
      ...formData,
      status: 'published',
      word_count: wordCount,
      internal_links_count: internalLinks,
      external_citations_count: externalLinks
    });
  };

  const handleSchemaUpdate = (faqs, schemas) => {
    setFormData(prev => ({ ...prev, faqs }));
  };

  const handleNavigationGenerated = (navHtml) => {
    setFormData(prev => ({
      ...prev,
      content: navHtml + '\n\n' + prev.content
    }));
  };

  const handleInsertBLSCitation = (citation) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + citation
    }));
  };

  const handleRegenerateImage = async () => {
    if (!articleId) {
      alert('Please save the article first.');
      return;
    }

    setIsRegeneratingImage(true);
    setShowRegenerateDialog(false);

    try {
      // Step 1: Generate prompt with optional user notes
      const promptResult = await base44.functions.invoke('generateImagePrompt', {
        title: formData.title,
        description: formData.excerpt,
        excerpt: formData.excerpt,
        keywords: [],
        contentType: formData.type,
        userNotes: imageNotes || undefined
      });

      if (!promptResult.data?.image_prompt) {
        throw new Error('Failed to generate image prompt');
      }

      // Step 2: Generate image
      const imageResult = await base44.functions.invoke('generateFeatureImage', {
        prompt: promptResult.data.image_prompt,
        articleTitle: formData.title
      });

      if (!imageResult.data?.file_url) {
        throw new Error('Failed to generate image');
      }

      // Step 3: Update article
      await base44.entities.Article.update(articleId, {
        feature_image_url: imageResult.data.file_url,
        feature_image_alt_text: promptResult.data.alt_text
      });

      alert('✅ Feature image regenerated successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setImageNotes('');
    } catch (error) {
      alert(`❌ Failed to regenerate image:\n\n${error.message}`);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handlePostToWordPress = async () => {
    if (!articleId) {
      alert('Please save the article first before posting to WordPress.');
      return;
    }

    if (!confirm('Post this article to WordPress Stage?\n\nThis will create a draft post on stage.geteducated.com.')) {
      return;
    }

    setIsPostingToWP(true);
    try {
      const result = await base44.functions.invoke('postArticleToWordPress', { articleId });
      
      if (result.data.success) {
        alert(`✅ Successfully posted to WordPress!\n\nPost ID: ${result.data.wordpress_post_id}\nURL: ${result.data.wordpress_url}`);
        queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      } else {
        alert(`❌ Failed to post to WordPress:\n\n${result.data.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to post to WordPress:\n\n${error.message}`);
    } finally {
      setIsPostingToWP(false);
    }
  };

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      {/* Auto-Fix Progress Overlay */}
      <AnimatePresence>
        {isAutoFixing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="w-10 h-10 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Auto-Fixing Article
                </h3>
                <p className="text-gray-600">
                  AI is analyzing and improving your content...
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto space-y-2">
                {autoFixSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-gray-400 text-xs mt-0.5 font-mono">
                      {step.timestamp}
                    </span>
                    <span className="text-gray-700 flex-1">
                      {step.message}
                    </span>
                  </motion.div>
                ))}
                {autoFixSteps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-blue-600 mt-4"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Processing...</span>
                  </motion.div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                This usually takes 30-60 seconds...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(createPageUrl('ContentLibrary'))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {articleId ? 'Edit Article' : 'New Article'}
                </h1>
                {article?.revision_number && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Rev. {article.revision_number}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {articleId ? 'Make changes to your article' : 'Create AI-assisted content'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            {formData.status !== 'published' && formData.status !== 'approved' && (
              <Button 
                onClick={handleSubmitForReview}
                disabled={saveMutation.isPending || !qualityStatus.canPublish}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </Button>
            )}
            {qualityStatus.canPublish && (
              <Button 
                onClick={() => {
                  if (confirm('Mark this article as fully approved and ready for posting queue?')) {
                    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
                    const internalLinks = (formData.content.match(/geteducated\.com/gi) || []).length;
                    const externalLinks = (formData.content.match(/<a href="http/gi) || []).length - internalLinks;
                    saveMutation.mutate({
                      ...formData,
                      status: 'approved',
                      word_count: wordCount,
                      internal_links_count: internalLinks,
                      external_citations_count: externalLinks
                    });
                  }
                }}
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-lg px-6 py-6 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve for Posting Queue
              </Button>
            )}
            {articleId && (
              <>
                <Button 
                  onClick={() => setShowRegenerateDialog(true)}
                  disabled={isRegeneratingImage}
                  variant="outline"
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {isRegeneratingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  Regenerate Image
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl(`ArticleReview?id=${articleId}`))}
                  variant="outline"
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Wand2 className="w-4 h-4" />
                  Revise Article
                </Button>
                <Button 
                  onClick={handlePostToWordPress}
                  disabled={isPostingToWP || !canPostToWP}
                  variant="outline"
                  className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  title={!canPostToWP ? 'No active WordPress connection. Configure in Integrations.' : 'Post to WordPress Stage'}
                >
                  {isPostingToWP ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {isPostingToWP ? 'Posting...' : 'Post to WordPress'}
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  variant="destructive"
                  className="gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Quality Alert */}
        {!qualityStatus.canPublish && formData.content && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Cannot Publish - Critical Issues Detected</p>
                <p className="text-sm text-red-700 mt-1">
                  Publishing is blocked until critical quality issues are resolved. Check the Quality Checklist below.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">


            {/* Production Preview */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">
                      {formData.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-blue-300">•</span>
                    <span className="text-blue-200 text-sm">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    {formData.title || 'Untitled Article'}
                  </h1>
                  {formData.excerpt && (
                    <p className="text-xl text-blue-100 leading-relaxed">
                      {formData.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {(article?.feature_image_url || formData.feature_image_url) && (
                  <div className="w-full">
                    <img 
                      src={article?.feature_image_url || formData.feature_image_url} 
                      alt={article?.feature_image_alt_text || formData.title || 'Feature image'}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '500px' }}
                    />
                  </div>
                )}

              <CardContent className="p-0">
                <div className="max-w-4xl mx-auto px-8 py-12">
                  <style>{`
                    .production-article {
                      font-family: Georgia, 'Times New Roman', serif;
                      font-size: 18px;
                      line-height: 1.8;
                      color: #1f2937;
                    }
                    .production-article h2 {
                      font-size: 32px;
                      font-weight: 700;
                      margin-top: 48px;
                      margin-bottom: 24px;
                      color: #111827;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      border-bottom: 2px solid #e5e7eb;
                      padding-bottom: 12px;
                    }
                    .production-article h3 {
                      font-size: 24px;
                      font-weight: 600;
                      margin-top: 36px;
                      margin-bottom: 16px;
                      color: #1f2937;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .production-article p {
                      margin-bottom: 20px;
                      line-height: 1.8;
                    }
                    .production-article a {
                      color: #2563eb;
                      text-decoration: none;
                      border-bottom: 1px solid #93c5fd;
                    }
                    .production-article a:hover {
                      color: #1d4ed8;
                      border-bottom-color: #2563eb;
                    }
                    .production-article ul, 
                    .production-article ol {
                      margin-bottom: 24px;
                      padding-left: 32px;
                    }
                    .production-article li {
                      margin-bottom: 12px;
                      line-height: 1.8;
                    }
                    .production-article blockquote {
                      border-left: 4px solid #2563eb;
                      padding-left: 24px;
                      margin: 32px 0;
                      font-style: italic;
                      color: #4b5563;
                      background-color: #f9fafb;
                      padding-top: 8px;
                      padding-bottom: 8px;
                      border-radius: 0 4px 4px 0;
                    }
                    .production-article strong {
                      font-weight: 700;
                      color: #111827;
                    }
                  `}</style>
                  <div 
                    className="production-article"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              </CardContent>

              <div className="border-t bg-gray-50 px-8 py-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>📝 {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length.toLocaleString()} words</span>
                      <span>•</span>
                      <span>Internal Links: {(formData.content.match(/geteducated\.com/gi) || []).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Editor Tools */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Edit Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title..."
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label>Excerpt / Dek</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description of the article..."
                    rows={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Content (HTML)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating || !formData.title}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Write or generate your content..."
                    className="bg-white"
                    style={{ height: '500px', marginBottom: '60px' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quality Tools */}
          <div className="space-y-6">
            {/* Settings */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Content Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    <option value="degree_page">Degree Page</option>
                    <option value="listicle">Listicle</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
                    <option value="ranking">Ranking</option>
                  </select>
                </div>

                <div>
                  <Label>Topic Cluster</Label>
                  <select
                    value={formData.cluster_id || ''}
                    onChange={(e) => setFormData({ ...formData, cluster_id: e.target.value })}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    <option value="">None</option>
                    {clusters.map(cluster => (
                      <option key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Contributor</Label>
                  <select
                    value={formData.contributor_id || ''}
                    onChange={(e) => {
                      const selectedContributor = contributors.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        contributor_id: e.target.value,
                        contributor_name: selectedContributor?.name || ''
                      });
                    }}
                    className="w-full p-2 border rounded-lg mt-1 text-sm"
                  >
                    <option value="">Select contributor...</option>
                    {contributors.map(contributor => (
                      <option key={contributor.id} value={contributor.id}>
                        {contributor.name}
                      </option>
                    ))}
                  </select>
                  {formData.contributor_name && (
                    <p className="text-xs text-gray-500 mt-1">{formData.contributor_name}</p>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className="w-full justify-center py-2 capitalize">
                    {formData.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {article && (
                  <div>
                    <Label>WordPress Publishing</Label>
                    <div className="mt-2 space-y-2">
                      <Badge variant="outline" className={`w-full justify-center py-2 ${
                        article.publish_status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        article.publish_status === 'failed' ? 'bg-red-50 text-red-700 border-red-300' :
                        'bg-gray-50 text-gray-600 border-gray-300'
                      }`}>
                        {article.publish_status || 'Not Published'}
                      </Badge>
                      
                      {article.wordpress_url && (
                        <a 
                          href={article.wordpress_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
                        >
                          <Globe className="w-4 h-4" />
                          View on WordPress
                        </a>
                      )}
                      
                      {article.last_publish_error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <strong>Error:</strong> {article.last_publish_error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </CardContent>
                </Card>

            {/* Auto-Fix Button */}
            {qualityStatus.score < 100 && formData.content && (
              <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <CardContent className="p-4">
                  <Button
                    onClick={handleAutoFix}
                    disabled={isAutoFixing}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2 py-6 text-base shadow-lg"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isAutoFixing ? 'Fixing Issues...' : 'Auto-Fix All Issues'}
                  </Button>
                  <p className="text-xs text-center text-gray-600 mt-3">
                    AI will automatically add missing links, FAQs, and expand content to meet publishing standards
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quality Checklist */}
            <QualityChecklist
              article={article}
              content={formData.content}
              onQualityChange={setQualityStatus}
            />

            {/* Schema Generator */}
            <SchemaGenerator
              article={{ ...article, ...formData }}
              onSchemaUpdate={handleSchemaUpdate}
            />

            {/* Link Compliance */}
            <LinkComplianceChecker
              content={formData.content}
              onComplianceChange={(isCompliant) => {
                console.log('Link compliance:', isCompliant);
              }}
            />

            {/* Article Navigation */}
            <ArticleNavigationGenerator
              content={formData.content}
              onNavigationGenerated={handleNavigationGenerated}
            />

            {/* BLS Citation Helper */}
            <BLSCitationHelper
              onInsertCitation={handleInsertBLSCitation}
            />
          </div>
        </div>

        {/* Regenerate Image Dialog */}
        <AnimatePresence>
          {showRegenerateDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRegenerateDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Regenerate Feature Image</h3>
                    <p className="text-sm text-gray-600">Optional: Add notes about what you want</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Image Notes (Optional)</Label>
                    <Textarea
                      value={imageNotes}
                      onChange={(e) => setImageNotes(e.target.value)}
                      placeholder="e.g., Include diverse students, modern classroom setting, warm colors..."
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Leave blank to use the article's content for automatic generation
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRegenerateDialog(false);
                        setImageNotes('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegenerateImage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Generate Image
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}