import { useMemo, useState } from 'react'
import { diffWords } from 'diff'
import { AnimatePresence } from 'framer-motion'
import {
  Plus,
  Minus,
  ArrowLeftRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  FileText,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

/**
 * Strip HTML tags and normalize whitespace for text comparison
 */
function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate statistics about the diff
 */
function calculateDiffStats(diff) {
  let added = 0
  let removed = 0
  let unchanged = 0

  diff.forEach(part => {
    const wordCount = part.value.split(/\s+/).filter(w => w.length > 0).length
    if (part.added) {
      added += wordCount
    } else if (part.removed) {
      removed += wordCount
    } else {
      unchanged += wordCount
    }
  })

  const total = added + removed + unchanged
  const changePercentage = total > 0 ? Math.round(((added + removed) / (unchanged + removed)) * 100) : 0

  return { added, removed, unchanged, total, changePercentage }
}

/**
 * DiffLine component - renders a single diff part with highlighting
 */
function DiffPart({ part, showAdditions = true, showDeletions = true }) {
  if (part.added && !showAdditions) return null
  if (part.removed && !showDeletions) return null

  return (
    <span
      className={cn(
        'transition-colors',
        part.added && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        part.removed && 'bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300',
        !part.added && !part.removed && 'text-gray-700 dark:text-gray-300'
      )}
    >
      {part.value}
    </span>
  )
}

/**
 * StatsBar - Visual representation of diff statistics
 */
function StatsBar({ stats }) {
  const total = stats.added + stats.removed + stats.unchanged
  if (total === 0) return null

  const addedPercent = (stats.added / total) * 100
  const removedPercent = (stats.removed / total) * 100
  const unchangedPercent = (stats.unchanged / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Plus className="w-3 h-3 text-green-600" />
          <span className="text-green-600 font-medium">{stats.added} added</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-3 h-3 text-red-600" />
          <span className="text-red-600 font-medium">{stats.removed} removed</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowLeftRight className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500">{stats.changePercentage}% changed</span>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${unchangedPercent}%` }}
          transition={{ duration: 0.5 }}
          className="bg-gray-400 h-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${addedPercent}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-green-500 h-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${removedPercent}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-red-500 h-full"
        />
      </div>
    </div>
  )
}

/**
 * SideBySideView - Shows old and new content side by side
 */
function SideBySideView({ diff, showAdditions, showDeletions }) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Old Content */}
      <div className="border rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-red-50 border-b flex items-center gap-2">
          <Minus className="w-4 h-4 text-red-600" />
          <span className="font-medium text-red-800">Original</span>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="prose prose-sm max-w-none">
            {diff.map((part, i) => {
              if (part.added) return null
              return (
                <span
                  key={i}
                  className={cn(
                    part.removed && showDeletions && 'bg-red-100 text-red-800'
                  )}
                >
                  {part.value}
                </span>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* New Content */}
      <div className="border rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-green-50 border-b flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">Revised</span>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="prose prose-sm max-w-none">
            {diff.map((part, i) => {
              if (part.removed) return null
              return (
                <span
                  key={i}
                  className={cn(
                    part.added && showAdditions && 'bg-green-100 text-green-800'
                  )}
                >
                  {part.value}
                </span>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

/**
 * UnifiedView - Shows diff inline with additions and deletions marked
 */
function UnifiedView({ diff, showAdditions, showDeletions }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 prose prose-sm max-w-none leading-relaxed">
        {diff.map((part, i) => (
          <DiffPart
            key={i}
            part={part}
            showAdditions={showAdditions}
            showDeletions={showDeletions}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

/**
 * VersionDiff - Main component for comparing two versions of content
 *
 * @param {string} oldContent - The original HTML content
 * @param {string} newContent - The revised HTML content
 * @param {string} mode - 'unified' or 'split'
 * @param {boolean} expanded - Whether to show in expanded view
 */
export default function VersionDiff({
  oldContent,
  newContent,
  mode: initialMode = 'unified',
  expanded: initialExpanded = false,
  showStats = true,
  maxHeight = '500px',
  className,
}) {
  const [mode, setMode] = useState(initialMode)
  const [showAdditions, setShowAdditions] = useState(true)
  const [showDeletions, setShowDeletions] = useState(true)
  const [expanded, setExpanded] = useState(initialExpanded)

  // Calculate the diff
  const { diff, stats, oldText, newText } = useMemo(() => {
    const oldText = stripHtml(oldContent)
    const newText = stripHtml(newContent)
    const diff = diffWords(oldText, newText)
    const stats = calculateDiffStats(diff)
    return { diff, stats, oldText, newText }
  }, [oldContent, newContent])

  // If content is the same, show a message
  if (oldText === newText) {
    return (
      <div className={cn('rounded-lg border bg-gray-50 p-8 text-center', className)}>
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No differences found</p>
        <p className="text-gray-500 text-sm mt-1">The content is identical</p>
      </div>
    )
  }

  return (
    <motion.div
      layout
      className={cn(
        'rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col',
        expanded && 'fixed inset-4 z-50',
        className
      )}
      style={{ maxHeight: expanded ? 'none' : maxHeight }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">Version Comparison</span>
          <Badge variant="secondary" className="text-xs">
            {stats.changePercentage}% changed
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <TooltipProvider>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'unified' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('unified')}
                    className="rounded-none h-8"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Unified View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'split' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('split')}
                    className="rounded-none h-8"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Side-by-Side View</TooltipContent>
              </Tooltip>
            </div>

            {/* Filter Toggles */}
            <div className="flex items-center gap-1 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showAdditions ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowAdditions(!showAdditions)}
                    className="h-8 gap-1"
                  >
                    <Plus className="w-3 h-3 text-green-600" />
                    {showAdditions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showAdditions ? 'Hide' : 'Show'} Additions
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showDeletions ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowDeletions(!showDeletions)}
                    className="h-8 gap-1"
                  >
                    <Minus className="w-3 h-3 text-red-600" />
                    {showDeletions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showDeletions ? 'Hide' : 'Show'} Deletions
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Expand Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 ml-2"
                >
                  {expanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {expanded ? 'Exit Fullscreen' : 'Fullscreen'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stats Bar */}
      {showStats && (
        <div className="px-4 py-3 border-b bg-gray-50/50">
          <StatsBar stats={stats} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'split' ? (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full p-4"
            >
              <SideBySideView
                diff={diff}
                showAdditions={showAdditions}
                showDeletions={showDeletions}
              />
            </motion.div>
          ) : (
            <motion.div
              key="unified"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <UnifiedView
                diff={diff}
                showAdditions={showAdditions}
                showDeletions={showDeletions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded Overlay Background */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setExpanded(false)}
        />
      )}
    </motion.div>
  )
}

/**
 * QuickDiff - Compact diff preview for version history
 */
export function QuickDiff({ oldContent, newContent, maxLength = 200 }) {
  const { diff, stats, truncatedDiff, isTruncated } = useMemo(() => {
    const oldText = stripHtml(oldContent).substring(0, maxLength * 2)
    const newText = stripHtml(newContent).substring(0, maxLength * 2)
    const diff = diffWords(oldText, newText)
    const stats = calculateDiffStats(diff)

    // Show first few changes
    let charCount = 0
    const truncatedDiff = []
    let isTruncated = false

    for (const part of diff) {
      if (charCount >= maxLength) {
        isTruncated = true
        break
      }
      truncatedDiff.push(part)
      charCount += part.value.length
    }

    return { diff, stats, truncatedDiff, isTruncated }
  }, [oldContent, newContent, maxLength])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-green-600 font-medium">+{stats.added}</span>
        <span className="text-red-600 font-medium">-{stats.removed}</span>
        <span className="text-gray-500">{stats.changePercentage}% changed</span>
      </div>
      <div className="text-sm text-gray-600 line-clamp-3">
        {truncatedDiff.map((part, i) => (
          <span
            key={i}
            className={cn(
              part.added && 'bg-green-100 text-green-700',
              part.removed && 'bg-red-100 text-red-700 line-through'
            )}
          >
            {part.value}
          </span>
        ))}
        {isTruncated && '...'}
      </div>
    </div>
  )
}
