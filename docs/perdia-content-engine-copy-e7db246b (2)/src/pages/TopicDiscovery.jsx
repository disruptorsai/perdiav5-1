import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Search,
  TrendingUp,
  Sparkles,
  Plus,
  ExternalLink,
  ThumbsUp,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function TopicDiscovery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");

  const { data: contentIdeas = [], isLoading } = useQuery({
    queryKey: ['content-ideas'],
    queryFn: () => base44.entities.ContentIdea.list('-created_date', 100),
  });

  const searchMutation = useMutation({
    mutationFn: async (query) => {
      const prompt = `Search for trending, interesting, and relevant education-related content on social media and news.

Search Query: "${query}"

Find topics related to:
- Online education
- Degree programs
- Career paths
- Educational technology
- Student advice
- Industry trends

For each topic found, provide:
1. Suggested article title (GetEducated style)
2. Brief description
3. Content type (ranking, career_guide, listicle, guide)
4. Keywords (array)
5. Why it's trending/relevant
6. Estimated engagement (high/medium/low)

Return 10-15 content ideas that would resonate with GetEducated's audience.`;

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
                  content_type: { type: "string" },
                  keywords: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reasoning: { type: "string" },
                  engagement: { type: "string" },
                  source_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      return result.ideas || [];
    },
    onSuccess: async (ideas) => {
      // Create all ideas in the database
      const createdIdeas = await Promise.all(
        ideas.map(idea => base44.entities.ContentIdea.create({
          title: idea.title,
          description: idea.description,
          content_type: idea.content_type,
          keywords: idea.keywords,
          source: idea.source_type === 'reddit' ? 'reddit' : 'twitter',
          status: 'pending',
          priority: idea.engagement === 'high' ? 'high' : idea.engagement === 'low' ? 'low' : 'medium',
          trending_score: idea.engagement === 'high' ? 90 : idea.engagement === 'low' ? 30 : 60,
          search_query: searchQuery,
          notes: idea.reasoning
        }))
      );

      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      setIsSearching(false);
    },
    onError: () => {
      setIsSearching(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ContentIdea.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    searchMutation.mutate(searchQuery);
  };

  const handleGenerateArticle = (idea) => {
    navigate(`/ArticleGenerator?title=${encodeURIComponent(idea.title)}&type=${idea.content_type}&keywords=${encodeURIComponent(idea.keywords?.join(', ') || '')}`);
  };

  const pendingIdeas = contentIdeas.filter(i => i.status === 'pending');
  const approvedIdeas = contentIdeas.filter(i => i.status === 'approved');
  const inProgressIdeas = contentIdeas.filter(i => i.status === 'in_progress');

  const statusColors = {
    pending: "bg-blue-100 text-blue-700 border-blue-300",
    approved: "bg-green-100 text-green-700 border-green-300",
    in_progress: "bg-blue-200 text-blue-800 border-blue-400",
    completed: "bg-gray-100 text-gray-700 border-gray-300",
    rejected: "bg-red-100 text-red-700 border-red-300"
  };

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-blue-100 text-blue-700 border-blue-300"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-25 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Topic Discovery
          </h1>
          <p className="text-gray-600 mt-1">
            Find trending topics from social media and news
          </p>
        </motion.div>

        {/* Search Bar */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
                <Input
                  placeholder="Search for topics (e.g., 'MBA programs', 'AI in education', 'nursing careers')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-white text-blue-700 hover:bg-blue-50 gap-2"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Discover Topics
                  </>
                )}
              </Button>
            </div>
            <p className="text-blue-100 text-sm mt-3">
              AI will search Reddit, X (Twitter), and news sources for trending education topics
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingIdeas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedIdeas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressIdeas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-300 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ideas</p>
                <p className="text-2xl font-bold text-gray-900">{contentIdeas.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-sm border border-gray-200">
            <TabsTrigger value="queue">Content Queue</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-6 space-y-4">
            {pendingIdeas.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-lg bg-white">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No topics in queue</h3>
                <p className="text-gray-500 mb-4">Search for trending topics to populate your content queue</p>
              </Card>
            ) : (
              pendingIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-lg text-gray-900">{idea.title}</h3>
                            {idea.trending_score >= 70 && (
                              <Badge className="bg-red-600 gap-1 text-white">
                                <TrendingUp className="w-3 h-3" />
                                Hot
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{idea.description}</p>
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            <Badge variant="outline" className={`${statusColors[idea.status]} border`}>
                              {idea.status}
                            </Badge>
                            <Badge variant="outline" className={`${priorityColors[idea.priority]} border`}>
                              {idea.priority} priority
                            </Badge>
                            <Badge variant="outline" className="capitalize bg-gray-50 text-gray-700 border-gray-200">
                              {idea.content_type?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline" className="capitalize bg-gray-50 text-gray-700 border-gray-200">
                              {idea.source}
                            </Badge>
                          </div>
                          {idea.keywords && idea.keywords.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {idea.keywords.slice(0, 5).map((keyword, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                          {idea.notes && (
                            <p className="text-sm text-blue-700 mt-3 bg-blue-50 p-2 rounded border border-blue-200">
                              💡 {idea.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleGenerateArticle(idea)}
                            className="bg-blue-600 hover:bg-blue-700 gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: idea.id, status: 'approved' })}
                            className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: idea.id, status: 'rejected' })}
                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6 space-y-4">
            {approvedIdeas.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-lg bg-white">
                <p className="text-gray-500">No approved topics yet</p>
              </Card>
            ) : (
              approvedIdeas.map((idea) => (
                <Card key={idea.id} className="border-none shadow-lg bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{idea.title}</h3>
                        <p className="text-gray-600 mb-3">{idea.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600 text-white">Approved</Badge>
                          <Badge variant="outline" className="capitalize bg-gray-50 text-gray-700 border-gray-200">
                            {idea.content_type?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleGenerateArticle(idea)}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-4">
            {contentIdeas.map((idea) => (
              <Card key={idea.id} className="border-none shadow-lg bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{idea.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`${statusColors[idea.status]} border text-xs`}>
                          {idea.status}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">{idea.content_type?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}