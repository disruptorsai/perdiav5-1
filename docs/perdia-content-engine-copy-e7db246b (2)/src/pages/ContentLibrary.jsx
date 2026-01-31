import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const createPageUrl = (pageName) => `/${pageName}`;
import { Search, Filter, Plus, ExternalLink, CheckCircle2, Globe, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const statusColors = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  in_review: "bg-amber-100 text-amber-700 border-amber-300",
  approved: "bg-blue-100 text-blue-700 border-blue-300",
  published: "bg-emerald-100 text-emerald-700 border-emerald-300",
  needs_revision: "bg-red-100 text-red-700 border-red-300"
};

export default function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedArticles, setSelectedArticles] = useState([]);
  
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (articleIds) => {
      await Promise.all(articleIds.map(id => base44.entities.Article.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setSelectedArticles([]);
    },
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedArticles(filteredArticles.map(a => a.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleSelectArticle = (articleId) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${selectedArticles.length} article(s)? This cannot be undone.`)) {
      deleteMutation.mutate(selectedArticles);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    const matchesType = typeFilter === "all" || article.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getClusterName = (clusterId) => {
    const cluster = clusters.find(c => c.id === clusterId);
    return cluster?.name || 'Uncategorized';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content Library</h1>
            <p className="text-gray-600 mt-1">
              {selectedArticles.length > 0 
                ? `${selectedArticles.length} article(s) selected` 
                : 'Manage all your articles in one place'}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedArticles.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedArticles.length}
              </Button>
            )}
            <Link to={createPageUrl("ArticleEditor")}>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg gap-2">
                <Plus className="w-5 h-5" />
                New Article
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="p-6 border-none shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="degree_page">Degree Page</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="ranking">Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Showing {filteredArticles.length} of {articles.length} articles</span>
            </div>
            {filteredArticles.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span>Select All</span>
              </label>
            )}
          </div>
        </Card>

        {/* Articles Grid */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Loading articles...</p>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No articles found. Try adjusting your filters.</p>
            </Card>
          ) : (
            filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-none shadow-lg group">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectArticle(article.id);
                      }}
                      className="mt-1 w-4 h-4 rounded border-gray-300 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Link to={`${createPageUrl("ArticleEditor")}?id=${article.id}`} className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {article.excerpt && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className={`${statusColors[article.status]} border font-medium`}>
                            {article.status.replace(/_/g, ' ')}
                          </Badge>
                          {article.wp_post_id && (
                            <div className="flex items-center gap-1 text-green-600" title="Published to WordPress">
                              <CheckCircle2 className="w-4 h-4" />
                              <Globe className="w-3 h-3" />
                            </div>
                          )}
                          <span className="text-xs text-gray-500 capitalize">
                            {article.type.replace(/_/g, ' ')}
                          </span>
                          {article.cluster_id && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {getClusterName(article.cluster_id)}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(article.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {article.word_count > 0 && (
                          <span className="text-xs text-gray-500">
                            {article.word_count.toLocaleString()} words
                          </span>
                        )}
                        {article.editor_score && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Score: {article.editor_score}/10
                          </Badge>
                        )}
                      </div>
                      </div>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}