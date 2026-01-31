import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Loader2,
  Send,
  X,
  AlertCircle,
  Sparkles,
  Eye,
  Code,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ArticleReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  const [selectedText, setSelectedText] = useState('');
  const [savedSelectedText, setSavedSelectedText] = useState('');
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [imageNotes, setImageNotes] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentData, setCommentData] = useState({
    comment: '',
    category: 'style',
    severity: 'moderate'
  });
  const [editingComment, setEditingComment] = useState(null);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState('');
  const [viewMode, setViewMode] = useState('preview');
  const [floatingButtonPos, setFloatingButtonPos] = useState({ x: 0, y: 0, show: false });
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const articleContentRef = useRef(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articleId ? base44.entities.Article.filter({ id: articleId }).then(r => r[0]) : null,
    enabled: !!articleId
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['revisions', articleId],
    queryFn: () => articleId ? base44.entities.ArticleRevision.filter({ article_id: articleId }, '-created_date') : [],
    enabled: !!articleId
  });

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text.length > 0 && articleContentRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        setSavedSelectedText(text); // Save immediately before button click
        
        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position button near the selection
        setFloatingButtonPos({
          x: rect.right + 10,
          y: rect.top + window.scrollY,
          show: true
        });
      } else {
        setFloatingButtonPos({ x: 0, y: 0, show: false });
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      if (editingComment) {
        return await base44.entities.ArticleRevision.update(editingComment.id, {
          comment: data.comment,
          category: data.category,
          severity: data.severity
        });
      }
      return await base44.entities.ArticleRevision.create({
        article_id: articleId,
        revision_type: 'comment',
        selected_text: savedSelectedText,
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
      setSavedSelectedText('');
      setEditingComment(null);
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

      setRevisionStatus('Building revision prompt...');
      
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
4. Preserve BLS citations with dates and links
5. Maintain internal links
6. Keep FAQs if present
7. Ensure 1500-2500 word count
8. Return revised content in clean HTML

Address each comment systematically while maintaining article quality and structure.`;

      setRevisionStatus('Generating revised article...');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      // Clean any AI meta-commentary from revised content
      const cleanedResult = result
        .replace(/^Here'?s? (?:a|the) (?:revised|improved|updated).*?version.*?:?\s*/gi, '')
        .replace(/^I'?ve (?:revised|improved|updated).*?\.\s*/gi, '')
        .replace(/^Below is.*?:?\s*/gi, '')
        .replace(/^Based on.*?feedback.*?:?\s*/gi, '')
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

      // Increment revision number
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

      return cleanedResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      setIsRevising(false);
      setRevisionStatus('');
    },
    onError: () => {
      setIsRevising(false);
      setRevisionStatus('');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }) => base44.entities.Article.update(articleId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate(createPageUrl('ReviewQueue'));
    }
  });

  const deleteArticleMutation = useMutation({
    mutationFn: () => base44.entities.Article.delete(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate(createPageUrl('ReviewQueue'));
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

  const handleComment = () => {
    if (!savedSelectedText && !editingComment) {
      alert('Please select some text first');
      return;
    }
    setShowCommentDialog(true);
  };

  const handleCommentClick = (comment) => {
    if (!comment.selected_text) return;
    
    // Highlight this comment
    setHighlightedCommentId(comment.id);
    
    // Find the text in the article and scroll to it
    if (articleContentRef.current) {
      const articleHTML = articleContentRef.current.innerHTML;
      const textIndex = articleHTML.indexOf(comment.selected_text.substring(0, 50));
      
      if (textIndex !== -1) {
        // Scroll to the commented section
        const walker = document.createTreeWalker(
          articleContentRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes(comment.selected_text.substring(0, 50))) {
            const element = node.parentElement;
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }
    }
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 3000);
  };

  const handleRegenerateImage = async () => {
    setIsRegeneratingImage(true);
    setShowRegenerateDialog(false);

    try {
      const promptResult = await base44.functions.invoke('generateImagePrompt', {
        title: article.title,
        description: article.excerpt,
        excerpt: article.excerpt,
        keywords: article.target_keywords || [],
        contentType: article.type,
        userNotes: imageNotes || undefined
      });

      if (!promptResult.data?.image_prompt) {
        throw new Error('Failed to generate image prompt');
      }

      const imageResult = await base44.functions.invoke('generateFeatureImage', {
        prompt: promptResult.data.image_prompt,
        articleTitle: article.title
      });

      if (!imageResult.data?.file_url) {
        throw new Error('Failed to generate image');
      }

      await base44.entities.Article.update(articleId, {
        feature_image_url: imageResult.data.file_url,
        feature_image_alt_text: promptResult.data.alt_text
      });

      alert('✅ Feature image regenerated successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setImageNotes('');
    } catch (error) {
      alert(`❌ Failed to regenerate image:\n\n${error.message}`);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentData({
      comment: comment.comment,
      category: comment.category,
      severity: comment.severity
    });
    setSavedSelectedText(comment.selected_text);
    setShowCommentDialog(true);
  };

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getRevisedText = (originalText) => {
    // Try to find the revised version of the text in the current article content
    if (!article?.content || !originalText) return null;
    
    // This is a simplified version - in production, you'd want more sophisticated matching
    const words = originalText.split(' ').slice(0, 5).join(' ');
    const contentText = article.content.replace(/<[^>]*>/g, ' ');
    
    if (contentText.includes(words)) {
      // Find surrounding context
      const index = contentText.indexOf(words);
      const start = Math.max(0, index - 20);
      const end = Math.min(contentText.length, index + originalText.length + 50);
      return contentText.substring(start, end).trim();
    }
    
    return "Text has been significantly revised";
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

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'approved' });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteArticleMutation.mutate();
    }
  };

  const severityColors = {
    minor: 'bg-blue-100 text-blue-700 border-blue-300',
    moderate: 'bg-amber-100 text-amber-700 border-amber-300',
    major: 'bg-orange-100 text-orange-700 border-orange-300',
    critical: 'bg-red-100 text-red-700 border-red-300'
  };

  const severityHighlightColors = {
    minor: 'rgba(191, 219, 254, 0.3)',
    moderate: 'rgba(254, 243, 199, 0.4)',
    major: 'rgba(254, 215, 170, 0.4)',
    critical: 'rgba(254, 202, 202, 0.5)'
  };

  // Generate highlighted content with commented sections marked
  const getHighlightedContent = () => {
    if (!article?.content || revisions.length === 0) return article?.content;
    
    let content = article.content;
    const sortedRevisions = [...revisions].sort((a, b) => 
      (a.selected_text?.length || 0) - (b.selected_text?.length || 0)
    );
    
    sortedRevisions.forEach((revision, index) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Loading Overlay for Revision */}
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      AI Revising Article
                    </h3>
                    <p className="text-blue-600 font-medium">
                      {revisionStatus}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Analyzing {revisions.length} editorial comments</p>
                    <p>✓ Preserving structure and citations</p>
                    <p>✓ Creating training data for AI learning</p>
                  </div>
                  <p className="text-xs text-gray-500">This takes 30-60 seconds...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Dialog */}
        <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingComment ? 'Edit Comment' : 'Add Comment'}</DialogTitle>
              <DialogDescription>
                {editingComment ? 'Update your feedback' : 'Provide feedback on the selected text'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Selected Text:</p>
                <p className="text-sm text-blue-700 italic">"{savedSelectedText.substring(0, 200)}{savedSelectedText.length > 200 ? '...' : ''}"</p>
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
                  onClick={() => {
                    setShowCommentDialog(false);
                    setEditingComment(null);
                    setCommentData({ comment: '', category: 'style', severity: 'moderate' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={createCommentMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {editingComment ? 'Update Comment' : 'Submit Comment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(createPageUrl('ReviewQueue'))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
<div>
              <h1 className="text-3xl font-bold text-gray-900">Review Article</h1>
              <p className="text-lg text-gray-700 font-medium mt-1">{article?.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                Select text to add comments • {viewMode === 'preview' ? 'Website Preview' : 'HTML Source'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <Card className="border-none shadow-lg bg-white sticky top-6 z-10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {article.type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline">
                  {revisions.length} comment{revisions.length !== 1 ? 's' : ''}
                </Badge>
                {selectedText && (
                  <Badge className="bg-blue-500 text-white">
                    Text Selected
                  </Badge>
                )}
                <div className="flex gap-1 ml-2">
                  <Button
                    variant={viewMode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('preview')}
                    className="gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant={viewMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('html')}
                    className="gap-1"
                  >
                    <Code className="w-3 h-3" />
                    HTML
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRegenerateDialog(true)}
                  disabled={isRegeneratingImage}
                  variant="outline"
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  size="sm"
                >
                  {isRegeneratingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  Regenerate Image
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl(`ArticleEditor?id=${articleId}`))}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <FileText className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={handleRevise}
                  disabled={revisions.length === 0 || isRevising}
                  className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Revise ({revisions.length})
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Article Content - Website Preview */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg overflow-hidden">
              {viewMode === 'preview' ? (
                <>
                  {/* Article Header - Like GetEducated */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">
                          {article.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-blue-300">•</span>
                        <span className="text-blue-200 text-sm">
                          {new Date(article.created_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                        {article.title}
                      </h1>
                      {article.excerpt && (
                        <p className="text-xl text-blue-100 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Featured Image */}
                  {article.feature_image_url && (
                    <div className="w-full">
                      <img 
                        src={article.feature_image_url} 
                        alt={article.feature_image_alt_text || article.title}
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  )}

                  {/* Article Body - GetEducated Style */}
                  <CardContent className="p-0">
                    <div className="max-w-4xl mx-auto px-8 py-12">
                      <style>{`
                        .article-content {
                          font-family: Georgia, 'Times New Roman', serif;
                          font-size: 18px;
                          line-height: 1.8;
                          color: #1f2937;
                        }
                        
                        /* Headings */
                        .article-content h1 {
                          font-size: 36px;
                          font-weight: 700;
                          margin-top: 48px;
                          margin-bottom: 24px;
                          color: #111827;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          line-height: 1.2;
                        }
                        .article-content h2 {
                          font-size: 32px;
                          font-weight: 700;
                          margin-top: 48px;
                          margin-bottom: 24px;
                          color: #111827;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          line-height: 1.2;
                          border-bottom: 2px solid #e5e7eb;
                          padding-bottom: 12px;
                        }
                        .article-content h3 {
                          font-size: 24px;
                          font-weight: 600;
                          margin-top: 36px;
                          margin-bottom: 16px;
                          color: #1f2937;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          line-height: 1.3;
                        }
                        .article-content h4 {
                          font-size: 20px;
                          font-weight: 600;
                          margin-top: 28px;
                          margin-bottom: 14px;
                          color: #374151;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        .article-content h5 {
                          font-size: 18px;
                          font-weight: 600;
                          margin-top: 24px;
                          margin-bottom: 12px;
                          color: #4b5563;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        
                        /* Paragraphs */
                        .article-content p {
                          margin-bottom: 20px;
                          line-height: 1.8;
                        }
                        .article-content p:last-child {
                          margin-bottom: 0;
                        }
                        
                        /* Links */
                        .article-content a {
                          color: #2563eb;
                          text-decoration: none;
                          border-bottom: 1px solid #93c5fd;
                          transition: all 0.2s;
                        }
                        .article-content a:hover {
                          color: #1d4ed8;
                          border-bottom-color: #2563eb;
                        }
                        
                        /* Text formatting */
                        .article-content strong, 
                        .article-content b {
                          font-weight: 700;
                          color: #111827;
                        }
                        .article-content em, 
                        .article-content i {
                          font-style: italic;
                        }
                        
                        /* Lists */
                        .article-content ul, 
                        .article-content ol {
                          margin-bottom: 24px;
                          padding-left: 32px;
                        }
                        .article-content ul {
                          list-style-type: disc;
                        }
                        .article-content ol {
                          list-style-type: decimal;
                        }
                        .article-content li {
                          margin-bottom: 12px;
                          line-height: 1.8;
                          padding-left: 8px;
                        }
                        .article-content li p {
                          margin-bottom: 8px;
                        }
                        .article-content ul ul,
                        .article-content ol ol,
                        .article-content ul ol,
                        .article-content ol ul {
                          margin-top: 12px;
                          margin-bottom: 12px;
                        }
                        
                        /* Blockquotes */
                        .article-content blockquote {
                          border-left: 4px solid #2563eb;
                          padding-left: 24px;
                          padding-top: 8px;
                          padding-bottom: 8px;
                          margin: 32px 0;
                          font-style: italic;
                          color: #4b5563;
                          background-color: #f9fafb;
                          border-radius: 0 4px 4px 0;
                        }
                        .article-content blockquote p {
                          margin-bottom: 12px;
                        }
                        .article-content blockquote p:last-child {
                          margin-bottom: 0;
                        }
                        
                        /* Tables */
                        .article-content table {
                          width: 100%;
                          border-collapse: collapse;
                          margin: 32px 0;
                          font-size: 16px;
                          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                          border-radius: 8px;
                          overflow: hidden;
                        }
                        .article-content thead {
                          background-color: #f3f4f6;
                        }
                        .article-content th {
                          background-color: #f3f4f6;
                          padding: 16px;
                          text-align: left;
                          font-weight: 600;
                          border-bottom: 2px solid #e5e7eb;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          color: #111827;
                        }
                        .article-content td {
                          padding: 16px;
                          border-bottom: 1px solid #e5e7eb;
                        }
                        .article-content tr:last-child td {
                          border-bottom: none;
                        }
                        .article-content tbody tr:hover {
                          background-color: #f9fafb;
                        }
                        
                        /* Images */
                        .article-content img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 8px;
                          margin: 32px 0;
                          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        }
                        
                        /* Horizontal Rules */
                        .article-content hr {
                          border: none;
                          border-top: 2px solid #e5e7eb;
                          margin: 48px 0;
                        }
                        
                        /* Code */
                        .article-content code {
                          background-color: #f3f4f6;
                          padding: 3px 8px;
                          border-radius: 4px;
                          font-family: 'Courier New', Courier, monospace;
                          font-size: 16px;
                          color: #dc2626;
                        }
                        .article-content pre {
                          background-color: #1f2937;
                          color: #f9fafb;
                          padding: 20px;
                          border-radius: 8px;
                          overflow-x: auto;
                          margin: 28px 0;
                          line-height: 1.6;
                        }
                        .article-content pre code {
                          background-color: transparent;
                          padding: 0;
                          color: inherit;
                          font-size: 14px;
                        }
                        
                        /* Dividers and spacing */
                        .article-content > *:first-child {
                          margin-top: 0 !important;
                        }
                        .article-content > *:last-child {
                          margin-bottom: 0 !important;
                        }
                        
                        /* Selection highlighting for commenting */
                        .article-content ::selection {
                          background-color: #bfdbfe;
                          color: #1e40af;
                        }
                        
                        /* Commented text highlights */
                        .article-content mark.comment-highlight {
                          border-radius: 3px;
                          padding: 2px 0;
                          border-bottom: 2px solid rgba(37, 99, 235, 0.3);
                        }
                        .article-content mark.comment-highlight:hover {
                          filter: brightness(0.95);
                        }
                        
                        /* Special formatting for statistics/data boxes */
                        .article-content .stats-box,
                        .article-content [style*="background"] {
                          background-color: #f0f9ff;
                          border: 2px solid #bfdbfe;
                          padding: 20px;
                          border-radius: 8px;
                          margin: 28px 0;
                        }
                        
                        /* FAQ sections */
                        .article-content details {
                          margin-bottom: 16px;
                          border: 1px solid #e5e7eb;
                          border-radius: 8px;
                          padding: 16px;
                        }
                        .article-content summary {
                          font-weight: 600;
                          cursor: pointer;
                          color: #1f2937;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        .article-content details[open] summary {
                          margin-bottom: 12px;
                          color: #2563eb;
                        }
                      `}</style>
                      <div 
                        ref={articleContentRef}
                        className="article-content select-text"
                        dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
                        onClick={(e) => {
                          const mark = e.target.closest('mark[data-comment-id]');
                          if (mark) {
                            const commentId = mark.getAttribute('data-comment-id');
                            const comment = revisions.find(r => r.id === commentId);
                            if (comment) handleCommentClick(comment);
                          }
                        }}
                      />
                    </div>
                  </CardContent>

                  {/* Article Footer - Author & Metadata */}
                  <div className="border-t bg-gray-50 px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>📝 {article.word_count?.toLocaleString() || 0} words</span>
                          <span>•</span>
                          <span>Updated {new Date(article.updated_date || article.created_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {article.schema_valid && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                              ✓ Schema Valid
                            </Badge>
                          )}
                          {article.shortcode_valid && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              ✓ Compliant
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* HTML Source View */
                <CardContent className="p-6">
                  <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-[800px]">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                      {article.content}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Comments Sidebar */}
          <div className="space-y-4">
            <Card className="border-none shadow-lg">
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
                    <p className="text-xs mt-2">💡 Highlight any text in the article</p>
                    <p className="text-xs text-blue-600 mt-1">A floating button will appear!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {revisions.map((revision) => {
                      const bgColor = severityHighlightColors[revision.severity] || severityHighlightColors.moderate;
                      const isHighlighted = highlightedCommentId === revision.id;
                      const isAddressed = revision.status === 'addressed';
                      const isExpanded = expandedComments[revision.id];
                      const revisedText = isAddressed ? getRevisedText(revision.selected_text) : null;
                      
                      return (
                        <motion.div 
                          key={revision.id} 
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all group ${
                            isHighlighted ? 'ring-2 ring-blue-500 border-blue-400' : 'border-gray-200'
                          } ${isAddressed ? 'opacity-40 hover:opacity-100' : ''}`}
                          style={{ backgroundColor: bgColor }}
                          onClick={() => handleCommentClick(revision)}
                          animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize bg-white">
                                {revision.category}
                              </Badge>
                              <Badge variant="outline" className={`${severityColors[revision.severity]} border text-xs`}>
                                {revision.severity}
                              </Badge>
                              {isAddressed && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                  ✓ Addressed
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {isAddressed && revision.selected_text && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCommentExpansion(revision.id);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  {isExpanded ? 'Hide' : 'Before/After'}
                                </Button>
                              )}
                              {!isAddressed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditComment(revision);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {revision.selected_text && !isExpanded && (
                            <p className="text-xs text-gray-700 italic mb-2 border-l-2 border-gray-400 pl-2 bg-white/50 py-1 rounded">
                              "{revision.selected_text.substring(0, 100)}{revision.selected_text.length > 100 ? '...' : ''}"
                            </p>
                          )}

                          {isExpanded && revision.selected_text && (
                            <div className="space-y-2 mb-2">
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs font-semibold text-red-800 mb-1">Before:</p>
                                <p className="text-xs text-red-900 italic">
                                  "{revision.selected_text}"
                                </p>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-xs font-semibold text-green-800 mb-1">After:</p>
                                <p className="text-xs text-green-900 italic">
                                  "{revisedText || 'Content revised'}"
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-900 font-medium">
                            {revision.comment}
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            {new Date(revision.created_date).toLocaleDateString()}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {revisions.length > 0 && (
              <Card className="border-none shadow-lg bg-cyan-50 border-2 border-cyan-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-cyan-900 text-sm">
                        Ready to revise
                      </p>
                      <p className="text-xs text-cyan-700 mt-1">
                        Click "AI Revise" to let AI rewrite the article based on all {revisions.length} comment{revisions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Regenerate Image Dialog */}
        <AnimatePresence>
          {showRegenerateDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRegenerateDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Regenerate Feature Image</h3>
                    <p className="text-sm text-gray-600">Optional: Add notes about what you want</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Image Notes (Optional)</Label>
                    <Textarea
                      value={imageNotes}
                      onChange={(e) => setImageNotes(e.target.value)}
                      placeholder="e.g., Include diverse students, modern classroom setting, warm colors..."
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Leave blank to use the article's content for automatic generation
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRegenerateDialog(false);
                        setImageNotes('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegenerateImage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Generate Image
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}