/**
 * Risk Assessment Service for GetEducated
 * Calculates risk level for articles based on content quality and compliance
 *
 * Risk Levels:
 * - LOW: Safe for auto-publish (score >= 85, no blocking issues)
 * - MEDIUM: Review recommended (score 70-84 or minor warnings)
 * - HIGH: Review required (score < 70, or major issues)
 * - CRITICAL: Publish blocked (blocking compliance issues)
 */

import { validateContent } from './linkValidator'

// Risk level thresholds
const RISK_THRESHOLDS = {
  LOW: 85,      // Quality score >= 85 with no issues
  MEDIUM: 70,   // Quality score 70-84 or minor issues
  HIGH: 0,      // Quality score < 70 or major issues
  // CRITICAL is set when blocking issues are present
}

// Issue weights for risk calculation
const ISSUE_WEIGHTS = {
  // Blocking issues (immediate CRITICAL)
  'blocked_link': 100,
  'unauthorized_author': 100,
  'missing_shortcode': 80,

  // Major issues (push toward HIGH)
  'missing_internal_links': 25,
  'missing_external_links': 20,
  'word_count_low': 20,
  'poor_readability': 15,
  'weak_headings': 15,
  'missing_faqs': 10,

  // Minor issues (push toward MEDIUM)
  'word_count_high': 5,
  'external_link_warning': 5,
  'missing_bls_citation': 10,
  'keyword_density_issue': 5,
}

/**
 * Assess the risk level for an article
 * @param {Object} article - Article object with content, contributor, quality metrics
 * @param {Object} options - Assessment options
 * @returns {Object} Risk assessment result
 */
export function assessRisk(article, options = {}) {
  const {
    checkLinks = true,
    checkAuthor = true,
    approvedAuthors = ['Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity'],
  } = options

  const assessment = {
    riskLevel: 'LOW',
    riskScore: 0,
    qualityScore: article.quality_score || 0,
    issues: [],
    blockingIssues: [],
    warnings: [],
    canAutoPublish: true,
    requiresReview: false,
    publishBlocked: false,
    summary: '',
  }

  // Start with quality score issues
  const existingFlags = article.risk_flags || []
  for (const flag of existingFlags) {
    const weight = ISSUE_WEIGHTS[flag] || 10
    assessment.riskScore += weight
    assessment.issues.push({
      type: flag,
      severity: weight >= 20 ? 'major' : 'minor',
      message: getIssueMessage(flag),
    })
  }

  // Check link compliance
  if (checkLinks && article.content) {
    const linkValidation = validateContent(article.content)

    if (!linkValidation.isCompliant) {
      assessment.blockingIssues.push(...linkValidation.blockingIssues)
      assessment.riskScore += ISSUE_WEIGHTS['blocked_link'] * linkValidation.blockingIssues.length
    }

    if (linkValidation.warnings.length > 0) {
      assessment.warnings.push(...linkValidation.warnings)
      assessment.riskScore += ISSUE_WEIGHTS['external_link_warning'] * linkValidation.warnings.length
    }

    // Check minimum internal links
    if (linkValidation.internalLinks < 3) {
      assessment.issues.push({
        type: 'missing_internal_links',
        severity: 'major',
        message: `Only ${linkValidation.internalLinks} internal links found (minimum: 3)`,
      })
      assessment.riskScore += ISSUE_WEIGHTS['missing_internal_links']
    }
  }

  // Check author authorization
  if (checkAuthor && article.contributor_name) {
    const isApproved = approvedAuthors.includes(article.contributor_name)
    if (!isApproved) {
      assessment.blockingIssues.push({
        type: 'unauthorized_author',
        message: `Author "${article.contributor_name}" is not an approved GetEducated author`,
      })
      assessment.riskScore += ISSUE_WEIGHTS['unauthorized_author']
    }
  }

  // Determine risk level based on score and issues
  if (assessment.blockingIssues.length > 0) {
    assessment.riskLevel = 'CRITICAL'
    assessment.publishBlocked = true
    assessment.canAutoPublish = false
    assessment.requiresReview = true
  } else if (assessment.riskScore >= 50 || assessment.qualityScore < RISK_THRESHOLDS.MEDIUM) {
    assessment.riskLevel = 'HIGH'
    assessment.canAutoPublish = false
    assessment.requiresReview = true
  } else if (assessment.riskScore >= 20 || assessment.qualityScore < RISK_THRESHOLDS.LOW) {
    assessment.riskLevel = 'MEDIUM'
    assessment.canAutoPublish = false
    assessment.requiresReview = true
  } else {
    assessment.riskLevel = 'LOW'
    assessment.canAutoPublish = true
    assessment.requiresReview = false
  }

  // Generate summary
  assessment.summary = generateSummary(assessment)

  return assessment
}

