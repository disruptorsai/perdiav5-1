import { useEffect, useState } from 'react'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { calculateQualityScore } from '@/services/qualityScoreService'

/**
 * Quality Checklist Component
 * Uses the unified qualityScoreService for consistent scoring across the app
 */
export default function QualityChecklist({ article, content, onQualityChange, onAutoFix }) {
  const [checks, setChecks] = useState({})
  const [score, setScore] = useState(0)
  const [canPublish, setCanPublish] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const { getIntValue, getBoolValue, getFloatValue } = useSettingsMap()

  useEffect(() => {
    if (!content) {
      const emptyState = { canPublish: false, score: 0, checks: {} }
      setChecks({})
      setScore(0)
      setCanPublish(false)
      onQualityChange?.(emptyState)
      return
    }

    // Build thresholds from system settings for the unified service
    const thresholds = {
      minWordCount: getIntValue('min_word_count', 800),
      maxWordCount: getIntValue('max_word_count', 2500),
      minInternalLinks: getIntValue('min_internal_links', 3),
      minExternalLinks: getIntValue('min_external_links', 1),
      requireBLS: getBoolValue('require_bls_citation', false),
      requireFAQ: getBoolValue('require_faq_schema', false),
      requireHeadings: getBoolValue('require_headings', true),
      minHeadingCount: getIntValue('min_heading_count', 3),
      minImages: getIntValue('min_images', 1),
      requireImageAlt: getBoolValue('require_image_alt_text', true),
      keywordDensityMin: getFloatValue('keyword_density_min', 0.5),
      keywordDensityMax: getFloatValue('keyword_density_max', 2.5),
      minReadability: getIntValue('min_readability_score', 60),
      maxReadability: getIntValue('max_readability_score', 80),
    }

    // Use the unified quality score service
    const result = calculateQualityScore(content, article, thresholds)

    setChecks(result.checks)
    setScore(result.score)
    setCanPublish(result.canPublish)

    onQualityChange?.({
      canPublish: result.canPublish,
      score: result.score,
      checks: result.checks,
      issues: result.issues
    })
  }, [content, article, getIntValue, getBoolValue, getFloatValue, onQualityChange])

  const handleAutoFix = async () => {
    if (!onAutoFix) return

    const issues = Object.values(checks)
      .filter(c => !c.passed && c.issue)
      .map(c => ({ description: c.issue, critical: c.critical }))

    if (issues.length === 0) return

    setIsFixing(true)
    try {
      await onAutoFix(issues)
    } catch (error) {
      console.error('Auto-fix error:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = () => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const issues = Object.values(checks).filter(c => !c.passed)

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Checklist</CardTitle>
          <Badge
            variant="outline"
            className={`${getScoreColor()} font-bold text-base px-3 py-1`}
          >
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(checks).map(([key, check]) => (
          <div
            key={key}
            className={`flex items-start justify-between gap-3 p-3 rounded-lg ${
              check.passed
                ? 'bg-green-50'
                : check.critical
                  ? 'bg-red-50'
                  : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-start gap-2 flex-1">
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : check.critical ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm text-gray-900">{check.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{check.value}</p>
                {check.critical && !check.passed && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    Critical - blocks publishing
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!canPublish && issues.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">
              Fix critical issues before publishing
            </p>
          </div>
        )}

        {issues.length > 0 && onAutoFix && (
          <Button
            onClick={handleAutoFix}
            disabled={isFixing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isFixing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing Issues...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Fix All Issues
              </>
            )}
          </Button>
        )}

        {issues.length === 0 && (
          <div className={`p-3 rounded-lg border ${getScoreBgColor()}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">All checks passed!</p>
                <p className="text-xs text-green-700">Ready for publishing</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
