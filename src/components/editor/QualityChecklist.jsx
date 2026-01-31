import { CheckCircle, XCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

/**
 * Quality Checklist Component
 * Displays article quality metrics and provides auto-fix capability
 */
function QualityChecklist({ article, onAutoFix }) {
  const [isFixing, setIsFixing] = useState(false)

  if (!article) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">Loading quality metrics...</p>
      </div>
    )
  }

  // Calculate metrics from article
  const metrics = calculateMetrics(article)
  const issues = identifyIssues(metrics, article)

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
        <h3 className="font-semibold text-gray-900 mb-2">Quality Checklist</h3>
        <div className="flex items-baseline space-x-2">
          <div className={`text-4xl font-bold ${getScoreColor(article.quality_score)}`}>
            {article.quality_score || 0}
          </div>
          <div className="text-gray-600">/100</div>
        </div>
      </div>

      {/* Metrics List */}
      <div className="p-6 space-y-4">
        <MetricItem
          label="Word Count"
          value={metrics.wordCount}
          target="1500-2500 words"
          passed={metrics.wordCount >= 1500 && metrics.wordCount <= 2500}
          severity={metrics.wordCount < 1500 ? 'major' : 'minor'}
        />

        <MetricItem
          label="Internal Links"
          value={`${metrics.internalLinks} links`}
          target="3-5 links"
          passed={metrics.internalLinks >= 3 && metrics.internalLinks <= 5}
          severity="major"
        />

        <MetricItem
          label="External Links"
          value={`${metrics.externalLinks} citations`}
          target="2-4 citations"
          passed={metrics.externalLinks >= 2 && metrics.externalLinks <= 4}
          severity="minor"
        />

        <MetricItem
          label="FAQ Section"
          value={`${metrics.faqCount} questions`}
          target="3+ questions"
          passed={metrics.faqCount >= 3}
          severity="minor"
        />

        <MetricItem
          label="Heading Structure"
          value={`${metrics.headingCount} headings`}
          target="3+ H2 headings"
          passed={metrics.headingCount >= 3}
          severity="minor"
        />

        <MetricItem
          label="Readability"
          value={`${metrics.avgSentenceLength.toFixed(0)} words/sentence`}
          target="≤25 words/sentence"
          passed={metrics.avgSentenceLength <= 25}
          severity="minor"
        />
      </div>

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
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
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
function MetricItem({ label, value, target, passed, severity }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {severity === 'major' && !passed && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
              Critical
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-600">{value}</span>
          <span className="text-xs text-gray-400">→</span>
          <span className="text-xs text-gray-500">{target}</span>
        </div>
      </div>
      <div>
        {passed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className={`w-5 h-5 ${severity === 'major' ? 'text-red-600' : 'text-yellow-600'}`} />
        )}
      </div>
    </div>
  )
}

/**
 * Calculate metrics from article content
 */
function calculateMetrics(article) {
  const content = article.content || ''

  // Strip HTML for text analysis
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length

  // Count links
  const internalLinks = (content.match(/<a\s+(?:[^>]*?\s+)?href=["'][^"']*["']/gi) || []).length
  const externalLinks = (content.match(/href=["']https?:\/\//gi) || []).length

  // Count FAQs
  const faqCount = article.faqs?.length || 0

  // Count headings
  const headingCount = (content.match(/<h2/gi) || []).length

  // Calculate average sentence length
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0

  return {
    wordCount,
    internalLinks,
    externalLinks,
    faqCount,
    headingCount,
    avgSentenceLength,
  }
}

/**
 * Identify issues based on metrics
 */
function identifyIssues(metrics) {
  const issues = []

  if (metrics.wordCount < 1500) {
    issues.push({
      type: 'word_count_low',
      severity: 'major',
      description: `Article is too short (${metrics.wordCount} words). Aim for 1500-2500 words.`,
    })
  } else if (metrics.wordCount > 2500) {
    issues.push({
      type: 'word_count_high',
      severity: 'minor',
      description: `Article is too long (${metrics.wordCount} words). Consider condensing.`,
    })
  }

  if (metrics.internalLinks < 3) {
    issues.push({
      type: 'missing_internal_links',
      severity: 'major',
      description: `Missing internal links. Add ${3 - metrics.internalLinks} more.`,
    })
  }

  if (metrics.externalLinks < 2) {
    issues.push({
      type: 'missing_external_links',
      severity: 'minor',
      description: `Missing external citations. Add ${2 - metrics.externalLinks} more.`,
    })
  }

  if (metrics.faqCount < 3) {
    issues.push({
      type: 'missing_faqs',
      severity: 'minor',
      description: `Missing FAQ section. Add ${3 - metrics.faqCount} more questions.`,
    })
  }

  if (metrics.headingCount < 3) {
    issues.push({
      type: 'weak_headings',
      severity: 'minor',
      description: `Weak heading structure. Add ${3 - metrics.headingCount} more H2 headings.`,
    })
  }

  if (metrics.avgSentenceLength > 25) {
    issues.push({
      type: 'poor_readability',
      severity: 'minor',
      description: `Readability could be improved. Shorten some sentences.`,
    })
  }

  return issues
}

/**
 * Get color class based on quality score
 */
function getScoreColor(score) {
  if (score >= 85) return 'text-green-600'
  if (score >= 75) return 'text-yellow-600'
  return 'text-red-600'
}

export default QualityChecklist
