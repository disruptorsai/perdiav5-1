import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const createPageUrl = (pageName) => `/${pageName}`;
import { 
  CheckCircle2, 
  Upload,
  Calendar,
  Clock,
  Eye,
  Loader2,
  FileText,
  Database,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function ApprovedArticles() {
  const queryClient = useQueryClient();
  const [publishingId, setPublishingId] = useState(null);

  const { data: approvedArticles = [], isLoading } = useQuery({
    queryKey: ['articles', 'approved'],
    queryFn: () => base44.entities.Article.filter({ 
      status: 'approved' 
    }, '-updated_date', 100),
  });

  const { data: wpConnection } = useQuery({
    queryKey: ['wordpress-connection'],
    queryFn: async () => {
      const connections = await base44.entities.WordPressConnection.list();
      return connections.find(c => c.connection_status === 'connected');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ articleId }) => {
      setPublishingId(articleId);
      const article = approvedArticles.find(a => a.id === articleId);
      
      // Simulate WordPress publishing (replace with actual WP API call when ready)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update article status to published
      await base44.entities.Article.update(articleId, { 
        status: 'published',
        publish_at: new Date().toISOString()
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setPublishingId(null);
    },
    onError: () => {
      setPublishingId(null);
    }
  });

  const schedulePublishMutation = useMutation({
    mutationFn: ({ id, publishDate }) => 
      base44.entities.Article.update(id, { 
        auto_publish_at: publishDate 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handlePublishNow = (articleId) => {
    if (window.confirm('Publish this article to WordPress now?')) {
      publishMutation.mutate({ articleId });
    }
  };

  const handleSchedule = (articleId) => {
    const date = window.prompt('Enter publish date (YYYY-MM-DD):');
    if (date) {
      schedulePublishMutation.mutate({ 
        id: articleId, 
        publishDate: new Date(date).toISOString() 
      });
    }
  };

  const scheduledArticles = approvedArticles.filter(a => a.auto_publish_at);
  const readyToPublish = approvedArticles.filter(a => !a.auto_publish_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-25 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            Publishing Queue
          </h1>
          <p className="text-gray-600 mt-1">
            Approved articles ready to publish to WordPress
          </p>
        </motion.div>

        {/* WordPress Connection Status */}
        {wpConnection ? (
          <Card className="border-none shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WordPress Connected</h3>
                  <p className="text-green-100 text-sm">
                    {wpConnection.site_name} • {wpConnection.total_published || 0} articles published
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("Integrations")}>
                <Button variant="secondary" className="bg-white text-green-700 hover:bg-green-50 gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Manage Connection
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WordPress Not Connected</h3>
                  <p className="text-yellow-100 text-sm">
                    Connect your WordPress site to publish articles
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("Integrations")}>
                <Button variant="secondary" className="bg-white text-yellow-700 hover:bg-yellow-50">
                  Connect Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ready to Publish</p>
                <p className="text-2xl font-bold text-gray-900">{readyToPublish.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledArticles.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedArticles.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Ready to Publish Section */}
        {readyToPublish.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Ready to Publish
            </h2>
            {readyToPublish.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-white">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Approved
                          </Badge>
                          {article.editor_score && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Score: {article.editor_score}/10
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{article.type.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span>{article.word_count?.toLocaleString() || 0} words</span>
                          <span>•</span>
                          <span>Approved {format(new Date(article.updated_date), 'MMM d')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={`${createPageUrl("ArticleReview")}?id=${article.id}`}>
                          <Button variant="outline" className="gap-2 w-full">
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handlePublishNow(article.id)}
                          disabled={publishingId === article.id || !wpConnection}
                          className="bg-green-600 hover:bg-green-700 gap-2"
                        >
                          {publishingId === article.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Publish Now
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSchedule(article.id)}
                          className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Calendar className="w-4 h-4" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Scheduled Articles Section */}
        {scheduledArticles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Scheduled for Publishing
            </h2>
            {scheduledArticles.map((article) => (
              <Card key={article.id} className="border-none shadow-lg bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          <Calendar className="w-3 h-3 mr-1" />
                          Scheduled: {format(new Date(article.auto_publish_at), 'MMM d, yyyy')}
                        </Badge>
                        <span className="text-sm text-gray-500 capitalize">
                          {article.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`${createPageUrl("ArticleReview")}?id=${article.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handlePublishNow(article.id)}
                        disabled={publishingId === article.id || !wpConnection}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        {publishingId === article.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Publish Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {isLoading ? (
          <Card className="p-8 text-center bg-white border-none shadow-sm">
            <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Loading approved articles...</p>
          </Card>
        ) : approvedArticles.length === 0 ? (
          <Card className="p-12 text-center bg-white border-none shadow-lg">
            <CheckCircle2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Approved Articles</h3>
            <p className="text-gray-500 mb-4">
              Articles that have been approved will appear here, ready to publish
            </p>
            <Link to={createPageUrl("ReviewQueue")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Go to Review Queue
              </Button>
            </Link>
          </Card>
        ) : null}
      </div>
    </div>
  );
}