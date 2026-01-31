import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DetectionTestResultsView() {
  const [selectedTool, setSelectedTool] = useState("all");

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['detection-test-results'],
    queryFn: () => base44.entities.DetectionTestResults.list('-tested_at', 100),
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-for-detection'],
    queryFn: () => base44.entities.Article.list('-created_date', 50),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tools = ["all", ...new Set(results.map(r => r.tool_name))];
  const filteredResults = selectedTool === "all" 
    ? results 
    : results.filter(r => r.tool_name === selectedTool);

  // Calculate average scores over time
  const chartData = filteredResults
    .slice(0, 30)
    .reverse()
    .map(r => ({
      date: new Date(r.tested_at).toLocaleDateString(),
      score: parseFloat(r.raw_score) || 0,
      tool: r.tool_name
    }));

  // Get interpretation color
  const getInterpretationColor = (interpretation) => {
    if (!interpretation) return "gray";
    const lower = interpretation.toLowerCase();
    if (lower.includes("likely human") || lower.includes("low")) return "green";
    if (lower.includes("mixed") || lower.includes("moderate")) return "yellow";
    return "red";
  };

  const getArticleTitle = (articleId) => {
    const article = articles.find(a => a.id === articleId);
    return article?.title || "Unknown Article";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detection Test Results</h1>
          <p className="text-gray-600">AI detection scores across different tools and articles</p>
        </motion.div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex gap-2 flex-wrap">
                {tools.map((tool) => (
                  <Button
                    key={tool}
                    variant={selectedTool === tool ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool(tool)}
                  >
                    {tool === "all" ? "All Tools" : tool}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Detection Score Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No test results yet</p>
              ) : (
                filteredResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{result.tool_name}</Badge>
                          <Badge 
                            className={
                              getInterpretationColor(result.interpretation) === "green" 
                                ? "bg-green-100 text-green-800" 
                                : getInterpretationColor(result.interpretation) === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {result.interpretation || "Unknown"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(result.tested_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">
                          {getArticleTitle(result.article_id)}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">Score: {result.raw_score}</p>
                        {result.notes && (
                          <p className="text-sm text-gray-700 bg-gray-100 rounded p-2 mt-2">
                            {result.notes}
                          </p>
                        )}
                        {result.workflow_version_used && (
                          <p className="text-xs text-gray-500 mt-2">
                            Workflow Version: {result.workflow_version_used}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {parseFloat(result.raw_score) > 50 ? (
                          <TrendingUp className="w-5 h-5 text-red-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}