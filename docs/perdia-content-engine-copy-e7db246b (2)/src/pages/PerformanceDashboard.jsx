import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointerClick, 
  Clock, 
  Target,
  ExternalLink,
  Edit,
  Search,
  BarChart3,
  ArrowUpDown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;

export default function PerformanceDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("published_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data: publishedArticles = [], isLoading } = useQuery({
    queryKey: ['published-articles-performance'],
    queryFn: () => base44.entities.Article.filter({ 
      publish_status: 'published',
      wordpress_post_id: { $exists: true }
    }, '-published_at', 100),
  });

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    if (!publishedArticles.length) return null;
    
    const total = publishedArticles.length;
    const totalViews = publishedArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const avgEngagement = publishedArticles.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / total;
    const avgBounce = publishedArticles.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / total;
    const avgConversion = publishedArticles.reduce((sum, a) => sum + (a.conversion_rate || 0), 0) / total;
    const avgTimeOnPage = publishedArticles.reduce((sum, a) => sum + (a.avg_time_on_page || 0), 0) / total;
    
    return {
      total,
      totalViews,
      avgEngagement: avgEngagement.toFixed(1),
      avgBounce: avgBounce.toFixed(1),
      avgConversion: avgConversion.toFixed(2),
      avgTimeOnPage: Math.round(avgTimeOnPage)
    };
  }, [publishedArticles]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = publishedArticles.filter(article => {
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || article.type === filterType;
      return matchesSearch && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortBy) {
        case "views":
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        case "engagement_rate":
          aVal = a.engagement_rate || 0;
          bVal = b.engagement_rate || 0;
          break;
        case "bounce_rate":
          aVal = a.bounce_rate || 0;
          bVal = b.bounce_rate || 0;
          break;
        case "conversion_rate":
          aVal = a.conversion_rate || 0;
          bVal = b.conversion_rate || 0;
          break;
        case "performance_score":
          aVal = a.performance_score || 0;
          bVal = b.performance_score || 0;
          break;
        case "published_at":
        default:
          aVal = new Date(a.published_at || 0).getTime();
          bVal = new Date(b.published_at || 0).getTime();
      }
      
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [publishedArticles, searchQuery, filterType, sortBy, sortOrder]);

  // Prepare chart data (last 30 days)
  const chartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const articlesOnDate = publishedArticles.filter(a => {
        if (!a.published_at) return false;
        const pubDate = new Date(a.published_at).toISOString().split('T')[0];
        return pubDate === dateStr;
      });
      
      last30Days.push({
        date: dateStr,
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        articles: articlesOnDate.length,
        views: articlesOnDate.reduce((sum, a) => sum + (a.views || 0), 0),
        engagement: articlesOnDate.length > 0 
          ? articlesOnDate.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / articlesOnDate.length 
          : 0
      });
    }
    
    return last30Days;
  }, [publishedArticles]);

  const typeDistribution = useMemo(() => {
    const distribution = {};
    publishedArticles.forEach(article => {
      const type = article.type || 'unknown';
      if (!distribution[type]) {
        distribution[type] = { count: 0, views: 0 };
      }
      distribution[type].count++;
      distribution[type].views += article.views || 0;
    });
    
    return Object.entries(distribution).map(([type, data]) => ({
      type: type.replace(/_/g, ' '),
      count: data.count,
      avgViews: Math.round(data.views / data.count)
    }));
  }, [publishedArticles]);

  const toggleSort = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600 mt-2">Track published article metrics and performance</p>
          </div>
        </motion.div>

        {/* Aggregate Stats */}
        {aggregateMetrics && (
          <div className="grid grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{aggregateMetrics.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{aggregateMetrics.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4" />
                  Avg Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{aggregateMetrics.avgEngagement}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Avg Bounce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{aggregateMetrics.avgBounce}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Avg Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{aggregateMetrics.avgConversion}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Avg Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{aggregateMetrics.avgTimeOnPage}s</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Publishing Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="articles" stroke="#3b82f6" name="Articles" />
                  <Line type="monotone" dataKey="views" stroke="#10b981" name="Views" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance by Content Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Count" />
                  <Bar dataKey="avgViews" fill="#10b981" name="Avg Views" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ranking">Ranking</SelectItem>
                  <SelectItem value="career_guide">Career Guide</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published_at">Publication Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
                  <SelectItem value="bounce_rate">Bounce Rate</SelectItem>
                  <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                  <SelectItem value="performance_score">Performance Score</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={toggleSort} className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {article.title}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {article.type?.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-6 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Views</div>
                            <div className="text-sm font-semibold">{article.views || 0}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MousePointerClick className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Engagement</div>
                            <div className="text-sm font-semibold">{article.engagement_rate || 0}%</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Bounce</div>
                            <div className="text-sm font-semibold">{article.bounce_rate || 0}%</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Conversion</div>
                            <div className="text-sm font-semibold">{article.conversion_rate || 0}%</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Avg Time</div>
                            <div className="text-sm font-semibold">{article.avg_time_on_page || 0}s</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Score</div>
                            <div className="text-sm font-semibold">{article.performance_score || 0}/100</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span>Published: {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'N/A'}</span>
                        <span>Words: {article.word_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`${createPageUrl('ArticleEditor')}?id=${article.id}`)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      {article.wordpress_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(article.wordpress_url, '_blank')}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Live
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No published articles found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}