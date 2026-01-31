import { useState } from 'react'
import {
  Shield,
  Plus,
  Trash2,
  Users,
  Link2,
  ExternalLink,
  DollarSign,
  FileCheck,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * HardRulesEditor - Edit non-negotiable rules that block publishing
 */
export default function HardRulesEditor({ value = {}, onChange }) {
  const [newBlockedDomain, setNewBlockedDomain] = useState('')
  const [newAllowedDomain, setNewAllowedDomain] = useState('')
  const [newAllowedDescription, setNewAllowedDescription] = useState('')

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

  const addBlockedDomain = () => {
    if (!newBlockedDomain.trim()) return
    const domains = [...(value.links?.blocked_domains || []), newBlockedDomain.trim()]
    updateValue('links.blocked_domains', domains)
    setNewBlockedDomain('')
  }

  const removeBlockedDomain = (domain) => {
    const domains = (value.links?.blocked_domains || []).filter(d => d !== domain)
    updateValue('links.blocked_domains', domains)
  }

  const addAllowedDomain = () => {
    if (!newAllowedDomain.trim()) return
    const domains = [...(value.external_sources?.allowed_domains || []), {
      domain: newAllowedDomain.trim(),
      description: newAllowedDescription.trim() || 'External source',
    }]
    updateValue('external_sources.allowed_domains', domains)
    setNewAllowedDomain('')
    setNewAllowedDescription('')
  }

  const removeAllowedDomain = (domain) => {
    const domains = (value.external_sources?.allowed_domains || []).filter(d => d.domain !== domain)
    updateValue('external_sources.allowed_domains', domains)
  }

  return (
    <div className="space-y-8">
      {/* Authors Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Author Rules</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Author Assignment</Label>
              <p className="text-sm text-gray-500">Every article must have an assigned author</p>
            </div>
            <Switch
              checked={value.authors?.require_author_assignment ?? true}
              onCheckedChange={(checked) => updateValue('authors.require_author_assignment', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enforce Approved Authors Only</Label>
              <p className="text-sm text-gray-500">Block publishing with unapproved author names</p>
            </div>
            <Switch
              checked={value.authors?.enforce_approved_only ?? true}
              onCheckedChange={(checked) => updateValue('authors.enforce_approved_only', checked)}
            />
          </div>

          {/* Approved Authors List */}
          <div className="mt-4">
            <Label className="mb-2 block">Approved Authors</Label>
            <div className="flex flex-wrap gap-2">
              {(value.authors?.approved_authors || []).map((author, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={cn(
                    'py-1.5 px-3',
                    author.active ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                  )}
                >
                  <span className="font-medium">{author.name}</span>
                  <span className="text-gray-400 ml-1">({author.style_proxy})</span>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Authors are managed in the Contributors section
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Links Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Link Blocking Rules</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Block .edu Links</Label>
              <p className="text-sm text-gray-500">Never link directly to university websites</p>
            </div>
            <Switch
              checked={value.links?.block_edu_links ?? true}
              onCheckedChange={(checked) => updateValue('links.block_edu_links', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Block Competitor Links</Label>
              <p className="text-sm text-gray-500">Block links to competitor websites</p>
            </div>
            <Switch
              checked={value.links?.block_competitor_links ?? true}
              onCheckedChange={(checked) => updateValue('links.block_competitor_links', checked)}
            />
          </div>

          {/* Blocked Domains */}
          <div className="mt-4">
            <Label className="mb-2 block">Blocked Domains</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newBlockedDomain}
                onChange={(e) => setNewBlockedDomain(e.target.value)}
                placeholder="e.g., competitor.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addBlockedDomain()}
              />
              <Button onClick={addBlockedDomain} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {(value.links?.blocked_domains || []).map((domain, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-red-300 bg-red-50 py-1"
                >
                  {domain}
                  <button
                    onClick={() => removeBlockedDomain(domain)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* External Sources Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">External Source Whitelist</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Whitelist for External Links</Label>
              <p className="text-sm text-gray-500">Only allow external links to approved domains</p>
            </div>
            <Switch
              checked={value.external_sources?.require_whitelist ?? true}
              onCheckedChange={(checked) => updateValue('external_sources.require_whitelist', checked)}
            />
          </div>

          {/* Allowed Domains */}
          <div className="mt-4">
            <Label className="mb-2 block">Allowed External Domains</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newAllowedDomain}
                onChange={(e) => setNewAllowedDomain(e.target.value)}
                placeholder="Domain (e.g., bls.gov)"
                className="flex-1"
              />
              <Input
                value={newAllowedDescription}
                onChange={(e) => setNewAllowedDescription(e.target.value)}
                placeholder="Description"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addAllowedDomain()}
              />
              <Button onClick={addAllowedDomain} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(value.external_sources?.allowed_domains || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div>
                    <span className="font-medium text-blue-900">{item.domain}</span>
                    <span className="text-blue-600 text-sm ml-2">- {item.description}</span>
                  </div>
                  <button
                    onClick={() => removeAllowedDomain(item.domain)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Monetization Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Monetization Rules</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Monetization Shortcode</Label>
              <p className="text-sm text-gray-500">Every article must have a degree table shortcode</p>
            </div>
            <Switch
              checked={value.monetization?.require_monetization_shortcode ?? true}
              onCheckedChange={(checked) => updateValue('monetization.require_monetization_shortcode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Block Unknown Shortcodes</Label>
              <p className="text-sm text-gray-500">Reject shortcodes not in the approved list</p>
            </div>
            <Switch
              checked={value.monetization?.block_unknown_shortcodes ?? true}
              onCheckedChange={(checked) => updateValue('monetization.block_unknown_shortcodes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Block Legacy Shortcodes</Label>
              <p className="text-sm text-gray-500">Reject old shortcode formats</p>
            </div>
            <Switch
              checked={value.monetization?.block_legacy_shortcodes ?? true}
              onCheckedChange={(checked) => updateValue('monetization.block_legacy_shortcodes', checked)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Publishing Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Publishing Rules</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Human Review</Label>
              <p className="text-sm text-gray-500">Articles must be reviewed before publishing</p>
            </div>
            <Switch
              checked={value.publishing?.require_human_review ?? true}
              onCheckedChange={(checked) => updateValue('publishing.require_human_review', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Block HIGH Risk Articles</Label>
              <p className="text-sm text-gray-500">Prevent auto-publish for HIGH risk content</p>
            </div>
            <Switch
              checked={value.publishing?.block_high_risk ?? true}
              onCheckedChange={(checked) => updateValue('publishing.block_high_risk', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Block CRITICAL Risk Articles</Label>
              <p className="text-sm text-gray-500">Prevent any publishing for CRITICAL risk content</p>
            </div>
            <Switch
              checked={value.publishing?.block_critical_risk ?? true}
              onCheckedChange={(checked) => updateValue('publishing.block_critical_risk', checked)}
            />
          </div>
        </div>
      </section>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">Hard Rules Block Publishing</p>
          <p className="text-sm text-yellow-700 mt-1">
            Any violation of hard rules will prevent an article from being published.
            Be careful when disabling rules.
          </p>
        </div>
      </div>
    </div>
  )
}
