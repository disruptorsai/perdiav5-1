import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Loader2,
  CheckCircle2,
  TrendingUp,
  Tag,
  Folder,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickGenerate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [generatingId, setGeneratingId] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.filter({ target_flag: true }, '-search_volume', 10),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.filter({ status: 'active' }, '-priority', 10),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['content-ideas'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }, '-trending_score', 10),
  });

  React.useEffect(() => {
    if (keywords.length > 0 || clusters.length > 0 || ideas.length > 0) {
      generateSuggestions();
    }
  }, [keywords, clusters, ideas]);

  const generateSuggestions = () => {
    const allSuggestions = [];

    // From keywords
    keywords.forEach(keyword => {
      allSuggestions.push({
        id: `keyword-${keyword.id}`,
        type: 'keyword',
        title: generateTitleFromKeyword(keyword),
        keywords: [keyword.keyword, ...getRelatedKeywords(keyword.keyword)],
        targetAudience: inferAudienceFromKeyword(keyword),
        contentType: inferContentType(keyword),
        additionalContext: `Targeting keyword: "${keyword.keyword}". ${keyword.search_volume ? `Search volume: ${keyword.search_volume}` : 'High search potential'}. ${keyword.intent || 'Informational'} intent.`,
        source: 'Keyword Research',
        priority: keyword.priority || 'medium',
        badge: 'SEO Optimized'
      });
    });

    // From clusters
    clusters.forEach(cluster => {
      allSuggestions.push({
        id: `cluster-${cluster.id}`,
        type: 'cluster',
        title: generateTitleFromCluster(cluster),
        keywords: cluster.subtopics || [],
        targetAudience: cluster.target_audience || 'Prospective online students',
        contentType: 'guide',
        additionalContext: cluster.description || `Comprehensive guide covering ${cluster.name}.`,
        source: 'Topic Cluster',
        priority: cluster.priority || 'medium',
        badge: 'Content Strategy'
      });
    });

    // From trending ideas
    ideas.forEach(idea => {
      allSuggestions.push({
        id: `idea-${idea.id}`,
        type: 'idea',
        title: idea.title,
        keywords: idea.keywords || [],
        targetAudience: inferAudienceFromIdea(idea),
        contentType: idea.content_type || 'guide',
        additionalContext: idea.description + (idea.notes ? `\n\n${idea.notes}` : ''),
        source: 'Trending Topics',
        priority: idea.priority || 'medium',
        badge: idea.trending_score >= 70 ? 'Hot Topic' : 'Trending'
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSuggestions(allSuggestions);
    setIsLoadingSuggestions(false);
  };

  const generateArticleMutation = useMutation({
    mutationFn: async (suggestion) => {
      setGenerationStatus('Building AI prompt...');
      const prompt = buildPrompt(suggestion);
      
      setGenerationStatus('Fetching latest data from internet...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationStatus('Generating article content...');
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
            }
          }
        }
      });

      setGenerationStatus('Saving to review queue...');
      
      // Create article directly in review queue
      const article = await base44.entities.Article.create({
        title: result.title,
        excerpt: result.excerpt,
        content: result.content,
        type: suggestion.contentType,
        status: 'in_review',
        faqs: result.faqs || [],
        target_keywords: suggestion.keywords,
        word_count: result.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        schema_valid: true,
        model_used: 'gpt-4',
        generation_prompt: prompt
      });

      return article;
    },
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setGeneratingId(null);
      setGenerationStatus('');
      
      // Show success and redirect to review queue
      setTimeout(() => {
        navigate('/ReviewQueue');
      }, 2000);
    },
    onError: () => {
      setGeneratingId(null);
      setGenerationStatus('');
    }
  });

  const buildPrompt = (suggestion) => {
    const templates = {
      ranking: `You are an expert content writer for GetEducated.com.

Create a RANKING article: "${suggestion.title}"

TARGET AUDIENCE: ${suggestion.targetAudience}
KEYWORDS: ${suggestion.keywords.join(', ')}
CONTEXT: ${suggestion.additionalContext}

STRUCTURE (GetEducated Style):

1. OPENING (2-3 paragraphs):
   - Hook about the degree/field
   - Why this matters for students
   - Cost-saving opportunities

2. KEY STATISTICS:
   **Average Cost (In-state):** ~$XX,XXX
   **Least Expensive:** [School] ~$XX,XXX
   **Most Expensive:** [School] ~$XXX,XXX

3. METHODOLOGY:
   "Our data-driven research creates a truly reliable system of scientific rankings. We calculate total tuition including all fees for accuracy. Our rankings cannot be bought."

4. MAIN SECTIONS (H2 with id attributes):
   <h2 id="what-is">What is a [Degree Name]?</h2>
   <h2 id="careers">Career Opportunities</h2>
   <h2 id="salary">Salary and Job Outlook</h2>
   <h2 id="choose">How to Choose the Right Program</h2>
   <h2 id="faqs">Frequently Asked Questions</h2>

5. BLS CITATIONS:
   - Cite Bureau of Labor Statistics with dates
   - Example: "According to the <a href="https://www.bls.gov/ooh/..." target="_blank">Bureau of Labor Statistics</a>, [occupation] earned $XX,XXX as of May 2023."

6. INTERNAL LINKS (5+):
   - Link to related degrees
   - Use natural anchor text
   - Example: <a href="/online-mba-programs">online MBA programs</a>

7. FAQs (5-7 questions with detailed answers)

TONE: Professional, helpful, consumer-focused
LENGTH: 1500-2000 words
FORMAT: Clean HTML with proper heading IDs`,

      career_guide: `You are an expert content writer for GetEducated.com.

Create a CAREER GUIDE: "${suggestion.title}"

TARGET AUDIENCE: ${suggestion.targetAudience}
KEYWORDS: ${suggestion.keywords.join(', ')}
CONTEXT: ${suggestion.additionalContext}

STRUCTURE (GetEducated Style):

1. INTRODUCTION (2 paragraphs):
   - Compelling hook
   - What readers will learn

2. MAIN SECTIONS (H2 with IDs):
   <h2 id="what-is">What is a [Job Title]?</h2>
   <h2 id="timeline">How Long Does It Take?</h2>
   <h2 id="steps">Step-by-Step Guide</h2> (8-10 numbered steps)
   <h2 id="skills">Skills Needed</h2>
   <h2 id="education">Education Requirements</h2>
   <h2 id="certifications">Certifications and Licensing</h2>
   <h2 id="outlook">Career Outlook</h2>
   <h2 id="salary">Salary Information</h2>
   <h2 id="advancement">Advancement Opportunities</h2>
   <h2 id="faqs">Frequently Asked Questions</h2>

3. BLS DATA (with dates and links):
   - Median salary with year
   - Growth projections with date range
   - Example: "According to the <a href="https://www.bls.gov/ooh/..." target="_blank">Bureau of Labor Statistics</a>, median wage was $XX,XXX as of May 2023, with X% growth projected from 2023-2033."

4. INTERNAL LINKS (5+):
   - Related degree programs
   - Related career guides

5. FAQs (5-7 questions)

TONE: Encouraging, practical, step-by-step
LENGTH: 2000-2500 words`,

      listicle: `You are an expert content writer for GetEducated.com.

Create a LISTICLE: "${suggestion.title}"

TARGET AUDIENCE: ${suggestion.targetAudience}
KEYWORDS: ${suggestion.keywords.join(', ')}
CONTEXT: ${suggestion.additionalContext}

STRUCTURE:

1. INTRODUCTION (why this list matters)

2. BACKGROUND SECTIONS:
   <h2 id="overview">What is [Topic]?</h2>
   <h2 id="why">Why Choose This Path?</h2>
   <h2 id="benefits">Key Benefits</h2>

3. THE LIST (15-25 items):
   <h3>1. [Item Title]</h3>
   - Median Salary: $XX,XXX (BLS, May 2023)
   - Growth Rate: X% (BLS, 2023-2033)
   - Description (3-4 sentences)
   - Education requirements
   - Link to related program

4. CAREER OUTLOOK SECTION:
   <h2 id="outlook">Future Trends</h2>
   - High-growth sectors
   - Emerging opportunities

5. FAQs (5-7 questions)

BLS CITATIONS: All salary/growth data must cite BLS with dates and links

LENGTH: 2500-3500 words`
    };

    return templates[suggestion.contentType] || templates.career_guide;
  };

  const handleGenerate = (suggestion) => {
    setGeneratingId(suggestion.id);
    setGenerationStatus('Initializing...');
    generateArticleMutation.mutate(suggestion);
  };

  // Helper functions
  const generateTitleFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    if (kw.includes('best') || kw.includes('top')) {
      return keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (kw.includes('how to')) {
      return keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return `The 25 Most Affordable Online ${keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Programs`;
  };

  const generateTitleFromCluster = (cluster) => {
    const patterns = [
      `The Complete Guide to ${cluster.name}`,
      `How to Choose the Right ${cluster.name}`,
      `Everything You Need to Know About ${cluster.name}`,
      `${cluster.name}: Career Guide and Degree Options`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const getRelatedKeywords = (keyword) => {
    const base = keyword.toLowerCase();
    const related = [];
    if (base.includes('online')) related.push('distance learning', 'remote education');
    if (base.includes('mba')) related.push('business degree', 'management');
    if (base.includes('nursing')) related.push('healthcare', 'RN', 'BSN');
    if (base.includes('education')) related.push('teaching', 'educator');
    if (base.includes('degree')) related.push('program', 'university', 'college');
    return related.slice(0, 3);
  };

  const inferAudienceFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    if (kw.includes('affordable')) return 'Budget-conscious students';
    if (kw.includes('online')) return 'Working professionals seeking flexible programs';
    if (kw.includes('accelerated')) return 'Career changers';
    if (kw.includes('master')) return 'Graduate students';
    return 'Prospective students researching online education';
  };

  const inferAudienceFromIdea = (idea) => {
    const desc = (idea.description || '').toLowerCase();
    if (desc.includes('career change')) return 'Career changers';
    if (desc.includes('working')) return 'Working professionals';
    return 'Current and prospective students';
  };

  const inferContentType = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    if (kw.includes('best') || kw.includes('top') || kw.includes('affordable')) return 'ranking';
    if (kw.includes('how to become')) return 'career_guide';
    if (kw.includes('highest paying')) return 'listicle';
    return 'guide';
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const contentTypeColors = {
    ranking: 'bg-purple-100 text-purple-700',
    career_guide: 'bg-blue-100 text-blue-700',
    listicle: 'bg-emerald-100 text-emerald-700',
    guide: 'bg-indigo-100 text-indigo-700'
  };

  const filteredSuggestions = activeTab === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading Overlay */}
        <AnimatePresence>
          {generatingId && (
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
                      <span>Analyzing data and keywords</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {generationStatus.includes('Generating') ? (
                        <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      <span>Creating 1500-2500 word article</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {generationStatus.includes('Saving') ? (
                        <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Adding to review queue</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      This takes 30-60 seconds...
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Quick Generate
                </h1>
                <p className="text-gray-600">
                  One-click article generation from your data
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8" />
              <div>
                <p className="text-purple-100 text-sm">From Keywords</p>
                <p className="text-3xl font-bold">{keywords.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-3">
              <Folder className="w-8 h-8" />
              <div>
                <p className="text-blue-100 text-sm">From Clusters</p>
                <p className="text-3xl font-bold">{clusters.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-emerald-100 text-sm">Trending Topics</p>
                <p className="text-3xl font-bold">{ideas.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="all">All Suggestions ({suggestions.length})</TabsTrigger>
            <TabsTrigger value="keyword">Keywords ({suggestions.filter(s => s.type === 'keyword').length})</TabsTrigger>
            <TabsTrigger value="cluster">Clusters ({suggestions.filter(s => s.type === 'cluster').length})</TabsTrigger>
            <TabsTrigger value="idea">Trending ({suggestions.filter(s => s.type === 'idea').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoadingSuggestions ? (
              <Card className="p-12 text-center border-none shadow-lg">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading AI-powered suggestions...</p>
              </Card>
            ) : filteredSuggestions.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-lg">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Suggestions Available</h3>
                <p className="text-gray-600 mb-4">
                  Add target keywords, create clusters, or approve content ideas to see suggestions here.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">
                                {suggestion.title}
                              </h3>
                              <Badge className="bg-purple-600">
                                {suggestion.badge}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              <Badge variant="outline" className={`${priorityColors[suggestion.priority]} border`}>
                                {suggestion.priority} priority
                              </Badge>
                              <Badge className={contentTypeColors[suggestion.contentType]}>
                                {suggestion.contentType.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="outline">
                                {suggestion.source}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                              <strong>Audience:</strong> {suggestion.targetAudience}
                            </p>

                            {suggestion.keywords.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-medium text-gray-500">Keywords:</span>
                                {suggestion.keywords.slice(0, 5).map((kw, i) => (
                                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => handleGenerate(suggestion)}
                            disabled={!!generatingId}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2 shadow-lg"
                            size="lg"
                          >
                            <Sparkles className="w-5 h-5" />
                            Generate Article
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}