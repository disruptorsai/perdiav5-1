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
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ArrowRight,
  Calendar,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("in_review");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles', 'review'],
    queryFn: () => base44.entities.Article.filter({ 
      status: selectedStatus 
    }, '-created_date', 100),
  });

  const { data: allRevisions = [] } = useQuery({
    queryKey: ['all-revisions'],
    queryFn: () => base44.entities.ArticleRevision.list('-created_date', 500),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Article.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const statuses = [
    { value: "in_review", label: "In Review", icon: Clock, color: "blue" },
    { value: "needs_revision", label: "Needs Revision", icon: AlertCircle, color: "red" },
    { value: "approved", label: "Approved", icon: CheckCircle2, color: "green" },
  ];

  const handleQuickAction = async (articleId, newStatus) => {
    await updateStatusMutation.mutateAsync({ id: articleId, status: newStatus });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_review': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'needs_revision': return 'bg-red-50 text-red-700 border-red-200';
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getArticleCommentCount = (articleId) => {
    return allRevisions.filter(r => r.article_id === articleId).length;
  };

  return (
    <div className="min-h-screen bg-gray-25 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Review Queue</h1>
          <p className="text-gray-600 text-lg">
            Review articles, add comments, and approve for publishing
          </p>
        </motion.div>

        {/* Status Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {statuses.map(({ value, label, icon: Icon, color }) => (
            <Button
              key={value}
              variant={selectedStatus === value ? "default" : "outline"}
              onClick={() => setSelectedStatus(value)}
              className={`gap-2 shadow-sm ${
                selectedStatus === value 
                  ? color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                    color === 'green' ? 'bg-green-600 hover:bg-green-700' : ''
                  : 'border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <Badge variant="secondary" className="ml-1 bg-white/20 text-inherit border-0">
                {articles.filter(a => a.status === value).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Queue Items */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-8 text-center bg-white border-none shadow-soft">
              <p className="text-gray-500">Loading queue...</p>
            </Card>
          ) : articles.length === 0 ? (
            <Card className="p-12 text-center bg-white border-none shadow-soft">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">No articles with "{selectedStatus.replace(/_/g, ' ')}" status</p>
            </Card>
          ) : (
            articles.map((article, index) => {
              const commentCount = getArticleCommentCount(article.id);
              
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-soft hover:shadow-md transition-all bg-white">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Badge variant="outline" className={`${getStatusColor(article.status)} border font-medium`}>
                              {article.status.replace(/_/g, ' ')}
                            </Badge>
                            {article.auto_publish_at && (
                              <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-200">
                                <Calendar className="w-3 h-3" />
                                Auto-publish: {format(new Date(article.auto_publish_at), 'MMM d')}
                              </div>
                            )}
                            {commentCount > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                <MessageSquare className="w-3 h-3" />
                                {commentCount} comment{commentCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="capitalize">{article.type.replace(/_/g, ' ')}</span>
                            <span>•</span>
                            <span>{article.word_count?.toLocaleString() || 0} words</span>
                            <span>•</span>
                            <span>Created {format(new Date(article.created_date), 'MMM d')}</span>
                          </div>
                          {article.risk_flags && article.risk_flags.length > 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-semibold text-yellow-900">
                                  {article.risk_flags.length} risk flag{article.risk_flags.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {article.risk_flags.map((flag, i) => (
                                  <Badge key={i} variant="outline" className="bg-white text-yellow-700 border-yellow-300">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link to={`${createPageUrl("ArticleReview")}?id=${article.id}`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 w-full shadow-sm">
                              Review Article
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                          {article.status === 'in_review' && (
                            <>
                              <Button
                                variant="outline"
                                className="gap-2 text-green-600 border-green-200 hover:bg-green-50 shadow-sm"
                                onClick={() => handleQuickAction(article.id, 'approved')}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Quick Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 shadow-sm"
                                onClick={() => handleQuickAction(article.id, 'needs_revision')}
                              >
                                <XCircle className="w-4 h-4" />
                                Needs Work
                              </Button>
                            </>
                          )}
                          {article.status === 'approved' && (
                            <Button
                              variant="outline"
                              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 shadow-sm"
                              onClick={() => handleQuickAction(article.id, 'published')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Publish Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}