import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import GenerationService from '../services/generationService'
import { useAuth } from './AuthContext'

const GenerationProgressContext = createContext({})

export const useGenerationProgress = () => {
  const context = useContext(GenerationProgressContext)
  if (!context) {
    throw new Error('useGenerationProgress must be used within a GenerationProgressProvider')
  }
  return context
}

// Status configurations for queue items
const STAGE_LABELS = {
  drafting: 'Generating draft...',
  humanizing: 'Humanizing content...',
  linking: 'Adding internal links...',
  quality_check: 'Running quality checks...',
  auto_fix: 'Auto-fixing issues...',
  saving: 'Saving article...',
}

export function GenerationProgressProvider({ children }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const generationServiceRef = useRef(new GenerationService())

  // Queue processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentItemId, setCurrentItemId] = useState(null)
  const [queueItems, setQueueItems] = useState([])
  const [processedCount, setProcessedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  // Current item progress
  const [currentProgress, setCurrentProgress] = useState({
    stage: null,
    percentage: 0,
    message: '',
    title: '',
  })

  // Detailed step tracking for typewriter effect (like single article generation)
  const [currentSteps, setCurrentSteps] = useState([])

  // Full auto mode state
  const [isFullAuto, setIsFullAuto] = useState(false)
  const [autoModeProgress, setAutoModeProgress] = useState({
    stage: null,
    percentage: 0,
    message: '',
  })
  const [autoModeResults, setAutoModeResults] = useState(null)

  // Activity log for detailed view
  const [activityLog, setActivityLog] = useState([])

  // UI state
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Refs for control
  const shouldStopRef = useRef(false)
  const processingRef = useRef(false)

  // Add log entry
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setActivityLog(prev => [...prev.slice(-99), { timestamp, message, type }])
  }, [])

  // Add step for typewriter effect
  const addStep = useCallback((text, status = 'active') => {
    setCurrentSteps(prev => {
      // Check if this step already exists
      const exists = prev.some(s => s.text === text)
      if (exists) {
        // Update existing step status
        return prev.map(s => s.text === text ? { ...s, status } : s)
      }
      // Add new step
      return [...prev, { text, status, timestamp: Date.now() }]
    })
  }, [])

  // Complete a step
  const completeStep = useCallback((text) => {
    setCurrentSteps(prev => prev.map(s =>
      s.text === text ? { ...s, status: 'completed' } : s
    ))
  }, [])

  // Clear steps (for new article)
  const clearSteps = useCallback(() => {
    setCurrentSteps([])
  }, [])

  // Clear log
  const clearLog = useCallback(() => {
    setActivityLog([])
  }, [])

  // Fetch queue items from database
  const fetchQueueItems = useCallback(async () => {
    if (!user) return []

    const { data, error } = await supabase
      .from('generation_queue')
      .select('*, content_ideas(title, description, seed_topics)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching queue:', error)
      return []
    }

    return data || []
  }, [user])

  // Update queue item status in database
  const updateQueueItemStatus = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('generation_queue')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating queue item:', error)
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['generation-queue'] })
  }, [queryClient])

  // Process a single queue item
  const processQueueItem = useCallback(async (item) => {
    if (!user || shouldStopRef.current) return false

    setCurrentItemId(item.id)
    clearSteps() // Clear previous steps for new article
    setCurrentProgress({
      stage: 'drafting',
      percentage: 0,
      message: 'Starting generation...',
      title: item.content_ideas?.title || 'Untitled',
    })

    addStep('Initializing article generation...', 'active')
    addLog(`Starting: ${item.content_ideas?.title || 'Untitled'}`, 'info')

    try {
      // Update status to processing
      await updateQueueItemStatus(item.id, {
        status: 'processing',
        progress_percentage: 0,
        current_stage: 'drafting',
        started_at: new Date().toISOString(),
      })

      // Load humanization settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'humanization_provider',
          'stealthgpt_tone',
          'stealthgpt_mode',
          'stealthgpt_detector',
          'stealthgpt_business',
          'stealthgpt_double_passing',
        ])

      const settingsMap = {}
      settings?.forEach(s => {
        settingsMap[s.key] = s.value
      })

      if (settingsMap.humanization_provider) {
        generationServiceRef.current.setHumanizationProvider(settingsMap.humanization_provider)
      }

      generationServiceRef.current.setStealthGptSettings({
        tone: settingsMap.stealthgpt_tone || 'College',
        mode: settingsMap.stealthgpt_mode || 'High',
        detector: settingsMap.stealthgpt_detector || 'gptzero',
        business: settingsMap.stealthgpt_business === 'true',
        doublePassing: settingsMap.stealthgpt_double_passing === 'true',
      })

      // Generate the article
      const idea = {
        id: item.content_idea_id,
        title: item.content_ideas?.title || 'Untitled',
        description: item.content_ideas?.description || '',
        seed_topics: item.content_ideas?.seed_topics || [],
      }

      const articleData = await generationServiceRef.current.generateArticleComplete(
        idea,
        {
          contentType: 'guide',
          targetWordCount: 2000,
          autoAssignContributor: true,
          addInternalLinks: true,
          autoFix: true,
          maxFixAttempts: 3,
        },
        async ({ message, percentage }) => {
          // Map message to stage
          let stage = 'drafting'
          if (message.includes('humaniz')) stage = 'humanizing'
          else if (message.includes('link')) stage = 'linking'
          else if (message.includes('quality')) stage = 'quality_check'
          else if (message.includes('fix')) stage = 'auto_fix'
          else if (message.includes('final') || message.includes('sav')) stage = 'saving'

          // Complete previous step and add new one if message changed
          if (message) {
            // Mark previous active steps as completed
            setCurrentSteps(prev => prev.map(s =>
              s.status === 'active' ? { ...s, status: 'completed' } : s
            ))
            // Add new step
            addStep(message, 'active')
          }

          setCurrentProgress({
            stage,
            percentage,
            message, // Keep the detailed message, not just stage label
            title: item.content_ideas?.title || 'Untitled',
          })

          // Update database
          await updateQueueItemStatus(item.id, {
            status: 'processing',
            progress_percentage: percentage,
            current_stage: stage,
          })
        }
      )

      // Save to database
      await generationServiceRef.current.saveArticle(
        articleData,
        item.content_idea_id,
        user.id
      )

      // Mark as completed
      await updateQueueItemStatus(item.id, {
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
      })

      setProcessedCount(prev => prev + 1)
      addLog(`Completed: ${item.content_ideas?.title || 'Untitled'}`, 'success')

      // Invalidate article queries
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })

      return true
    } catch (error) {
      console.error('Queue processing error:', error)

      await updateQueueItemStatus(item.id, {
        status: 'failed',
        error_message: error.message || 'Unknown error occurred',
        completed_at: new Date().toISOString(),
      })

      setFailedCount(prev => prev + 1)
      addLog(`Failed: ${item.content_ideas?.title || 'Untitled'} - ${error.message}`, 'error')

      return false
    } finally {
      setCurrentItemId(null)
    }
  }, [user, addLog, updateQueueItemStatus, queryClient])

  // Start queue processing
  const startQueueProcessing = useCallback(async () => {
    if (processingRef.current || !user) return

    processingRef.current = true
    shouldStopRef.current = false
    setIsProcessing(true)
    setIsVisible(true)
    setProcessedCount(0)
    setFailedCount(0)

    addLog('Starting queue processing...', 'info')

    try {
      // Fetch pending items
      const items = await fetchQueueItems()
      const pendingItems = items.filter(item => item.status === 'pending')
      setQueueItems(pendingItems)

      if (pendingItems.length === 0) {
        addLog('No pending items in queue', 'info')
        setIsProcessing(false)
        processingRef.current = false
        return
      }

      addLog(`Found ${pendingItems.length} pending item(s)`, 'info')

      // Process each item sequentially
      for (const item of pendingItems) {
        if (shouldStopRef.current) {
          addLog('Processing stopped by user', 'warning')
          break
        }

        await processQueueItem(item)

        // Refresh queue items
        const updatedItems = await fetchQueueItems()
        setQueueItems(updatedItems.filter(i => i.status === 'pending'))
      }

      addLog('Queue processing complete', 'success')
    } catch (error) {
      console.error('Queue processing error:', error)
      addLog(`Error: ${error.message}`, 'error')
    } finally {
      setIsProcessing(false)
      processingRef.current = false
      setCurrentProgress({
        stage: null,
        percentage: 0,
        message: '',
        title: '',
      })
    }
  }, [user, fetchQueueItems, processQueueItem, addLog])

  // Stop queue processing
  const stopQueueProcessing = useCallback(() => {
    shouldStopRef.current = true
    addLog('Stopping queue processing...', 'warning')
  }, [addLog])

  // Start full auto mode
  const startFullAutoMode = useCallback(async (settings = {}) => {
    if (processingRef.current) {
      console.log('[AutoMode] Already processing, ignoring start request')
      return
    }

    if (!user) {
      console.error('[AutoMode] No user found, cannot start')
      return
    }

    console.log('[AutoMode] Starting full auto pipeline with settings:', settings)

    processingRef.current = true
    shouldStopRef.current = false
    setIsFullAuto(true)
    setIsVisible(true)
    setIsMinimized(false) // Ensure window is not minimized
    setAutoModeResults(null)

    // Set initial progress immediately so user sees something
    setAutoModeProgress({
      stage: 'initializing',
      percentage: 0,
      message: 'Initializing pipeline...',
    })

    addLog('Starting full auto pipeline...', 'info')

    try {
      // Load humanization settings
      const { data: dbSettings } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'humanization_provider',
          'stealthgpt_tone',
          'stealthgpt_mode',
          'stealthgpt_detector',
          'stealthgpt_business',
          'stealthgpt_double_passing',
        ])

      const settingsMap = {}
      dbSettings?.forEach(s => {
        settingsMap[s.key] = s.value
      })

      if (settingsMap.humanization_provider) {
        generationServiceRef.current.setHumanizationProvider(settingsMap.humanization_provider)
      }

      generationServiceRef.current.setStealthGptSettings({
        tone: settingsMap.stealthgpt_tone || 'College',
        mode: settingsMap.stealthgpt_mode || 'High',
        detector: settingsMap.stealthgpt_detector || 'gptzero',
        business: settingsMap.stealthgpt_business === 'true',
        doublePassing: settingsMap.stealthgpt_double_passing === 'true',
      })

      await generationServiceRef.current.runAutoPipeline(
        {
          sources: settings.sources || ['reddit', 'news', 'trends'],
          maxIdeas: settings.maxIdeas || 10,
          generateImmediately: settings.generateImmediately !== false,
          userId: user.id,
          niche: settings.niche || 'higher education, online degrees, career development',
        },
        (progressUpdate) => {
          setAutoModeProgress({
            stage: progressUpdate.stage || 'running',
            percentage: progressUpdate.percentage,
            message: progressUpdate.message,
          })
          addLog(progressUpdate.message)
        },
        (results) => {
          setAutoModeResults(results)
          addLog(`Pipeline complete! Generated ${results.generatedArticles?.length || 0} articles`, 'success')
        }
      )
    } catch (error) {
      console.error('[AutoMode] Pipeline error:', error)
      addLog(`Pipeline error: ${error.message}`, 'error')

      // Show the error in progress so user can see what went wrong
      setAutoModeProgress({
        stage: 'error',
        percentage: 0,
        message: `Error: ${error.message}`,
      })

      // Keep the window visible so user can see the error
      // Don't hide it immediately
    } finally {
      console.log('[AutoMode] Pipeline finished')
      setIsFullAuto(false)
      processingRef.current = false

      // Only reset progress if we didn't have an error
      // (error case keeps the error message visible)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    }
  }, [user, addLog, queryClient])

  // Stop full auto mode
  const stopFullAutoMode = useCallback(() => {
    generationServiceRef.current.stop()
    shouldStopRef.current = true
    addLog('Stopping auto pipeline...', 'warning')
  }, [addLog])

  // UI controls
  const showWindow = useCallback(() => setIsVisible(true), [])
  const hideWindow = useCallback(() => setIsVisible(false), [])
  const toggleMinimize = useCallback(() => setIsMinimized(prev => !prev), [])
  const toggleMaximize = useCallback(() => setIsMaximized(prev => !prev), [])

  // Check if any processing is active
  const isActive = isProcessing || isFullAuto

  // Calculate total progress for batch
  const totalItems = queueItems.length
  const completedItems = processedCount + failedCount

  const value = {
    // Queue processing
    isProcessing,
    currentItemId,
    queueItems,
    processedCount,
    failedCount,
    currentProgress,
    startQueueProcessing,
    stopQueueProcessing,

    // Detailed step tracking
    currentSteps,
    addStep,
    completeStep,
    clearSteps,

    // Full auto mode
    isFullAuto,
    autoModeProgress,
    autoModeResults,
    startFullAutoMode,
    stopFullAutoMode,

    // Activity log
    activityLog,
    addLog,
    clearLog,

    // UI state
    isMinimized,
    isMaximized,
    isVisible,
    showWindow,
    hideWindow,
    toggleMinimize,
    toggleMaximize,

    // Computed
    isActive,
    totalItems,
    completedItems,

    // Stage labels
    STAGE_LABELS,
  }

  return (
    <GenerationProgressContext.Provider value={value}>
      {children}
    </GenerationProgressContext.Provider>
  )
}
