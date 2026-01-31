import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Search,
  Filter,
  Copy,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useDevFeedback,
  useDevFeedbackStats,
  useUpdateDevFeedbackStatus,
  useDeleteDevFeedback,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
} from '@/hooks/useDevFeedback'
import { generateAndCopyFeedback } from '@/services/feedbackExportService'
import { cn } from '@/lib/utils'

// Category icons
const CATEGORY_ICONS = {
  bug: Bug,
  question: HelpCircle,
  suggestion: Lightbulb,
  confusion: AlertCircle,
  other: MessageSquare,
}

// Category badge colors
const CATEGORY_BADGE_COLORS = {
  bug: 'bg-red-100 text-red-800 border-red-200',
  question: 'bg-blue-100 text-blue-800 border-blue-200',
  suggestion: 'bg-purple-100 text-purple-800 border-purple-200',
  confusion: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

// Status badge colors
const STATUS_BADGE_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  wont_fix: 'bg-gray-100 text-gray-800 border-gray-200',
}

// Status icons
const STATUS_ICONS = {
  pending: Clock,
  reviewed: Eye,
  resolved: CheckCircle,
  wont_fix: XCircle,
}

function DevFeedbackQueue() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [copySuccess, setCopySuccess] = useState(false)
  const [devNotesInput, setDevNotesInput] = useState({})

  // Fetch data
  const { data: feedback = [], isLoading, error } = useDevFeedback()
  const { data: stats = { total: 0, byStatus: {}, byCategory: {} } } = useDevFeedbackStats()

  // Mutations
  const updateStatus = useUpdateDevFeedbackStatus()
  const deleteFeedback = useDeleteDevFeedback()

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    return feedback.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          item.message.toLowerCase().includes(query) ||
          item.page_path?.toLowerCase().includes(query) ||
          item.page_title?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [feedback, statusFilter, categoryFilter, searchQuery])

  // Toggle item expansion
  const toggleExpanded = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Handle status update
  const handleStatusUpdate = async (feedbackId, newStatus) => {
    const notes = devNotesInput[feedbackId]
    await updateStatus.mutateAsync({
      feedbackId,
      status: newStatus,
      developerNotes: notes || undefined,
    })
    // Clear notes input after update
    setDevNotesInput(prev => {
      const next = { ...prev }
      delete next[feedbackId]
      return next
    })
  }

  // Handle delete
  const handleDelete = async (feedbackId) => {
    if (confirm('Are you sure you want to delete this feedback item?')) {
      await deleteFeedback.mutateAsync(feedbackId)
    }
  }

  // Handle copy for Claude
  const handleCopyForClaude = async () => {
    const { success } = await generateAndCopyFeedback(filteredFeedback, stats)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-semibold">Error loading feedback</h3>
          <p className="text-sm mt-1">{error.message}</p>
          <p className="text-xs mt-2 text-red-600">
            Make sure to run the database migration first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dev Feedback Queue</h1>
              <p className="text-gray-600">
                Review and address user feedback ({stats.total} total)
              </p>
            </div>
          </div>

          {/* Copy for Claude Button */}
          <Button
            onClick={handleCopyForClaude}
            variant={copySuccess ? 'default' : 'outline'}
            className={cn(
              'gap-2 transition-all',
              copySuccess && 'bg-green-600 hover:bg-green-700 text-white'
            )}
          >
            {copySuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All for Claude
              </>
            )}
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'p-3 rounded-lg border transition-all text-left',
              statusFilter === 'all'
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </button>
          {Object.entries(FEEDBACK_STATUSES).map(([key, config]) => {
            const count = stats.byStatus?.[key] || 0
            const Icon = STATUS_ICONS[key]
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={cn(
                  'p-3 rounded-lg border transition-all text-left',
                  statusFilter === key
                    ? STATUS_BADGE_COLORS[key]
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="text-xs opacity-75">{config.label}</div>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="all">All Categories</option>
              {Object.entries(FEEDBACK_CATEGORIES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label} ({stats.byCategory?.[key] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No feedback found</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Feedback submitted by users will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredFeedback.map((item) => {
              const isExpanded = expandedItems.has(item.id)
              const CategoryIcon = CATEGORY_ICONS[item.category] || MessageSquare
              const StatusIcon = STATUS_ICONS[item.status] || Clock

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Main row */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Category icon */}
                          <div className={cn(
                            'p-2 rounded-lg',
                            CATEGORY_BADGE_COLORS[item.category]
                          )}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={CATEGORY_BADGE_COLORS[item.category]}
                              >
                                {FEEDBACK_CATEGORIES[item.category]?.label || item.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={STATUS_BADGE_COLORS[item.status]}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {FEEDBACK_STATUSES[item.status]?.label || item.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(item.created_at)}
                              </span>
                            </div>

                            <p className="text-gray-900 line-clamp-2">{item.message}</p>

                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {item.page_path || 'Unknown page'}
                              </span>
                            </div>
                          </div>

                          {/* Expand indicator */}
                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                              {/* Full message */}
                              <div className="bg-gray-50 rounded-lg p-4 mt-4 mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  Full Feedback
                                </h4>
                                <p className="text-gray-900 whitespace-pre-wrap">
                                  {item.message}
                                </p>
                              </div>

                              {/* Developer notes input */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Developer Notes
                                </label>
                                <textarea
                                  value={devNotesInput[item.id] ?? item.developer_notes ?? ''}
                                  onChange={(e) =>
                                    setDevNotesInput(prev => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add notes about how you addressed this feedback..."
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              {/* Metadata */}
                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-500">Page: </span>
                                  <span className="text-gray-900">
                                    {item.page_title || item.page_path}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Path: </span>
                                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                    {item.page_path}
                                  </code>
                                </div>
                                {item.resolved_at && (
                                  <div>
                                    <span className="text-gray-500">Resolved: </span>
                                    <span className="text-gray-900">
                                      {formatDate(item.resolved_at)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(item.id, 'reviewed')}
                                      disabled={updateStatus.isPending}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Mark Reviewed
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                      disabled={updateStatus.isPending}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Mark Resolved
                                    </Button>
                                  </>
                                )}

                                {item.status === 'reviewed' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                      disabled={updateStatus.isPending}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Mark Resolved
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusUpdate(item.id, 'wont_fix')}
                                      disabled={updateStatus.isPending}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Won't Fix
                                    </Button>
                                  </>
                                )}

                                {(item.status === 'resolved' || item.status === 'wont_fix') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(item.id, 'pending')}
                                    disabled={updateStatus.isPending}
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Reopen
                                  </Button>
                                )}

                                <div className="flex-1" />

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deleteFeedback.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default DevFeedbackQueue
