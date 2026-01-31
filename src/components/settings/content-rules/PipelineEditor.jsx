import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import {
  GitBranch,
  GripVertical,
  Settings,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Brain,
  Link2,
  DollarSign,
  CheckSquare,
  FileCheck,
  Lightbulb,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

const STEP_ICONS = {
  idea_generation: Lightbulb,
  draft_generation: Brain,
  contributor_assignment: Users,
  humanization: Zap,
  internal_linking: Link2,
  monetization_insertion: DollarSign,
  quality_scoring: CheckSquare,
  pre_publish_validation: FileCheck,
}

const PROVIDER_COLORS = {
  grok: 'bg-orange-100 text-orange-700 border-orange-300',
  claude: 'bg-purple-100 text-purple-700 border-purple-300',
  stealthgpt: 'bg-blue-100 text-blue-700 border-blue-300',
  internal: 'bg-gray-100 text-gray-700 border-gray-300',
}

/**
 * PipelineEditor - Configure each step of the article generation pipeline
 */
export default function PipelineEditor({ value = [], onChange }) {
  const [expandedSteps, setExpandedSteps] = useState({})

  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const updateStep = (index, updates) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], ...updates }
    onChange(newValue)
  }

  const updateStepConfig = (index, configKey, configValue) => {
    const newValue = [...value]
    newValue[index] = {
      ...newValue[index],
      config: {
        ...newValue[index].config,
        [configKey]: configValue,
      },
    }
    onChange(newValue)
  }

  const handleReorder = (newOrder) => {
    // Update order numbers
    const reordered = newOrder.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }))
    onChange(reordered)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">
            Drag to reorder steps. Toggle steps on/off. Configure each step's settings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Enabled
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            Disabled
          </span>
        </div>
      </div>

      <Reorder.Group axis="y" values={value} onReorder={handleReorder} className="space-y-3">
        {value.map((step, index) => {
          const Icon = STEP_ICONS[step.id] || GitBranch
          const isExpanded = expandedSteps[step.id]

          return (
            <Reorder.Item
              key={step.id}
              value={step}
              className={cn(
                'border rounded-lg transition-all',
                step.enabled ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
              )}
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleStep(step.id)}>
                <div className="flex items-center gap-3 p-4">
                  {/* Drag handle */}
                  <div className="cursor-grab hover:bg-gray-100 rounded p-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Order number */}
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                    {step.order || index + 1}
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    step.enabled ? 'bg-purple-100' : 'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      step.enabled ? 'text-purple-600' : 'text-gray-400'
                    )} />
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        'font-medium',
                        step.enabled ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {step.name}
                      </h4>
                      {step.required && (
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  </div>

                  {/* Provider badge */}
                  <Badge
                    variant="outline"
                    className={cn('text-xs', PROVIDER_COLORS[step.provider])}
                  >
                    {step.provider}
                  </Badge>

                  {/* Enable/disable toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!step.required) {
                        updateStep(index, { enabled: !step.enabled })
                      }
                    }}
                    disabled={step.required}
                    className={cn(
                      'gap-1',
                      step.enabled ? 'text-green-600' : 'text-gray-400'
                    )}
                  >
                    {step.enabled ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Expand/collapse */}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 border-t">
                    <div className="mt-4 space-y-4">
                      {/* Step-specific config */}
                      <StepConfig
                        step={step}
                        onConfigChange={(key, val) => updateStepConfig(index, key, val)}
                      />

                      {/* Fallback provider (if applicable) */}
                      {step.fallback_provider && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700">
                            Falls back to <Badge variant="outline" className="text-xs ml-1">{step.fallback_provider}</Badge> if primary fails
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </div>
  )
}

/**
 * Step-specific configuration component
 */
function StepConfig({ step, onConfigChange }) {
  const config = step.config || {}

  switch (step.id) {
    case 'idea_generation':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Use Web Context</Label>
              <p className="text-xs text-gray-500">Include trending topics and news</p>
            </div>
            <Switch
              checked={config.use_web_context ?? true}
              onCheckedChange={(checked) => onConfigChange('use_web_context', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Prioritize Monetizable Topics</Label>
              <p className="text-xs text-gray-500">Favor topics with paid school programs</p>
            </div>
            <Switch
              checked={config.prioritize_monetizable ?? true}
              onCheckedChange={(checked) => onConfigChange('prioritize_monetizable', checked)}
            />
          </div>
        </div>
      )

    case 'draft_generation':
      return (
        <div className="space-y-4">
          <div>
            <Label>Model</Label>
            <Input
              value={config.model || 'grok-3'}
              onChange={(e) => onConfigChange('model', e.target.value)}
              className="mt-1 w-48"
            />
          </div>
          <div>
            <Label>Temperature ({config.temperature || 0.8})</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature || 0.8}
              onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          <div>
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={config.max_tokens || 12000}
              onChange={(e) => onConfigChange('max_tokens', parseInt(e.target.value))}
              className="mt-1 w-32"
            />
          </div>
        </div>
      )

    case 'contributor_assignment':
      return (
        <div className="space-y-4">
          <Label>Scoring Weights</Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Expertise Match</Label>
              <Input
                type="number"
                value={config.scoring_weights?.expertise_match || 50}
                onChange={(e) => onConfigChange('scoring_weights', {
                  ...config.scoring_weights,
                  expertise_match: parseInt(e.target.value),
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Content Type Match</Label>
              <Input
                type="number"
                value={config.scoring_weights?.content_type_match || 30}
                onChange={(e) => onConfigChange('scoring_weights', {
                  ...config.scoring_weights,
                  content_type_match: parseInt(e.target.value),
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Keyword Match</Label>
              <Input
                type="number"
                value={config.scoring_weights?.keyword_match || 20}
                onChange={(e) => onConfigChange('scoring_weights', {
                  ...config.scoring_weights,
                  keyword_match: parseInt(e.target.value),
                })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )

    case 'humanization':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <select
                value={config.tone || 'College'}
                onChange={(e) => onConfigChange('tone', e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="Standard">Standard</option>
                <option value="HighSchool">High School</option>
                <option value="College">College</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
            <div>
              <Label>Mode</Label>
              <select
                value={config.mode || 'High'}
                onChange={(e) => onConfigChange('mode', e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Target Detector</Label>
            <select
              value={config.detector || 'gptzero'}
              onChange={(e) => onConfigChange('detector', e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option value="gptzero">GPTZero</option>
              <option value="turnitin">Turnitin</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Business Mode (10x Power)</Label>
              <p className="text-xs text-gray-500">Use more powerful humanization engine</p>
            </div>
            <Switch
              checked={config.business ?? true}
              onCheckedChange={(checked) => onConfigChange('business', checked)}
            />
          </div>
        </div>
      )

    case 'internal_linking':
      return (
        <div className="space-y-4">
          <div>
            <Label>Max Links</Label>
            <Input
              type="number"
              value={config.max_links || 5}
              onChange={(e) => onConfigChange('max_links', parseInt(e.target.value))}
              className="mt-1 w-24"
            />
          </div>
          <div>
            <Label>Min Relevance Score</Label>
            <Input
              type="number"
              value={config.min_relevance_score || 20}
              onChange={(e) => onConfigChange('min_relevance_score', parseInt(e.target.value))}
              className="mt-1 w-24"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Prefer Under-linked Articles</Label>
              <p className="text-xs text-gray-500">Prioritize articles with fewer incoming links</p>
            </div>
            <Switch
              checked={config.prefer_underlinked_articles ?? true}
              onCheckedChange={(checked) => onConfigChange('prefer_underlinked_articles', checked)}
            />
          </div>
        </div>
      )

    case 'monetization_insertion':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Include QDF Widget</Label>
              <p className="text-xs text-gray-500">Add Quick Degree Find widget</p>
            </div>
            <Switch
              checked={config.include_qdf_widget ?? true}
              onCheckedChange={(checked) => onConfigChange('include_qdf_widget', checked)}
            />
          </div>
          <div>
            <Label>Shortcode Positions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['after_intro', 'mid_content', 'pre_conclusion'].map(pos => (
                <Badge
                  key={pos}
                  variant="outline"
                  className={cn(
                    'cursor-pointer',
                    (config.shortcode_positions || []).includes(pos)
                      ? 'bg-green-100 border-green-400'
                      : 'bg-gray-50'
                  )}
                  onClick={() => {
                    const current = config.shortcode_positions || []
                    const newPositions = current.includes(pos)
                      ? current.filter(p => p !== pos)
                      : [...current, pos]
                    onConfigChange('shortcode_positions', newPositions)
                  }}
                >
                  {pos.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )

    case 'quality_scoring':
      return (
        <div className="space-y-4">
          <Label>Scoring Weights</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(config.weights || {}).map(([key, value]) => (
              <div key={key}>
                <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => onConfigChange('weights', {
                    ...config.weights,
                    [key]: parseInt(e.target.value),
                  })}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      )

    case 'pre_publish_validation':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Validate Author</Label>
            <Switch
              checked={config.validate_author ?? true}
              onCheckedChange={(checked) => onConfigChange('validate_author', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Validate Links</Label>
            <Switch
              checked={config.validate_links ?? true}
              onCheckedChange={(checked) => onConfigChange('validate_links', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Validate Shortcodes</Label>
            <Switch
              checked={config.validate_shortcodes ?? true}
              onCheckedChange={(checked) => onConfigChange('validate_shortcodes', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Validate Risk Level</Label>
            <Switch
              checked={config.validate_risk ?? true}
              onCheckedChange={(checked) => onConfigChange('validate_risk', checked)}
            />
          </div>
        </div>
      )

    default:
      return (
        <p className="text-sm text-gray-500 italic">
          No configuration options available for this step.
        </p>
      )
  }
}
