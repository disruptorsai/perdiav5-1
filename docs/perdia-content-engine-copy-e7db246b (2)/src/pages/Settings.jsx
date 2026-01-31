import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Zap, 
  Shield, 
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  Bot
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("workflow");

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemSetting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemSetting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  const getSetting = (key) => {
    return settings.find(s => s.setting_key === key);
  };

  const getSettingValue = (key, defaultValue = '') => {
    const setting = getSetting(key);
    return setting?.setting_value || defaultValue;
  };

  const handleUpdateSetting = async (key, value, type = 'workflow', description = '') => {
    const existing = getSetting(key);
    
    if (existing) {
      await updateSettingMutation.mutateAsync({
        id: existing.id,
        data: { setting_value: value }
      });
    } else {
      await createSettingMutation.mutateAsync({
        setting_key: key,
        setting_value: value,
        setting_type: type,
        description,
        editable_by: 'admin'
      });
    }
  };

  const [workflowSettings, setWorkflowSettings] = useState({
    requireReview: getSettingValue('require_review', 'true') === 'true',
    autoPublishDays: getSettingValue('auto_publish_days', '5'),
    dailyLimit: getSettingValue('daily_limit', '10'),
    weeklyLimit: getSettingValue('weekly_limit', '100')
  });

  const [aiSettings, setAiSettings] = useState({
    defaultModel: getSettingValue('default_model', 'gpt-4'),
    temperature: getSettingValue('temperature', '0.7'),
    maxTokens: getSettingValue('max_tokens', '4000')
  });

  const [qualitySettings, setQualitySettings] = useState({
    minWordCount: getSettingValue('min_word_count', '500'),
    minInternalLinks: getSettingValue('min_internal_links', '2'),
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
    checkPlagiarism: getSettingValue('check_plagiarism', 'false') === 'true'
  });

  const [automationSettings, setAutomationSettings] = useState({
    automationLevel: getSettingValue('automation_level', 'manual'),
    autoPostEnabled: getSettingValue('auto_post_enabled', 'false') === 'true',
    autoPostDays: getSettingValue('auto_post_days', '5'),
    postingBlockStart: getSettingValue('posting_block_start', ''),
    postingBlockEnd: getSettingValue('posting_block_end', '')
  });

  const handleSaveWorkflow = async () => {
    await handleUpdateSetting('require_review', workflowSettings.requireReview.toString(), 'workflow', 'Require manual review before publishing');
    await handleUpdateSetting('auto_publish_days', workflowSettings.autoPublishDays, 'workflow', 'Auto-publish after N days if not reviewed');
    await handleUpdateSetting('daily_limit', workflowSettings.dailyLimit, 'throughput', 'Maximum articles per day');
    await handleUpdateSetting('weekly_limit', workflowSettings.weeklyLimit, 'throughput', 'Maximum articles per week');
  };

  const handleSaveAI = async () => {
    await handleUpdateSetting('default_model', aiSettings.defaultModel, 'ai', 'Default AI model for content generation');
    await handleUpdateSetting('temperature', aiSettings.temperature, 'ai', 'AI temperature setting');
    await handleUpdateSetting('max_tokens', aiSettings.maxTokens, 'ai', 'Maximum tokens for AI generation');
  };

  const handleSaveQuality = async () => {
    await handleUpdateSetting('min_word_count', qualitySettings.minWordCount, 'quality', 'Minimum word count for articles');
    await handleUpdateSetting('min_internal_links', qualitySettings.minInternalLinks, 'quality', 'Minimum internal links required');
    await handleUpdateSetting('min_external_links', qualitySettings.minExternalLinks, 'quality', 'Minimum external citations required');
    await handleUpdateSetting('require_external_citation', qualitySettings.requireExternalCitation.toString(), 'quality', 'Require at least one external citation');
    await handleUpdateSetting('require_bls_citation', qualitySettings.requireBLSCitation.toString(), 'quality', 'Require BLS data citation');
    await handleUpdateSetting('require_faq_schema', qualitySettings.requireFAQSchema.toString(), 'quality', 'Require FAQ schema markup');
    await handleUpdateSetting('enforce_shortcodes', qualitySettings.enforceShortcodes.toString(), 'quality', 'Enforce shortcode usage for monetization');
    await handleUpdateSetting('min_readability_score', qualitySettings.minReadabilityScore, 'quality', 'Minimum readability score (Flesch-Kincaid)');
    await handleUpdateSetting('max_readability_score', qualitySettings.maxReadabilityScore, 'quality', 'Maximum readability score');
    await handleUpdateSetting('min_images', qualitySettings.minImages, 'quality', 'Minimum number of images');
    await handleUpdateSetting('require_image_alt_text', qualitySettings.requireImageAltText.toString(), 'quality', 'Require alt text for all images');
    await handleUpdateSetting('keyword_density_min', qualitySettings.keywordDensityMin, 'quality', 'Minimum keyword density percentage');
    await handleUpdateSetting('keyword_density_max', qualitySettings.keywordDensityMax, 'quality', 'Maximum keyword density percentage');
    await handleUpdateSetting('require_headings', qualitySettings.requireHeadings.toString(), 'quality', 'Require heading structure (H2/H3)');
    await handleUpdateSetting('min_heading_count', qualitySettings.minHeadingCount, 'quality', 'Minimum number of headings');
    await handleUpdateSetting('check_grammar', qualitySettings.checkGrammar.toString(), 'quality', 'Enable grammar and spelling checks');
    await handleUpdateSetting('check_plagiarism', qualitySettings.checkPlagiarism.toString(), 'quality', 'Enable plagiarism detection');
  };

  const handleSaveAutomation = async () => {
    await handleUpdateSetting('automation_level', automationSettings.automationLevel, 'workflow', 'Automation level: manual, assisted, or full_auto');
    await handleUpdateSetting('auto_post_enabled', automationSettings.autoPostEnabled.toString(), 'workflow', 'Enable automatic posting after approval');
    await handleUpdateSetting('auto_post_days', automationSettings.autoPostDays, 'workflow', 'Days to wait before auto-posting approved articles');
    await handleUpdateSetting('posting_block_start', automationSettings.postingBlockStart, 'workflow', 'Start time for posting block');
    await handleUpdateSetting('posting_block_end', automationSettings.postingBlockEnd, 'workflow', 'End time for posting block');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
          <TabsList className="bg-white shadow-lg border-none">
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
          </TabsList>

          {/* Automation Settings */}
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
                          <Badge variant="outline" className="bg-white">Recommended</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

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
                          <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">Use Carefully</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveAutomation}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Automation Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">How Automation Works</h4>
                    <ul className="text-sm text-blue-800 space-y-1 mt-2">
                      <li><strong>Manual:</strong> You control everything—AI just provides helpful tools</li>
                      <li><strong>Assisted:</strong> AI generates articles, you review and approve before publishing</li>
                      <li><strong>Full Auto:</strong> AI manages the entire lifecycle including publishing (based on your settings)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Settings */}
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
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Workflow Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Important Note</h4>
                    <p className="text-sm text-amber-800">
                      Changes to workflow settings will affect all future articles. Existing articles 
                      in the queue will maintain their current settings until manually updated.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
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
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="grok-beta">Grok Beta (xAI) - Recommended</option>
                    <option value="grok-vision-beta">Grok Vision Beta (xAI)</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="gemini-pro">Gemini Pro</option>
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
                    className="w-full bg-blue-700 hover:bg-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save AI Settings
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

          {/* Quality Rules */}
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
                      Articles below this will be flagged (not blocking)
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
                    <Label className="text-base font-medium">Require External Citation</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      At least one authoritative external source
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireExternalCitation}
                    onCheckedChange={(checked) => 
                      setQualitySettings({ ...qualitySettings, requireExternalCitation: checked })
                    }
                  />
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
                    <p className="text-xs text-gray-600">
                      Minimum target keyword usage
                    </p>
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
                    <p className="text-xs text-gray-600">
                      Maximum to avoid keyword stuffing
                    </p>
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
                    <p className="text-xs text-gray-600">
                      Upper limit for appropriate complexity
                    </p>
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
                  <p className="text-xs text-gray-600">
                    Minimum number of images required per article
                  </p>
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
              </CardContent>
            </Card>

            {/* Advanced Checks */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Advanced Quality Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Grammar & Spelling Check</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      AI-powered grammar and spelling validation
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.checkGrammar}
                    onCheckedChange={(checked) => 
                      setQualitySettings({ ...qualitySettings, checkGrammar: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Plagiarism Detection</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Check content originality against web sources
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.checkPlagiarism}
                    onCheckedChange={(checked) => 
                      setQualitySettings({ ...qualitySettings, checkPlagiarism: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveQuality}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Quality Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Schema Validation</span>
                    <Badge className="bg-emerald-600">100% Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Shortcode Enforcement</span>
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
        </Tabs>
      </div>
    </div>
  );
}