import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  FileText,
  Search,
  Inbox,
  AlertCircle,
  FolderOpen,
  Users,
  BarChart3,
  Lightbulb,
  Zap,
} from 'lucide-react'
import { Button } from './button'

const icons = {
  file: FileText,
  search: Search,
  inbox: Inbox,
  error: AlertCircle,
  folder: FolderOpen,
  users: Users,
  chart: BarChart3,
  idea: Lightbulb,
  automation: Zap,
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryLabel,
  className = '',
}) {
  const Icon = typeof icon === 'string' ? icons[icon] || Inbox : icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <Icon className="w-8 h-8 text-gray-400" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 max-w-sm mb-6"
        >
          {description}
        </motion.p>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button onClick={action}>{actionLabel || 'Get Started'}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction}>
              {secondaryLabel || 'Learn More'}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// Preset empty states for common scenarios
export function NoArticlesFound({ onCreateNew }) {
  return (
    <EmptyState
      icon="file"
      title="No articles yet"
      description="Get started by creating your first article or generating content from ideas."
      action={onCreateNew}
      actionLabel="Create Article"
    />
  )
}

export function NoSearchResults({ query, onClear }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
      action={onClear}
      actionLabel="Clear Search"
    />
  )
}

export function NoIdeasFound({ onCreateNew }) {
  return (
    <EmptyState
      icon="idea"
      title="No content ideas yet"
      description="Start brainstorming new content ideas or use AI to generate suggestions."
      action={onCreateNew}
      actionLabel="Add Idea"
    />
  )
}

export function NoContributorsFound({ onAddNew }) {
  return (
    <EmptyState
      icon="users"
      title="No contributors configured"
      description="Add AI contributors with unique writing styles to give your content personality."
      action={onAddNew}
      actionLabel="Add Contributor"
    />
  )
}

export function NoDataAvailable() {
  return (
    <EmptyState
      icon="chart"
      title="No data available"
      description="Analytics will appear here once you start creating and publishing content."
    />
  )
}

export function QueueEmpty({ onAddItems }) {
  return (
    <EmptyState
      icon="automation"
      title="Queue is empty"
      description="Add content ideas to the generation queue to start automated article creation."
      action={onAddItems}
      actionLabel="Add to Queue"
    />
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={message || 'An unexpected error occurred. Please try again.'}
      action={onRetry}
      actionLabel="Try Again"
    />
  )
}
