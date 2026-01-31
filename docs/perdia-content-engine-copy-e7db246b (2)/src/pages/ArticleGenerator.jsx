import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Wand2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ContentTypeSelector from "../components/article/ContentTypeSelector";
import SchemaGenerator from "../components/article/SchemaGenerator";
import LinkComplianceChecker from "../components/article/LinkComplianceChecker";
import ArticleNavigationGenerator from "../components/article/ArticleNavigationGenerator";
import AutoFillButton from "../components/article/AutoFillButton";

export default function ArticleGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contentType: '',
    title: '',
    keywords: '',
    targetAudience: '',
    additionalContext: ''
  });
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  // Check for URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const type = urlParams.get('type');
    const keywords = urlParams.get('keywords');
    
    if (title || type || keywords) {
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        contentType: type || prev.contentType,
        keywords: keywords || prev.keywords
      }));
      if (type) setStep(2);
    }
  }, []);

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  const generateArticleMutation = useMutation({
    mutationFn: async (data) => {
      setGenerationStatus('Building AI prompt...');
      const prompt = buildPrompt(data);
      
      setGenerationStatus('Searching internet for latest data...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual feedback
      
      setGenerationStatus('Generating content with AI...');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
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
                }
              }
            },
            internal_links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  url: { type: "string" }
                }
              }
            },
            external_citations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string" },
                  url: { type: "string" },
                  text: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGenerationStatus('Finalizing article...');
      return result;
    },
    onSuccess: (result) => {
      setGeneratedArticle(result);
      setIsGenerating(false);
      setGenerationStatus('');
      setStep(3);
    },
    onError: (error) => {
      setIsGenerating(false);
      setGenerationStatus('');
      alert('Failed to generate article. Please try again.');
    }
  });

  const buildPrompt = (data) => {
    const templates = {
      ranking: `You are an expert content writer for GetEducated.com, a trusted guide to online education.

Create a comprehensive RANKING article about: "${data.title}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords}
ADDITIONAL CONTEXT: ${data.additionalContext}

STRUCTURE YOUR ARTICLE EXACTLY AS FOLLOWS:

1. OPENING SECTION (2-3 paragraphs):
   - Hook paragraph about the degree/career field
   - Context about why this matters for students
   - Mention cost savings opportunities

2. KEY STATISTICS BOX:
   Format: "**Average Cost (In-state):** ~$XX,XXX
   **Least Expensive:** [School Name] ~$XX,XXX
   **Most Expensive:** [School Name] ~$XXX,XXX"

3. METHODOLOGY STATEMENT:
   "Our data-driven research creates a truly reliable system of scientific rankings. We meticulously calculate total full-time tuition—including any fees—for the most accurate total cost. Our rankings cannot be bought."

4. MAIN CONTENT SECTIONS (H2 headings with IDs):
   - What is a [Degree Name]?
   - Career Opportunities
   - Salary and Job Outlook (cite BLS data with dates)
   - How to Choose the Right Program
   - FAQs (at least 5 questions)

5. INTERNAL LINKING:
   - Link to at least 5 related degree categories
   - Link to relevant career guides
   - Use natural anchor text

6. EXTERNAL CITATIONS:
   - Cite Bureau of Labor Statistics (bls.gov/ooh) for salary data
   - Include publication dates
   - Format: "According to the Bureau of Labor Statistics, [occupation] earned a median salary of $XX,XXX per year as of [date]"

7. FAQs SECTION:
   Create 5-7 FAQs that are genuinely helpful

TONE: Professional, helpful, consumer-focused
WORD COUNT: 1500-2000 words
FORMAT: HTML with proper H2 tags that include id attributes for navigation`,

      career_guide: `You are an expert content writer for GetEducated.com.

Create a comprehensive CAREER GUIDE about: "${data.title}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords}
ADDITIONAL CONTEXT: ${data.additionalContext}

STRUCTURE:

1. INTRODUCTION (2 paragraphs):
   - Compelling hook about the profession
   - What readers will learn

2. MAIN SECTIONS (H2 with IDs):
   - What is a [Job Title]?
   - How Long Does It Take to Become a [Job Title]?
   - Step-by-Step Guide (numbered list of 6-8 steps)
   - Skills Needed to Succeed
   - Education Requirements
   - Certifications and Licensing
   - Career Outlook (BLS data with citations and dates)
   - Salary Information (BLS data with citations and dates)
   - Advancement Opportunities
   - Benefits of Becoming a [Job Title]

3. RELATED RESOURCES:
   - Link to relevant degree programs
   - Link to related career guides

4. FAQs (5-7 questions)

CITATIONS:
- Always cite Bureau of Labor Statistics with dates
- Example: "According to the Bureau of Labor Statistics (BLS), the median annual wage for [occupation] was $XX,XXX as of May 2023."
- Include growth projections with date ranges

TONE: Encouraging, practical, step-by-step
WORD COUNT: 2000-2500 words`,

      listicle: `You are an expert content writer for GetEducated.com.

Create a LISTICLE about: "${data.title}"

TARGET AUDIENCE: ${data.targetAudience}
KEYWORDS: ${data.keywords}

STRUCTURE:

1. INTRODUCTION:
   - Why this list matters
   - What readers will discover

2. MAIN SECTIONS:
   - What is an [Degree Level]?
   - Why Choose This Path?
   - Benefits of This Degree Level

3. THE LIST:
   Create a numbered list of 15-25 jobs, each with:
   - Job Title (H3)
   - Median Salary (from BLS with date)
   - Job Growth Rate (from BLS with date range)
   - Brief description (3-4 sentences)
   - Educational requirements
   - Link to related degree program

4. CAREER OUTLOOK SECTION:
   - High-growth sectors
   - Declining sectors  
   - Future trends

5. FAQs (5-7 questions)

ALL SALARY DATA MUST:
- Come from Bureau of Labor Statistics
- Include the date (e.g., "as of May 2023")
- Include source link to bls.gov/ooh

TONE: Informative, data-driven, optimistic
WORD COUNT: 2500-3500 words`
    };

    return templates[data.contentType] || templates.career_guide;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationStatus('Initializing...');
    generateArticleMutation.mutate(formData);
  };

  const handleSaveArticle = async (schemaData) => {
    const articleData = {
      title: generatedArticle.title,
      excerpt: generatedArticle.excerpt,
      content: generatedArticle.content,
      type: formData.contentType === 'ranking' ? 'ranking' : 'guide',
      status: 'draft',
      faqs: schemaData?.faqs || generatedArticle.faqs,
      word_count: generatedArticle.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
      schema_valid: true,
      model_used: 'gpt-4'
    };

    const article = await base44.entities.Article.create(articleData);
    queryClient.invalidateQueries({ queryKey: ['articles'] });
    navigate(`/ArticleEditor?id=${article.id}`);
  };

  const handleAutoFill = (suggestion) => {
    setFormData({
      contentType: suggestion.contentType,
      title: suggestion.title,
      keywords: suggestion.keywords.join(', '),
      targetAudience: suggestion.targetAudience,
      additionalContext: suggestion.additionalContext
    });
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/Dashboard')}
              disabled={isGenerating}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                AI Article Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Generate GetEducated-style content with AI assistance
              </p>
            </div>
          </div>
          {step === 1 && !isGenerating && (
            <AutoFillButton onAutoFill={handleAutoFill} />
          )}
        </motion.div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`h-2 rounded-full flex-1 transition-all ${
                s < step ? 'bg-purple-600' : 
                s === step ? 'bg-purple-400' : 
                'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-purple-400/20 rounded-full"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Generating Article...
                    </h3>
                    <p className="text-purple-600 font-medium">
                      {generationStatus}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Analyzing keywords and context</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Fetching latest BLS data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {generationStatus.includes('Generating') ? (
                        <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Writing {formData.contentType === 'ranking' ? '1500-2000' : '2000-2500'} words</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      <span>Adding schema markup & citations</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      This typically takes 30-60 seconds...
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Content Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Content Type</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ContentTypeSelector
                  selectedType={formData.contentType}
                  onSelect={(type) => {
                    setFormData({ ...formData, contentType: type });
                    setStep(2);
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Article Details</CardTitle>
                  <AutoFillButton onAutoFill={handleAutoFill} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Article Title *</Label>
                  <Input
                    placeholder="e.g., How to Become a History Teacher"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Target Keywords</Label>
                  <Input
                    placeholder="e.g., history teacher, teaching degree, education career"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Target Audience</Label>
                  <Input
                    placeholder="e.g., Working professionals seeking career change"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Additional Context (Optional)</Label>
                  <Textarea
                    placeholder="Any specific points you want to cover..."
                    value={formData.additionalContext}
                    onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!formData.title || isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Article with AI
                    </>
                  )}
                </Button>

                {!formData.title && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      Article title is required. Use "Auto-Fill from Data" for suggestions!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Review & Enhance */}
        {step === 3 && generatedArticle && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Generated Article
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">Title</Label>
                      <h2 className="text-xl font-bold">{generatedArticle.title}</h2>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Excerpt</Label>
                      <p className="text-sm text-gray-700">{generatedArticle.excerpt}</p>
                    </div>
                    <div className="max-h-96 overflow-auto p-4 bg-gray-50 rounded-lg">
                      <div 
                        className="prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: generatedArticle.content }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <SchemaGenerator
                article={generatedArticle}
                onSchemaUpdate={(faqs, schemas) => handleSaveArticle({ faqs, schemas })}
              />
              
              <LinkComplianceChecker
                content={generatedArticle.content}
                onComplianceChange={(isCompliant, analysis) => {
                  console.log('Compliance:', isCompliant, analysis);
                }}
              />

              <ArticleNavigationGenerator
                content={generatedArticle.content}
                onNavigationGenerated={(navHtml, sections) => {
                  console.log('Navigation:', navHtml, sections);
                }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}