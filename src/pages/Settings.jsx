import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Zap,
  Shield,
  Clock,
  Save,
  Bot,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Link2,
  Users,
  AlertTriangle,
  Monitor,
  HelpCircle,
  Settings2,
  FileText,
  Globe,
  RefreshCw,
  Database,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSystemSettings, useBulkUpdateSettings } from '@/hooks/useSystemSettings'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { APPROVED_AUTHORS, AUTHOR_DISPLAY_NAMES } from '@/hooks/useContributors'
import { useHowToGuide } from '@/contexts/HowToGuideContext'
import { ContentRulesTab } from '@/components/settings/content-rules'
import AuditLogViewer from '@/components/settings/AuditLogViewer'
import QualityScoreRecalculator from '@/components/settings/QualityScoreRecalculator'
import { useSitemapSync, useCatalogStats } from '@/hooks/useSitemap'

function SettingsContent() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('geteducated')
  const [isSaving, setIsSaving] = useState(false)

  const { data: settings = [], isLoading } = useSystemSettings()
  const bulkUpdateSettings = useBulkUpdateSettings()
  const { isEnabled: howToGuidesEnabled, setEnabled: setHowToGuidesEnabled } = useHowToGuide()

  // Site Catalog hooks
  const sitemapSync = useSitemapSync()
  const { data: catalogStats, isLoading: statsLoading, refetch: refetchStats } = useCatalogStats()
  const [syncProgress, setSyncProgress] = useState(null)
  const [syncResults, setSyncResults] = useState(null)

  // Helper to get setting value
  const getSettingValue = (settingKey, defaultValue = '') => {
    const setting = settings.find(s => s.key === settingKey)
    return setting?.value ?? defaultValue
  }

  // State for all settings
  const [automationSettings, setAutomationSettings] = useState({
    automationLevel: 'manual',
    autoPostEnabled: false,
    autoPostDays: '5',
    postingBlockStart: '',
    postingBlockEnd: '',
    autoGenerateIdeas: false,
    ideaQueueMinimum: '5',
    maxConcurrentGeneration: '2',
    autoApproveArticles: false,
    autoApproveIdeas: false,
  })

  const [workflowSettings, setWorkflowSettings] = useState({
    requireReview: true,
    autoPublishDays: '5',
    dailyLimit: '10',
    weeklyLimit: '100',
  })

  // GetEducated-specific settings
  const [getEducatedSettings, setGetEducatedSettings] = useState({
    approvedAuthorsOnly: true,
    blockEduLinks: true,
    blockCompetitorLinks: true,
    requireRankingCostData: true,
    autoPublishEnabled: false,
    autoPublishDays: '5',
    blockHighRiskPublish: true,
  })

  const [aiSettings, setAiSettings] = useState({
    defaultModel: 'grok-beta',
    temperature: '0.7',
    maxTokens: '4000',
  })

  const [humanizationSettings, setHumanizationSettings] = useState({
    provider: 'stealthgpt',
    stealthgptTone: 'College',
    stealthgptMode: 'High',
    stealthgptDetector: 'gptzero',
    stealthgptBusiness: true,      // Use 10x more powerful engine
    stealthgptDoublePassing: false, // Two-pass humanization
  })

  const [qualitySettings, setQualitySettings] = useState({
    minWordCount: '800',
    minInternalLinks: '3',
    minExternalLinks: '1',
    requireExternalCitation: false,
    requireBLSCitation: false,
    requireFAQSchema: false,
    enforceShortcodes: false,
    minReadabilityScore: '60',
    maxReadabilityScore: '80',
    minImages: '1',
    requireImageAltText: true,
    keywordDensityMin: '0.5',
    keywordDensityMax: '2.5',
    requireHeadings: true,
    minHeadingCount: '3',
    checkGrammar: true,
    checkPlagiarism: false,
  })

  // Load settings from database
  useEffect(() => {
    if (settings.length > 0) {
      setAutomationSettings({
        automationLevel: getSettingValue('automation_level', 'manual'),
        autoPostEnabled: getSettingValue('auto_post_enabled', 'false') === 'true',
        autoPostDays: getSettingValue('auto_post_days', '5'),
        postingBlockStart: getSettingValue('posting_block_start', ''),
        postingBlockEnd: getSettingValue('posting_block_end', ''),
        autoGenerateIdeas: getSettingValue('auto_generate_ideas', 'false') === 'true',
        ideaQueueMinimum: getSettingValue('idea_queue_minimum', '5'),
        maxConcurrentGeneration: getSettingValue('max_concurrent_generation', '2'),
        autoApproveArticles: getSettingValue('auto_approve_articles', 'false') === 'true',
        autoApproveIdeas: getSettingValue('auto_approve_ideas', 'false') === 'true',
      })

      setWorkflowSettings({
        requireReview: getSettingValue('require_review', 'true') === 'true',
        autoPublishDays: getSettingValue('auto_publish_days', '5'),
        dailyLimit: getSettingValue('daily_limit', '10'),
        weeklyLimit: getSettingValue('weekly_limit', '100'),
      })

      setAiSettings({
        defaultModel: getSettingValue('default_model', 'grok-beta'),
        temperature: getSettingValue('temperature', '0.7'),
        maxTokens: getSettingValue('max_tokens', '4000'),
      })

      setHumanizationSettings({
        provider: getSettingValue('humanization_provider', 'stealthgpt'),
        stealthgptTone: getSettingValue('stealthgpt_tone', 'College'),
        stealthgptMode: getSettingValue('stealthgpt_mode', 'High'),
        stealthgptDetector: getSettingValue('stealthgpt_detector', 'gptzero'),
        stealthgptBusiness: getSettingValue('stealthgpt_business', 'true') === 'true',
        stealthgptDoublePassing: getSettingValue('stealthgpt_double_passing', 'false') === 'true',
      })

      setQualitySettings({
        minWordCount: getSettingValue('min_word_count', '800'),
        minInternalLinks: getSettingValue('min_internal_links', '3'),
        minExternalLinks: getSettingValue('min_external_links', '1'),
        requireExternalCitation: getSettingValue('require_external_citation', 'false') === 'true',
        requireBLSCitation: getSettingValue('require_bls_citation', 'false') === 'true',
        requireFAQSchema: getSettingValue('require_faq_schema', 'false') === 'true',
        enforceShortcodes: getSettingValue('enforce_shortcodes', 'false') === 'true',
        minReadabilityScore: getSettingValue('min_readability_score', '60'),
        maxReadabilityScore: getSettingValue('max_readability_score', '80'),
        minImages: getSettingValue('min_images', '1'),
        requireImageAltText: getSettingValue('require_image_alt_text', 'true') === 'true',
        keywordDensityMin: getSettingValue('keyword_density_min', '0.5'),
        keywordDensityMax: getSettingValue('keyword_density_max', '2.5'),
        requireHeadings: getSettingValue('require_headings', 'true') === 'true',
        minHeadingCount: getSettingValue('min_heading_count', '3'),
        checkGrammar: getSettingValue('check_grammar', 'true') === 'true',
        checkPlagiarism: getSettingValue('check_plagiarism', 'false') === 'true',
      })

      // Load GetEducated settings
      setGetEducatedSettings({
        approvedAuthorsOnly: getSettingValue('approved_authors_only', 'true') === 'true',
        blockEduLinks: getSettingValue('block_edu_links', 'true') === 'true',
        blockCompetitorLinks: getSettingValue('block_competitor_links', 'true') === 'true',
        requireRankingCostData: getSettingValue('require_ranking_cost_data', 'true') === 'true',
        autoPublishEnabled: getSettingValue('auto_publish_enabled', 'false') === 'true',
        autoPublishDays: getSettingValue('auto_publish_days', '5'),
        blockHighRiskPublish: getSettingValue('block_high_risk_publish', 'true') === 'true',
      })
    }
  }, [settings])

  const handleSaveAutomation = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'automation_level', value: automationSettings.automationLevel, type: 'workflow' },
        { key: 'auto_post_enabled', value: automationSettings.autoPostEnabled.toString(), type: 'workflow' },
        { key: 'auto_post_days', value: automationSettings.autoPostDays, type: 'workflow' },
        { key: 'posting_block_start', value: automationSettings.postingBlockStart, type: 'workflow' },
        { key: 'posting_block_end', value: automationSettings.postingBlockEnd, type: 'workflow' },
        { key: 'auto_generate_ideas', value: automationSettings.autoGenerateIdeas.toString(), type: 'workflow' },
        { key: 'idea_queue_minimum', value: automationSettings.ideaQueueMinimum, type: 'workflow' },
        { key: 'max_concurrent_generation', value: automationSettings.maxConcurrentGeneration, type: 'workflow' },
        { key: 'auto_approve_articles', value: automationSettings.autoApproveArticles.toString(), type: 'workflow' },
        { key: 'auto_approve_ideas', value: automationSettings.autoApproveIdeas.toString(), type: 'workflow' },
      ])
      toast.success('Automation settings saved successfully')
    } catch (error) {
      toast.error('Failed to save automation settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWorkflow = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'require_review', value: workflowSettings.requireReview.toString(), type: 'workflow' },
        { key: 'auto_publish_days', value: workflowSettings.autoPublishDays, type: 'workflow' },
        { key: 'daily_limit', value: workflowSettings.dailyLimit, type: 'throughput' },
        { key: 'weekly_limit', value: workflowSettings.weeklyLimit, type: 'throughput' },
      ])
      toast.success('Workflow settings saved successfully')
    } catch (error) {
      toast.error('Failed to save workflow settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAI = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'default_model', value: aiSettings.defaultModel, type: 'ai' },
        { key: 'temperature', value: aiSettings.temperature, type: 'ai' },
        { key: 'max_tokens', value: aiSettings.maxTokens, type: 'ai' },
      ])
      toast.success('AI settings saved successfully')
    } catch (error) {
      toast.error('Failed to save AI settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveHumanization = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'humanization_provider', value: humanizationSettings.provider, type: 'ai' },
        { key: 'stealthgpt_tone', value: humanizationSettings.stealthgptTone, type: 'ai' },
        { key: 'stealthgpt_mode', value: humanizationSettings.stealthgptMode, type: 'ai' },
        { key: 'stealthgpt_detector', value: humanizationSettings.stealthgptDetector, type: 'ai' },
        { key: 'stealthgpt_business', value: humanizationSettings.stealthgptBusiness.toString(), type: 'ai' },
        { key: 'stealthgpt_double_passing', value: humanizationSettings.stealthgptDoublePassing.toString(), type: 'ai' },
      ])
      toast.success('Humanization settings saved successfully')
    } catch (error) {
      toast.error('Failed to save humanization settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQuality = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'min_word_count', value: qualitySettings.minWordCount, type: 'quality' },
        { key: 'min_internal_links', value: qualitySettings.minInternalLinks, type: 'quality' },
        { key: 'min_external_links', value: qualitySettings.minExternalLinks, type: 'quality' },
        { key: 'require_external_citation', value: qualitySettings.requireExternalCitation.toString(), type: 'quality' },
        { key: 'require_bls_citation', value: qualitySettings.requireBLSCitation.toString(), type: 'quality' },
        { key: 'require_faq_schema', value: qualitySettings.requireFAQSchema.toString(), type: 'quality' },
        { key: 'enforce_shortcodes', value: qualitySettings.enforceShortcodes.toString(), type: 'quality' },
        { key: 'min_readability_score', value: qualitySettings.minReadabilityScore, type: 'quality' },
        { key: 'max_readability_score', value: qualitySettings.maxReadabilityScore, type: 'quality' },
        { key: 'min_images', value: qualitySettings.minImages, type: 'quality' },
        { key: 'require_image_alt_text', value: qualitySettings.requireImageAltText.toString(), type: 'quality' },
        { key: 'keyword_density_min', value: qualitySettings.keywordDensityMin, type: 'quality' },
        { key: 'keyword_density_max', value: qualitySettings.keywordDensityMax, type: 'quality' },
        { key: 'require_headings', value: qualitySettings.requireHeadings.toString(), type: 'quality' },
        { key: 'min_heading_count', value: qualitySettings.minHeadingCount, type: 'quality' },
        { key: 'check_grammar', value: qualitySettings.checkGrammar.toString(), type: 'quality' },
        { key: 'check_plagiarism', value: qualitySettings.checkPlagiarism.toString(), type: 'quality' },
      ])
      toast.success('Quality settings saved successfully')
    } catch (error) {
      toast.error('Failed to save quality settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveGetEducated = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'approved_authors_only', value: getEducatedSettings.approvedAuthorsOnly.toString(), type: 'geteducated' },
        { key: 'block_edu_links', value: getEducatedSettings.blockEduLinks.toString(), type: 'geteducated' },
        { key: 'block_competitor_links', value: getEducatedSettings.blockCompetitorLinks.toString(), type: 'geteducated' },
        { key: 'require_ranking_cost_data', value: getEducatedSettings.requireRankingCostData.toString(), type: 'geteducated' },
        { key: 'auto_publish_enabled', value: getEducatedSettings.autoPublishEnabled.toString(), type: 'geteducated' },
        { key: 'auto_publish_days', value: getEducatedSettings.autoPublishDays, type: 'geteducated' },
        { key: 'block_high_risk_publish', value: getEducatedSettings.blockHighRiskPublish.toString(), type: 'geteducated' },
      ])
      toast.success('GetEducated settings saved successfully')
    } catch (error) {
      toast.error('Failed to save GetEducated settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-600 mt-1">Configure content engine behavior and policies</p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none flex-wrap">
            <TabsTrigger value="geteducated">
              <GraduationCap className="w-4 h-4 mr-2" />
              GetEducated
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Bot className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <Clock className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Zap className="w-4 h-4 mr-2" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Shield className="w-4 h-4 mr-2" />
              Quality Rules
            </TabsTrigger>
            <TabsTrigger value="contentrules">
              <Settings2 className="w-4 h-4 mr-2" />
              Content Rules
            </TabsTrigger>
            <TabsTrigger value="ui">
              <Monitor className="w-4 h-4 mr-2" />
              User Interface
            </TabsTrigger>
            <TabsTrigger value="auditlog">
              <FileText className="w-4 h-4 mr-2" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="sitecatalog">
              <Globe className="w-4 h-4 mr-2" />
              Site Catalog
            </TabsTrigger>
          </TabsList>

          {/* GetEducated Settings Tab */}
          <TabsContent value="geteducated" className="space-y-6 mt-6">
            {/* Client Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Client:</strong> GetEducated.com | <strong>Stakeholders:</strong> Tony Huffman, Kayleigh Gilbert, Sara, Charity
              </AlertDescription>
            </Alert>

            {/* Approved Authors */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Approved Authors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Only these 4 authors can be attributed on GetEducated content:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {APPROVED_AUTHORS.map(author => (
                    <div key={author} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-gray-900">{author}</p>
                      <p className="text-xs text-gray-600">Display: {AUTHOR_DISPLAY_NAMES[author]}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Enforce Approved Authors Only</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Block article generation with non-approved authors
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.approvedAuthorsOnly}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, approvedAuthorsOnly: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Link Compliance */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Link Compliance Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Block .edu Links</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Prevent direct links to school .edu websites (use GetEducated pages instead)
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.blockEduLinks}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, blockEduLinks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Block Competitor Links</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Block links to onlineu.com, usnews.com, affordablecollegesonline.com, etc.
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.blockCompetitorLinks}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, blockCompetitorLinks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Ranking Report Cost Data</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All cost/tuition data must come from GetEducated ranking reports only
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.requireRankingCostData}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, requireRankingCostData: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Auto-Publish Settings */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Auto-Publish Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Enable Auto-Publish</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically publish articles after the review deadline
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.autoPublishEnabled}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, autoPublishEnabled: checked })
                    }
                  />
                </div>

                {getEducatedSettings.autoPublishEnabled && (
                  <div className="space-y-2">
                    <Label>Auto-Publish After (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={getEducatedSettings.autoPublishDays}
                      onChange={(e) =>
                        setGetEducatedSettings({ ...getEducatedSettings, autoPublishDays: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-600">
                      Articles in "ready_to_publish" status for {getEducatedSettings.autoPublishDays} days without human review will be auto-published
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Block High-Risk Auto-Publish</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Prevent auto-publish for HIGH or CRITICAL risk articles (require manual review)
                    </p>
                  </div>
                  <Switch
                    checked={getEducatedSettings.blockHighRiskPublish}
                    onCheckedChange={(checked) =>
                      setGetEducatedSettings({ ...getEducatedSettings, blockHighRiskPublish: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveGetEducated}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save GetEducated Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* GetEducated Resources */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Key Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <a href="https://www.geteducated.com/online-college-ratings-and-rankings/" target="_blank" rel="noopener noreferrer" className="block p-2 hover:bg-gray-50 rounded">
                    Ranking Reports (cost data source)
                  </a>
                  <a href="https://www.geteducated.com/online-degrees/" target="_blank" rel="noopener noreferrer" className="block p-2 hover:bg-gray-50 rounded">
                    Degree Database
                  </a>
                  <a href="https://www.geteducated.com/online-schools/" target="_blank" rel="noopener noreferrer" className="block p-2 hover:bg-gray-50 rounded">
                    School Database
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Settings Tab */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Automation Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Manual Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'manual' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'manual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'manual' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'manual' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Manual Mode</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Full human control. AI provides tools and suggestions, but your team initiates and approves every action.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">Human-Powered</Badge>
                          <Badge variant="outline" className="bg-white">Maximum Control</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assisted Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'assisted' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'assisted'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'assisted' ? 'border-purple-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'assisted' && (
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Assisted Automation</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          AI generates complete articles automatically. Your team reviews, approves, and decides when to publish.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">AI Drafts</Badge>
                          <Badge variant="outline" className="bg-white">Human Approval</Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Recommended</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Auto Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'full_auto' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'full_auto'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'full_auto' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'full_auto' && (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Full Automation</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Fully autonomous content engine. AI handles research, generation, review, optimization, and publishing.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">Autonomous</Badge>
                          <Badge variant="outline" className="bg-white">Hands-Free</Badge>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Use Carefully</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Post Settings */}
                <div className="pt-6 border-t space-y-6">
                  <h4 className="font-semibold text-gray-900">Auto-Post Settings</h4>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Enable Auto-Post</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically publish approved articles after a waiting period
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoPostEnabled}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoPostEnabled: checked })
                      }
                    />
                  </div>

                  {automationSettings.autoPostEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Auto-Post After (Days)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={automationSettings.autoPostDays}
                          onChange={(e) =>
                            setAutomationSettings({ ...automationSettings, autoPostDays: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-600">
                          Articles approved for {automationSettings.autoPostDays} days will be automatically published
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label>Posting Block Start (Time)</Label>
                          <Input
                            type="time"
                            value={automationSettings.postingBlockStart}
                            onChange={(e) =>
                              setAutomationSettings({ ...automationSettings, postingBlockStart: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-600">
                            Do not post after this time (e.g. 00:00)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Posting Block End (Time)</Label>
                          <Input
                            type="time"
                            value={automationSettings.postingBlockEnd}
                            onChange={(e) =>
                              setAutomationSettings({ ...automationSettings, postingBlockEnd: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-600">
                            Resume posting after this time (e.g. 06:00)
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Idea Generation Settings */}
                <div className="pt-6 border-t space-y-6">
                  <h4 className="font-semibold text-gray-900">Idea Generation</h4>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Auto-Generate Ideas</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically generate new content ideas when queue is low
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoGenerateIdeas}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoGenerateIdeas: checked })
                      }
                    />
                  </div>

                  {automationSettings.autoGenerateIdeas && (
                    <div className="space-y-2">
                      <Label>Minimum Idea Queue Size</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={automationSettings.ideaQueueMinimum}
                        onChange={(e) =>
                          setAutomationSettings({ ...automationSettings, ideaQueueMinimum: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-600">
                        Generate new ideas when approved ideas fall below this number
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Auto-Approve Ideas</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically approve AI-generated ideas
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoApproveIdeas}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoApproveIdeas: checked })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveAutomation}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Automation Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert variant="info">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>How Automation Works:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li><strong>Manual:</strong> You control everything - AI just provides helpful tools</li>
                  <li><strong>Assisted:</strong> AI generates articles, you review and approve before publishing</li>
                  <li><strong>Full Auto:</strong> AI manages the entire lifecycle including publishing</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Workflow Settings Tab */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Review & Publishing Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Manual Review</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All articles must be reviewed before publishing
                    </p>
                  </div>
                  <Switch
                    checked={workflowSettings.requireReview}
                    onCheckedChange={(checked) =>
                      setWorkflowSettings({ ...workflowSettings, requireReview: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Auto-Publish After (Days)</Label>
                  <Input
                    type="number"
                    value={workflowSettings.autoPublishDays}
                    onChange={(e) =>
                      setWorkflowSettings({ ...workflowSettings, autoPublishDays: e.target.value })
                    }
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-600">
                    Automatically publish if not reviewed within this timeframe (0 to disable)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Article Limit</Label>
                    <Input
                      type="number"
                      value={workflowSettings.dailyLimit}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, dailyLimit: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Article Limit</Label>
                    <Input
                      type="number"
                      value={workflowSettings.weeklyLimit}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, weeklyLimit: e.target.value })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveWorkflow}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Workflow Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes to workflow settings will affect all future articles. Existing articles in the queue will maintain their current settings until manually updated.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <select
                    value={aiSettings.defaultModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, defaultModel: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="grok-beta">Grok Beta (xAI) - Recommended</option>
                    <option value="grok-vision-beta">Grok Vision Beta (xAI)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                  </select>
                  <p className="text-xs text-gray-600">
                    Select the primary AI model for content generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Temperature (0.0 - 1.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({ ...aiSettings, temperature: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Lower = more focused, Higher = more creative (0.7 recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Tokens</Label>
                  <Input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Maximum length for AI-generated content
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveAI}
                    disabled={isSaving}
                    className="w-full bg-blue-700 hover:bg-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save AI Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* StealthGPT Humanization Settings */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Content Humanization (AI Detection Bypass)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="info">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    StealthGPT processes AI-generated content to make it undetectable by AI detection tools like GPTZero and Turnitin.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Humanization Provider</Label>
                  <select
                    value={humanizationSettings.provider}
                    onChange={(e) => setHumanizationSettings({ ...humanizationSettings, provider: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="stealthgpt">StealthGPT - Specialized AI Detection Bypass</option>
                    <option value="claude">Claude - Natural Humanization with Contributor Voice</option>
                  </select>
                  <p className="text-xs text-gray-600">
                    StealthGPT is optimized for bypassing AI detection. Claude applies contributor writing styles.
                  </p>
                </div>

                {humanizationSettings.provider === 'stealthgpt' && (
                  <>
                    <div className="space-y-2">
                      <Label>Writing Tone</Label>
                      <select
                        value={humanizationSettings.stealthgptTone}
                        onChange={(e) => setHumanizationSettings({ ...humanizationSettings, stealthgptTone: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Standard">Standard - General purpose writing</option>
                        <option value="HighSchool">High School - Simpler vocabulary and structure</option>
                        <option value="College">College - Academic but accessible (Recommended)</option>
                        <option value="PhD">PhD - Advanced academic writing</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Bypass Mode</Label>
                      <select
                        value={humanizationSettings.stealthgptMode}
                        onChange={(e) => setHumanizationSettings({ ...humanizationSettings, stealthgptMode: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Low">Low - Light humanization, best for SEO content</option>
                        <option value="Medium">Medium - Balanced bypass for general use</option>
                        <option value="High">High - Maximum undetectability (Recommended)</option>
                      </select>
                      <p className="text-xs text-gray-600">
                        Higher modes introduce more variation to evade detection but may slightly alter meaning.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Optimize For</Label>
                      <select
                        value={humanizationSettings.stealthgptDetector}
                        onChange={(e) => setHumanizationSettings({ ...humanizationSettings, stealthgptDetector: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="gptzero">GPTZero - Most common AI detector</option>
                        <option value="turnitin">Turnitin - Academic plagiarism checker</option>
                      </select>
                    </div>

                    {/* Advanced Settings */}
                    <div className="pt-4 border-t space-y-4">
                      <h4 className="font-semibold text-gray-900">Advanced Optimization</h4>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex-1">
                          <Label className="text-base font-medium">Business Mode (10x Engine)</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Use StealthGPT's 10x more powerful model for higher quality and better detection bypass
                          </p>
                        </div>
                        <Switch
                          checked={humanizationSettings.stealthgptBusiness}
                          onCheckedChange={(checked) =>
                            setHumanizationSettings({ ...humanizationSettings, stealthgptBusiness: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex-1">
                          <Label className="text-base font-medium">Double-Pass Humanization</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Process content twice for maximum undetectability (slower but more thorough)
                          </p>
                        </div>
                        <Switch
                          checked={humanizationSettings.stealthgptDoublePassing}
                          onCheckedChange={(checked) =>
                            setHumanizationSettings({ ...humanizationSettings, stealthgptDoublePassing: checked })
                          }
                        />
                      </div>

                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-sm">
                          <strong>Optimization Tips:</strong> Content is split into 150-200 word chunks for best results.
                          Each chunk is iteratively processed until detection score drops below 25%.
                          Business mode + High bypass + Double-pass gives maximum protection.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveHumanization}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Humanization Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Generation Time</span>
                    <Badge className="bg-emerald-600">~15 seconds</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge className="bg-blue-600">98.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Quality Score</span>
                    <Badge className="bg-purple-600">8.2/10</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Rules Tab */}
          <TabsContent value="quality" className="space-y-6 mt-6">
            {/* Content Requirements */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Content Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Word Count</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minWordCount}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minWordCount: e.target.value })
                      }
                      placeholder="800"
                    />
                    <p className="text-xs text-gray-600">
                      Articles below this will be flagged
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Heading Count</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minHeadingCount}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minHeadingCount: e.target.value })
                      }
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-600">
                      Minimum H2/H3 headings for structure
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Heading Structure</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Articles must have proper H2/H3 heading hierarchy
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireHeadings}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireHeadings: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Link & Citation Rules */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Links & Citations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Internal Links</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minInternalLinks}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minInternalLinks: e.target.value })
                      }
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-600">
                      Links to your own content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum External Citations</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minExternalLinks}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minExternalLinks: e.target.value })
                      }
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-600">
                      Authoritative external sources
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require BLS Citation</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Require Bureau of Labor Statistics data for salary/career articles
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireBLSCitation}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireBLSCitation: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO & Schema */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  SEO & Schema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Keyword Density Min (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={qualitySettings.keywordDensityMin}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, keywordDensityMin: e.target.value })
                      }
                      placeholder="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Keyword Density Max (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={qualitySettings.keywordDensityMax}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, keywordDensityMax: e.target.value })
                      }
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require FAQ Schema</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Articles must include structured FAQ data for rich snippets
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireFAQSchema}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireFAQSchema: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Enforce Shortcodes</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Block publishing if monetization links bypass shortcodes
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.enforceShortcodes}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, enforceShortcodes: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Readability & Images */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Readability & Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Readability Score</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minReadabilityScore}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minReadabilityScore: e.target.value })
                      }
                      placeholder="60"
                    />
                    <p className="text-xs text-gray-600">
                      Flesch-Kincaid reading ease (60-70 = standard)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Readability Score</Label>
                    <Input
                      type="number"
                      value={qualitySettings.maxReadabilityScore}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, maxReadabilityScore: e.target.value })
                      }
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Images</Label>
                  <Input
                    type="number"
                    value={qualitySettings.minImages}
                    onChange={(e) =>
                      setQualitySettings({ ...qualitySettings, minImages: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Image Alt Text</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All images must have descriptive alt text for accessibility
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireImageAltText}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireImageAltText: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveQuality}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Quality Rules'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Schema Validation</span>
                    <Badge className="bg-emerald-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Quality Checks</span>
                    <Badge className="bg-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">E-E-A-T Guidelines</span>
                    <Badge className="bg-emerald-600">Following</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Rules Tab */}
          <TabsContent value="contentrules" className="space-y-6 mt-6">
            <ContentRulesTab />
          </TabsContent>

          {/* User Interface Settings Tab */}
          <TabsContent value="ui" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Help & Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">How-To Guides</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Show a floating "How to use this page" button on every page with helpful instructions
                    </p>
                  </div>
                  <Switch
                    checked={howToGuidesEnabled}
                    onCheckedChange={setHowToGuidesEnabled}
                  />
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    When enabled, a floating button will appear in the bottom-right corner of each page. Click it to see helpful information about the current page's features and how to use them.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Display Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Additional display settings coming soon. This will include options for compact mode, sidebar preferences, and more.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="auditlog" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  User Input Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    This is an immutable log of all user-entered text including comments, revision notes, feedback, and setting changes.
                    Entries cannot be deleted - this serves as a backup for recovery purposes.
                  </AlertDescription>
                </Alert>
                <AuditLogViewer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Catalog Tab */}
          <TabsContent value="sitecatalog" className="space-y-6 mt-6">
            {/* Catalog Overview */}
            <Alert className="border-blue-200 bg-blue-50">
              <Globe className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                The site catalog syncs from GetEducated's sitemap to enable internal linking and identify monetizable content areas.
              </AlertDescription>
            </Alert>

            {/* Catalog Statistics */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Catalog Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading statistics...
                  </div>
                ) : catalogStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-700">{catalogStats.total?.toLocaleString() || 0}</p>
                        <p className="text-sm text-blue-600">Total URLs</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-700">
                          {(catalogStats.byType?.degree_directory || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">Degree Directory</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-2xl font-bold text-purple-700">
                          {(catalogStats.byType?.ranking || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-purple-600">Rankings</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-2xl font-bold text-amber-700">
                          {(catalogStats.byType?.career || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-amber-600">Career Guides</p>
                      </div>
                    </div>

                    {/* Type Breakdown */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Content Type Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(catalogStats.byType || {}).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 capitalize">{type.replace(/_/g, ' ')}</span>
                            <Badge variant="secondary">{count.toLocaleString()}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No catalog data available. Run a sync to populate.</p>
                )}
              </CardContent>
            </Card>

            {/* Sync Controls */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Sitemap Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Sync the catalog from GetEducated's sitemap. This will fetch all URLs and categorize them for internal linking.
                </p>

                {/* Progress indicator */}
                {syncProgress && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Syncing...</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(syncProgress.processed / syncProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {syncProgress.processed.toLocaleString()} / {syncProgress.total.toLocaleString()} URLs processed
                    </p>
                  </div>
                )}

                {/* Results */}
                {syncResults && !syncProgress && (
                  <div className={`p-4 rounded-lg border ${syncResults.errors?.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {syncResults.errors?.length > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium">
                        Sync Complete: {syncResults.synced?.toLocaleString()} URLs synced
                      </span>
                    </div>
                    {syncResults.errors?.length > 0 && (
                      <div className="mt-2 text-xs text-amber-700">
                        <p className="font-medium">Errors ({syncResults.errors.length}):</p>
                        <ul className="list-disc list-inside">
                          {syncResults.errors.slice(0, 3).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {syncResults.errors.length > 3 && (
                            <li>...and {syncResults.errors.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {syncResults.byType && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(syncResults.byType).slice(0, 6).map(([type, count]) => (
                          <div key={type} className="bg-white/50 p-1 rounded">
                            <span className="capitalize">{type.replace(/_/g, ' ')}:</span> {count}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      setSyncProgress({ processed: 0, total: 1 })
                      setSyncResults(null)
                      try {
                        const results = await sitemapSync.mutateAsync({
                          maxPages: 5000,
                          onProgress: (progress) => {
                            setSyncProgress(progress)
                          },
                        })
                        setSyncResults(results)
                        refetchStats()
                        toast({
                          title: 'Sync Complete',
                          description: `Synced ${results.synced} URLs from sitemap`,
                        })
                      } catch (error) {
                        setSyncResults({ synced: 0, errors: [error.message] })
                        toast({
                          title: 'Sync Failed',
                          description: error.message,
                          variant: 'destructive',
                        })
                      } finally {
                        setSyncProgress(null)
                      }
                    }}
                    disabled={sitemapSync.isPending}
                    className="gap-2"
                  >
                    {sitemapSync.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync from Sitemap
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => refetchStats()}
                    disabled={statsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                    Refresh Stats
                  </Button>
                </div>

                <Alert className="border-gray-200 bg-gray-50">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-gray-700">
                    <strong>URL Patterns Synced:</strong> /online-degrees/, /online-college-ratings-and-rankings/, /resources/, /blog/, /online-schools/, /careers/
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Quality Score Recalculation */}
            <QualityScoreRecalculator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  )
}

export default Settings
