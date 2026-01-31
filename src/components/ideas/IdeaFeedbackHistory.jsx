import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Brain,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles,
  Tag,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useFeedbackHistory,
  useFeedbackStats,
  useUntrainedFeedback,
  REJECTION_CATEGORIES,
  DECISION_TYPES,
} from '@/hooks/useIdeaFeedbackHistory'
import { cn } from '@/lib/utils'

/**
 * Get icon component for decision type
 */
function getDecisionIcon(decision) {
  switch (decision) {
    case 'approved':
      return CheckCircle
    case 'rejected':
      return XCircle
    case 'thumbs_up':
      return ThumbsUp
    case 'thumbs_down':
      return ThumbsDown
    default:
      return AlertCircle
  }
}

/**
 * Get color classes for decision type
 */
function getDecisionColors(decision) {
  switch (decision) {
    case 'approved':
    case 'thumbs_up':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'rejected':
    case 'thumbs_down':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Stats Card - Display a single stat
 */
function StatCard({ label, value, icon: Icon, color = 'gray', trend }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  }

  return (
    <div className={cn('p-4 rounded-lg border', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+{trend}%</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600">{trend}%</span>
            </>
          ) : (
            <span className="text-gray-500">No change</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * FeedbackCard - Individual feedback entry
 */
function FeedbackCard({ feedback, isExpanded, onToggle }) {
  const Icon = getDecisionIcon(feedback.decision)
  const colorClasses = getDecisionColors(feedback.decision)
  const categoryInfo = feedback.rejection_category
    ? REJECTION_CATEGORIES[feedback.rejection_category]
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-lg p-4 transition-all hover:shadow-sm',
        colorClasses
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Decision Icon */}
          <div className={cn('p-2 rounded-full', colorClasses)}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-xs', colorClasses)}>
                {DECISION_TYPES[feedback.decision]?.label || feedback.decision}
              </Badge>
              {feedback.idea_content_type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {feedback.idea_content_type}
                </Badge>
              )}
              {feedback.idea_source && (
                <Badge variant="outline" className="text-xs">
                  {feedback.idea_source}
                </Badge>
              )}
              {feedback.used_for_training && (
                <Badge className="bg-purple-100 text-purple-700 text-xs gap-1">
                  <Brain className="w-3 h-3" />
                  Trained
                </Badge>
              )}
            </div>

            <h4 className="font-medium text-gray-900 mt-2 line-clamp-2">
              {feedback.idea_title}
            </h4>

            {categoryInfo && (
              <div className="mt-2 flex items-center gap-2">
                <Tag className="w-3 h-3 text-gray-500" />
                <span className="text-sm text-gray-600">{categoryInfo.label}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {format(new Date(feedback.decided_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(feedback.id)}
          className="flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t overflow-hidden"
          >
            {feedback.idea_description && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-sm text-gray-600">{feedback.idea_description}</p>
              </div>
            )}

            {feedback.rejection_reason && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason</p>
                <p className="text-sm text-gray-600">{feedback.rejection_reason}</p>
              </div>
            )}

            {feedback.feedback_notes && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{feedback.feedback_notes}</p>
              </div>
            )}

            {feedback.idea_keywords?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {feedback.idea_keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * CategoryBreakdown - Show rejection reasons distribution
 */
function CategoryBreakdown({ byCategory }) {
  const total = Object.values(byCategory).reduce((sum, count) => sum + count, 0)

  if (total === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Rejection Reasons</p>
      {Object.entries(byCategory).map(([category, count]) => {
        const info = REJECTION_CATEGORIES[category]
        const percentage = Math.round((count / total) * 100)

        return (
          <div key={category} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{info?.label || category}</span>
                <span className="text-gray-500">{count} ({percentage}%)</span>
              </div>
              <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * IdeaFeedbackHistory - Main component
 */
export default function IdeaFeedbackHistory({ onStartLearning }) {
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  // Fetch data
  const { data: history = [], isLoading: historyLoading } = useFeedbackHistory({
    decision: filter === 'all' ? null : filter,
    limit: 50,
  })
  const { data: stats, isLoading: statsLoading } = useFeedbackStats()
  const { data: untrainedFeedback = [] } = useUntrainedFeedback(100)

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const isLoading = historyLoading || statsLoading

  return (
    <div className="space-y-6">
      {/* Header with AI Learning Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Feedback History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review past decisions to train the AI for better idea generation
          </p>
        </div>

        {untrainedFeedback.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onStartLearning}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="w-4 h-4" />
                  Train AI
                  <Badge className="bg-white/20 text-white">
                    {untrainedFeedback.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{untrainedFeedback.length} decisions ready for AI learning</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Decisions"
            value={stats.total}
            icon={History}
            color="blue"
          />
          <StatCard
            label="Approved"
            value={(stats.byDecision?.approved || 0) + (stats.byDecision?.thumbs_up || 0)}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Rejected"
            value={(stats.byDecision?.rejected || 0) + (stats.byDecision?.thumbs_down || 0)}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Ready for Training"
            value={stats.untrained}
            icon={Brain}
            color="purple"
          />
        </div>
      )}

      {/* Approval Rate */}
      {stats?.approvalRate !== null && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Approval Rate</span>
              <span className="text-lg font-bold text-gray-900">{stats.approvalRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                style={{ width: `${stats.approvalRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Categories Breakdown */}
      {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why Ideas Get Rejected</CardTitle>
            <CardDescription>
              Understanding rejection patterns helps improve AI idea generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown byCategory={stats.byCategory} />
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by decision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="thumbs_up">Thumbs Up</SelectItem>
            <SelectItem value="thumbs_down">Thumbs Down</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <ScrollArea className="h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No feedback history yet</p>
            <p className="text-sm mt-1">
              Approve or reject ideas to start building training data
            </p>
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {history.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                isExpanded={expandedId === feedback.id}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
