import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useArticleRevisions, useCreateRevision, useBulkMarkAddressed } from '@/hooks/useArticleRevisions'
import { useReviseArticle } from '@/hooks/useGeneration'
import GenerationService from '@/services/generationService'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Loader2,
  Send,
  AlertCircle,
  Sparkles,
  Eye,
  Code,
  FileText,
  RefreshCw
} from 'lucide-react'
import GetEducatedPreview from '@/components/article/GetEducatedPreview'
import { RevisionProgressAnimation } from '@/components/article'

// Comment categories - must match DB CHECK constraint: accuracy, clarity, tone, seo, structure, style, other
const COMMENT_CATEGORIES = [
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'tone', label: 'Tone' },
  { value: 'structure', label: 'Structure' },
  { value: 'seo', label: 'SEO' },
  { value: 'style', label: 'Style' },
  { value: 'other', label: 'Other' }
]

// Severity options - must match DB CHECK constraint: critical, major, minor, suggestion
const SEVERITY_OPTIONS = [
  { value: 'suggestion', label: 'Suggestion', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'minor', label: 'Minor', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'major', label: 'Major', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300' }
]

// Highlight colors for different severity levels - must match DB values
const SEVERITY_HIGHLIGHT_COLORS = {
  suggestion: 'rgba(191, 219, 254, 0.3)',  // Blue for suggestions
  minor: 'rgba(254, 243, 199, 0.4)',        // Amber for minor
  major: 'rgba(254, 215, 170, 0.4)',        // Orange for major
  critical: 'rgba(254, 202, 202, 0.5)'      // Red for critical
}

export default function ArticleReview() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const articleContentRef = useRef(null)

  // State
  const [selectedText, setSelectedText] = useState('')
  const [savedSelectedText, setSavedSelectedText] = useState('')
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentData, setCommentData] = useState({
    comment: '',
    category: 'style',
    severity: 'minor'  // Must match DB CHECK constraint: critical, major, minor, suggestion
  })
  const [viewMode, setViewMode] = useState('preview')
  const [floatingButtonPos, setFloatingButtonPos] = useState({ x: 0, y: 0, show: false })
  const [highlightedCommentId, setHighlightedCommentId] = useState(null)
  const [isRevising, setIsRevising] = useState(false)
  const [revisedContent, setRevisedContent] = useState(null)
  const [revisionFeedbackItems, setRevisionFeedbackItems] = useState([])
  const [originalContentSnapshot, setOriginalContentSnapshot] = useState(null)
  const [isRefreshingRules, setIsRefreshingRules] = useState(false)
  const [validationResult, setValidationResult] = useState(null) // Store AI revision validation result

  // Fetch article
  const { data: article, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_contributors(*)')
        .eq('id', articleId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!articleId,
    retry: (failureCount, error) => {
      // Don't retry if article doesn't exist (PGRST116 = "not found")
      if (error?.code === 'PGRST116') return false
      return failureCount < 2
    }
  })

  // Fetch revisions/comments
  const { data: revisions = [] } = useArticleRevisions(articleId)
  const createRevision = useCreateRevision()
  const bulkMarkAddressed = useBulkMarkAddressed()
  const reviseArticle = useReviseArticle()

  // Text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      if (text.length > 0 && articleContentRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text)
        setSavedSelectedText(text)

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setFloatingButtonPos({
          x: rect.right + 10,
          y: rect.top + window.scrollY,
          show: true
        })
      } else {
        setFloatingButtonPos({ x: 0, y: 0, show: false })
      }
    }

    document.addEventListener('mouseup', handleTextSelection)
    return () => document.removeEventListener('mouseup', handleTextSelection)
  }, [])

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }) => {
      const { error } = await supabase
        .from('articles')
        .update({ status })
        .eq('id', articleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['review-articles'] }) // Invalidate review queue cache
      navigate('/review')
    }
  })

  // Delete mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['review-articles'] }) // Invalidate review queue cache
      navigate('/review')
    }
  })

  const handleComment = () => {
    if (!savedSelectedText) {
      alert('Please select some text first')
      return
    }
    setShowCommentDialog(true)
  }

  const handleSubmitComment = async () => {
    if (!commentData.comment.trim()) {
      alert('Please enter a comment')
      return
    }

    try {
      await createRevision.mutateAsync({
        article_id: articleId,
        revision_type: 'comment',
        selected_text: savedSelectedText,
        comment: commentData.comment,
        category: commentData.category,
        severity: commentData.severity
      })

      setShowCommentDialog(false)
      setSelectedText('')
      setSavedSelectedText('')
      setFloatingButtonPos({ x: 0, y: 0, show: false })
      setCommentData({ comment: '', category: 'style', severity: 'minor' })  // Reset to valid DB value
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  const handleRevise = async () => {
    if (revisions.length === 0) {
      alert('No feedback to apply. Add comments first.')
      return
    }

    // Prepare feedback items - only include PENDING revisions
    const feedbackItems = revisions
      .filter(r => r.status === 'pending')
      .map(r => ({
        id: r.id,
        selected_text: r.selected_text,
        comment: r.comment,
        category: r.category || 'other',  // Fallback for missing category
        severity: r.severity || 'minor'   // Fallback for missing severity
      }))

    // Check if there are any pending items to process
    if (feedbackItems.length === 0) {
      alert('No pending feedback to apply. All comments have already been addressed.')
      return
    }

    // Store original content before any changes
    setOriginalContentSnapshot(article.content)

    // Show animation immediately with feedback items
    setRevisionFeedbackItems(feedbackItems)
    setRevisedContent(null)
    setIsRevising(true)

    try {
      // Call the AI revision - the animation will show analyzing/processing phases
      const result = await reviseArticle.mutateAsync({
        articleId,
        content: article.content,
        feedbackItems
      })

      // When content arrives, update state - animation will transition to "writing" phase
      setRevisedContent(result.content)

      // Store validation result for display
      if (result.validationResult) {
        setValidationResult(result.validationResult)
        console.log('[ArticleReview] Revision validation:', result.validationSummary)
      }
    } catch (error) {
      console.error('Revision error:', error)
      alert('Revision failed: ' + error.message)
      setIsRevising(false)
      setRevisedContent(null)
      setRevisionFeedbackItems([])
      setValidationResult(null)
    }
  }

  // Handler when user accepts the revision
  const handleAcceptRevision = useCallback(async () => {
    try {
      // Invalidate queries to refresh data (revision already saved by mutation)
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['review-articles'] })
      queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })

      // Close the animation and clear state
      setIsRevising(false)
      setRevisedContent(null)
      setRevisionFeedbackItems([])
      setOriginalContentSnapshot(null)
      setValidationResult(null)
    } catch (error) {
      console.error('Error accepting revision:', error)
      alert('Failed to save revision: ' + error.message)
    }
  }, [articleId, queryClient])

  // Handler when user cancels/discards the revision
  const handleCancelRevision = useCallback(async () => {
    // If content was already generated and saved, revert to original
    if (revisedContent && originalContentSnapshot) {
      try {
        // Revert to original content
        await supabase
          .from('articles')
          .update({ content: originalContentSnapshot })
          .eq('id', articleId)

        // Reset revision status back to pending
        await supabase
          .from('article_revisions')
          .update({ status: 'pending', ai_revised: false })
          .eq('article_id', articleId)
          .eq('status', 'addressed')

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['article', articleId] })
        queryClient.invalidateQueries({ queryKey: ['revisions', articleId] })
      } catch (error) {
        console.error('Error reverting changes:', error)
      }
    }

    setIsRevising(false)
    setRevisedContent(null)
    setRevisionFeedbackItems([])
    setOriginalContentSnapshot(null)
    setValidationResult(null)
  }, [revisedContent, originalContentSnapshot, articleId, queryClient])

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'ready_to_publish' })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteArticleMutation.mutate()
    }
  }

  const handleRefreshWithRules = async () => {
    setIsRefreshingRules(true)
    try {
      const generationService = new GenerationService()
      const updatedArticle = await generationService.refreshWithRules(article)

      // Save updated article to database
      const { error } = await supabase
        .from('articles')
        .update({
          content: updatedArticle.content,
          quality_score: updatedArticle.quality_score,
          quality_issues: updatedArticle.quality_issues,
          rules_applied_at: updatedArticle.rules_applied_at,
          rules_version: updatedArticle.rules_version,
        })
        .eq('id', articleId)

      if (error) throw error

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['review-articles'] })
    } catch (error) {
      console.error('Error refreshing with rules:', error)
      alert('Failed to refresh with rules: ' + error.message)
    } finally {
      setIsRefreshingRules(false)
    }
  }

  const handleCommentClick = (comment) => {
    if (!comment.selected_text) return

    setHighlightedCommentId(comment.id)

    // Scroll to the commented section
    if (articleContentRef.current) {
      const walker = document.createTreeWalker(
        articleContentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node
      while ((node = walker.nextNode())) {
        if (node.textContent.includes(comment.selected_text.substring(0, 50))) {
          const element = node.parentElement
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
    }

    setTimeout(() => setHighlightedCommentId(null), 3000)
  }

  // Generate highlighted content
  const getHighlightedContent = () => {
    if (!article?.content || revisions.length === 0) return article?.content

    let content = article.content
    const sortedRevisions = [...revisions]
      .filter(r => r.status === 'pending')
      .sort((a, b) => (a.selected_text?.length || 0) - (b.selected_text?.length || 0))

    sortedRevisions.forEach((revision) => {
      if (revision.selected_text && revision.selected_text.length > 10) {
        const color = SEVERITY_HIGHLIGHT_COLORS[revision.severity] || SEVERITY_HIGHLIGHT_COLORS.minor
        const escapedText = revision.selected_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const replacement = `<mark data-comment-id="${revision.id}" style="background-color: ${color}; cursor: pointer; border-radius: 2px; padding: 0 2px;">${revision.selected_text}</mark>`

        content = content.replace(new RegExp(escapedText, 'i'), replacement)
      }
    })

    return content
  }

  const pendingRevisions = revisions.filter(r => r.status === 'pending')
  const addressedRevisions = revisions.filter(r => r.status === 'addressed')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!article || isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-1">Article not found</p>
          <p className="text-sm text-gray-400 mb-4">
            {isError ? 'This article may have been deleted.' : 'The requested article does not exist.'}
          </p>
          <Button onClick={() => navigate('/review')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
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
                className="bg-blue-500 hover:bg-blue-600 shadow-lg gap-2"
                size="sm"
              >
                <MessageSquare className="w-4 h-4" />
                Add Comment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revision Progress Animation */}
        <AnimatePresence>
          {isRevising && (
            <RevisionProgressAnimation
              originalContent={originalContentSnapshot}
              revisedContent={revisedContent}
              feedbackItems={revisionFeedbackItems}
              isLoading={!revisedContent}
              onAccept={handleAcceptRevision}
              onCancel={handleCancelRevision}
            />
          )}
        </AnimatePresence>

        {/* Comment Dialog */}
        <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Provide feedback on the selected text
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Selected Text:</p>
                <p className="text-sm text-blue-700 italic">
                  "{savedSelectedText.substring(0, 200)}{savedSelectedText.length > 200 ? '...' : ''}"
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <Select
                  value={commentData.category}
                  onValueChange={(value) => setCommentData({ ...commentData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Severity</Label>
                <Select
                  value={commentData.severity}
                  onValueChange={(value) => setCommentData({ ...commentData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map(sev => (
                      <SelectItem key={sev.value} value={sev.value}>
                        {sev.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Your Feedback</Label>
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
                  disabled={createRevision.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Comment
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
              onClick={() => navigate('/review')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Article</h1>
              <p className="text-gray-500 text-sm mt-1">
                Select text to add comments
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <Card className="border-none shadow-sm bg-white sticky top-6 z-10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {article.content_type?.replace(/_/g, ' ') || 'Article'}
                </Badge>
                {article.is_revision && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Revised
                    {article.source_ge_article_id && ' (Catalog)'}
                  </Badge>
                )}
                <Badge variant="outline">
                  {pendingRevisions.length} pending comment{pendingRevisions.length !== 1 ? 's' : ''}
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
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/editor/${articleId}`)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshWithRules}
                  disabled={isRefreshingRules}
                  className="gap-2"
                  title="Re-apply content rules, shortcodes, and refresh internal links"
                >
                  {isRefreshingRules ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Update with Rules
                </Button>
                <Button
                  onClick={handleRevise}
                  disabled={pendingRevisions.length === 0 || isRevising}
                  className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Revise ({pendingRevisions.length})
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
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Article Content */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-sm overflow-hidden">
              {viewMode === 'preview' ? (
                <GetEducatedPreview
                  ref={articleContentRef}
                  article={article}
                  highlightedContent={getHighlightedContent()}
                  onMarkClick={(commentId) => {
                    const comment = revisions.find(r => r.id === commentId)
                    if (comment) handleCommentClick(comment)
                  }}
                />
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
            <Card className="border-none shadow-sm">
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
                    <p className="text-xs mt-2 text-blue-600">
                      Highlight text to add comments
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[calc(100vh-400px)] min-h-[200px]">
                    <div className="space-y-3 pr-4">
                      {revisions.map((revision) => {
                        const isHighlighted = highlightedCommentId === revision.id
                        const isAddressed = revision.status === 'addressed'
                        const severityOption = SEVERITY_OPTIONS.find(s => s.value === revision.severity)

                        return (
                          <motion.div
                            key={revision.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isHighlighted
                                ? 'ring-2 ring-blue-500 border-blue-400'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${isAddressed ? 'opacity-50' : ''}`}
                            style={{
                              backgroundColor: SEVERITY_HIGHLIGHT_COLORS[revision.severity]
                            }}
                            onClick={() => handleCommentClick(revision)}
                            animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize bg-white">
                                  {revision.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${severityOption?.color}`}
                                >
                                  {revision.severity}
                                </Badge>
                                {isAddressed && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-300"
                                  >
                                    Addressed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {revision.selected_text && (
                              <p className="text-xs text-gray-700 italic mb-2 border-l-2 border-gray-400 pl-2 bg-white/50 py-1 rounded">
                                "{revision.selected_text.substring(0, 100)}
                                {revision.selected_text.length > 100 ? '...' : ''}"
                              </p>
                            )}

                            <p className="text-sm text-gray-900 font-medium">
                              {revision.comment}
                            </p>

                            <p className="text-xs text-gray-500 mt-2">
                              {format(new Date(revision.created_at), 'MMM d, h:mm a')}
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* AI Revise Prompt */}
            {pendingRevisions.length > 0 && (
              <Card className="border-none shadow-sm bg-cyan-50 border-2 border-cyan-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-cyan-900 text-sm">
                        Ready to revise
                      </p>
                      <p className="text-xs text-cyan-700 mt-1">
                        Click "AI Revise" to rewrite based on {pendingRevisions.length} comment{pendingRevisions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
