import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Tag, TrendingUp, Target, Folder } from "lucide-react";
import { motion } from "framer-motion";

export default function KeywordsAndClusters() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("keywords");
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [showClusterDialog, setShowClusterDialog] = useState(false);

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 200),
  });

  const { data: clusters = [], isLoading: loadingClusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list('-created_date', 100),
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data) => base44.entities.Keyword.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setShowKeywordDialog(false);
    },
  });

  const createClusterMutation = useMutation({
    mutationFn: (data) => base44.entities.Cluster.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      setShowClusterDialog(false);
    },
  });

  const handleCreateKeyword = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createKeywordMutation.mutate({
      keyword: formData.get('keyword'),
      intent: formData.get('intent'),
      priority: formData.get('priority'),
      target_flag: formData.get('target_flag') === 'on'
    });
  };

  const handleCreateCluster = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createClusterMutation.mutate({
      name: formData.get('name'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      status: 'planning'
    });
  };

  const targetKeywords = keywords.filter(k => k.target_flag);
  const rankedKeywords = keywords.filter(k => !k.target_flag && k.current_position);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Keywords & Clusters
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your content strategy and topic organization
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{keywords.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{targetKeywords.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Topic Clusters</p>
                <p className="text-2xl font-bold text-gray-900">{clusters.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Currently Ranked</p>
                <p className="text-2xl font-bold text-gray-900">{rankedKeywords.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="clusters">Topic Clusters</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="w-4 h-4" />
                    Add Keyword
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Keyword</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateKeyword} className="space-y-4">
                    <div>
                      <Label>Keyword</Label>
                      <Input name="keyword" required placeholder="e.g., online mba programs" />
                    </div>
                    <div>
                      <Label>Intent</Label>
                      <select name="intent" className="w-full p-2 border rounded-lg">
                        <option value="informational">Informational</option>
                        <option value="commercial">Commercial</option>
                        <option value="transactional">Transactional</option>
                        <option value="navigational">Navigational</option>
                      </select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select name="priority" className="w-full p-2 border rounded-lg">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="target_flag" id="target_flag" />
                      <Label htmlFor="target_flag">Mark as new target</Label>
                    </div>
                    <Button type="submit" className="w-full">Add Keyword</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {keywords.map((keyword) => (
                <Card key={keyword.id} className="p-4 border-none shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{keyword.keyword}</h3>
                        {keyword.target_flag && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                            Target
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {keyword.intent}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            keyword.priority === 'high' ? 'border-red-300 text-red-700' :
                            keyword.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                            'border-gray-300 text-gray-700'
                          }
                        >
                          {keyword.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {keyword.current_position && (
                          <span>Position: {keyword.current_position}</span>
                        )}
                        {keyword.impressions > 0 && (
                          <span>{keyword.impressions.toLocaleString()} impressions</span>
                        )}
                        {keyword.clicks > 0 && (
                          <span>{keyword.clicks} clicks</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {keywords.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">No keywords yet. Add your first one!</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clusters" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={showClusterDialog} onOpenChange={setShowClusterDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Plus className="w-4 h-4" />
                    Create Cluster
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Topic Cluster</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCluster} className="space-y-4">
                    <div>
                      <Label>Cluster Name</Label>
                      <Input name="name" required placeholder="e.g., MBA Programs" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        name="description" 
                        placeholder="Describe this topic cluster and its content strategy..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select name="priority" className="w-full p-2 border rounded-lg">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">Create Cluster</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {clusters.map((cluster) => (
                <Card key={cluster.id} className="p-6 border-none shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {cluster.name}
                      </h3>
                      {cluster.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {cluster.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline"
                          className={
                            cluster.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            cluster.status === 'planning' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                            'bg-gray-50 text-gray-700 border-gray-300'
                          }
                        >
                          {cluster.status}
                        </Badge>
                        <Badge variant="outline">
                          {cluster.keyword_count || 0} keywords
                        </Badge>
                        <Badge variant="outline">
                          {cluster.article_count || 0} articles
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {clusters.length === 0 && (
                <Card className="p-12 text-center md:col-span-2">
                  <p className="text-gray-500">No topic clusters yet. Create your first one!</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}