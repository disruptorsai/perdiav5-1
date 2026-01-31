import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle2, 
  BarChart3 
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = {
  draft: '#94a3b8',
  in_review: '#f59e0b',
  approved: '#3b82f6',
  published: '#10b981',
  needs_revision: '#ef4444'
};

const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: articles = [] } = useQuery({
    queryKey: ['analytics-articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['analytics-keywords'],
    queryFn: () => base44.entities.Keyword.list(),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['analytics-clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  // Helper functions
  const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const filterByTimeRange = (items) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = getDaysAgo(days);
    return items.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const filteredArticles = filterByTimeRange(articles);

  // Get timeline data for article production chart
  const getTimelineData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const count = articles.filter(a => {
        const articleDate = new Date(a.created_date).toISOString().split('T')[0];
        return articleDate === dateStr;
      }).length;
      
      data.push({ date: displayDate, articles: count });
    }
    
    return data;
  };

  // Get status distribution data
  const getStatusData = () => {
    const statusCounts = {
      draft: 0,
      in_review: 0,
      approved: 0,
      published: 0,
      needs_revision: 0
    };
    
    filteredArticles.forEach(article => {
      if (statusCounts.hasOwnProperty(article.status)) {
        statusCounts[article.status]++;
      }
    });
    
    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        color: COLORS[status]
      }));
  };

  // Get content type distribution
  const getTypeData = () => {
    const typeCounts = {};
    
    filteredArticles.forEach(article => {
      const type = article.type || 'guide';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
  };

  // Get quality score trend
  const getQualityData = () => {
    const articlesWithScore = articles.filter(a => a.editor_score);
    const scoresByDate = {};
    
    articlesWithScore.forEach(article => {
      const date = new Date(article.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!scoresByDate[date]) {
        scoresByDate[date] = { total: 0, count: 0 };
      }
      scoresByDate[date].total += article.editor_score;
      scoresByDate[date].count++;
    });
    
    return Object.entries(scoresByDate)
      .slice(-30)
      .map(([date, data]) => ({
        date,
        score: Math.round((data.total / data.count) * 10) / 10
      }));
  };

  // Get cluster performance data
  const getClusterData = () => {
    return clusters
      .slice(0, 10)
      .map(cluster => ({
        name: cluster.name?.substring(0, 20) || 'Unknown',
        articles: cluster.article_count || 0,
        keywords: cluster.keyword_count || 0
      }))
      .sort((a, b) => b.articles - a.articles);
  };

  // Calculate stats
  const weeklyArticles = articles.filter(a => new Date(a.created_date) >= getDaysAgo(7)).length;
  const prevWeekArticles = articles.filter(a => {
    const date = new Date(a.created_date);
    return date >= getDaysAgo(14) && date < getDaysAgo(7);
  }).length;
  const weeklyGrowth = prevWeekArticles > 0 
    ? Math.round(((weeklyArticles - prevWeekArticles) / prevWeekArticles) * 100) 
    : 0;

  const articlesWithScore = filteredArticles.filter(a => a.editor_score);
  const avgScore = articlesWithScore.length > 0
    ? (articlesWithScore.reduce((sum, a) => sum + a.editor_score, 0) / articlesWithScore.length).toFixed(1)
    : 0;

  const publishedCount = filteredArticles.filter(a => a.status === 'published').length;
  const publishedRate = filteredArticles.length > 0
    ? Math.round((publishedCount / filteredArticles.length) * 100)
    : 0;

  const inReviewCount = filteredArticles.filter(a => a.status === 'in_review').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics</h1>
            <p className="text-gray-600 mt-1">Content performance and insights</p>
          </div>
          
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Articles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{filteredArticles.length}</p>
                  <p className={`text-sm mt-1 ${weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}% this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{avgScore}</p>
                  <p className="text-sm text-gray-500 mt-1">out of 10</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{publishedRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">{publishedCount} published</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{inReviewCount}</p>
                  <p className="text-sm text-gray-500 mt-1">awaiting approval</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Article Production */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Article Production
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="articles" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Types */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTypeData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {getTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quality Score Trend */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Quality Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getQualityData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cluster Performance */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Top Topic Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getClusterData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="articles" fill="#3b82f6" name="Articles" radius={[0, 4, 4, 0]} />
                <Bar dataKey="keywords" fill="#8b5cf6" name="Keywords" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}