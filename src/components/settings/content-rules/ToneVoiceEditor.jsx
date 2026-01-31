import { useState } from 'react'
import {
  MessageSquare,
  Ban,
  ThumbsUp,
  AlertTriangle,
  Plus,
  Trash2,
  Type,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * ToneVoiceEditor - Edit writing style, banned phrases, and content focus
 */
export default function ToneVoiceEditor({ value = {}, onChange }) {
  const [newBannedPhrase, setNewBannedPhrase] = useState('')
  const [newPreferredPhrase, setNewPreferredPhrase] = useState('')
  const [newContentFocus, setNewContentFocus] = useState('')

  const updateValue = (path, newVal) => {
    const paths = path.split('.')
    const updated = JSON.parse(JSON.stringify(value))
    let current = updated
    for (let i = 0; i < paths.length - 1; i++) {
      if (!current[paths[i]]) current[paths[i]] = {}
      current = current[paths[i]]
    }
    current[paths[paths.length - 1]] = newVal
    onChange(updated)
  }

  const addToList = (list, item, setter) => {
    if (!item.trim()) return
    const currentList = value[list] || []
    updateValue(list, [...currentList, item.trim()])
    setter('')
  }

  const removeFromList = (list, item) => {
    const currentList = value[list] || []
    updateValue(list, currentList.filter(i => i !== item))
  }

  const addContentFocus = () => {
    if (!newContentFocus.trim()) return
    const currentList = value.content_focus || []
    updateValue('content_focus', [...currentList, newContentFocus.trim()])
    setNewContentFocus('')
  }

  const removeContentFocus = (item) => {
    const currentList = value.content_focus || []
    updateValue('content_focus', currentList.filter(i => i !== item))
  }

  return (
    <div className="space-y-8">
      {/* Overall Style Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Overall Writing Style</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Input
              id="tone"
              value={value.overall_style?.tone ?? 'conversational, natural, empathetic'}
              onChange={(e) => updateValue('overall_style.tone', e.target.value)}
              className="mt-1"
              placeholder="e.g., conversational, natural, empathetic"
            />
          </div>

          <div>
            <Label htmlFor="formality">Formality Level</Label>
            <Input
              id="formality"
              value={value.overall_style?.formality ?? 'professional but approachable'}
              onChange={(e) => updateValue('overall_style.formality', e.target.value)}
              className="mt-1"
              placeholder="e.g., professional but approachable"
            />
          </div>

          <div>
            <Label htmlFor="perspective">Perspective</Label>
            <Input
              id="perspective"
              value={value.overall_style?.perspective ?? 'second person (you/your)'}
              onChange={(e) => updateValue('overall_style.perspective', e.target.value)}
              className="mt-1"
              placeholder="e.g., second person (you/your)"
            />
          </div>

          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Textarea
              id="audience"
              value={value.overall_style?.target_audience ?? 'Prospective online students considering their education options'}
              onChange={(e) => updateValue('overall_style.target_audience', e.target.value)}
              className="mt-1"
              rows={2}
              placeholder="Describe your target audience..."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Banned Phrases Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Banned Phrases</h3>
          <Badge variant="outline" className="ml-auto">
            {(value.banned_phrases || []).length} phrases
          </Badge>
        </div>

        <div className="space-y-4 pl-7">
          <p className="text-sm text-gray-500">
            The AI will never use these phrases in generated content. Common AI-sounding phrases.
          </p>

          <div className="flex gap-2">
            <Input
              value={newBannedPhrase}
              onChange={(e) => setNewBannedPhrase(e.target.value)}
              placeholder="Add a phrase to ban..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addToList('banned_phrases', newBannedPhrase, setNewBannedPhrase)}
            />
            <Button onClick={() => addToList('banned_phrases', newBannedPhrase, setNewBannedPhrase)} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-red-50 rounded-lg border border-red-200">
            {(value.banned_phrases || []).map((phrase, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="border-red-300 bg-white py-1.5"
              >
                "{phrase}"
                <button
                  onClick={() => removeFromList('banned_phrases', phrase)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(value.banned_phrases || []).length === 0 && (
              <p className="text-sm text-red-400 italic">No banned phrases configured</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Preferred Phrases Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Preferred Phrases</h3>
          <Badge variant="outline" className="ml-auto">
            {(value.preferred_phrases || []).length} phrases
          </Badge>
        </div>

        <div className="space-y-4 pl-7">
          <p className="text-sm text-gray-500">
            The AI will try to incorporate these phrases when appropriate.
          </p>

          <div className="flex gap-2">
            <Input
              value={newPreferredPhrase}
              onChange={(e) => setNewPreferredPhrase(e.target.value)}
              placeholder="Add a preferred phrase..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addToList('preferred_phrases', newPreferredPhrase, setNewPreferredPhrase)}
            />
            <Button onClick={() => addToList('preferred_phrases', newPreferredPhrase, setNewPreferredPhrase)} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-green-50 rounded-lg border border-green-200">
            {(value.preferred_phrases || []).map((phrase, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="border-green-300 bg-white py-1.5"
              >
                "{phrase}"
                <button
                  onClick={() => removeFromList('preferred_phrases', phrase)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(value.preferred_phrases || []).length === 0 && (
              <p className="text-sm text-green-400 italic">No preferred phrases configured</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Sentence Style Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Sentence Style</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Vary Sentence Length</Label>
              <p className="text-sm text-gray-500">Mix short punchy sentences with longer explanations</p>
            </div>
            <Switch
              checked={value.sentence_style?.vary_length ?? true}
              onCheckedChange={(checked) => updateValue('sentence_style.vary_length', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Avoid Passive Voice</Label>
              <p className="text-sm text-gray-500">Prefer active voice constructions</p>
            </div>
            <Switch
              checked={value.sentence_style?.avoid_passive_voice ?? true}
              onCheckedChange={(checked) => updateValue('sentence_style.avoid_passive_voice', checked)}
            />
          </div>

          <div>
            <Label htmlFor="max-short">Max Consecutive Short Sentences</Label>
            <Input
              id="max-short"
              type="number"
              value={value.sentence_style?.max_consecutive_short_sentences ?? 3}
              onChange={(e) => updateValue('sentence_style.max_consecutive_short_sentences', parseInt(e.target.value) || 0)}
              className="mt-1 w-24"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Content Focus Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Content Focus Areas</h3>
        </div>

        <div className="space-y-4 pl-7">
          <p className="text-sm text-gray-500">
            Key themes and focuses that should be present in all content.
          </p>

          <div className="flex gap-2">
            <Input
              value={newContentFocus}
              onChange={(e) => setNewContentFocus(e.target.value)}
              placeholder="Add a content focus..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addContentFocus()}
            />
            <Button onClick={addContentFocus} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {(value.content_focus || []).map((focus, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-200"
              >
                <span className="text-sm text-indigo-800">{focus}</span>
                <button
                  onClick={() => removeContentFocus(focus)}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Anti-Hallucination Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Anti-Hallucination Rules</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Never Fabricate Statistics</Label>
              <p className="text-sm text-gray-500">Block invented percentages, numbers, or data</p>
            </div>
            <Switch
              checked={value.anti_hallucination?.never_fabricate_statistics ?? true}
              onCheckedChange={(checked) => updateValue('anti_hallucination.never_fabricate_statistics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Never Fabricate Studies</Label>
              <p className="text-sm text-gray-500">Block references to non-existent research</p>
            </div>
            <Switch
              checked={value.anti_hallucination?.never_fabricate_studies ?? true}
              onCheckedChange={(checked) => updateValue('anti_hallucination.never_fabricate_studies', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Never Fabricate School Names</Label>
              <p className="text-sm text-gray-500">Only reference real, verified schools</p>
            </div>
            <Switch
              checked={value.anti_hallucination?.never_fabricate_school_names ?? true}
              onCheckedChange={(checked) => updateValue('anti_hallucination.never_fabricate_school_names', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Never Fabricate Legislation</Label>
              <p className="text-sm text-gray-500">Block fake law or policy references</p>
            </div>
            <Switch
              checked={value.anti_hallucination?.never_fabricate_legislation ?? true}
              onCheckedChange={(checked) => updateValue('anti_hallucination.never_fabricate_legislation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Use Hedging Language</Label>
              <p className="text-sm text-gray-500">Use phrases like "Many students find that..." instead of absolutes</p>
            </div>
            <Switch
              checked={value.anti_hallucination?.use_hedging_language ?? true}
              onCheckedChange={(checked) => updateValue('anti_hallucination.use_hedging_language', checked)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
