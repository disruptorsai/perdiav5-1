import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGenerationQueue, useQueueStats, useRetryQueueItem, useClearCompleted } from '../hooks/useAutomation'
import { useGenerationProgress } from '../contexts/GenerationProgressContext'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  FileText,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Terminal,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Link } from 'react-router-dom'

// Typewriter step display component for batch progress
function TypewriterSteps({ steps, isExpanded }) {
  const [displayedSteps, setDisplayedSteps] = useState([])
  const [typingStep, setTypingStep] = useState(null)
  const [typedText, setTypedText] = useState('')
  const containerRef = useRef(null)

  // Typewriter effect for new steps
  useEffect(() => {
    if (!isExpanded || steps.length === 0) return

    // Find new steps that haven't been displayed yet
    const newSteps = steps.filter(
      (step) => !displayedSteps.some((ds) => ds.text === step.text)
    )

    if (newSteps.length > 0 && !typingStep) {
      const stepToType = newSteps[0]
      setTypingStep(stepToType)
      setTypedText('')

      let charIndex = 0
      const typeInterval = setInterval(() => {
        if (charIndex <= stepToType.text.length) {
          setTypedText(stepToType.text.slice(0, charIndex))
          charIndex++
        } else {
          clearInterval(typeInterval)
          setDisplayedSteps((prev) => [...prev, stepToType])
          setTypingStep(null)
          setTypedText('')
        }
      }, 12) // Fast typing speed

      return () => clearInterval(typeInterval)
    }
  }, [steps, displayedSteps, typingStep, isExpanded])

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedSteps, typedText])

  // Reset when steps are cleared
  useEffect(() => {
    if (steps.length === 0) {
      setDisplayedSteps([])
      setTypingStep(null)
      setTypedText('')
    }
  }, [steps])

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
      case 'active':
        return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />
      default:
        return <div className="w-3.5 h-3.5 rounded-full border border-gray-500" />
    }
  }

  if (!isExpanded) return null

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm mt-3"
    >
      {displayedSteps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2 py-1"
        >
          <span className="mt-0.5">{getStepIcon(step.status)}</span>
          <span
            className={`${
              step.status === 'completed'
                ? 'text-green-400'
                : step.status === 'error'
                ? 'text-red-400'
                : 'text-gray-300'
            }`}
          >
            {step.text}
          </span>
        </motion.div>
      ))}

      {/* Currently typing step */}
      {typingStep && (
        <div className="flex items-start gap-2 py-1">
          <span className="mt-0.5">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          </span>
          <span className="text-blue-400">
            {typedText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-blue-400 ml-0.5 align-middle"
            />
          </span>
        </div>
      )}

      {/* Blinking cursor when idle but running */}
      {steps.length === 0 && (
        <div className="flex items-center gap-2 py-1">
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-gray-400"
          />
          <span className="text-gray-500 italic">Waiting for generation to start...</span>
        </div>
      )}
    </div>
  )
}

// Stage labels for display
const STAGE_LABELS = {
  drafting: 'Generating draft',
  humanizing: 'Humanizing content',
  linking: 'Adding internal links',
  quality_check: 'Running quality checks',
  auto_fix: 'Auto-fixing issues',
  saving: 'Saving article',
}

// Status configurations
const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Loader2,
    iconClass: 'text-blue-600 animate-spin',
    bgClass: 'bg-blue-50 border-blue-200',
  },
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    iconClass: 'text-gray-400',
    bgClass: 'bg-gray-50 border-gray-200',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle2,
    iconClass: 'text-green-600',
    bgClass: 'bg-green-50 border-green-200',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50 border-red-200',
  },
}

