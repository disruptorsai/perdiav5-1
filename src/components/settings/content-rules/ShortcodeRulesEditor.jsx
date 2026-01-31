import { useState } from 'react'
import {
  Code,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * ShortcodeRulesEditor - Configure allowed shortcodes and monetization rules
 */
export default function ShortcodeRulesEditor({ value = {}, onChange }) {
  const [newLegacyShortcode, setNewLegacyShortcode] = useState('')

  const updateValue = (key, newVal) => {
    onChange({
      ...value,
      [key]: newVal,
    })
  }

  const addLegacyShortcode = () => {
    if (!newLegacyShortcode.trim()) return
    const current = value.legacy_shortcodes_blocked || []
    updateValue('legacy_shortcodes_blocked', [...current, newLegacyShortcode.trim()])
    setNewLegacyShortcode('')
  }

  const removeLegacyShortcode = (shortcode) => {
    const current = value.legacy_shortcodes_blocked || []
    updateValue('legacy_shortcodes_blocked', current.filter(s => s !== shortcode))
  }

  const updateShortcodeField = (index, field, newVal) => {
    const shortcodes = [...(value.allowed_shortcodes || [])]
    shortcodes[index] = { ...shortcodes[index], [field]: newVal }
    updateValue('allowed_shortcodes', shortcodes)
  }

  return (
    <div className="space-y-8">
      {/* Allowed Shortcodes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Allowed Shortcodes</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          These are the only shortcodes allowed in content. Any other shortcodes will be blocked.
        </p>

        <div className="space-y-4">
          {(value.allowed_shortcodes || []).map((shortcode, idx) => (
            <div
              key={idx}
              className="p-4 border rounded-lg bg-green-50 border-green-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <code className="text-lg font-mono text-green-800 bg-green-100 px-2 py-1 rounded">
                    [{shortcode.tag}]
                  </code>
                  <p className="text-sm text-green-700 mt-2">{shortcode.description}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-green-700">Required Parameters</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(shortcode.required_params || []).map((param, pIdx) => (
                      <Badge key={pIdx} className="bg-green-200 text-green-800 text-xs">
                        {param}
                      </Badge>
                    ))}
                    {(shortcode.required_params || []).length === 0 && (
                      <span className="text-xs text-green-600 italic">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-green-700">Optional Parameters</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(shortcode.optional_params || []).map((param, pIdx) => (
                      <Badge key={pIdx} variant="outline" className="border-green-300 text-green-700 text-xs">
                        {param}
                      </Badge>
                    ))}
                    {(shortcode.optional_params || []).length === 0 && (
                      <span className="text-xs text-green-600 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(value.allowed_shortcodes || []).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No allowed shortcodes configured</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Shortcode Format Examples</span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono text-blue-600">
            <p>[su_ge-picks category="psychology" concentration="counseling" level="masters"]</p>
            <p>[su_ge-cta type="school" school="22742" cta-copy="Learn More"]</p>
            <p>[su_ge-qdf type="sidebar" header="Find Your Degree"]</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Legacy/Blocked Shortcodes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Blocked Legacy Shortcodes</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          These old shortcode formats will trigger validation errors and block publishing.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={newLegacyShortcode}
            onChange={(e) => setNewLegacyShortcode(e.target.value)}
            placeholder="e.g., degree_table"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addLegacyShortcode()}
          />
          <Button onClick={addLegacyShortcode} size="sm" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(value.legacy_shortcodes_blocked || []).map((shortcode, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="py-1.5 border-red-300 bg-red-50"
            >
              <code className="font-mono">[{shortcode}]</code>
              <button
                onClick={() => removeLegacyShortcode(shortcode)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {(value.legacy_shortcodes_blocked || []).length === 0 && (
            <p className="text-sm text-gray-400 italic">No legacy shortcodes blocked</p>
          )}
        </div>
      </section>

      <Separator />

      {/* Monetization Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Monetization Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Monetization Shortcode</Label>
              <p className="text-sm text-gray-500">Every article must have at least one monetization shortcode</p>
            </div>
            <Switch
              checked={value.monetization_required ?? true}
              onCheckedChange={(checked) => updateValue('monetization_required', checked)}
            />
          </div>

          <div>
            <Label className="mb-2 block">Shortcode Positions</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <Label className="text-xs text-gray-500">Primary</Label>
                <select
                  value={value.monetization_positions?.primary || 'after_intro'}
                  onChange={(e) => updateValue('monetization_positions', {
                    ...value.monetization_positions,
                    primary: e.target.value,
                  })}
                  className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                >
                  <option value="after_intro">After Introduction</option>
                  <option value="mid_content">Mid Content</option>
                  <option value="pre_conclusion">Before Conclusion</option>
                </select>
              </div>
              <div className="p-3 border rounded-lg">
                <Label className="text-xs text-gray-500">Secondary</Label>
                <select
                  value={value.monetization_positions?.secondary || 'mid_content'}
                  onChange={(e) => updateValue('monetization_positions', {
                    ...value.monetization_positions,
                    secondary: e.target.value,
                  })}
                  className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                >
                  <option value="after_intro">After Introduction</option>
                  <option value="mid_content">Mid Content</option>
                  <option value="pre_conclusion">Before Conclusion</option>
                </select>
              </div>
              <div className="p-3 border rounded-lg">
                <Label className="text-xs text-gray-500">Optional</Label>
                <select
                  value={value.monetization_positions?.optional || 'pre_conclusion'}
                  onChange={(e) => updateValue('monetization_positions', {
                    ...value.monetization_positions,
                    optional: e.target.value,
                  })}
                  className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                >
                  <option value="after_intro">After Introduction</option>
                  <option value="mid_content">Mid Content</option>
                  <option value="pre_conclusion">Before Conclusion</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
