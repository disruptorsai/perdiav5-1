import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Loader2,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Globe,
  Search,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sources = [
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    description: "Education subreddits and discussions",
    color: "orange"
  },
  {
    id: "trending",
    name: "Trending News",
    icon: TrendingUp,
    description: "Current education news and trends",
    color: "blue"
  },
  {
    id: "google",
    name: "Google Trends",
    icon: Search,
    description: "Popular education searches",
    color: "green"
  },
  {
    id: "general",
    name: "General Topics",
    icon: Globe,
    description: "Evergreen education content",
    color: "purple"
  }
];

export default function SourceSelector({ onClose, onComplete }) {
  const queryClient = useQueryClient();
  const [selectedSources, setSelectedSources] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);

  // Fetch existing articles and ideas to prevent duplicates
  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-duplicate-check'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: existingIdeas = [] } = useQuery({
    queryKey: ['all-ideas-for-duplicate-check'],
    queryFn: () => base44.entities.ContentIdea.list('-created_date', 200),
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const sourcesText = selectedSources.map(s => sources.find(src => src.id === s)?.name).join(", ");
      
      // Get top performing articles for learning
      const topPerformers = existingArticles
        .filter(a => a.views && a.views > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10);

      // Build list of existing topics to avoid
      const existingTopics = [
        ...existingArticles.map(a => a.title),
        ...existingIdeas.map(i => i.title)
      ];

      // Extract covered keywords
      const coveredKeywords = [
        ...existingArticles.flatMap(a => a.target_keywords || []),
        ...existingIdeas.flatMap(i => i.keywords || [])
      ];

      const topPerformersText = topPerformers.length > 0 
        ? `\n\nTOP PERFORMING ARTICLES (learn from these):
${topPerformers.map((a, i) => `${i + 1}. "${a.title}" - ${a.views} views, Type: ${a.type}`).join('\n')}`
        : '';

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      
      const prompt = `Generate 10 highly relevant article ideas for GetEducated.com, an education and career guidance website.

${customTopic ? `🎯 PRIMARY DIRECTIVE: ALL IDEAS MUST BE SPECIFICALLY ABOUT "${customTopic}"
Generate ONLY articles that directly relate to this topic. Do not stray to general trends.` : `IMPORTANT - CURRENT DATE CONTEXT:
- Current year: ${currentYear}
- Current month: ${currentMonth} ${currentYear}
- Focus on CURRENT and UPCOMING trends (${currentYear} and ${currentYear + 1})
- DO NOT reference past years like 2023 or 2024 in titles`}

Sources to consider: ${sourcesText}
${topPerformersText}

CRITICAL - AVOID DUPLICATE TOPICS:
We already have ${existingTopics.length} articles/ideas covering these topics. DO NOT suggest topics similar to:
${existingTopics.slice(0, 30).map(t => `- ${t}`).join('\n')}

COVERED KEYWORDS (explore new angles):
${coveredKeywords.slice(0, 50).join(', ')}

For each NEW and UNIQUE idea, provide:
1. A compelling, SEO-friendly article title (must be different from existing)
2. A brief description (2-3 sentences)
3. Target audience
4. Priority level (high/medium/low)
5. Suggested content type (ranking, career_guide, listicle, guide, or faq)

${customTopic ? `ALL IDEAS MUST FOCUS ON: ${customTopic}` : `Focus on:
- Current education trends and career paths (${currentYear})
- Online degree programs and certifications
- Career development and skills
- Education technology and innovations
- Student success strategies
- UNIQUE angles not yet covered`}

${topPerformers.length > 0 ? 'Generate ideas similar in STYLE and TOPIC CATEGORY to our top performers, but with fresh angles.' : ''}

Return as JSON array with this structure:
{
  "ideas": [
    {
      "title": "Article title",
      "description": "Brief description",
      "target_audience": "Who this is for",
      "priority": "high/medium/low",
      "content_type": "ranking/career_guide/listicle/guide/faq",
      "keywords": ["keyword1", "keyword2"]
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
                  target_audience: { type: "string" },
                  priority: { type: "string" },
                  content_type: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Filter out any remaining duplicates using semantic similarity check
      const uniqueIdeas = [];
      for (const idea of (result.ideas || [])) {
        const isDuplicate = existingTopics.some(existing => {
          const similarity = calculateSimilarity(idea.title.toLowerCase(), existing.toLowerCase());
          return similarity > 0.7; // 70% similarity threshold
        });
        
        if (!isDuplicate) {
          uniqueIdeas.push(idea);
        }
      }

      return uniqueIdeas;
    },
    onSuccess: (ideas) => {
      setGeneratedIdeas(ideas);
      setIsGenerating(false);
      
      if (ideas.length === 0) {
        alert("All generated ideas were too similar to existing content. Try a different topic focus.");
      }
    },
    onError: () => {
      setIsGenerating(false);
      alert("Failed to generate ideas. Please try again.");
    }
  });

  const saveIdeasMutation = useMutation({
    mutationFn: async () => {
      const ideasToSave = generatedIdeas
        .filter((_, index) => selectedIdeas.includes(index))
        .map(idea => ({
          title: idea.title,
          description: idea.description,
          source: selectedSources[0] || "manual",
          keywords: idea.keywords || [],
          content_type: idea.content_type || "guide",
          priority: idea.priority || "medium",
          status: "approved",
          notes: `Target: ${idea.target_audience}`
        }));

      await base44.entities.ContentIdea.bulkCreate(ideasToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
      onComplete();
    }
  });

  const handleGenerate = () => {
    if (selectedSources.length === 0) {
      alert("Please select at least one source");
      return;
    }
    setIsGenerating(true);
    generateIdeasMutation.mutate();
  };

  const handleSaveIdeas = () => {
    if (selectedIdeas.length === 0) {
      alert("Please select at least one idea to add to the queue");
      return;
    }
    saveIdeasMutation.mutate();
  };

  const toggleSource = (sourceId) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const toggleIdea = (index) => {
    setSelectedIdeas(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Simple similarity calculation (Levenshtein-based)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (str1, str2) => {
    const costs = [];
    for (let i = 0; i <= str1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= str2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[str2.length] = lastValue;
    }
    return costs[str2.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold mb-2">Generate Article Ideas</h2>
          <p className="text-blue-100">
            Select sources and let AI discover trending topics
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {generatedIdeas.length === 0 ? (
            <>
              {/* Source Selection */}
              <div className="space-y-4 mb-6">
                <Label className="text-base font-semibold">Select Sources</Label>
                <div className="grid grid-cols-2 gap-4">
                  {sources.map((source) => {
                    const Icon = source.icon;
                    const isSelected = selectedSources.includes(source.id);
                    
                    return (
                      <Card
                        key={source.id}
                        onClick={() => toggleSource(source.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? `ring-2 ring-${source.color}-500 bg-${source.color}-50 border-${source.color}-200`
                            : 'hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-${source.color}-100 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 text-${source.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {source.name}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {source.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className={`w-5 h-5 text-${source.color}-600`} />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="custom-topic">Custom Topic (Optional)</Label>
                <Input
                  id="custom-topic"
                  placeholder="e.g., nursing degrees, data science careers, online MBA programs"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedSources.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 py-6"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Article Ideas
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Generated Ideas */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Generated Ideas</h3>
                    <p className="text-sm text-gray-600">
                      Select ideas to add to your article queue
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {selectedIdeas.length} selected
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generatedIdeas.map((idea, index) => (
                    <Card
                      key={index}
                      onClick={() => toggleIdea(index)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedIdeas.includes(index)
                          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                          : 'hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIdeas.includes(index)}
                          onCheckedChange={() => toggleIdea(index)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {idea.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {idea.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">
                              {idea.content_type?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                idea.priority === 'high'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : idea.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {idea.priority}
                            </Badge>
                            {idea.target_audience && (
                              <span className="text-xs text-gray-500">
                                👥 {idea.target_audience}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedIdeas([]);
                    setSelectedIdeas([]);
                  }}
                  className="flex-1"
                >
                  Generate New Ideas
                </Button>
                <Button
                  onClick={handleSaveIdeas}
                  disabled={saveIdeasMutation.isPending || selectedIdeas.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  {saveIdeasMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Add {selectedIdeas.length} to Queue
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}