import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  Save,
  Play,
  ArrowRight,
  Tag,
  Eye,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  useUntrainedFeedback,
  useCreateLearningSession,
  useActivateLearningSession,
  useLearningSessionsQuery,
  useActiveLearningSession,
  REJECTION_CATEGORIES,
  DECISION_TYPES,
} from '@/hooks/useIdeaFeedbackHistory'
import { cn } from '@/lib/utils'

// Use the edge function client for Claude
import ClaudeClient from '@/services/ai/claudeClient.edge'

/**
 * AILearningModal - Train the AI idea generator from user feedback
 */
export default function AILearningModal({ open, onOpenChange }) {
  const [step, setStep] = useState('review') // review, analyzing, results, saved
  const [selectedFeedback, setSelectedFeedback] = useState([])
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  const [customNotes, setCustomNotes] = useState('')

  // Data hooks
  const { data: untrainedFeedback = [], isLoading } = useUntrainedFeedback(100)
  const { data: activeLearning } = useActiveLearningSession('idea_generation')
  const { data: previousSessions = [] } = useLearningSessionsQuery('idea_generation')
  const createSession = useCreateLearningSession()
  const activateSession = useActivateLearningSession()

  // Group feedback by decision
  const groupedFeedback = useMemo(() => {
    const approved = untrainedFeedback.filter(f =>
      ['approved', 'thumbs_up'].includes(f.decision)
    )
    const rejected = untrainedFeedback.filter(f =>
      ['rejected', 'thumbs_down'].includes(f.decision)
    )
    return { approved, rejected }
  }, [untrainedFeedback])

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedFeedback(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all
  const selectAll = () => {
    setSelectedFeedback(untrainedFeedback.map(f => f.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedFeedback([])
  }

  // Toggle item expansion
  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Analyze feedback patterns
  const analyzeFeedback = async () => {
    if (selectedFeedback.length === 0) return

    setIsAnalyzing(true)
    setStep('analyzing')

    try {
      const selected = untrainedFeedback.filter(f => selectedFeedback.includes(f.id))

      // Build context for Claude
      const approvedIdeas = selected
        .filter(f => ['approved', 'thumbs_up'].includes(f.decision))
        .map(f => ({
          title: f.idea_title,
          description: f.idea_description,
          source: f.idea_source,
          contentType: f.idea_content_type,
          keywords: f.idea_keywords,
          notes: f.feedback_notes,
        }))

      const rejectedIdeas = selected
        .filter(f => ['rejected', 'thumbs_down'].includes(f.decision))
        .map(f => ({
          title: f.idea_title,
          description: f.idea_description,
          source: f.idea_source,
          contentType: f.idea_content_type,
          keywords: f.idea_keywords,
          category: f.rejection_category,
          reason: f.rejection_reason,
          notes: f.feedback_notes,
        }))

      const claudeClient = new ClaudeClient()
      const analysis = await claudeClient.extractLearningPatterns({
        approvedIdeas,
        rejectedIdeas,
        customNotes,
      })

      setAnalysisResult(analysis)
      setStep('results')
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisResult({
        error: error.message,
        patterns: {
          goodPatterns: [],
          badPatterns: [],
          avoidTopics: [],
          preferredTopics: [],
          titlePatterns: { good: [], bad: [] },
          recommendations: ['Unable to analyze patterns. Please try again.'],
        },
      })
      setStep('results')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save learning session
  const saveLearningSession = async (activate = false) => {
    if (!analysisResult) return

    setIsSaving(true)
    try {
      const session = await createSession.mutateAsync({
        sessionType: 'idea_generation',
        feedbackIds: selectedFeedback,
        originalPrompt: null, // We're not modifying prompts directly yet
        improvedPrompt: analysisResult.improvedPromptAdditions || null,
        improvementNotes: customNotes,
        learnedPatterns: analysisResult.patterns || analysisResult,
      })

      if (activate && session) {
        await activateSession.mutateAsync({
          sessionId: session.id,
          sessionType: 'idea_generation',
        })
      }

      setStep('saved')
    } catch (error) {
      console.error('Failed to save learning session:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset modal state
  const resetModal = () => {
    setStep('review')
    setSelectedFeedback([])
    setAnalysisResult(null)
    setExpandedItems({})
    setCustomNotes('')
  }

  // Handle close
  const handleClose = (open) => {
    if (!open) {
      resetModal()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Train AI Idea Generator
          </DialogTitle>
          <DialogDescription>
            {step === 'review' && 'Review your feedback and train the AI to generate better ideas'}
            {step === 'analyzing' && 'Analyzing patterns in your feedback...'}
            {step === 'results' && 'Review what the AI learned from your feedback'}
            {step === 'saved' && 'Learning session saved successfully!'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 py-3 border-b">
          <StepIndicator
            number={1}
            label="Review Feedback"
            active={step === 'review'}
            completed={step !== 'review'}
          />
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <StepIndicator
            number={2}
            label="Analyze"
            active={step === 'analyzing'}
            completed={step === 'results' || step === 'saved'}
          />
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <StepIndicator
            number={3}
            label="Apply Learning"
            active={step === 'results'}
            completed={step === 'saved'}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 'review' && (
            <ReviewStep
              groupedFeedback={groupedFeedback}
              selectedFeedback={selectedFeedback}
              expandedItems={expandedItems}
              toggleSelection={toggleSelection}
              toggleExpand={toggleExpand}
              selectAll={selectAll}
              clearSelection={clearSelection}
              customNotes={customNotes}
              setCustomNotes={setCustomNotes}
              isLoading={isLoading}
              activeLearning={activeLearning}
            />
          )}

          {step === 'analyzing' && (
            <AnalyzingStep selectedCount={selectedFeedback.length} />
          )}

          {step === 'results' && (
            <ResultsStep
              analysisResult={analysisResult}
              groupedFeedback={groupedFeedback}
              selectedFeedback={selectedFeedback}
            />
          )}

          {step === 'saved' && (
            <SavedStep onClose={() => handleClose(false)} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {step === 'review' && selectedFeedback.length > 0 && (
              <span>{selectedFeedback.length} items selected</span>
            )}
          </div>
          <div className="flex gap-2">
            {step === 'review' && (
              <>
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={analyzeFeedback}
                  disabled={selectedFeedback.length === 0 || isAnalyzing}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Patterns
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {step === 'results' && (
              <>
                <Button variant="outline" onClick={() => setStep('review')}>
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveLearningSession(false)}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save for Later
                </Button>
                <Button
                  onClick={() => saveLearningSession(true)}
                  disabled={isSaving}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Save & Activate
                </Button>
              </>
            )}

            {step === 'saved' && (
              <Button onClick={() => handleClose(false)} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Step indicator component
 */
function StepIndicator({ number, label, active, completed }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
      active && 'bg-purple-100 text-purple-700',
      completed && 'bg-green-100 text-green-700',
      !active && !completed && 'bg-gray-100 text-gray-500'
    )}>
      <span className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium',
        active && 'bg-purple-600 text-white',
        completed && 'bg-green-600 text-white',
        !active && !completed && 'bg-gray-300 text-gray-600'
      )}>
        {completed ? <CheckCircle className="w-3 h-3" /> : number}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  )
}

/**
 * Review Step - Select feedback to analyze
 */
function ReviewStep({
  groupedFeedback,
  selectedFeedback,
  expandedItems,
  toggleSelection,
  toggleExpand,
  selectAll,
  clearSelection,
  customNotes,
  setCustomNotes,
  isLoading,
  activeLearning,
}) {
  const totalCount = groupedFeedback.approved.length + groupedFeedback.rejected.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No untrained feedback available</p>
        <p className="text-sm text-gray-500 mt-1">
          Approve or reject more ideas to build training data
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full">
      {/* Active Learning Session Banner */}
      {activeLearning && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Active Learning Session</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            AI is currently using patterns from {activeLearning.feedback_count} feedback items
          </p>
        </div>
      )}

      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All ({totalCount})
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {groupedFeedback.approved.length} approved, {groupedFeedback.rejected.length} rejected
        </div>
      </div>

      {/* Feedback Lists */}
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-4">
          {/* Approved Section */}
          {groupedFeedback.approved.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 font-medium text-green-700 mb-2">
                <CheckCircle className="w-4 h-4" />
                Approved Ideas ({groupedFeedback.approved.length})
              </h4>
              <div className="space-y-2">
                {groupedFeedback.approved.map(feedback => (
                  <FeedbackItem
                    key={feedback.id}
                    feedback={feedback}
                    selected={selectedFeedback.includes(feedback.id)}
                    expanded={expandedItems[feedback.id]}
                    onToggleSelect={() => toggleSelection(feedback.id)}
                    onToggleExpand={() => toggleExpand(feedback.id)}
                    type="approved"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Section */}
          {groupedFeedback.rejected.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 font-medium text-red-700 mb-2">
                <XCircle className="w-4 h-4" />
                Rejected Ideas ({groupedFeedback.rejected.length})
              </h4>
              <div className="space-y-2">
                {groupedFeedback.rejected.map(feedback => (
                  <FeedbackItem
                    key={feedback.id}
                    feedback={feedback}
                    selected={selectedFeedback.includes(feedback.id)}
                    expanded={expandedItems[feedback.id]}
                    onToggleSelect={() => toggleSelection(feedback.id)}
                    onToggleExpand={() => toggleExpand(feedback.id)}
                    type="rejected"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Custom Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Context (optional)
        </label>
        <Textarea
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Add any additional instructions for the AI to learn from..."
          rows={2}
        />
      </div>
    </div>
  )
}

/**
 * Feedback item in the list
 */
function FeedbackItem({ feedback, selected, expanded, onToggleSelect, onToggleExpand, type }) {
  const Icon = type === 'approved'
    ? (feedback.decision === 'thumbs_up' ? ThumbsUp : CheckCircle)
    : (feedback.decision === 'thumbs_down' ? ThumbsDown : XCircle)

  return (
    <div className={cn(
      'border rounded-lg p-3 transition-colors cursor-pointer',
      selected
        ? type === 'approved'
          ? 'border-green-400 bg-green-50'
          : 'border-red-400 bg-red-50'
        : 'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className={cn(
            'mt-1 w-4 h-4 rounded',
            type === 'approved' ? 'text-green-600' : 'text-red-600'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={cn(
              'w-4 h-4 flex-shrink-0',
              type === 'approved' ? 'text-green-600' : 'text-red-600'
            )} />
            <h5 className="font-medium text-gray-900 truncate">{feedback.idea_title}</h5>
          </div>

          {/* Rejection category */}
          {feedback.rejection_category && (
            <div className="mt-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">
                {REJECTION_CATEGORIES[feedback.rejection_category]?.label}
              </span>
            </div>
          )}

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 text-sm text-gray-600 overflow-hidden"
              >
                {feedback.idea_description && (
                  <p className="mb-2">{feedback.idea_description}</p>
                )}
                {feedback.rejection_reason && (
                  <p className="text-red-600">
                    <strong>Reason:</strong> {feedback.rejection_reason}
                  </p>
                )}
                {feedback.feedback_notes && (
                  <p className="text-gray-500 mt-1">
                    <strong>Notes:</strong> {feedback.feedback_notes}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Analyzing Step - Show loading animation
 */
function AnalyzingStep({ selectedCount }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Brain className="w-16 h-16 text-purple-600" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mt-6">
        Analyzing {selectedCount} Decisions...
      </h3>
      <p className="text-gray-600 mt-2 text-center max-w-md">
        The AI is learning from your feedback patterns to generate better ideas in the future.
      </p>
      <div className="flex gap-2 mt-6">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-purple-600 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          className="w-2 h-2 bg-purple-600 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 bg-purple-600 rounded-full"
        />
      </div>
    </div>
  )
}

/**
 * Results Step - Show what the AI learned
 */
function ResultsStep({ analysisResult, groupedFeedback, selectedFeedback }) {
  const patterns = analysisResult?.patterns || analysisResult || {}

  if (analysisResult?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Analysis Issue</h3>
        <p className="text-gray-600 mt-2 text-center max-w-md">
          {analysisResult.error}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {selectedFeedback.filter(id =>
                groupedFeedback.approved.some(f => f.id === id)
              ).length}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-red-800">
              {selectedFeedback.filter(id =>
                groupedFeedback.rejected.some(f => f.id === id)
              ).length}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Brain className="w-4 h-4" />
              <span className="font-medium">Patterns Found</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">
              {(patterns.goodPatterns?.length || 0) + (patterns.badPatterns?.length || 0)}
            </p>
          </div>
        </div>

        {/* Good Patterns */}
        {patterns.goodPatterns?.length > 0 && (
          <PatternSection
            title="What Works Well"
            icon={<Lightbulb className="w-4 h-4" />}
            items={patterns.goodPatterns}
            color="green"
          />
        )}

        {/* Bad Patterns */}
        {patterns.badPatterns?.length > 0 && (
          <PatternSection
            title="What to Avoid"
            icon={<AlertTriangle className="w-4 h-4" />}
            items={patterns.badPatterns}
            color="red"
          />
        )}

        {/* Preferred Topics */}
        {patterns.preferredTopics?.length > 0 && (
          <PatternSection
            title="Preferred Topics"
            icon={<Target className="w-4 h-4" />}
            items={patterns.preferredTopics}
            color="blue"
            asTags
          />
        )}

        {/* Topics to Avoid */}
        {patterns.avoidTopics?.length > 0 && (
          <PatternSection
            title="Topics to Avoid"
            icon={<X className="w-4 h-4" />}
            items={patterns.avoidTopics}
            color="gray"
            asTags
          />
        )}

        {/* Title Patterns */}
        {(patterns.titlePatterns?.good?.length > 0 || patterns.titlePatterns?.bad?.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Title Patterns
            </h4>
            {patterns.titlePatterns?.good?.length > 0 && (
              <div className="pl-6 space-y-1">
                <p className="text-sm font-medium text-green-700">Good patterns:</p>
                {patterns.titlePatterns.good.map((pattern, i) => (
                  <p key={i} className="text-sm text-gray-600">• {pattern}</p>
                ))}
              </div>
            )}
            {patterns.titlePatterns?.bad?.length > 0 && (
              <div className="pl-6 space-y-1">
                <p className="text-sm font-medium text-red-700">Avoid:</p>
                {patterns.titlePatterns.bad.map((pattern, i) => (
                  <p key={i} className="text-sm text-gray-600">• {pattern}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {patterns.recommendations?.length > 0 && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Recommendations
            </h4>
            <ul className="space-y-2">
              {patterns.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

/**
 * Pattern section component
 */
function PatternSection({ title, icon, items, color, asTags = false }) {
  const colorClasses = {
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
  }

  const titleColors = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    gray: 'text-gray-700',
    purple: 'text-purple-700',
  }

  return (
    <div>
      <h4 className={cn('font-medium mb-2 flex items-center gap-2', titleColors[color])}>
        {icon}
        {title}
      </h4>
      {asTags ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Badge key={i} variant="outline" className={colorClasses[color]}>
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <ul className="space-y-1 pl-6">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-gray-700">• {item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Saved Step - Success confirmation
 */
function SavedStep({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-900 mt-6">
        Learning Session Saved!
      </h3>
      <p className="text-gray-600 mt-2 text-center max-w-md">
        The AI will now use these patterns to generate better content ideas tailored to your preferences.
      </p>
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200 max-w-md">
        <p className="text-sm text-purple-800 flex items-start gap-2">
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Future idea generations will incorporate these learned patterns automatically.
        </p>
      </div>
    </div>
  )
}
