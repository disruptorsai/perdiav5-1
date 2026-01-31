import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeftRight,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Radio,
  FileText,
  Zap,
  Edit3,
  Clock,
  AlertTriangle,
  Loader2,
  GitCompare,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import VersionDiff from './VersionDiff'

/**
 * Get version type icon and color
 */
function getVersionTypeConfig(versionType) {
  switch (versionType) {
    case 'original':
      return { icon: FileText, color: 'gray', label: 'Original' }
    case 'ai_revision':
      return { icon: Zap, color: 'purple', label: 'AI Revision' }
    case 'manual_edit':
      return { icon: Edit3, color: 'blue', label: 'Manual Edit' }
    case 'ai_update':
      return { icon: Zap, color: 'green', label: 'AI Update' }
    case 'republished':
      return { icon: Radio, color: 'cyan', label: 'Republished' }
    default:
      return { icon: FileText, color: 'gray', label: versionType }
  }
}

/**
 * VersionSelector - Dropdown for selecting a version
 */
function VersionSelector({
  versions,
  selectedVersionId,
  onSelect,
  currentVersionId,
  label,
  excludeVersionId,
}) {
  const availableVersions = versions.filter(v => v.id !== excludeVersionId)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select
        value={selectedVersionId || ''}
        onValueChange={onSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a version">
            {selectedVersionId && (() => {
              const v = versions.find(ver => ver.id === selectedVersionId)
              if (!v) return 'Select a version'
              const config = getVersionTypeConfig(v.version_type)
              return (
                <div className="flex items-center gap-2">
                  <span>v{v.version_number}</span>
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                  {v.id === currentVersionId && (
                    <Badge className="bg-blue-500 text-xs">Live</Badge>
                  )}
                </div>
              )
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableVersions.map(version => {
            const config = getVersionTypeConfig(version.version_type)
            const Icon = config.icon
            return (
              <SelectItem key={version.id} value={version.id}>
                <div className="flex items-center gap-3 py-1">
                  <div className={`p-1.5 rounded bg-${config.color}-100`}>
                    <Icon className={`w-3 h-3 text-${config.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version_number}</span>
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                      {version.id === currentVersionId && (
                        <Badge className="bg-blue-500 text-xs">Live</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                      {' - '}
                      {version.word_count?.toLocaleString() || 0} words
                    </p>
                  </div>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * VersionComparisonTool - Full-featured version comparison dialog
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {array} versions - Array of version objects
 * @param {string} currentVersionId - ID of the current/live version
 * @param {string} selectedVersionId - ID of the currently selected version for preview
 * @param {function} onRestore - Callback when restoring a version
 * @param {function} onSelect - Callback when selecting a version for preview
 * @param {boolean} isRestoring - Whether a restore operation is in progress
 */
export default function VersionComparisonTool({
  open,
  onOpenChange,
  versions = [],
  currentVersionId,
  selectedVersionId,
  onRestore,
  onSelect,
  isRestoring = false,
}) {
  const [leftVersionId, setLeftVersionId] = useState(null)
  const [rightVersionId, setRightVersionId] = useState(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)

  // Sort versions by version number (newest first)
  const sortedVersions = useMemo(() =>
    [...versions].sort((a, b) => b.version_number - a.version_number),
    [versions]
  )

  // Auto-select versions when opening
  useMemo(() => {
    if (open && sortedVersions.length >= 2) {
      // If there's a selected version different from current, use that
      if (selectedVersionId && selectedVersionId !== currentVersionId) {
        setRightVersionId(selectedVersionId)
        const currentVersion = sortedVersions.find(v => v.id === currentVersionId)
        if (currentVersion) {
          setLeftVersionId(currentVersionId)
        } else {
          setLeftVersionId(sortedVersions[1]?.id || null)
        }
      } else {
        // Default to latest two versions
        setRightVersionId(sortedVersions[0]?.id || null)
        setLeftVersionId(sortedVersions[1]?.id || null)
      }
    }
  }, [open, sortedVersions, selectedVersionId, currentVersionId])

  // Get selected versions
  const leftVersion = sortedVersions.find(v => v.id === leftVersionId)
  const rightVersion = sortedVersions.find(v => v.id === rightVersionId)

  // Quick compare presets
  const handleQuickCompare = useCallback((preset) => {
    switch (preset) {
      case 'latest-vs-original':
        const original = sortedVersions.find(v => v.version_type === 'original')
        const latest = sortedVersions[0]
        if (original && latest) {
          setLeftVersionId(original.id)
          setRightVersionId(latest.id)
        }
        break
      case 'current-vs-latest':
        const current = sortedVersions.find(v => v.id === currentVersionId)
        const newestVersion = sortedVersions[0]
        if (current && newestVersion && current.id !== newestVersion.id) {
          setLeftVersionId(current.id)
          setRightVersionId(newestVersion.id)
        }
        break
      case 'consecutive':
        if (sortedVersions.length >= 2) {
          setLeftVersionId(sortedVersions[1].id)
          setRightVersionId(sortedVersions[0].id)
        }
        break
    }
  }, [sortedVersions, currentVersionId])

  // Handle restore
  const handleRestore = useCallback(() => {
    if (restoreTarget && onRestore) {
      onRestore(restoreTarget)
      setShowRestoreConfirm(false)
      setRestoreTarget(null)
    }
  }, [restoreTarget, onRestore])

  // Swap versions
  const handleSwap = useCallback(() => {
    const temp = leftVersionId
    setLeftVersionId(rightVersionId)
    setRightVersionId(temp)
  }, [leftVersionId, rightVersionId])

  if (versions.length < 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Version Comparison
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Not enough versions to compare.</p>
            <p className="text-sm text-gray-500 mt-1">
              Revise the article to create more versions.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-gray-600" />
              <DialogTitle className="text-lg">Version Comparison</DialogTitle>
              <Badge variant="secondary">
                {versions.length} versions
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Version Selectors */}
          <div className="px-6 py-4 border-b bg-white">
            <div className="flex items-end gap-4">
              {/* Left Version */}
              <div className="flex-1">
                <VersionSelector
                  versions={sortedVersions}
                  selectedVersionId={leftVersionId}
                  onSelect={setLeftVersionId}
                  currentVersionId={currentVersionId}
                  label="Compare From"
                  excludeVersionId={rightVersionId}
                />
              </div>

              {/* Swap Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="mb-0.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>

              {/* Right Version */}
              <div className="flex-1">
                <VersionSelector
                  versions={sortedVersions}
                  selectedVersionId={rightVersionId}
                  onSelect={setRightVersionId}
                  currentVersionId={currentVersionId}
                  label="Compare To"
                  excludeVersionId={leftVersionId}
                />
              </div>
            </div>

            {/* Quick Compare Presets */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">Quick compare:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCompare('latest-vs-original')}
              >
                Latest vs Original
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCompare('current-vs-latest')}
              >
                Live vs Latest
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCompare('consecutive')}
              >
                Last Two Versions
              </Button>
            </div>
          </div>

          {/* Diff Content */}
          <div className="flex-1 overflow-hidden p-6">
            {leftVersion && rightVersion ? (
              <VersionDiff
                oldContent={leftVersion.content_html}
                newContent={rightVersion.content_html}
                oldLabel={`v${leftVersion.version_number} - ${getVersionTypeConfig(leftVersion.version_type).label}`}
                newLabel={`v${rightVersion.version_number} - ${getVersionTypeConfig(rightVersion.version_type).label}`}
                mode="split"
                maxHeight="100%"
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ArrowLeftRight className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Select two versions to compare</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Version Info */}
              {leftVersion && rightVersion && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">v{leftVersion.version_number}</span>
                  <ArrowRight className="w-4 h-4 inline mx-2" />
                  <span className="font-medium">v{rightVersion.version_number}</span>
                  <span className="mx-2">|</span>
                  <span>
                    {Math.abs((rightVersion.word_count || 0) - (leftVersion.word_count || 0)).toLocaleString()} word difference
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Restore Left Version */}
              {leftVersion && leftVersion.id !== currentVersionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRestoreTarget(leftVersion)
                    setShowRestoreConfirm(true)
                  }}
                  disabled={isRestoring}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore v{leftVersion.version_number}
                </Button>
              )}

              {/* Restore Right Version */}
              {rightVersion && rightVersion.id !== currentVersionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRestoreTarget(rightVersion)
                    setShowRestoreConfirm(true)
                  }}
                  disabled={isRestoring}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore v{rightVersion.version_number}
                </Button>
              )}

              {/* Select for Preview */}
              {rightVersion && rightVersion.id !== selectedVersionId && onSelect && (
                <Button
                  onClick={() => {
                    onSelect(rightVersion.id)
                    onOpenChange(false)
                  }}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Select v{rightVersion.version_number} for Preview
                </Button>
              )}

              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              Restore Version
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this version?
            </DialogDescription>
          </DialogHeader>

          {restoreTarget && (
            <div className="py-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  This will make <strong>Version {restoreTarget.version_number}</strong> the current live version.
                  The existing content will be replaced, but all versions remain in history.
                </AlertDescription>
              </Alert>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">
                    v{restoreTarget.version_number}
                  </Badge>
                  <Badge className={`bg-${getVersionTypeConfig(restoreTarget.version_type).color}-500`}>
                    {getVersionTypeConfig(restoreTarget.version_type).label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {restoreTarget.word_count?.toLocaleString() || 0} words
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {format(new Date(restoreTarget.created_at), 'MMM d, yyyy h:mm a')}
                </p>
                {restoreTarget.changes_summary && (
                  <p className="text-sm text-gray-700 mt-2 italic">
                    "{restoreTarget.changes_summary}"
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreConfirm(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Restore Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * CompareButton - Trigger button for opening comparison tool
 */
export function CompareButton({ onClick, disabled = false, size = 'default' }) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <GitCompare className="w-4 h-4" />
      Compare Versions
    </Button>
  )
}
