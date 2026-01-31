import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGenerationProgress } from '../../contexts/GenerationProgressContext'
import { Progress } from './progress'
import { Button } from './button'
import { Badge } from './badge'
import { ScrollArea } from './scroll-area'
import {
  Minimize2,
  Maximize2,
  X,
  Square,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  FileText,
  GripVertical,
  Settings,
  RefreshCw,
  Terminal,
} from 'lucide-react'

// Typewriter step display component
function TypewriterSteps({ steps }) {
  const [displayedSteps, setDisplayedSteps] = useState([])
  const [typingStep, setTypingStep] = useState(null)
  const [typedText, setTypedText] = useState('')
  const containerRef = useRef(null)

  // Typewriter effect for new steps
  useEffect(() => {
    if (steps.length === 0) return

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
  }, [steps, displayedSteps, typingStep])

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
        return <CheckCircle2 className="w-3 h-3 text-green-400" />
      case 'active':
        return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
      case 'error':
        return <XCircle className="w-3 h-3 text-red-400" />
      default:
        return <div className="w-3 h-3 rounded-full border border-gray-500" />
    }
  }

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs"
    >
      {displayedSteps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2 py-0.5"
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
        <div className="flex items-start gap-2 py-0.5">
          <span className="mt-0.5">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          </span>
          <span className="text-blue-400">
            {typedText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-1.5 h-3 bg-blue-400 ml-0.5 align-middle"
            />
          </span>
        </div>
      )}

      {/* Blinking cursor when idle but running */}
      {steps.length === 0 && (
        <div className="flex items-center gap-2 py-0.5">
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-1.5 h-3 bg-gray-400"
          />
          <span className="text-gray-500 italic">Waiting to start...</span>
        </div>
      )}
    </div>
  )
}

export default function FloatingProgressWindow() {
  const {
    // Queue processing
    isProcessing,
    currentProgress,
    processedCount,
    failedCount,
    queueItems,
    stopQueueProcessing,

    // Detailed step tracking
    currentSteps,

    // Full auto mode
    isFullAuto,
    autoModeProgress,
    autoModeResults,
    stopFullAutoMode,

    // Activity log
    activityLog,
    clearLog,

    // UI state
    isMinimized,
    isMaximized,
    isVisible,
    hideWindow,
    toggleMinimize,
    toggleMaximize,

    // Computed
    isActive,
    totalItems,
    completedItems,

    STAGE_LABELS,
  } = useGenerationProgress()

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Show activity log
  const [showLog, setShowLog] = useState(false)

  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (isMaximized) return

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY

    setIsDragging(true)
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    }
  }, [position, isMaximized])

  // Handle drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging || isMaximized) return

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY

    const newX = Math.max(0, Math.min(window.innerWidth - 400, clientX - dragStartRef.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 100, clientY - dragStartRef.current.y))

    setPosition({ x: newX, y: newY })
  }, [isDragging, isMaximized])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)

      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDragMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Determine current mode and progress (define before visibility check for logging)
  const currentMode = isFullAuto ? 'auto' : 'queue'
  const progress = isFullAuto ? autoModeProgress : currentProgress

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`fixed z-[9999] shadow-2xl rounded-lg border border-gray-200 bg-white overflow-hidden ${
          isMaximized
            ? 'inset-4'
            : isDragging
            ? 'cursor-grabbing'
            : ''
        }`}
        style={
          isMaximized
            ? {}
            : {
                left: position.x,
                top: position.y,
                width: isMinimized ? 320 : 400,
              }
        }
      >
        {/* Header - Draggable Area */}
        <div
          ref={dragRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${
            isActive
              ? 'from-blue-600 to-blue-700'
              : 'from-gray-700 to-gray-800'
          } text-white ${!isMaximized ? 'cursor-grab' : ''} select-none`}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 opacity-50" />
            {isActive ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span className="font-semibold text-sm">
              {isFullAuto ? 'Full Auto Pipeline' : 'Queue Processing'}
            </span>
            {isActive && (
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                Running
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={toggleMinimize}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={toggleMaximize}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={hideWindow}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content - Hidden when minimized */}
        {!isMinimized && (
          <div className={`${isMaximized ? 'h-[calc(100%-56px)]' : ''}`}>
            {/* Stats Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">
                    {isFullAuto
                      ? `${autoModeResults?.generatedArticles?.length || 0} generated`
                      : `${completedItems}/${totalItems} processed`}
                  </span>
                </div>
                {processedCount > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">{processedCount}</span>
                  </div>
                )}
                {failedCount > 0 && (
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-600">{failedCount}</span>
                  </div>
                )}
              </div>

              {isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={isFullAuto ? stopFullAutoMode : stopQueueProcessing}
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>

            {/* Main Progress Area */}
            <div className="p-4 space-y-4">
              {isActive || progress.stage === 'error' ? (
                <>
                  {/* Current Item Title */}
                  {progress.title && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {progress.title}
                      </span>
                    </div>
                  )}

                  {/* Stage and Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={progress.stage === 'error' ? 'text-red-600' : 'text-gray-600'}>
                        {STAGE_LABELS[progress.stage] || 'Processing...'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {Math.round(progress.percentage || 0)}%
                      </span>
                    </div>
                    <Progress value={progress.percentage || 0} className="h-2" />
                  </div>

                  {/* Detailed Steps with Typewriter Effect */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Generation Progress</span>
                    </div>
                    <TypewriterSteps steps={currentSteps || []} />
                  </div>

                  {/* Stage Indicator */}
                  {progress.stage && (
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                        progress.stage === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {progress.stage === 'error' ? (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        )}
                      </div>
                      <span className={`text-xs capitalize ${
                        progress.stage === 'error' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {progress.stage.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Zap className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    {autoModeResults
                      ? `Completed! ${autoModeResults.generatedArticles?.length || 0} articles generated`
                      : processedCount > 0
                      ? `Completed! ${processedCount} articles processed`
                      : 'Ready to process'}
                  </p>
                </div>
              )}

              {/* Auto Mode Results Summary */}
              {autoModeResults && !isActive && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-600">
                      {autoModeResults.discoveredIdeas?.length || 0}
                    </p>
                    <p className="text-[10px] text-blue-700">Discovered</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">
                      {autoModeResults.generatedArticles?.length || 0}
                    </p>
                    <p className="text-[10px] text-green-700">Generated</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="text-lg font-bold text-yellow-600">
                      {autoModeResults.skippedIdeas?.length || 0}
                    </p>
                    <p className="text-[10px] text-yellow-700">Skipped</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-600">
                      {autoModeResults.failedIdeas?.length || 0}
                    </p>
                    <p className="text-[10px] text-red-700">Failed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Log Toggle */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowLog(!showLog)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span>Activity Log ({activityLog.length})</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showLog ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Activity Log Content */}
              <AnimatePresence>
                {showLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                        <span className="text-xs font-medium text-gray-600">Recent Activity</span>
                        {activityLog.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-gray-500"
                            onClick={clearLog}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <ScrollArea className={`${isMaximized ? 'h-64' : 'h-40'}`}>
                        <div className="p-2 space-y-1 font-mono text-[10px]">
                          {activityLog.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No activity yet</p>
                          ) : (
                            [...activityLog].reverse().map((log, index) => (
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
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Minimized State - Just show quick status */}
        {isMinimized && isActive && (
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 truncate">
                {progress.message || 'Processing...'}
              </span>
              <span className="font-medium text-gray-900 ml-2">
                {Math.round(progress.percentage)}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-1 mt-1" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
