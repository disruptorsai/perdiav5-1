import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SourceSelector from "../components/workflow/SourceSelector";
import KanbanBoard from "../components/workflow/KanbanBoard";

export default function ArticleWorkflow() {
  const queryClient = useQueryClient();
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['workflow-articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 100),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['workflow-ideas'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }),
  });

  const updateArticleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Article.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleStatusChange = (articleId, newStatus) => {
    updateArticleStatusMutation.mutate({ id: articleId, status: newStatus });
  };

  const handleSourcesSelected = () => {
    setShowSourceSelector(false);
    queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Article Pipeline
            </h1>
            <p className="text-gray-600 mt-2">
              Drag articles through your content workflow
            </p>
          </div>
          <Button
            onClick={() => setShowSourceSelector(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-lg"
            size="lg"
          >
            <TrendingUp className="w-5 h-5" />
            Generate New Ideas
          </Button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{ideas.length}</p>
                <p className="text-xs text-gray-600">Ideas Ready</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'draft').length}
                </p>
                <p className="text-xs text-gray-600">Generated</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'in_review').length}
                </p>
                <p className="text-xs text-gray-600">In Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'approved').length}
                </p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Kanban Board */}
        <KanbanBoard
          ideas={ideas}
          articles={articles}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
        />

        {/* Source Selector Modal */}
        <AnimatePresence>
          {showSourceSelector && (
            <SourceSelector
              onClose={() => setShowSourceSelector(false)}
              onComplete={handleSourcesSelected}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}