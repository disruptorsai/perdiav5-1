import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  List,
  Plus,
  Copy,
  Check,
  GripVertical,
  ChevronRight,
  Settings
} from 'lucide-react'

/**
 * Article Navigation Generator Component
 * Generates table of contents from H2/H3 headings
 */
export default function ArticleNavigationGenerator({ content, onNavigationGenerated }) {
  const [headings, setHeadings] = useState([])
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    title: 'Table of Contents',
    includeH3: true,
    style: 'box', // 'box', 'simple', 'numbered'
    showNumbers: true
  })

  // Extract headings from content
  useEffect(() => {
    if (!content) {
      setHeadings([])
      return
    }

    const extracted = []

    // Match H2 headings with optional IDs
    const h2Regex = /<h2[^>]*(?:id=["']([^"']+)["'])?[^>]*>([^<]+)<\/h2>/gi
    let match

    while ((match = h2Regex.exec(content)) !== null) {
      const id = match[1] || generateId(match[2])
      extracted.push({
        id,
        text: match[2].trim(),
        level: 2,
        included: true
      })
    }

    // Match H3 headings if enabled
    if (settings.includeH3) {
      const h3Regex = /<h3[^>]*(?:id=["']([^"']+)["'])?[^>]*>([^<]+)<\/h3>/gi
      while ((match = h3Regex.exec(content)) !== null) {
        const id = match[1] || generateId(match[2])
        // Find position in content to maintain order
        const position = match.index
        extracted.push({
          id,
          text: match[2].trim(),
          level: 3,
          included: true,
          position
        })
      }
    }

    // Sort by position in document
    extracted.sort((a, b) => {
      const posA = content.indexOf(`>${a.text}<`)
      const posB = content.indexOf(`>${b.text}<`)
      return posA - posB
    })

    setHeadings(extracted)
  }, [content, settings.includeH3])

  const generateId = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const toggleHeading = (index) => {
    setHeadings(prev =>
      prev.map((h, i) =>
        i === index ? { ...h, included: !h.included } : h
      )
    )
  }

  const includedHeadings = useMemo(
    () => headings.filter(h => h.included),
    [headings]
  )

  const generateNavigationHtml = () => {
    if (includedHeadings.length === 0) return ''

    const styles = {
      box: {
        container: 'background: #f0f7ff; border: 1px solid #bae0ff; border-radius: 8px; padding: 20px; margin: 20px 0;',
        title: 'margin: 0 0 12px 0; font-size: 18px; color: #0070c9;',
        list: 'list-style: none; padding: 0; margin: 0;',
        item: 'margin: 8px 0;',
        subItem: 'margin: 4px 0 4px 20px;',
        link: 'color: #0070c9; text-decoration: none;'
      },
      simple: {
        container: 'margin: 20px 0;',
        title: 'font-size: 16px; font-weight: bold; margin-bottom: 10px;',
        list: 'list-style: disc; padding-left: 20px; margin: 0;',
        item: 'margin: 4px 0;',
        subItem: 'margin: 4px 0;',
        link: 'color: inherit; text-decoration: underline;'
      },
      numbered: {
        container: 'background: #f8f9fa; border-left: 4px solid #0070c9; padding: 15px 20px; margin: 20px 0;',
        title: 'margin: 0 0 10px 0; font-size: 16px; font-weight: bold;',
        list: 'list-style: decimal; padding-left: 20px; margin: 0;',
        item: 'margin: 6px 0;',
        subItem: 'margin: 4px 0 4px 10px; list-style: lower-alpha;',
        link: 'color: #0070c9; text-decoration: none;'
      }
    }

    const s = styles[settings.style]

    let listItems = ''
    let currentH2Index = 0

    includedHeadings.forEach((h) => {
      const number = settings.showNumbers ? `${h.level === 2 ? ++currentH2Index : ''}. ` : ''
      const indent = h.level === 3 ? s.subItem : s.item

      listItems += `    <li style="${indent}"><a href="#${h.id}" style="${s.link}">${h.level === 2 ? number : ''}${h.text}</a></li>\n`
    })

    return `
<nav class="article-navigation" style="${s.container}">
  <h3 style="${s.title}">${settings.title}</h3>
  <${settings.style === 'numbered' ? 'ol' : 'ul'} style="${s.list}">
${listItems}  </${settings.style === 'numbered' ? 'ol' : 'ul'}>
</nav>
    `.trim()
  }

  const handleInsert = () => {
    if (includedHeadings.length === 0) return

    const navHtml = generateNavigationHtml()
    onNavigationGenerated?.(navHtml)

    // Copy to clipboard
    navigator.clipboard.writeText(navHtml).catch(console.error)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <List className="w-5 h-5" />
            Navigation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {includedHeadings.length} heading{includedHeadings.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-7 w-7 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-3 border">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={settings.title}
                onChange={(e) => setSettings(s => ({ ...s, title: e.target.value }))}
                className="text-sm mt-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={settings.includeH3}
                  onCheckedChange={(checked) =>
                    setSettings(s => ({ ...s, includeH3: checked }))
                  }
                />
                Include H3 headings
              </label>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={settings.showNumbers}
                  onCheckedChange={(checked) =>
                    setSettings(s => ({ ...s, showNumbers: checked }))
                  }
                />
                Show numbers
              </label>
            </div>

            <div>
              <Label className="text-xs">Style</Label>
              <div className="flex gap-2 mt-1">
                {['box', 'simple', 'numbered'].map(style => (
                  <Button
                    key={style}
                    variant={settings.style === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings(s => ({ ...s, style }))}
                    className="flex-1 capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Headings List */}
        {headings.length > 0 ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {headings.map((heading, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  heading.included
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}
                onClick={() => toggleHeading(index)}
              >
                <Checkbox
                  checked={heading.included}
                  onCheckedChange={() => toggleHeading(index)}
                />
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {heading.level === 3 && (
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      heading.level === 2 ? 'font-medium' : 'text-gray-600'
                    }`}
                  >
                    {heading.text}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  H{heading.level}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No headings found in content
          </p>
        )}

        {/* Insert Button */}
        {headings.length > 0 && (
          <>
            <Button
              onClick={handleInsert}
              disabled={includedHeadings.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Inserted!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Insert Navigation
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Click headings to include/exclude from navigation
            </p>
          </>
        )}

        {/* Tip for missing IDs */}
        {headings.length > 0 && headings.some(h => !h.id.match(/^[a-z]/)) && (
          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Tip:</strong> Some headings don't have IDs. IDs will be auto-generated.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
