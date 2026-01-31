import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGenerationQueue,
  useQueueStats,
  useBulkAddToQueue,
  useRemoveFromQueue,
  useClearCompleted,
  useRetryQueueItem,
  useUpdateQueuePriority,
} from '@/hooks/useAutomation'
import { useContentIdeas } from '@/hooks/useContentIdeas'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { useGenerationProgress } from '@/contexts/GenerationProgressContext'
import AutomationEngine from '@/components/automation/AutomationEngine'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Icons
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Settings,
  ListChecks,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileText,
  RefreshCcw,
} from 'lucide-react'

// Status configurations
const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-400' },
  processing: { label: 'Processing', icon: Loader2, color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
}

const STAGE_LABELS = {
  drafting: 'Generating draft...',
  humanizing: 'Humanizing content...',
  linking: 'Adding internal links...',
  quality_check: 'Running quality checks...',
  auto_fix: 'Auto-fixing issues...',
  saving: 'Saving article...',
}

export default function Automation() {
  // State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedIdeas, setSelectedIdeas] = useState([])
  const [mode, setMode] = useState('queue') // 'queue' | 'auto' - queue for manual queue, auto for full automation

  // Global generation progress context
  const {
    isProcessing,
    startQueueProcessing,
    stopQueueProcessing,
    showWindow,
  } = useGenerationProgress()

  // Hooks
  const { data: queue = [], isLoading: queueLoading } = useGenerationQueue()
  const stats = useQueueStats()
  const { data: approvedIdeas = [] } = useContentIdeas({ status: 'approved' })
  const { getValue, getBoolValue } = useSettingsMap()

  // Mutations
  const bulkAddMutation = useBulkAddToQueue()
  const removeFromQueueMutation = useRemoveFromQueue()
  const clearCompletedMutation = useClearCompleted()
  const retryMutation = useRetryQueueItem()
  const updatePriorityMutation = useUpdateQueuePriority()

  // Get automation settings
  const autoModeEnabled = getBoolValue('automation_enabled', false)
  const dailyLimit = parseInt(getValue('automation_daily_limit', '10'))
  const qualityThreshold = parseInt(getValue('quality_threshold', '85'))

  // Filter ideas not already in queue
  const availableIdeas = approvedIdeas.filter(
    idea => !queue.some(q => q.content_idea_id === idea.id)
  )

  // Handlers - now use global context
  const handleStart = () => {
    startQueueProcessing()
    showWindow() // Show the floating progress window
  }

  const handleStop = () => {
    stopQueueProcessing()
  }

  const handleAddToQueue = async () => {
    if (selectedIdeas.length === 0) return

    try {
      const items = selectedIdeas.map((ideaId, index) => ({
        contentIdeaId: ideaId,
        priority: selectedIdeas.length - index, // Higher priority for earlier selections
      }))

      await bulkAddMutation.mutateAsync(items)
      setSelectedIdeas([])
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding to queue:', error)
    }
  }

  const handleRemove = async (id) => {
    try {
      await removeFromQueueMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error removing from queue:', error)
    }
  }

  const handleRetry = async (id) => {
    try {
      await retryMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error retrying:', error)
    }
  }

  const handleClearCompleted = async () => {
    try {
      await clearCompletedMutation.mutateAsync()
    } catch (error) {
      console.error('Error clearing completed:', error)
    }
  }

  const handlePriorityChange = async (id, direction) => {
    const item = queue.find(q => q.id === id)
    if (!item) return

    const newPriority = direction === 'up'
      ? item.priority + 1
      : Math.max(0, item.priority - 1)

    try {
      await updatePriorityMutation.mutateAsync({ id, priority: newPriority })
    } catch (error) {
      console.error('Error updating priority:', error)
    }
  }

  const toggleIdeaSelection = (ideaId) => {
    setSelectedIdeas(prev =>
      prev.includes(ideaId)
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
              Automation Engine
            </h1>
            <p className="text-gray-600 text-lg">
              {mode === 'auto'
                ? 'Full automation: Discover ideas and generate articles automatically'
                : 'Queue-based automation: Process approved ideas in sequence'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setMode('queue')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'queue'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListChecks className="w-4 h-4 inline mr-2" />
                Queue Mode
              </button>
              <button
                onClick={() => setMode('auto')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'auto'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Full Auto
              </button>
            </div>
          </div>
        </motion.div>

        {/* Full Auto Mode */}
        {mode === 'auto' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AutomationEngine
              onComplete={(results) => {
                console.log('Automation complete:', results)
              }}
            />
          </motion.div>
        )}

        {/* Queue Mode Controls - only show in queue mode */}
        {mode === 'queue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            {isProcessing ? (
              <Button onClick={handleStop} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={stats.pending === 0}
              >
                <Play className="w-4 h-4" />
                Start Processing
              </Button>
            )}
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </Button>
          </motion.div>
        )}

        {/* Queue Mode Content */}
        {mode === 'queue' && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <ListChecks className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Loader2 className={`w-5 h-5 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Processing</p>
                  <p className="text-xl font-bold text-gray-900">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="text-xl font-bold text-gray-900">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Banner */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-sm bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-medium">
                      Automation is running - Processing {stats.pending} pending items
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                    onClick={showWindow}
                  >
                    View Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Queue List */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generation Queue</CardTitle>
              <CardDescription>
                Articles waiting to be generated or in progress
              </CardDescription>
            </div>
            {stats.completed > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                className="text-gray-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Completed
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Queue is empty
                </h3>
                <p className="text-gray-500 mb-4">
                  Add approved content ideas to start generating articles
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Ideas to Queue
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {queue.map((item, index) => {
                    const statusConfig = STATUS_CONFIG[item.status]
                    const StatusIcon = statusConfig.icon

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                              <StatusIcon className={`w-5 h-5 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {item.content_ideas?.title || 'Untitled'}
                                </h4>
                                {item.priority > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Priority: {item.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {item.content_ideas?.description || 'No description'}
                              </p>

                              {/* Progress for processing items */}
                              {item.status === 'processing' && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>{STAGE_LABELS[item.current_stage] || 'Processing...'}</span>
                                    <span>{item.progress_percentage}%</span>
                                  </div>
                                  <Progress value={item.progress_percentage} className="h-2" />
                                </div>
                              )}

                              {/* Error message for failed items */}
                              {item.status === 'failed' && item.error_message && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                  {item.error_message}
                                </div>
                              )}

                              {/* Timestamps */}
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                {item.started_at && (
                                  <span>Started: {format(new Date(item.started_at), 'HH:mm')}</span>
                                )}
                                {item.completed_at && (
                                  <span>Completed: {format(new Date(item.completed_at), 'HH:mm')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {item.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePriorityChange(item.id, 'up')}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePriorityChange(item.id, 'down')}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.status === 'failed' && (
                                  <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Retry
                                  </DropdownMenuItem>
                                )}
                                {item.status !== 'processing' && (
                                  <DropdownMenuItem
                                    onClick={() => handleRemove(item.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Add to Queue Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Ideas to Queue</DialogTitle>
            <DialogDescription>
              Select approved content ideas to add to the generation queue
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  No approved ideas available. Approve some content ideas first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableIdeas.map(idea => (
                  <div
                    key={idea.id}
                    onClick={() => toggleIdeaSelection(idea.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedIdeas.includes(idea.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedIdeas.includes(idea.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedIdeas.includes(idea.id) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {idea.title}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {idea.description || 'No description'}
                        </p>
                        {idea.seed_topics && idea.seed_topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {idea.seed_topics.slice(0, 3).map((topic, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-gray-500">
              {selectedIdeas.length} idea{selectedIdeas.length !== 1 ? 's' : ''} selected
            </div>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToQueue}
              disabled={selectedIdeas.length === 0 || bulkAddMutation.isPending}
            >
              {bulkAddMutation.isPending ? 'Adding...' : `Add ${selectedIdeas.length} to Queue`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
