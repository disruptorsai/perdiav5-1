import { formatDistanceToNow } from 'date-fns'
import {
  History,
  RotateCcw,
  X,
  User,
  Clock,
  Tag,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CHANGE_TYPE_STYLES = {
  create: 'bg-green-100 text-green-700 border-green-300',
  update: 'bg-blue-100 text-blue-700 border-blue-300',
  restore: 'bg-purple-100 text-purple-700 border-purple-300',
}

/**
 * VersionHistoryPanel - View and restore previous configuration versions
 */
export default function VersionHistoryPanel({
  history = [],
  currentVersion,
  onRestore,
  onClose,
}) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            Version History
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="divide-y">
            {/* Current version indicator */}
            <div className="p-3 bg-purple-50 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600">Current</Badge>
                <span className="text-sm font-medium">Version {currentVersion}</span>
              </div>
            </div>

            {/* History items */}
            {history.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  'p-3 hover:bg-gray-50 transition-colors',
                  item.version === currentVersion && 'bg-purple-50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Version number and change type */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">v{item.version}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', CHANGE_TYPE_STYLES[item.change_type])}
                      >
                        {item.change_type}
                      </Badge>
                    </div>

                    {/* Version name */}
                    {item.version_name && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                        <Tag className="w-3 h-3" />
                        {item.version_name}
                      </div>
                    )}

                    {/* Change summary */}
                    {item.change_summary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.change_summary}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.changed_by || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Restore button */}
                  {item.version !== currentVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(item.id)}
                      className="flex-shrink-0 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>

                {/* Changes diff preview */}
                {item.changes_diff && Object.keys(item.changes_diff).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <span className="font-medium">Changed: </span>
                    {Object.keys(item.changes_diff).map((key, i) => (
                      <span key={key}>
                        {i > 0 && ', '}
                        <code className="bg-gray-200 px-1 rounded">{key}</code>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {history.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No version history yet</p>
                <p className="text-xs mt-1">Changes will appear here when you save</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
