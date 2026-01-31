import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Tag, 
  Folder, 
  TrendingUp, 
  Newspaper,
  Plus,
  Loader2
} from "lucide-react";

export default function IdeaSelection({ keywords, clusters, contentIdeas, onSelect }) {
  const [activeTab, setActiveTab] = useState("smart");
  const [customIdea, setCustomIdea] = useState({
    title: '',
    keywords: '',
    targetAudience: '',
    additionalContext: ''
  });
  const [newsIdeas, setNewsIdeas] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    generateSuggestions();
    fetchNewsIdeas();
  }, [keywords, clusters, contentIdeas]);

  const generateSuggestions = () => {
    const allSuggestions = [];

    // From keywords
    keywords.forEach(keyword => {
      allSuggestions.push({
        id: `keyword-${keyword.id}`,
        type: 'keyword',
        title: generateTitleFromKeyword(keyword),
        description: `High-volume keyword targeting "${keyword.keyword}"`,
        keywords: [keyword.keyword, ...getRelatedKeywords(keyword.keyword)],
        targetAudience: inferAudienceFromKeyword(keyword),
        additionalContext: `Search volume: ${keyword.search_volume || 'High'}. Intent: ${keyword.intent || 'Informational'}.`,
        source: 'Keyword Research',
        priority: keyword.priority || 'medium',
        badge: 'SEO Optimized',
        badgeColor: 'bg-blue-600'
      });
    });

    // From clusters
    clusters.forEach(cluster => {
      allSuggestions.push({
        id: `cluster-${cluster.id}`,
        type: 'cluster',
        title: generateTitleFromCluster(cluster),
        description: cluster.description || `Part of "${cluster.name}" content cluster`,
        keywords: cluster.subtopics || [],
        targetAudience: cluster.target_audience || 'Prospective online students',
        additionalContext: `Cluster priority: ${cluster.priority}. ${cluster.article_count || 0} articles already published.`,
        source: 'Content Strategy',
        priority: cluster.priority || 'medium',
        badge: 'Strategic',
        badgeColor: 'bg-emerald-600'
      });
    });

    // From trending ideas
    contentIdeas.forEach(idea => {
      allSuggestions.push({
        id: `idea-${idea.id}`,
        type: 'idea',
        title: idea.title,
        description: idea.description,
        keywords: idea.keywords || [],
        targetAudience: 'Current and prospective students',
        additionalContext: idea.notes || '',
        source: 'Trending Topics',
        priority: idea.priority || 'medium',
        badge: idea.trending_score >= 70 ? 'Hot Topic' : 'Trending',
        badgeColor: idea.trending_score >= 70 ? 'bg-red-600' : 'bg-orange-600'
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSuggestions(allSuggestions);
  };

  const fetchNewsIdeas = async () => {
    setLoadingNews(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 trending, newsworthy topics related to online education, career development, or higher education from the past 7 days.

For each topic, provide:
- title: A compelling article title
- description: Brief explanation
- keywords: Array of 3-5 relevant keywords
- reason: Why this is timely and relevant

Focus on: policy changes, new programs, industry trends, salary reports, job market shifts.`,
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
                  keywords: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newsData = (result.ideas || []).map((idea, index) => ({
        id: `news-${index}`,
        type: 'news',
        title: idea.title,
        description: idea.description,
        keywords: idea.keywords,
        targetAudience: 'Education professionals and students',
        additionalContext: idea.reason,
        source: 'Current News',
        priority: 'high',
        badge: 'Breaking News',
        badgeColor: 'bg-cyan-600'
      }));

      setNewsIdeas(newsData);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    }
    setLoadingNews(false);
  };

  const generateTitleFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    if (kw.includes('best') || kw.includes('top')) {
      return keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return `The Complete Guide to ${keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  };

  const generateTitleFromCluster = (cluster) => {
    const patterns = [
      `Everything You Need to Know About ${cluster.name}`,
      `The Complete Guide to ${cluster.name}`,
      `How to Choose the Right ${cluster.name}`,
      `${cluster.name}: Career Paths and Opportunities`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const getRelatedKeywords = (keyword) => {
    const base = keyword.toLowerCase();
    const related = [];
    if (base.includes('online')) related.push('distance learning', 'remote education');
    if (base.includes('degree')) related.push('program', 'university', 'college');
    return related.slice(0, 3);
  };

  const inferAudienceFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    if (kw.includes('affordable')) return 'Budget-conscious students';
    if (kw.includes('online')) return 'Working professionals seeking flexible programs';
    return 'Prospective students researching online education';
  };

  const handleCustomSubmit = () => {
    if (!customIdea.title.trim()) {
      alert('Please enter a title');
      return;
    }

    onSelect({
      id: 'custom',
      type: 'custom',
      title: customIdea.title,
      keywords: customIdea.keywords.split(',').map(k => k.trim()).filter(k => k),
      targetAudience: customIdea.targetAudience || 'General audience',
      additionalContext: customIdea.additionalContext,
      source: 'Custom',
      priority: 'medium'
    });
  };

  const allSuggestions = [...newsIdeas, ...suggestions];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white shadow-lg border-none mb-6">
          <TabsTrigger value="smart" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Smart Suggestions ({allSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Plus className="w-4 h-4" />
            Custom Idea
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart">
          {loadingNews && (
            <Card className="p-6 mb-4 bg-cyan-50 border-cyan-200">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                <p className="text-sm text-cyan-900">Fetching latest news and trending topics...</p>
              </div>
            </Card>
          )}

          <div className="grid gap-4">
            {allSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            {suggestion.type === 'keyword' && <Tag className="w-5 h-5 text-white" />}
                            {suggestion.type === 'cluster' && <Folder className="w-5 h-5 text-white" />}
                            {suggestion.type === 'idea' && <TrendingUp className="w-5 h-5 text-white" />}
                            {suggestion.type === 'news' && <Newspaper className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {suggestion.title}
                            </h3>
                            <p className="text-sm text-gray-500">{suggestion.source}</p>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">
                          {suggestion.description}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Badge className={`${suggestion.badgeColor} text-white`}>
                            {suggestion.badge}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {suggestion.priority} priority
                          </Badge>
                        </div>

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

                        {suggestion.additionalContext && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Context:</span> {suggestion.additionalContext}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => onSelect(suggestion)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                      >
                        Select Idea
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {allSuggestions.length === 0 && !loadingNews && (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No suggestions available</h3>
                <p className="text-gray-600 mb-4">
                  Add target keywords, create clusters, or approve content ideas to see AI-powered suggestions.
                </p>
                <Button onClick={() => setActiveTab('custom')}>
                  Create Custom Idea
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Article Title *</label>
                <Input
                  placeholder="e.g., How to Become a Data Scientist"
                  value={customIdea.title}
                  onChange={(e) => setCustomIdea({ ...customIdea, title: e.target.value })}
                  className="text-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Keywords</label>
                <Input
                  placeholder="e.g., data science, machine learning, analytics (comma-separated)"
                  value={customIdea.keywords}
                  onChange={(e) => setCustomIdea({ ...customIdea, keywords: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple keywords with commas</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Input
                  placeholder="e.g., Career changers interested in tech"
                  value={customIdea.targetAudience}
                  onChange={(e) => setCustomIdea({ ...customIdea, targetAudience: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
                <Textarea
                  placeholder="Any specific points, requirements, or focus areas..."
                  value={customIdea.additionalContext}
                  onChange={(e) => setCustomIdea({ ...customIdea, additionalContext: e.target.value })}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleCustomSubmit}
                disabled={!customIdea.title.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                size="lg"
              >
                Continue with Custom Idea
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}