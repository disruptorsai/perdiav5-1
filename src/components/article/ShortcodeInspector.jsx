/**
 * Shortcode Inspector Component
 * Displays all shortcodes in an article with validation status
 * Allows quick editing and provides compliance feedback
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit2,
  RefreshCw,
  DollarSign,
} from 'lucide-react'
import { extractShortcodes, parseShortcode } from '../../services/shortcodeService'

/**
 * Shortcode type display config
 */
const SHORTCODE_TYPES = {
  ge_monetization: {
    label: 'Monetization Block',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  degree_table: {
    label: 'Degree Table',
    icon: Code2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  degree_offer: {
    label: 'Degree Offer',
    icon: Code2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  ge_internal_link: {
    label: 'Internal Link',
    icon: Code2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  ge_external_cited: {
    label: 'External Citation',
    icon: Code2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
}

/**
 * Single shortcode display item
 */
function ShortcodeItem({ shortcode, index, onCopy }) {
  const [isOpen, setIsOpen] = useState(false)

  const parsed = useMemo(() => parseShortcode(shortcode.raw), [shortcode.raw])
  const typeConfig = SHORTCODE_TYPES[shortcode.type] || SHORTCODE_TYPES.ge_monetization

  const Icon = typeConfig.icon

  const validationStatus = useMemo(() => {
    // Simple validation checks
    if (!parsed) return { valid: false, message: 'Invalid shortcode syntax' }

    // Check required params based on type
    if (shortcode.type === 'degree_table' || shortcode.type === 'ge_monetization') {
      if (!parsed.category && !parsed.category_id) {
        return { valid: false, message: 'Missing category_id' }
      }
      if (!parsed.concentration && !parsed.concentration_id) {
        return { valid: false, message: 'Missing concentration_id' }
      }
    }

    if (shortcode.type === 'degree_offer') {
      if (!parsed.program_id && !parsed.school_id) {
        return { valid: false, message: 'Missing program_id or school_id' }
      }
    }

    return { valid: true, message: 'Valid' }
  }, [parsed, shortcode.type])

  return (
    <div className={`border rounded-lg p-3 ${typeConfig.bgColor}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Icon className={`h-4 w-4 ${typeConfig.color}`} />
            <span className="font-medium text-sm">{typeConfig.label}</span>
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            {validationStatus.valid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onCopy(shortcode.raw)
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="pt-3 space-y-3">
          {/* Raw shortcode display */}
          <div className="bg-white/80 rounded p-2 font-mono text-xs break-all">
            {shortcode.raw}
          </div>

          {/* Parsed parameters */}
          {parsed && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(parsed).map(([key, value]) => (
                  <div key={key} className="flex justify-between bg-white/50 rounded px-2 py-1">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation status */}
          {!validationStatus.valid && (
            <Alert variant="warning" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {validationStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Position info */}
          {shortcode.position && (
            <p className="text-xs text-muted-foreground">
              Position: {shortcode.position}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Main ShortcodeInspector component
 */
export default function ShortcodeInspector({
  content,
  onRefresh,
  // onEdit - reserved for future edit-in-place functionality
  className = '',
}) {
  const [copied, setCopied] = useState(false)

  // Extract all shortcodes from content
  const shortcodes = useMemo(() => {
    if (!content) return []
    return extractShortcodes(content)
  }, [content])

  // Count shortcodes by type
  const shortcodeCounts = useMemo(() => {
    const counts = {}
    shortcodes.forEach((sc) => {
      counts[sc.type] = (counts[sc.type] || 0) + 1
    })
    return counts
  }, [shortcodes])

  // Check overall monetization compliance
  const complianceStatus = useMemo(() => {
    const hasMonetization = shortcodes.some(
      (sc) => sc.type === 'degree_table' || sc.type === 'ge_monetization' || sc.type === 'degree_offer'
    )

    const allValid = shortcodes.every((sc) => {
      const parsed = parseShortcode(sc.raw)
      return parsed !== null
    })

    if (!hasMonetization) {
      return {
        status: 'warning',
        message: 'No monetization shortcodes found. Consider adding degree tables.',
      }
    }

    if (!allValid) {
      return {
        status: 'error',
        message: 'Some shortcodes have validation errors.',
      }
    }

    return {
      status: 'success',
      message: 'All shortcodes are valid.',
    }
  }, [shortcodes])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Shortcode Inspector
            </CardTitle>
            <CardDescription className="text-xs">
              {shortcodes.length} shortcode{shortcodes.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compliance status banner */}
        <Alert
          variant={
            complianceStatus.status === 'success'
              ? 'default'
              : complianceStatus.status === 'warning'
              ? 'warning'
              : 'destructive'
          }
          className="py-2"
        >
          {complianceStatus.status === 'success' && (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {complianceStatus.status === 'warning' && (
            <AlertTriangle className="h-4 w-4" />
          )}
          {complianceStatus.status === 'error' && (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-xs">
            {complianceStatus.message}
          </AlertDescription>
        </Alert>

        {/* Summary counts */}
        {Object.keys(shortcodeCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(shortcodeCounts).map(([type, count]) => {
              const config = SHORTCODE_TYPES[type] || SHORTCODE_TYPES.ge_monetization
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={`${config.bgColor} ${config.color}`}
                >
                  {config.label}: {count}
                </Badge>
              )
            })}
          </div>
        )}

        {/* Shortcode list */}
        {shortcodes.length > 0 ? (
          <div className="space-y-2">
            {shortcodes.map((shortcode, index) => (
              <ShortcodeItem
                key={`${shortcode.type}-${index}`}
                shortcode={shortcode}
                index={index}
                onCopy={handleCopy}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shortcodes in content</p>
            <p className="text-xs">
              Monetization shortcodes will be added during generation
            </p>
          </div>
        )}

        {/* Quick add buttons */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Quick Insert:
          </p>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleCopy('[degree_table category="" concentration="" level="" max="5"]')}
            >
              Degree Table
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleCopy('[degree_offer program_id="" school_id="" highlight="true"]')}
            >
              Degree Offer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleCopy('[ge_internal_link url="/online-degrees/"]text[/ge_internal_link]')}
            >
              Internal Link
            </Button>
          </div>
        </div>

        {copied && (
          <p className="text-xs text-green-600 text-center">Copied to clipboard!</p>
        )}
      </CardContent>
    </Card>
  )
}
