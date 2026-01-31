import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  Loader2,
  FileText,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useGenerationProgress } from '../../contexts/GenerationProgressContext'
import { useToast } from '../ui/toast'

const PIPELINE_STAGES = [
  { id: 'discover', label: 'Discovering Ideas', icon: Sparkles },
  { id: 'filter', label: 'Filtering Duplicates', icon: RefreshCw },
  { id: 'save', label: 'Saving Ideas', icon: FileText },
  { id: 'generate', label: 'Generating Articles', icon: Zap },
  { id: 'qa', label: 'Quality Assurance', icon: CheckCircle },
  { id: 'complete', label: 'Complete', icon: TrendingUp },
]

export default function AutomationEngine({
  onComplete,
  defaultSources = ['reddit', 'news', 'trends'],
}) {
  const { addToast } = useToast()

  // Use global generation progress context
  const {
    isFullAuto,
    autoModeProgress,
    autoModeResults,
    startFullAutoMode,
    stopFullAutoMode,
    activityLog,
    clearLog,
    showWindow,
  } = useGenerationProgress()

  const [settings, setSettings] = useState({
    sources: defaultSources,
    maxIdeas: 10,
    generateImmediately: true,
    niche: 'higher education, online degrees, career development',
  })

  // Determine current stage based on percentage
  const getCurrentStage = useCallback((percentage) => {
    if (percentage < 15) return 'discover'
    if (percentage < 20) return 'filter'
    if (percentage < 25) return 'save'
    if (percentage < 95) return 'generate'
    if (percentage < 100) return 'qa'
    return 'complete'
  }, [])

  const currentStage = autoModeResults
    ? 'complete'
    : isFullAuto
    ? getCurrentStage(autoModeProgress.percentage)
    : null

  // Start the automation pipeline using global context
  const startPipeline = useCallback(() => {
    startFullAutoMode({
      sources: settings.sources,
      maxIdeas: settings.maxIdeas,
      generateImmediately: settings.generateImmediately,
      niche: settings.niche,
    })
    showWindow() // Show the floating progress window

    if (onComplete) {
      // The context will handle completion, but we can still notify the parent
    }
  }, [settings, startFullAutoMode, showWindow, onComplete])

  // Stop the pipeline
  const stopPipeline = useCallback(() => {
    stopFullAutoMode()
  }, [stopFullAutoMode])

  // Use context values for display
  const isRunning = isFullAuto
  const progress = autoModeProgress
  const results = autoModeResults
  const logs = activityLog

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${isRunning ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Zap className={`w-6 h-6 ${isRunning ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Automation Engine</h3>
              <p className="text-sm text-gray-500">
                {isRunning ? 'Pipeline is running...' : 'Ready to start automation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button onClick={startPipeline} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Start Pipeline
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={stopPipeline}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{progress.message}</span>
              <span className="font-medium text-gray-900">{Math.round(progress.percentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Pipeline Stages</h4>
        <div className="flex items-center justify-between">
          {PIPELINE_STAGES.map((stage, index) => {
            const Icon = stage.icon
            const isActive = currentStage === stage.id
            const isComplete = PIPELINE_STAGES.findIndex(s => s.id === currentStage) > index
            const isPending = PIPELINE_STAGES.findIndex(s => s.id === currentStage) < index

            return (
              <div key={stage.id} className="flex items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    opacity: isPending && !isRunning ? 0.5 : 1,
                  }}
                  className={`
                    flex flex-col items-center gap-2 px-3
                    ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'}
                  `}
                >
                  <div className={`
                    p-2 rounded-full
                    ${isActive ? 'bg-blue-100' : isComplete ? 'bg-green-100' : 'bg-gray-100'}
                  `}>
                    {isActive && isRunning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                    ) : isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{stage.label}</span>
                </motion.div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-1 ${isComplete ? 'text-green-400' : 'text-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Results Summary */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h4 className="font-medium text-gray-900 mb-4">Pipeline Results</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{results.discoveredIdeas?.length || 0}</p>
                <p className="text-sm text-blue-700">Ideas Discovered</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{results.generatedArticles?.length || 0}</p>
                <p className="text-sm text-green-700">Articles Generated</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{results.skippedIdeas?.length || 0}</p>
                <p className="text-sm text-yellow-700">Duplicates Skipped</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{results.failedIdeas?.length || 0}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {/* Generated Articles List */}
            {results.generatedArticles?.length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-700 mb-3">Generated Articles</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.generatedArticles.map((article, index) => (
                    <div
                      key={article.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                          {article.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{article.word_count} words</Badge>
                        <Badge className={`
                          ${article.quality_score >= 85 ? 'bg-green-100 text-green-700' :
                            article.quality_score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'}
                        `}>
                          {article.quality_score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Activity Log</h4>
          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLog}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No activity yet</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 py-1 ${
                  log.type === 'error' ? 'text-red-600' :
                  log.type === 'success' ? 'text-green-600' :
                  log.type === 'warning' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}
              >
                <span className="text-gray-400 shrink-0">[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <details className="bg-white rounded-lg border border-gray-200">
        <summary className="p-4 cursor-pointer font-medium text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Pipeline Settings
        </summary>
        <div className="p-4 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Sources
            </label>
            <div className="flex flex-wrap gap-2">
              {['reddit', 'news', 'trends', 'general'].map(source => (
                <button
                  key={source}
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      sources: prev.sources.includes(source)
                        ? prev.sources.filter(s => s !== source)
                        : [...prev.sources, source]
                    }))
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.sources.includes(source)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Ideas per Run
            </label>
            <select
              value={settings.maxIdeas}
              onChange={(e) => setSettings(prev => ({ ...prev, maxIdeas: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={5}>5 ideas</option>
              <option value={10}>10 ideas</option>
              <option value={15}>15 ideas</option>
              <option value={20}>20 ideas</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.generateImmediately}
                onChange={(e) => setSettings(prev => ({ ...prev, generateImmediately: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Generate articles immediately after discovery</span>
            </label>
          </div>
        </div>
      </details>
    </div>
  )
}
