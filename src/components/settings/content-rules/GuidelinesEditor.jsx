import {
  FileText,
  Hash,
  HelpCircle,
  Link2,
  Award,
  BookOpen,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'

/**
 * GuidelinesEditor - Edit soft rules that generate warnings
 */
export default function GuidelinesEditor({ value = {}, onChange }) {
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

  return (
    <div className="space-y-8">
      {/* Word Count Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Word Count Guidelines</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min-words">Minimum Words</Label>
              <Input
                id="min-words"
                type="number"
                value={value.word_count?.minimum ?? 1500}
                onChange={(e) => updateValue('word_count.minimum', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="target-words">Target Words</Label>
              <Input
                id="target-words"
                type="number"
                value={value.word_count?.target ?? 2000}
                onChange={(e) => updateValue('word_count.target', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-words">Maximum Words</Label>
              <Input
                id="max-words"
                type="number"
                value={value.word_count?.maximum ?? 2500}
                onChange={(e) => updateValue('word_count.maximum', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Articles below {value.word_count?.minimum || 1500} words or above {value.word_count?.maximum || 2500} words
              will trigger quality warnings.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Structure Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Content Structure</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-h2">Minimum H2 Headings</Label>
              <Input
                id="min-h2"
                type="number"
                value={value.structure?.min_h2_headings ?? 3}
                onChange={(e) => updateValue('structure.min_h2_headings', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-h2">Maximum H2 Headings</Label>
              <Input
                id="max-h2"
                type="number"
                value={value.structure?.max_h2_headings ?? 8}
                onChange={(e) => updateValue('structure.max_h2_headings', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Introduction Paragraph</Label>
              <p className="text-sm text-gray-500">Article must start with an intro before first heading</p>
            </div>
            <Switch
              checked={value.structure?.require_intro_paragraph ?? true}
              onCheckedChange={(checked) => updateValue('structure.require_intro_paragraph', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Conclusion Section</Label>
              <p className="text-sm text-gray-500">Article must have a concluding section</p>
            </div>
            <Switch
              checked={value.structure?.require_conclusion ?? true}
              onCheckedChange={(checked) => updateValue('structure.require_conclusion', checked)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQs Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">FAQ Requirements</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-faqs">Minimum FAQs</Label>
              <Input
                id="min-faqs"
                type="number"
                value={value.faqs?.minimum ?? 3}
                onChange={(e) => updateValue('faqs.minimum', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="target-faqs">Target FAQs</Label>
              <Input
                id="target-faqs"
                type="number"
                value={value.faqs?.target ?? 5}
                onChange={(e) => updateValue('faqs.target', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Complete Answers</Label>
              <p className="text-sm text-gray-500">FAQ answers must be fully written (not placeholders)</p>
            </div>
            <Switch
              checked={value.faqs?.require_complete_answers ?? true}
              onCheckedChange={(checked) => updateValue('faqs.require_complete_answers', checked)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Links Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Link Requirements</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-internal">Min Internal Links</Label>
              <Input
                id="min-internal"
                type="number"
                value={value.links?.internal_links_min ?? 3}
                onChange={(e) => updateValue('links.internal_links_min', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="target-internal">Target Internal Links</Label>
              <Input
                id="target-internal"
                type="number"
                value={value.links?.internal_links_target ?? 5}
                onChange={(e) => updateValue('links.internal_links_target', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-external">Min External Citations</Label>
              <Input
                id="min-external"
                type="number"
                value={value.links?.external_citations_min ?? 2}
                onChange={(e) => updateValue('links.external_citations_min', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-external">Max External Citations</Label>
              <Input
                id="max-external"
                type="number"
                value={value.links?.external_citations_max ?? 5}
                onChange={(e) => updateValue('links.external_citations_max', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Quality Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Quality Thresholds</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Minimum Score to Publish</Label>
              <span className="text-lg font-semibold text-gray-900">
                {value.quality?.minimum_score_to_publish ?? 70}
              </span>
            </div>
            <Slider
              value={[value.quality?.minimum_score_to_publish ?? 70]}
              onValueChange={([val]) => updateValue('quality.minimum_score_to_publish', val)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Articles below this score cannot be published
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Minimum Score for Auto-Publish</Label>
              <span className="text-lg font-semibold text-gray-900">
                {value.quality?.minimum_score_auto_publish ?? 80}
              </span>
            </div>
            <Slider
              value={[value.quality?.minimum_score_auto_publish ?? 80]}
              onValueChange={([val]) => updateValue('quality.minimum_score_auto_publish', val)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Articles must reach this score to auto-publish without review
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Target Quality Score</Label>
              <span className="text-lg font-semibold text-green-600">
                {value.quality?.target_score ?? 85}
              </span>
            </div>
            <Slider
              value={[value.quality?.target_score ?? 85]}
              onValueChange={([val]) => updateValue('quality.target_score', val)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              AI will attempt to reach this score during generation
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Readability Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Readability</h3>
        </div>

        <div className="space-y-6 pl-7">
          <div>
            <Label htmlFor="max-sentence">Max Avg. Sentence Length (words)</Label>
            <Input
              id="max-sentence"
              type="number"
              value={value.quality?.max_avg_sentence_length ?? 25}
              onChange={(e) => updateValue('quality.max_avg_sentence_length', parseInt(e.target.value) || 0)}
              className="mt-1 w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Articles with longer average sentences will trigger readability warnings
            </p>
          </div>

          <div>
            <Label htmlFor="max-para">Max Paragraph Length (words)</Label>
            <Input
              id="max-para"
              type="number"
              value={value.readability?.max_paragraph_length ?? 150}
              onChange={(e) => updateValue('readability.max_paragraph_length', parseInt(e.target.value) || 0)}
              className="mt-1 w-32"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Vary Sentence Length</Label>
              <p className="text-sm text-gray-500">Mix short and long sentences for better flow</p>
            </div>
            <Switch
              checked={value.readability?.vary_sentence_length ?? true}
              onCheckedChange={(checked) => updateValue('readability.vary_sentence_length', checked)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
