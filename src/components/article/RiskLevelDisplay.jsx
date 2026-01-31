import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react'
import { getRiskLevelColors } from '@/services/validation/riskAssessment'
import { getAutoPublishCountdown } from '@/hooks/useAutoPublish'

/**
 * RiskLevelBadge - Compact badge showing risk level
 */
export function RiskLevelBadge({ riskLevel, size = 'default' }) {
  const colors = getRiskLevelColors(riskLevel || 'LOW')

  const Icon = {
    LOW: CheckCircle2,
    MEDIUM: AlertCircle,
    HIGH: AlertTriangle,
    CRITICAL: XCircle,
  }[riskLevel] || AlertCircle

  const sizeClasses = {
    small: 'text-[10px] px-1.5 py-0',
    default: 'text-xs px-2 py-0.5',
    large: 'text-sm px-3 py-1',
  }

  const iconSize = {
    small: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    large: 'w-4 h-4',
  }

  return (
    <Badge className={`${colors.badge} ${sizeClasses[size]} gap-1`}>
      <Icon className={iconSize[size]} />
      {riskLevel || 'UNKNOWN'}
    </Badge>
  )
}

/**
 * AutoPublishCountdown - Shows time until auto-publish
 */
export function AutoPublishCountdown({ deadline, riskLevel }) {
  const countdown = getAutoPublishCountdown(deadline)

  if (!countdown.isSet) {
    return (
      <span className="text-xs text-gray-500">No auto-publish set</span>
    )
  }

  // Check if auto-publish is blocked due to risk level
  const isBlocked = riskLevel === 'HIGH' || riskLevel === 'CRITICAL'

  if (isBlocked) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-600">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Auto-publish blocked ({riskLevel} risk)</span>
      </div>
    )
  }

  if (countdown.isPast) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Clock className="w-3.5 h-3.5" />
        <span>Ready for auto-publish</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-blue-600">
      <Clock className="w-3.5 h-3.5" />
      <span>{countdown.displayText}</span>
    </div>
  )
}

/**
 * RiskLevelCard - Full card with risk assessment details
 */
export function RiskLevelCard({
  article,
  assessment,
  onRecalculate,
  isRecalculating = false
}) {
  const riskLevel = assessment?.riskLevel || article?.risk_level || 'LOW'
  const colors = getRiskLevelColors(riskLevel)

  const Icon = {
    LOW: CheckCircle2,
    MEDIUM: AlertCircle,
    HIGH: AlertTriangle,
    CRITICAL: XCircle,
  }[riskLevel] || AlertCircle

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Assessment
          </CardTitle>
          <RiskLevelBadge riskLevel={riskLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Summary */}
        <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
          <div className="flex items-start gap-2">
            <Icon className={`w-5 h-5 ${colors.text} mt-0.5`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${colors.text}`}>
                {assessment?.summary || getRiskSummary(riskLevel)}
              </p>
              {article?.quality_score !== undefined && (
                <p className="text-xs text-gray-600 mt-1">
                  Quality Score: {article.quality_score}/100
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-publish Status */}
        {article?.autopublish_deadline && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <AutoPublishCountdown
              deadline={article.autopublish_deadline}
              riskLevel={riskLevel}
            />
          </div>
        )}

        {/* Blocking Issues */}
        {assessment?.blockingIssues?.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs font-medium text-red-800 mb-2">
              Blocking Issues ({assessment.blockingIssues.length})
            </p>
            <ul className="space-y-1">
              {assessment.blockingIssues.slice(0, 3).map((issue, i) => (
                <li key={i} className="text-xs text-red-700">
                  • {issue.message || issue.issues?.[0] || 'Unknown issue'}
                </li>
              ))}
              {assessment.blockingIssues.length > 3 && (
                <li className="text-xs text-red-600 italic">
                  +{assessment.blockingIssues.length - 3} more issues
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Other Issues */}
        {assessment?.issues?.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs font-medium text-yellow-800 mb-2">
              Issues to Address ({assessment.issues.length})
            </p>
            <ul className="space-y-1">
              {assessment.issues.slice(0, 3).map((issue, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  • {issue.message || issue.type}
                </li>
              ))}
              {assessment.issues.length > 3 && (
                <li className="text-xs text-yellow-600 italic">
                  +{assessment.issues.length - 3} more issues
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Recalculate Button */}
        {onRecalculate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="w-full text-xs"
          >
            {isRecalculating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Recalculate Risk
              </>
            )}
          </Button>
        )}

        {/* Auto-publish Eligibility */}
        {riskLevel && (
          <div className={`p-2 rounded-lg border ${
            riskLevel === 'LOW'
              ? 'bg-green-50 border-green-200'
              : riskLevel === 'MEDIUM'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-[10px] ${
              riskLevel === 'LOW'
                ? 'text-green-700'
                : riskLevel === 'MEDIUM'
                ? 'text-yellow-700'
                : 'text-red-700'
            }`}>
              {riskLevel === 'LOW' && '✓ Eligible for auto-publish'}
              {riskLevel === 'MEDIUM' && '⚠ Review recommended before auto-publish'}
              {riskLevel === 'HIGH' && '✗ Requires manual review (auto-publish blocked)'}
              {riskLevel === 'CRITICAL' && '✗ Publishing blocked until issues resolved'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Get a default risk summary based on level
 */
function getRiskSummary(riskLevel) {
  const summaries = {
    LOW: 'Article meets all quality requirements and is ready for publishing.',
    MEDIUM: 'Article has minor issues that should be reviewed.',
    HIGH: 'Article has significant issues requiring attention before publishing.',
    CRITICAL: 'Article cannot be published due to blocking compliance issues.',
  }
  return summaries[riskLevel] || 'Risk level not assessed.'
}

export default {
  RiskLevelBadge,
  RiskLevelCard,
  AutoPublishCountdown,
}