function QueueItemCard({ item, onRetry, currentSteps, isCurrentItem }) {
  const [isExpanded, setIsExpanded] = useState(item.status === 'processing')
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
  const StatusIcon = config.icon

  const title = item.content_ideas?.title || 'Untitled Article'
  const progress = item.progress_percentage || 0
  const stage = item.current_stage

  // Auto-expand when this item becomes the current processing item
  useEffect(() => {
    if (isCurrentItem && item.status === 'processing') {
      setIsExpanded(true)
    }
  }, [isCurrentItem, item.status])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-lg border ${config.bgClass} overflow-hidden`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={`w-5 h-5 shrink-0 ${config.iconClass}`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{title}</h3>
            {item.status === 'processing' && stage && (
              <p className="text-xs text-gray-500 mt-0.5">
                {STAGE_LABELS[stage] || stage}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {item.status === 'processing' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
              <div className="w-24">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}
          <Badge className={config.color}>{config.label}</Badge>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200/50"
          >
            <div className="p-4 space-y-3 bg-white/30">
              {/* Progress Bar for Processing */}
              {item.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {STAGE_LABELS[stage] || 'Processing...'}
                    </span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />

                  {/* Stage Indicators */}
                  <div className="flex items-center gap-1 pt-2">
                    {Object.keys(STAGE_LABELS).map((s, idx) => {
                      const stageIndex = Object.keys(STAGE_LABELS).indexOf(stage)
                      const currentIndex = idx
                      const isCompleted = currentIndex < stageIndex
                      const isCurrent = s === stage

                      return (
                        <div
                          key={s}
                          className={`flex-1 h-1.5 rounded-full transition-colors ${
                            isCompleted
                              ? 'bg-green-500'
                              : isCurrent
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                          }`}
                          title={STAGE_LABELS[s]}
                        />
                      )
                    })}
                  </div>

                  {/* Detailed Steps with Typewriter Effect */}
                  {isCurrentItem && (
                    <div className="pt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Generation Progress</span>
                      </div>
                      <TypewriterSteps steps={currentSteps || []} isExpanded={isExpanded} />
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {item.content_ideas?.description && (
                <p className="text-sm text-gray-600">
                  {item.content_ideas.description}
                </p>
              )}

              {/* Error Message */}
              {item.status === 'failed' && item.error_message && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {item.error_message}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {item.started_at && (
                  <span>
                    Started: {format(new Date(item.started_at), 'h:mm:ss a')}
                  </span>
                )}
                {item.completed_at && (
                  <span>
                    Finished: {format(new Date(item.completed_at), 'h:mm:ss a')}
                  </span>
                )}
                {!item.started_at && item.created_at && (
                  <span>
                    Queued: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Actions */}
              {item.status === 'failed' && (
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetry(item.id)
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function BatchProgress() {
  const { data: queueItems = [], isLoading, refetch } = useGenerationQueue()
  const stats = useQueueStats()
  const retryMutation = useRetryQueueItem()
  const clearCompletedMutation = useClearCompleted()

  // Get context for controlling the queue
  const {
    isProcessing,
    startQueueProcessing,
    stopQueueProcessing,
    activityLog,
    currentSteps,
    currentItemId,
  } = useGenerationProgress()

  // Auto-scroll effect for processing items
  const processingItem = queueItems.find(item => item.status === 'processing')

  // Group items by status
  const groupedItems = useMemo(() => {
    const groups = {
      processing: [],
      pending: [],
      completed: [],
      failed: [],
    }

    queueItems.forEach(item => {
      if (groups[item.status]) {
        groups[item.status].push(item)
      }
    })

    return groups
  }, [queueItems])

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (queueItems.length === 0) return 0
    const completed = stats.completed + stats.failed
    const currentProgress = processingItem?.progress_percentage || 0
    return Math.round(((completed + currentProgress / 100) / queueItems.length) * 100)
  }, [queueItems.length, stats.completed, stats.failed, processingItem])

  // Handle retry
  const handleRetry = async (id) => {
    await retryMutation.mutateAsync(id)
  }

  // Handle clear completed
  const handleClearCompleted = async () => {
    await clearCompletedMutation.mutateAsync()
  }

  // Check if generation is active
  const isActive = stats.processing > 0 || isProcessing

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">Batch Generation Progress</h1>
                  {isActive && (
                    <Badge className="bg-blue-100 text-blue-700 animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Running
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {queueItems.length === 0
                    ? 'No items in queue'
                    : `${stats.completed} of ${queueItems.length} completed`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-gray-600"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Refresh
              </Button>

              {stats.completed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCompleted}
                  disabled={clearCompletedMutation.isPending}
                  className="text-gray-600"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Clear Completed
                </Button>
              )}

              {stats.pending > 0 && !isActive && (
                <Button
                  size="sm"
                  onClick={startQueueProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Start Processing
                </Button>
              )}

              {isActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopQueueProcessing}
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          {/* Overall Progress Bar */}
          {queueItems.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium text-gray-900">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Loader2 className={`w-5 h-5 text-blue-600 ${isActive ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                <p className="text-xs text-gray-500">Processing</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading queue...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && queueItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Items in Queue</h2>
            <p className="text-gray-500 mb-6">
              Go to the Dashboard and click "Generate All" to add items to the queue.
            </p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Queue Items */}
        {!isLoading && queueItems.length > 0 && (
          <div className="space-y-6">
            {/* Processing Items */}
            {groupedItems.processing.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  Currently Processing
                </h2>
                <div className="space-y-3">
                  {groupedItems.processing.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onRetry={handleRetry}
                      currentSteps={currentSteps}
                      isCurrentItem={item.id === currentItemId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Items */}
            {groupedItems.pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Pending ({groupedItems.pending.length})
                </h2>
                <div className="space-y-3">
                  {groupedItems.pending.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onRetry={handleRetry}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Items */}
            {groupedItems.completed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Completed ({groupedItems.completed.length})
                </h2>
                <div className="space-y-3">
                  {groupedItems.completed.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onRetry={handleRetry}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Failed Items */}
            {groupedItems.failed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Failed ({groupedItems.failed.length})
                </h2>
                <div className="space-y-3">
                  {groupedItems.failed.map(item => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onRetry={handleRetry}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Log Panel */}
        {activityLog.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Activity Log</h3>
              <Badge variant="secondary">{activityLog.length} entries</Badge>
            </div>
            <ScrollArea className="h-48">
              <div className="p-4 space-y-1 font-mono text-xs">
                {[...activityLog].reverse().map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 py-1 px-2 rounded ${
                      log.type === 'error'
                        ? 'bg-red-50 text-red-700'
                        : log.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : log.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'text-gray-600'
                    }`}
                  >
                    <span className="text-gray-400 shrink-0">[{log.timestamp}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
