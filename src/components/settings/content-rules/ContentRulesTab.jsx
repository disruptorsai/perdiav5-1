import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  BookOpen,
  MessageSquare,
  GitBranch,
  Users,
  Code,
  Globe,
  History,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  RotateCcw,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useContentRulesConfig,
  useUpdateConfigSection,
  useContentRulesHistory,
  useRestoreContentRulesVersion,
  CONFIG_SECTIONS,
} from '@/hooks/useContentRulesConfig'
import { cn } from '@/lib/utils'

// Section editors
import GlobalRulesEditor from './GlobalRulesEditor'
import HardRulesEditor from './HardRulesEditor'
import GuidelinesEditor from './GuidelinesEditor'
import ToneVoiceEditor from './ToneVoiceEditor'
import PipelineEditor from './PipelineEditor'
import AuthorMappingEditor from './AuthorMappingEditor'
import ShortcodeRulesEditor from './ShortcodeRulesEditor'
import VersionHistoryPanel from './VersionHistoryPanel'

const SECTION_ICONS = {
  global_rules: Globe,
  hard_rules: Shield,
  guidelines: BookOpen,
  tone_voice: MessageSquare,
  pipeline_steps: GitBranch,
  author_content_mapping: Users,
  shortcode_rules: Code,
}

/**
 * ContentRulesTab - Main tab for editing all content generation rules
 */
export default function ContentRulesTab() {
  const [activeSection, setActiveSection] = useState('global_rules')
  const [showHistory, setShowHistory] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({})
  const [saveStatus, setSaveStatus] = useState(null) // null, 'saving', 'saved', 'error'

  const { data: config, isLoading, error } = useContentRulesConfig()
  const { data: history = [] } = useContentRulesHistory(10)
  const updateSection = useUpdateConfigSection()
  const restoreVersion = useRestoreContentRulesVersion()

  // Handle section value change
  const handleSectionChange = (section, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [section]: value,
    }))
  }

  // Save a specific section
  const handleSaveSection = async (section) => {
    if (!pendingChanges[section]) return

    setSaveStatus('saving')
    try {
      await updateSection.mutateAsync({
        section,
        value: pendingChanges[section],
        changeSummary: `Updated ${CONFIG_SECTIONS[section].label}`,
      })

      // Clear pending changes for this section
      setPendingChanges(prev => {
        const { [section]: _, ...rest } = prev
        return rest
      })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // Restore a previous version
  const handleRestore = async (historyId) => {
    if (!confirm('Are you sure you want to restore this version? Current changes will be saved to history first.')) {
      return
    }

    try {
      await restoreVersion.mutateAsync({ historyId })
      setPendingChanges({})
      setShowHistory(false)
    } catch (err) {
      console.error('Failed to restore:', err)
      alert('Failed to restore version: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Failed to load content rules: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-600" />
            Content Generation Rules
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure how articles are generated, validated, and published
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Version indicator */}
          <Badge variant="outline" className="text-xs">
            Version {config?.version || 1}
          </Badge>

          {/* Save status */}
          <AnimatePresence>
            {saveStatus && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {saveStatus === 'saving' && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Saving...
                  </Badge>
                )}
                {saveStatus === 'saved' && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Saved
                  </Badge>
                )}
                {saveStatus === 'error' && (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending changes indicator */}
          {hasPendingChanges && (
            <Badge variant="outline" className="border-yellow-400 text-yellow-700">
              {Object.keys(pendingChanges).length} unsaved changes
            </Badge>
          )}

          {/* History toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={cn(showHistory && 'bg-gray-100')}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-6">
        {/* Section navigation */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {Object.entries(CONFIG_SECTIONS).map(([key, section]) => {
                  const Icon = SECTION_ICONS[key]
                  const hasChanges = pendingChanges[key]

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        activeSection === key
                          ? 'bg-purple-100 text-purple-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {section.label}
                        </span>
                      </div>
                      {hasChanges && (
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      )}
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-transform',
                        activeSection === key && 'rotate-90'
                      )} />
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
                Current Config
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Authors</dt>
                  <dd className="font-medium">
                    {config?.hard_rules?.authors?.approved_authors?.length || 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Blocked Domains</dt>
                  <dd className="font-medium">
                    {config?.hard_rules?.links?.blocked_domains?.length || 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Pipeline Steps</dt>
                  <dd className="font-medium">
                    {config?.pipeline_steps?.length || 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Banned Phrases</dt>
                  <dd className="font-medium">
                    {config?.tone_voice?.banned_phrases?.length || 0}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = SECTION_ICONS[activeSection]
                      return <Icon className="w-5 h-5 text-purple-600" />
                    })()}
                    {CONFIG_SECTIONS[activeSection].label}
                  </CardTitle>
                  <CardDescription>
                    {CONFIG_SECTIONS[activeSection].description}
                  </CardDescription>
                </div>
                {pendingChanges[activeSection] && (
                  <Button
                    onClick={() => handleSaveSection(activeSection)}
                    disabled={updateSection.isPending}
                    className="gap-2"
                  >
                    {updateSection.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px] pr-4">
                {/* Render the appropriate editor */}
                {activeSection === 'global_rules' && (
                  <GlobalRulesEditor
                    value={pendingChanges.global_rules || config?.global_rules}
                    onChange={(value) => handleSectionChange('global_rules', value)}
                  />
                )}
                {activeSection === 'hard_rules' && (
                  <HardRulesEditor
                    value={pendingChanges.hard_rules || config?.hard_rules}
                    onChange={(value) => handleSectionChange('hard_rules', value)}
                  />
                )}
                {activeSection === 'guidelines' && (
                  <GuidelinesEditor
                    value={pendingChanges.guidelines || config?.guidelines}
                    onChange={(value) => handleSectionChange('guidelines', value)}
                  />
                )}
                {activeSection === 'tone_voice' && (
                  <ToneVoiceEditor
                    value={pendingChanges.tone_voice || config?.tone_voice}
                    onChange={(value) => handleSectionChange('tone_voice', value)}
                  />
                )}
                {activeSection === 'pipeline_steps' && (
                  <PipelineEditor
                    value={pendingChanges.pipeline_steps || config?.pipeline_steps}
                    onChange={(value) => handleSectionChange('pipeline_steps', value)}
                  />
                )}
                {activeSection === 'author_content_mapping' && (
                  <AuthorMappingEditor
                    value={pendingChanges.author_content_mapping || config?.author_content_mapping}
                    onChange={(value) => handleSectionChange('author_content_mapping', value)}
                  />
                )}
                {activeSection === 'shortcode_rules' && (
                  <ShortcodeRulesEditor
                    value={pendingChanges.shortcode_rules || config?.shortcode_rules}
                    onChange={(value) => handleSectionChange('shortcode_rules', value)}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* History panel (collapsible) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <VersionHistoryPanel
                history={history}
                currentVersion={config?.version}
                onRestore={handleRestore}
                onClose={() => setShowHistory(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
