import { CheckCircle, XCircle, AlertCircle, Loader2, Sparkles, Shield, ShieldAlert } from 'lucide-react'
import { useState, useEffect } from 'react'
import { calculateQualityScore, getQualityThresholds } from '../../services/qualityScoreService'

/**
 * Quality Checklist Component
 *
 * UNIFIED v2: Uses qualityScoreService for consistent scoring across all UI
 *
 * Displays article quality metrics and provides auto-fix capability
 */
function QualityChecklist({ article, onAutoFix }) {
  const [isFixing, setIsFixing] = useState(false)
  const [qualityData, setQualityData] = useState(null)

  // Calculate quality score using unified service
  useEffect(() => {
    async function calculateScore() {
      if (!article?.content) {
        setQualityData(null)
        return
      }

      const thresholds = await getQualityThresholds()
      const result = calculateQualityScore(article.content, article, thresholds)
      setQualityData(result)
    }

    calculateScore()
  }, [article?.content, article?.contributor_id])

  if (!article) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">Loading quality metrics...</p>
      </div>
    )
  }

  if (!qualityData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Calculating quality score...</p>
        </div>
      </div>
    )
  }

  const { score, checks, issues, canPublish } = qualityData

  const handleAutoFix = async () => {
    if (!onAutoFix || issues.length === 0) return

    setIsFixing(true)
    try {
      await onAutoFix(issues)
    } catch (error) {
      console.error('Auto-fix error:', error)
      alert('Auto-fix failed: ' + error.message)
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Quality Checklist</h3>
          {canPublish ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Ready</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-medium">Blocked</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline space-x-2">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-gray-600">/100</div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {Object.values(checks).filter(c => c.passed).length} of {Object.keys(checks).length} checks passed
        </p>
      </div>

      {/* Checks List */}
      <div className="p-6 space-y-4">
        {Object.entries(checks).map(([key, check]) => (
          <MetricItem
            key={key}
            label={check.label}
            value={check.value}
            passed={check.passed}
            critical={check.critical}
            issue={check.issue}
          />
        ))}
      </div>

      {/* Critical Failure Warning */}
      {!canPublish && (
        <div className="px-6 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">
                  Cannot Publish
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  Critical issues must be resolved before publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues Summary */}
      {issues.length > 0 && (
        <div className="p-6 pt-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">
                  {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Found
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${issue.critical ? 'bg-red-600' : 'bg-yellow-600'}`}></span>
                      <span>{issue.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Fix Button */}
      {issues.length > 0 && onAutoFix && (
        <div className="p-6 pt-0">
          <button
            onClick={handleAutoFix}
            disabled={isFixing}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Uses AI to automatically resolve quality issues
          </p>
        </div>
      )}

      {/* Success State */}
      {issues.length === 0 && (
        <div className="p-6 pt-0">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-900">
                  All Quality Checks Passed!
                </h4>
                <p className="text-xs text-green-700 mt-1">
                  This article meets all quality standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual Metric Item
 */
function MetricItem({ label, value, passed, critical, issue }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {critical && !passed && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
              Critical
            </span>
          )}
        </div>
        <div className="mt-1">
          <span className={`text-xs ${passed ? 'text-green-600' : critical ? 'text-red-600' : 'text-yellow-600'}`}>
            {value}
          </span>
        </div>
      </div>
      <div>
        {passed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className={`w-5 h-5 ${critical ? 'text-red-600' : 'text-yellow-600'}`} />
        )}
      </div>
    </div>
  )
}

/**
 * Get color class based on quality score
 * UNIFIED: Uses same thresholds as other UI components (80/60)
 */
function getScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export default QualityChecklist
