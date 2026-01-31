import { useState } from 'react'
import { format } from 'date-fns'
import {
  MessageSquare,
  Settings,
  FileText,
  Lightbulb,
  RefreshCw,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useUserInputLog,
  useUserInputLogStats,
  useSearchUserInputLog,
  useExportUserInputLog,
  INPUT_TYPES,
} from '@/hooks/useUserInputLog'
import { cn } from '@/lib/utils'

const TYPE_CONFIG = {
  [INPUT_TYPES.ARTICLE_COMMENT]: {
    label: 'Comment',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-700',
  },
  [INPUT_TYPES.REVISION_REQUEST]: {
    label: 'Revision',
    icon: RefreshCw,
    color: 'bg-purple-100 text-purple-700',
  },
  [INPUT_TYPES.REVISION_FEEDBACK]: {
    label: 'Feedback',
    icon: MessageSquare,
    color: 'bg-indigo-100 text-indigo-700',
  },
  [INPUT_TYPES.IDEA_FEEDBACK]: {
    label: 'Idea Feedback',
    icon: Lightbulb,
    color: 'bg-yellow-100 text-yellow-700',
  },
  [INPUT_TYPES.SETTING_CHANGE]: {
    label: 'Setting',
    icon: Settings,
    color: 'bg-gray-100 text-gray-700',
  },
  [INPUT_TYPES.QUALITY_NOTE]: {
    label: 'Quality Note',
    icon: FileText,
    color: 'bg-green-100 text-green-700',
  },
  [INPUT_TYPES.PUBLISH_NOTE]: {
    label: 'Publish Note',
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-700',
  },
  [INPUT_TYPES.GENERAL_NOTE]: {
    label: 'Note',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700',
  },
  [INPUT_TYPES.VERSION_NOTE]: {
    label: 'Version Note',
    icon: FileText,
    color: 'bg-cyan-100 text-cyan-700',
  },
  [INPUT_TYPES.CONTRIBUTOR_NOTE]: {
    label: 'Contributor',
    icon: FileText,
    color: 'bg-orange-100 text-orange-700',
  },
}

function LogEntry({ entry, isExpanded, onToggle }) {
  const config = TYPE_CONFIG[entry.input_type] || TYPE_CONFIG[INPUT_TYPES.GENERAL_NOTE]
  const Icon = config.icon

  return (
    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className={cn('p-2 rounded-lg', config.color)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          <p className={cn('text-sm text-gray-700', !isExpanded && 'line-clamp-2')}>
            {entry.input_text}
          </p>

          {entry.articles?.title && (
            <p className="text-xs text-gray-500 mt-1">
              Article: {entry.articles.title}
            </p>
          )}

          {entry.content_ideas?.title && (
            <p className="text-xs text-gray-500 mt-1">
              Idea: {entry.content_ideas.title}
            </p>
          )}
        </div>

        <button className="p-1 hover:bg-gray-200 rounded">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && entry.input_context && Object.keys(entry.input_context).length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium text-gray-500 mb-2">Context</p>
          <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
            {JSON.stringify(entry.input_context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function AuditLogViewer({ articleId = null, ideaId = null }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Build filters
  const filters = {
    ...(articleId && { articleId }),
    ...(ideaId && { ideaId }),
    ...(selectedType && { inputType: selectedType }),
    ...(searchTerm && { searchTerm }),
  }

  const { data: logs = [], isLoading, refetch } = useUserInputLog(filters)
  const { data: stats } = useUserInputLogStats()
  const { data: searchResults = [] } = useSearchUserInputLog(searchTerm)
  const exportMutation = useExportUserInputLog()

  const displayLogs = searchTerm ? searchResults : logs

  const handleExport = async () => {
    try {
      const exportData = await exportMutation.mutateAsync({})
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-input-log-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Input Log</h3>
          <p className="text-sm text-gray-500">
            {stats?.total || 0} entries logged
            {stats?.recentCount > 0 && ` (${stats.recentCount} in last 7 days)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md bg-white"
            >
              <option value="">All Types</option>
              {Object.entries(INPUT_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {TYPE_CONFIG[value]?.label || value}
                </option>
              ))}
            </select>
            {selectedType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType('')}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Type stats */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => {
            const config = TYPE_CONFIG[type] || TYPE_CONFIG[INPUT_TYPES.GENERAL_NOTE]
            return (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? '' : type)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-all',
                  selectedType === type
                    ? config.color + ' ring-2 ring-offset-1 ring-blue-500'
                    : config.color + ' opacity-75 hover:opacity-100'
                )}
              >
                {config.label}: {count}
              </button>
            )
          })}
        </div>
      )}

      {/* Log entries */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading logs...</div>
        ) : displayLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No logs match your search' : 'No logs found'}
          </div>
        ) : (
          displayLogs.map((entry) => (
            <LogEntry
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
