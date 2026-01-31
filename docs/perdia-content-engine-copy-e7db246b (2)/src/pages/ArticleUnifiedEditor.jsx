import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Send,
  Eye,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Loader2,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import components from ArticleEditor
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ArticleUnifiedEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  const [activeTab, setActiveTab] = useState('edit');
  const [article, setArticle] = useState({
    title: '',
    excerpt: '',
    content: '',
    type: 'guide',
    status: 'draft',
    target_keywords: [],
    seo_title: '',
    seo_description: ''
  });

  // Review tab state
  const [selectedText, setSelectedText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentData, setCommentData] = useState({
    comment: '',
    category: 'style',
    severity: 'moderate'
  });
  const [floatingButtonPos, setFloatingButtonPos] = useState({ x: 0, y: 0, show: false });
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState('');
  const articleContentRef = useRef(null);

  const { data: fetchedArticle, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      const results = await base44.entities.Article.filter({ id: articleId });
      return results[0] || null;
    },
    enabled: !!articleId
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['revisions', articleId],
    queryFn: () => articleId ? base44.entities.ArticleRevision.filter({ article_id: articleId }, '-created_date') : [],
    enabled: !!articleId
  });

  useEffect(() => {
    if (fetchedArticle) {
      setArticle(fetchedArticle);
    }
  }, [fetchedArticle]);

  // Text selection handler for Review tab
  useEffect(() => {
    if (activeTab !== 'review') return;

    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 0 && articleContentRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setFloatingButtonPos({
          x: rect.right + 10,
          y: rect.top + window.scrollY,
          show: true
        });
      } else {
        setSelectedText('');
        setFloatingButtonPos({ x: 0, y: 0, show: false });
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [activeTab]);

  const saveArticleMutation = useMutation({
    mutationFn: async (data) => {
      if (articleId) {
        return await base44.entities.Article.update(articleId, data);
      } else {
        return await base44.entities.Article.create(data);
      }
    },
    onSuccess: (savedArticle) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      if (!articleId) {
        navigate(createPageUrl(`ArticleUnifiedEditor?id=${savedArticle.id}`));
      }
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ArticleRevision.create({
        article_id: articleId,
        revision_type: 'comment',
        selected_text: selectedText,
        comment: data.comment,
        category: data.category,
        severity: data.severity,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      setShowCommentDialog(false);
      setSelectedText('');
      setFloatingButtonPos({ x: 0, y: 0, show: false });
      setCommentData({ comment: '', category: 'style', severity: 'moderate' });
    }
  });

  const reviseArticleMutation = useMutation({
    mutationFn: async () => {
      setRevisionStatus('Analyzing feedback...');
      
      const feedbackItems = revisions.map(r => ({
        selected_text: r.selected_text,
        comment: r.comment,
        category: r.category,
        severity: r.severity
      }));

      setRevisionStatus('Generating revised content...');
      
      const prompt = `You are revising an article for GetEducated.com based on editorial feedback.

ORIGINAL ARTICLE:
Title: ${article.title}
Content Type: ${article.type}

${article.content}

EDITORIAL FEEDBACK (${revisions.length} comments):
${revisions.map((r, i) => `
${i + 1}. [${r.category.toUpperCase()} - ${r.severity}]
   Selected Text: "${r.selected_text}"
   Feedback: ${r.comment}
`).join('\n')}

INSTRUCTIONS:
1. Carefully address EVERY piece of feedback above
2. Maintain GetEducated's professional, helpful tone
3. Keep all H2 headings with id attributes
4. Preserve citations and links
5. Ensure 1500-2500 word count
6. Return revised content in clean HTML

Address each comment systematically while maintaining article quality and structure.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const cleanedResult = result
        .replace(/^Here'?s? (?:a|the) (?:revised|improved|updated).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:revised|improved|updated).*?\.\s*/gi, '')
        .trim();

      setRevisionStatus('Creating training data...');

      await base44.entities.TrainingData.create({
        article_id: articleId,
        article_title: article.title,
        content_type: article.type,
        original_content: article.content,
        revised_content: cleanedResult,
        feedback_items: feedbackItems,
        pattern_type: getMostCommonCategory(revisions),
        lesson_learned: `Revised based on ${revisions.length} editorial comments focusing on ${getMostCommonCategory(revisions)}`,
        status: 'pending_review',
        impact_score: calculateImpactScore(revisions)
      });

      setRevisionStatus('Saving revised article...');

      const newRevisionNumber = (article.revision_number || 0) + 1;

      await base44.entities.Article.update(articleId, {
        content: cleanedResult,
        status: 'in_review',
        revision_number: newRevisionNumber
      });

      await Promise.all(
        revisions.map(r => 
          base44.entities.ArticleRevision.update(r.id, { status: 'addressed' })
        )
      );

      setArticle(prev => ({ ...prev, content: cleanedResult, revision_number: newRevisionNumber }));

      return cleanedResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      setIsRevising(false);
      setRevisionStatus('');
    }
  });

  const getMostCommonCategory = (revisions) => {
    const categories = revisions.map(r => r.category);
    const counts = {};
    categories.forEach(c => counts[c] = (counts[c] || 0) + 1);
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'style_change';
  };

  const calculateImpactScore = (revisions) => {
    const severityScores = { minor: 1, moderate: 3, major: 5, critical: 10 };
    const total = revisions.reduce((sum, r) => sum + (severityScores[r.severity] || 3), 0);
    return Math.min(10, Math.ceil(total / revisions.length));
  };

  const handleSave = () => {
    saveArticleMutation.mutate(article);
  };

  const handleSubmitForReview = () => {
    saveArticleMutation.mutate({ ...article, status: 'in_review' });
  };

  const handleApprove = () => {
    saveArticleMutation.mutate({ ...article, status: 'approved' });
  };

  const handleComment = () => {
    if (!selectedText) {
      alert('Please select some text first');
      return;
    }
    setShowCommentDialog(true);
  };

  const handleSubmitComment = () => {
    if (!commentData.comment.trim()) {
      alert('Please enter a comment');
      return;
    }
    createCommentMutation.mutate(commentData);
  };

  const handleRevise = () => {
    if (revisions.length === 0) {
      alert('No feedback to apply. Add comments first.');
      return;
    }
    setIsRevising(true);
    reviseArticleMutation.mutate();
  };

  const getHighlightedContent = () => {
    if (!article?.content || revisions.length === 0) return article?.content;
    
    let content = article.content;
    const severityHighlightColors = {
      minor: 'rgba(191, 219, 254, 0.3)',
      moderate: 'rgba(254, 243, 199, 0.4)',
      major: 'rgba(254, 215, 170, 0.4)',
      critical: 'rgba(254, 202, 202, 0.5)'
    };
    
    const sortedRevisions = [...revisions].sort((a, b) => 
      (a.selected_text?.length || 0) - (b.selected_text?.length || 0)
    );
    
    sortedRevisions.forEach((revision) => {
      if (revision.selected_text && revision.selected_text.length > 10) {
        const color = severityHighlightColors[revision.severity] || severityHighlightColors.moderate;
        const highlightClass = highlightedCommentId === revision.id ? 'animate-pulse' : '';
        const escapedText = revision.selected_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const replacement = `<mark data-comment-id="${revision.id}" class="comment-highlight ${highlightClass}" style="background-color: ${color}; cursor: pointer; transition: all 0.3s;" title="Click to view comment">${revision.selected_text}</mark>`;
        
        content = content.replace(new RegExp(escapedText, 'i'), replacement);
      }
    });
    
    return content;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
      {/* Floating Comment Button */}
      <AnimatePresence>
        {floatingButtonPos.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              left: floatingButtonPos.x,
              top: floatingButtonPos.y,
              zIndex: 1000
            }}
          >
            <Button
              onClick={handleComment}
              className="bg-blue-500 hover:bg-blue-600 shadow-2xl gap-2"
              size="sm"
            >
              <MessageSquare className="w-4 h-4" />
              Add Comment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Revision Overlay */}
      <AnimatePresence>
        {isRevising && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Revising Article</h3>
                  <p className="text-blue-600 font-medium">{revisionStatus}</p>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Analyzing {revisions.length} editorial comments</p>
                  <p>✓ Preserving structure and citations</p>
                  <p>✓ Creating training data for AI learning</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>Provide feedback on the selected text</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Selected Text:</p>
              <p className="text-sm text-blue-700 italic">"{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}"</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={commentData.category}
                onValueChange={(value) => setCommentData({ ...commentData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="tone">Tone</SelectItem>
                  <SelectItem value="structure">Structure</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="style">Style</SelectItem>
                  <SelectItem value="formatting">Formatting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select
                value={commentData.severity}
                onValueChange={(value) => setCommentData({ ...commentData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Feedback</label>
              <Textarea
                placeholder="Explain what needs to be changed..."
                value={commentData.comment}
                onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCommentDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={createCommentMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(createPageUrl('ContentLibrary'))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{articleId ? 'Edit Article' : 'New Article'}</h1>
              <p className="text-gray-600 mt-1">{article.title || 'Untitled Article'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline" disabled={saveArticleMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            {article.status === 'draft' && (
              <Button onClick={handleSubmitForReview} className="bg-blue-600 hover:bg-blue-700" disabled={saveArticleMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {article.status === 'in_review' && (
              <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700" disabled={saveArticleMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="edit" className="gap-2">
              <Code className="w-4 h-4" />
              Edit Content
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Review Feedback
              {revisions.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{revisions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Edit Content Tab */}
          <TabsContent value="edit" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Article Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={article.title}
                        onChange={(e) => setArticle({ ...article, title: e.target.value })}
                        placeholder="Article title..."
                      />
                    </div>
                    <div>
                      <Label>Excerpt</Label>
                      <Textarea
                        value={article.excerpt}
                        onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                        placeholder="Brief summary..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <ReactQuill
                        value={article.content}
                        onChange={(value) => setArticle({ ...article, content: value })}
                        theme="snow"
                        className="h-96 mb-12"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Content Type</Label>
                      <Select
                        value={article.type}
                        onValueChange={(value) => setArticle({ ...article, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="listicle">Listicle</SelectItem>
                          <SelectItem value="ranking">Ranking</SelectItem>
                          <SelectItem value="career_guide">Career Guide</SelectItem>
                          <SelectItem value="degree_page">Degree Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>SEO Title</Label>
                      <Input
                        value={article.seo_title || ''}
                        onChange={(e) => setArticle({ ...article, seo_title: e.target.value })}
                        placeholder="SEO optimized title..."
                      />
                    </div>
                    <div>
                      <Label>SEO Description</Label>
                      <Textarea
                        value={article.seo_description || ''}
                        onChange={(e) => setArticle({ ...article, seo_description: e.target.value })}
                        placeholder="Meta description..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Review Feedback Tab */}
          <TabsContent value="review" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Article Content</CardTitle>
                    {revisions.length > 0 && (
                      <Button
                        onClick={handleRevise}
                        disabled={isRevising}
                        className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Revise ({revisions.length})
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-lg mb-6">
                      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
                      {article.excerpt && (
                        <p className="text-xl text-blue-100">{article.excerpt}</p>
                      )}
                    </div>
                    <div className="prose max-w-none px-8">
                      <style>{`
                        .article-content ::selection {
                          background-color: #bfdbfe;
                          color: #1e40af;
                        }
                        .article-content mark.comment-highlight {
                          border-radius: 3px;
                          padding: 2px 0;
                          border-bottom: 2px solid rgba(37, 99, 235, 0.3);
                        }
                      `}</style>
                      <div 
                        ref={articleContentRef}
                        className="article-content select-text"
                        dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Comments ({revisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revisions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No comments yet</p>
                        <p className="text-xs mt-2">💡 Highlight text to add feedback</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {revisions.map((revision) => (
                          <div key={revision.id} className="p-3 rounded-lg border bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{revision.category}</Badge>
                              <Badge variant="outline" className="text-xs">{revision.severity}</Badge>
                              {revision.status === 'addressed' && (
                                <Badge className="bg-green-600 text-xs">✓ Addressed</Badge>
                              )}
                            </div>
                            {revision.selected_text && (
                              <p className="text-xs text-gray-700 italic mb-2 border-l-2 border-gray-400 pl-2">
                                "{revision.selected_text.substring(0, 100)}..."
                              </p>
                            )}
                            <p className="text-sm text-gray-900 font-medium">{revision.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-xl">
                <h1 className="text-5xl font-bold mb-4">{article.title}</h1>
                {article.excerpt && (
                  <p className="text-xl text-blue-100">{article.excerpt}</p>
                )}
              </div>
              <CardContent className="p-12">
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}