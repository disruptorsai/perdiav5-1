/**
 * AI Training Panel Component
 *
 * Shows all AI revisions for the current article with:
 * - Full context of each revision (what was changed, why)
 * - Training data status (included/excluded)
 * - Delete and rollback functionality
 * - Visual indicators for revision type and quality impact
 */

import { useState } from 'react'
import {
  Brain,
  Trash2,
  RotateCcw,
  RotateCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Sparkles,
  Wand2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useArticleRevisions,
  useDeleteAIRevision,
  useRollbackAIRevision,
  useReapplyAIRevision,
  useToggleTrainingInclusion,
} from '@/hooks/useAIRevisions'
import { cn } from '@/lib/utils'

// Revision type configuration
const REVISION_TYPES = {
  feedback: { label: 'Feedback', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  auto_fix: { label: 'Auto Fix', icon: Wand2, color: 'text-purple-600 bg-purple-50' },
  humanize: { label: 'Humanize', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
  quality_improvement: { label: 'Quality', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
}

/**
 * Single revision card with expandable details
 */
function RevisionCard({
  revision,
  onDelete,
  onRollback,
  onReapply,
  onToggleTraining,
  onContentRestore,
  isDeleting,
  isRollingBack,
  isReapplying,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const typeConfig = REVISION_TYPES[revision.revision_type] || REVISION_TYPES.feedback
  const TypeIcon = typeConfig.icon

  const isRolledBack = !!revision.rolled_back_at
  const commentsCount = revision.comments_snapshot?.length || 0
  const qualityDelta = revision.quality_delta
  const context = revision.article_context || {}

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        isRolledBack ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200',
        !revision.include_in_training && !isRolledBack && 'border-dashed'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-gray-50/50">
            <div className="flex items-start gap-3">
              {/* Expand/collapse icon */}
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* Type icon and info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={cn('text-xs gap-1', typeConfig.color)}>
                    <TypeIcon className="w-3 h-3" />
                    {typeConfig.label}
                  </Badge>

                  {isRolledBack && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Rolled Back
                    </Badge>
                  )}

                  {!revision.include_in_training && !isRolledBack && (
                    <Badge variant="outline" className="text-xs text-amber-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Excluded
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-1">{formatDate(revision.created_at)}</p>

                {/* Summary stats */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {commentsCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
                    </span>
                  )}

                  {qualityDelta && (
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        qualityDelta.improvement > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {qualityDelta.improvement > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {qualityDelta.improvement > 0 ? '+' : ''}
                      {qualityDelta.improvement}%
                    </span>
                  )}

                  {context.word_count_delta && (
                    <span className="text-gray-500">
                      {context.word_count_delta > 0 ? '+' : ''}
                      {context.word_count_delta} words
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {!isRolledBack ? (
                  <>
                    {/* Rollback button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600"
                            onClick={() => onRollback(revision)}
                            disabled={isRollingBack}
                          >
                            {isRollingBack ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rollback this revision</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Delete button with confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Revision?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this revision record. The article content
                            will not be affected, but the training data will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(revision.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  /* Re-apply button for rolled back revisions */
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-green-600"
                          onClick={() => onReapply(revision)}
                          disabled={isReapplying}
                        >
                          {isReapplying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Re-apply this revision</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
            {/* Article context */}
            {(context.title || context.content_type || context.contributor_name) && (
              <div className="p-2 bg-gray-50 rounded text-xs space-y-1">
                <p className="font-medium text-gray-700">Article Context</p>
                {context.content_type && (
                  <p className="text-gray-600">Type: {context.content_type}</p>
                )}
                {context.focus_keyword && (
                  <p className="text-gray-600">Keyword: {context.focus_keyword}</p>
                )}
                {context.contributor_name && (
                  <p className="text-gray-600">Author: {context.contributor_name}</p>
                )}
              </div>
            )}

            {/* Comments that triggered this revision */}
            {commentsCount > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Feedback Applied:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {revision.comments_snapshot.map((comment, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-blue-50 rounded text-xs border-l-2 border-blue-400"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {comment.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {comment.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-600 italic mb-1">"{comment.selected_text}"</p>
                      <p className="text-gray-800">{comment.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="w-3 h-3" />
                {revision.include_in_training
                  ? 'Included in AI training'
                  : 'Excluded from AI training'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onToggleTraining(revision.id, revision.include_in_training)}
              >
                {revision.include_in_training ? 'Exclude' : 'Include'}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Main AI Training Panel component
 */
export function AITrainingPanel({ articleId, content, onContentRestore }) {
  const { data: revisions = [], isLoading } = useArticleRevisions(articleId)
  const deleteRevision = useDeleteAIRevision()
  const rollbackRevision = useRollbackAIRevision()
  const reapplyRevision = useReapplyAIRevision()
  const toggleTraining = useToggleTrainingInclusion()

  const [actioningId, setActioningId] = useState(null)

  const appliedRevisions = revisions.filter((r) => !r.rolled_back_at)
  const rolledBackRevisions = revisions.filter((r) => r.rolled_back_at)
  const trainingCount = revisions.filter((r) => r.include_in_training).length

  const handleDelete = async (revisionId) => {
    setActioningId(revisionId)
    try {
      await deleteRevision.mutateAsync(revisionId)
    } finally {
      setActioningId(null)
    }
  }

  const handleRollback = async (revision) => {
    setActioningId(revision.id)
    try {
      const result = await rollbackRevision.mutateAsync({
        revisionId: revision.id,
        articleId,
      })
      // Restore the previous content
      onContentRestore?.(result.previousContent)
    } finally {
      setActioningId(null)
    }
  }

  const handleReapply = async (revision) => {
    setActioningId(revision.id)
    try {
      const result = await reapplyRevision.mutateAsync({
        revisionId: revision.id,
      })
      // Restore the revised content
      onContentRestore?.(result.revisedContent)
    } finally {
      setActioningId(null)
    }
  }

  const handleToggleTraining = async (revisionId, currentValue) => {
    await toggleTraining.mutateAsync({ revisionId, currentValue })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">AI Training Data</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {trainingCount} of {revisions.length} included
        </Badge>
      </div>

      <p className="text-xs text-gray-600">
        All AI revisions for this article are captured below. Each revision includes the feedback,
        before/after content, and context - used to train and improve AI generation.
      </p>

      {revisions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No AI revisions yet</p>
          <p className="text-xs mt-1">
            Add comments and use AI Revise to start building training data
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-2">
            {/* Applied revisions */}
            {appliedRevisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Applied ({appliedRevisions.length})
                </h4>
                {appliedRevisions.map((revision) => (
                  <RevisionCard
                    key={revision.id}
                    revision={revision}
                    onDelete={handleDelete}
                    onRollback={handleRollback}
                    onReapply={handleReapply}
                    onToggleTraining={handleToggleTraining}
                    onContentRestore={onContentRestore}
                    isDeleting={deleteRevision.isPending && actioningId === revision.id}
                    isRollingBack={rollbackRevision.isPending && actioningId === revision.id}
                    isReapplying={reapplyRevision.isPending && actioningId === revision.id}
                  />
                ))}
              </div>
            )}

            {/* Rolled back revisions */}
            {rolledBackRevisions.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <XCircle className="w-3 h-3" />
                  Rolled Back ({rolledBackRevisions.length})
                </h4>
                {rolledBackRevisions.map((revision) => (
                  <RevisionCard
                    key={revision.id}
                    revision={revision}
                    onDelete={handleDelete}
                    onRollback={handleRollback}
                    onReapply={handleReapply}
                    onToggleTraining={handleToggleTraining}
                    onContentRestore={onContentRestore}
                    isDeleting={deleteRevision.isPending && actioningId === revision.id}
                    isRollingBack={rollbackRevision.isPending && actioningId === revision.id}
                    isReapplying={reapplyRevision.isPending && actioningId === revision.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default AITrainingPanel