/**
 * Get human-readable message for an issue type
 * @param {string} issueType - The issue type code
 * @returns {string} Human-readable message
 */
function getIssueMessage(issueType) {
  const messages = {
    'blocked_link': 'Contains blocked links (competitors or .edu)',
    'unauthorized_author': 'Author is not on the approved list',
    'missing_shortcode': 'Monetization links missing required shortcodes',
    'missing_internal_links': 'Not enough internal links to GetEducated content',
    'missing_external_links': 'Missing authoritative external citations',
    'word_count_low': 'Article is below minimum word count (1500 words)',
    'word_count_high': 'Article exceeds recommended word count (2500 words)',
    'poor_readability': 'Readability score needs improvement',
    'weak_headings': 'Heading structure needs improvement',
    'missing_faqs': 'Missing FAQ section (minimum 3 questions)',
    'external_link_warning': 'External link not on approved whitelist',
    'missing_bls_citation': 'Missing BLS citation for salary/career data',
    'keyword_density_issue': 'Focus keyword density outside optimal range',
  }
  return messages[issueType] || issueType
}

/**
 * Generate a summary description of the risk assessment
 * @param {Object} assessment - The risk assessment result
 * @returns {string} Summary text
 */
function generateSummary(assessment) {
  const { riskLevel, blockingIssues, issues, qualityScore } = assessment

  if (riskLevel === 'CRITICAL') {
    return `Publishing blocked: ${blockingIssues.length} critical issue(s) must be resolved.`
  }

  if (riskLevel === 'HIGH') {
    return `High risk: ${issues.length} issue(s) require attention. Quality score: ${qualityScore}.`
  }

  if (riskLevel === 'MEDIUM') {
    return `Review recommended: ${issues.length} minor issue(s). Quality score: ${qualityScore}.`
  }

  return `Ready for publishing. Quality score: ${qualityScore}.`
}

/**
 * Get the color scheme for a risk level
 * @param {string} riskLevel - The risk level
 * @returns {Object} Color classes for UI
 */
export function getRiskLevelColors(riskLevel) {
  const colors = {
    LOW: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
    },
    MEDIUM: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    HIGH: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800',
    },
    CRITICAL: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    },
  }
  return colors[riskLevel] || colors.MEDIUM
}

/**
 * Get the icon name for a risk level
 * @param {string} riskLevel - The risk level
 * @returns {string} Lucide icon name
 */
export function getRiskLevelIcon(riskLevel) {
  const icons = {
    LOW: 'CheckCircle2',
    MEDIUM: 'AlertCircle',
    HIGH: 'AlertTriangle',
    CRITICAL: 'XCircle',
  }
  return icons[riskLevel] || 'AlertCircle'
}

/**
 * Calculate if an article is eligible for auto-publish
 * @param {Object} assessment - Risk assessment result
 * @param {Object} settings - System settings
 * @returns {Object} Auto-publish eligibility
 */
export function checkAutoPublishEligibility(assessment, settings = {}) {
  const {
    blockHighRiskPublish = true,
    requireMinQualityScore = 80,
  } = settings

  if (assessment.publishBlocked) {
    return {
      eligible: false,
      reason: 'Article has critical issues that block publishing',
    }
  }

  if (blockHighRiskPublish && (assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'CRITICAL')) {
    return {
      eligible: false,
      reason: `${assessment.riskLevel} risk articles require manual review`,
    }
  }

  if (assessment.qualityScore < requireMinQualityScore) {
    return {
      eligible: false,
      reason: `Quality score (${assessment.qualityScore}) below minimum (${requireMinQualityScore})`,
    }
  }

  return {
    eligible: true,
    reason: null,
  }
}

export default {
  assessRisk,
  getRiskLevelColors,
  getRiskLevelIcon,
  checkAutoPublishEligibility,
  RISK_THRESHOLDS,
  ISSUE_WEIGHTS,
}
