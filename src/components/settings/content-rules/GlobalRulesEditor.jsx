import { useState } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Rule priority levels
const PRIORITY_LEVELS = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', description: 'Blocks publishing' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200', description: 'Strong warning' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: 'Warning' },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'Suggestion' },
}

// Rule categories
const RULE_CATEGORIES = {
  content: { label: 'Content', icon: '📝', description: 'What to include/exclude in articles' },
  style: { label: 'Style', icon: '✍️', description: 'Writing style and tone' },
  linking: { label: 'Linking', icon: '🔗', description: 'Rules about links and citations' },
  monetization: { label: 'Monetization', icon: '💰', description: 'Revenue and shortcode rules' },
  compliance: { label: 'Compliance', icon: '⚖️', description: 'Legal and regulatory rules' },
  custom: { label: 'Custom', icon: '⚙️', description: 'Other custom rules' },
}

// Example rules for placeholder
const EXAMPLE_RULES = [
  { rule: 'Never mention competitor schools by name', category: 'content', priority: 'high' },
  { rule: 'Always include BLS citation for salary data', category: 'compliance', priority: 'critical' },
  { rule: 'Use GetEducated school pages instead of .edu links', category: 'linking', priority: 'critical' },
  { rule: 'Include at least one shortcode for programs costing over $20,000', category: 'monetization', priority: 'medium' },
]

/**
 * GlobalRulesEditor - Natural language rules editor per Dec 22, 2025 meeting
 * Allows users to add custom rules in plain English that AI will follow during generation
 */
export default function GlobalRulesEditor({ value, onChange }) {
  const [newRule, setNewRule] = useState('')
  const [newCategory, setNewCategory] = useState('content')
  const [newPriority, setNewPriority] = useState('medium')
  const [showExamples, setShowExamples] = useState(false)

  // Initialize with empty array if no value
  const rules = value?.rules || []

  // Add a new rule
  const handleAddRule = () => {
    if (!newRule.trim()) return

    const updatedRules = [
      ...rules,
      {
        id: Date.now().toString(),
        rule: newRule.trim(),
        category: newCategory,
        priority: newPriority,
        enabled: true,
        created_at: new Date().toISOString(),
      },
    ]

    onChange({
      ...value,
      rules: updatedRules,
    })

    setNewRule('')
  }

  // Remove a rule
  const handleRemoveRule = (ruleId) => {
    const updatedRules = rules.filter(r => r.id !== ruleId)
    onChange({
      ...value,
      rules: updatedRules,
    })
  }

  // Toggle rule enabled state
  const handleToggleRule = (ruleId) => {
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    onChange({
      ...value,
      rules: updatedRules,
    })
  }

  // Update rule priority
  const handleUpdatePriority = (ruleId, priority) => {
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, priority } : r
    )
    onChange({
      ...value,
      rules: updatedRules,
    })
  }

  // Add example rule
  const handleAddExample = (example) => {
    const updatedRules = [
      ...rules,
      {
        id: Date.now().toString(),
        rule: example.rule,
        category: example.category,
        priority: example.priority,
        enabled: true,
        created_at: new Date().toISOString(),
      },
    ]
    onChange({
      ...value,
      rules: updatedRules,
    })
  }

  // Group rules by category for display
  const rulesByCategory = rules.reduce((acc, rule) => {
    const cat = rule.category || 'custom'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(rule)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Natural Language Rules</strong> - Add rules in plain English that the AI will follow when generating articles.
          These rules are included in every AI prompt and are automatically enforced.
        </AlertDescription>
      </Alert>

      {/* Add new rule form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
        <Label className="text-base font-medium">Add New Rule</Label>

        <div className="flex gap-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Enter a rule in plain English, e.g., 'Never mention competitor X'"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
          />
          <Button onClick={handleAddRule} disabled={!newRule.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
            >
              {Object.entries(RULE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-gray-500 mb-1 block">Priority</Label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
            >
              {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
                <option key={key} value={key}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
          className="text-xs"
        >
          <Info className="w-3 h-3 mr-1" />
          {showExamples ? 'Hide Examples' : 'Show Example Rules'}
        </Button>

        {/* Example rules */}
        {showExamples && (
          <div className="mt-2 p-3 bg-white border rounded-lg space-y-2">
            <p className="text-xs text-gray-500 font-medium">Click to add an example rule:</p>
            {EXAMPLE_RULES.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleAddExample(example)}
                className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', PRIORITY_LEVELS[example.priority].color)}>
                    {PRIORITY_LEVELS[example.priority].label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {RULE_CATEGORIES[example.category]?.icon}
                  </span>
                  <span className="flex-1">{example.rule}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rules list by category */}
      {rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No rules yet</p>
          <p className="text-xs mt-1">Add rules above to configure AI behavior</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(RULE_CATEGORIES).map(([catKey, category]) => {
            const catRules = rulesByCategory[catKey] || []
            if (catRules.length === 0) return null

            return (
              <div key={catKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <h4 className="font-medium text-gray-900">{category.label}</h4>
                  <Badge variant="outline" className="text-xs">
                    {catRules.length} {catRules.length === 1 ? 'rule' : 'rules'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{category.description}</p>

                <div className="space-y-2">
                  {catRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        'flex items-center gap-3 p-3 border rounded-lg transition-colors',
                        rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-move" />

                      {/* Enable/disable toggle */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                          rule.enabled
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 bg-white'
                        )}
                      >
                        {rule.enabled && <CheckCircle className="w-3 h-3" />}
                      </button>

                      {/* Priority badge */}
                      <select
                        value={rule.priority}
                        onChange={(e) => handleUpdatePriority(rule.id, e.target.value)}
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0',
                          PRIORITY_LEVELS[rule.priority].color
                        )}
                      >
                        {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
                          <option key={key} value={key}>
                            {level.label}
                          </option>
                        ))}
                      </select>

                      {/* Rule text */}
                      <p className={cn(
                        'flex-1 text-sm',
                        rule.enabled ? 'text-gray-900' : 'text-gray-500 line-through'
                      )}>
                        {rule.rule}
                      </p>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary stats */}
      {rules.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rules Summary</h4>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(PRIORITY_LEVELS).map(([key, level]) => {
              const count = rules.filter(r => r.priority === key && r.enabled).length
              return (
                <div key={key} className="text-center">
                  <div className={cn('text-2xl font-bold', level.color.split(' ')[1])}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-500">{level.label}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
            <span className="text-gray-500">Total Active Rules</span>
            <span className="font-medium">{rules.filter(r => r.enabled).length} / {rules.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
