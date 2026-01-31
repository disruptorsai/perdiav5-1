/**
 * Revision Validator
 * Validates that AI revisions actually addressed the requested changes
 *
 * Per GetEducated issue report - addresses:
 * - Issue 5: "Edits not sticking - AI addressed it but content still wrong"
 * - Issue 6: "Comment addressed but missing required link"
 */

/**
 * Validate that a revision actually addressed the feedback
 * @param {string} originalContent - Content before revision
 * @param {string} revisedContent - Content after AI revision
 * @param {Array} feedbackItems - Array of feedback items that should have been addressed
 * @returns {Object} Validation result with details for each feedback item
 */
export function validateRevision(originalContent, revisedContent, feedbackItems) {
  const results = {
    success: true,
    addressedCount: 0,
    failedCount: 0,
    partialCount: 0,
    items: [],
    summary: ''
  }

  if (!feedbackItems || feedbackItems.length === 0) {
    results.summary = 'No feedback items to validate'
    return results
  }

  for (const item of feedbackItems) {
    const validation = validateSingleFeedback(originalContent, revisedContent, item)
    results.items.push(validation)

    if (validation.status === 'addressed') {
      results.addressedCount++
    } else if (validation.status === 'failed') {
      results.failedCount++
      results.success = false
    } else if (validation.status === 'partial') {
      results.partialCount++
    }
  }

  // Generate summary
  if (results.failedCount === 0 && results.partialCount === 0) {
    results.summary = `All ${results.addressedCount} feedback items were successfully addressed`
  } else if (results.failedCount > 0) {
    results.summary = `${results.failedCount} of ${feedbackItems.length} items may not have been fully addressed. Please review.`
  } else {
    results.summary = `${results.addressedCount} items addressed, ${results.partialCount} partially addressed`
  }

  return results
}

/**
 * Validate a single feedback item
 */
function validateSingleFeedback(originalContent, revisedContent, item) {
  const result = {
    id: item.id,
    comment: item.comment,
    category: item.category,
    status: 'unknown',
    evidence: [],
    warnings: []
  }

  const commentLower = item.comment.toLowerCase()
  const selectedText = item.selected_text || ''

  // Check for link-related feedback
  if (isLinkRequest(commentLower)) {
    const linkValidation = validateLinkAddition(originalContent, revisedContent, commentLower, selectedText)
    Object.assign(result, linkValidation)
    return result
  }

  // Check for text correction feedback (typos, formatting errors like "$15,5006")
  if (isTextCorrectionRequest(commentLower, selectedText)) {
    const correctionValidation = validateTextCorrection(originalContent, revisedContent, selectedText, commentLower)
    Object.assign(result, correctionValidation)
    return result
  }

  // Check for removal requests
  if (isRemovalRequest(commentLower)) {
    const removalValidation = validateRemoval(originalContent, revisedContent, selectedText)
    Object.assign(result, removalValidation)
    return result
  }

  // Check for addition requests
  if (isAdditionRequest(commentLower)) {
    const additionValidation = validateAddition(originalContent, revisedContent, commentLower)
    Object.assign(result, additionValidation)
    return result
  }

  // Generic change detection - improved to handle context changes
  const contentChanged = originalContent !== revisedContent
  const selectedTextMoved = selectedText && !revisedContent.includes(selectedText) && originalContent.includes(selectedText)

  if (contentChanged) {
    if (selectedTextMoved) {
      result.status = 'addressed'
      result.evidence.push('The highlighted text was modified or removed')
    } else {
      // Check if the content around the selected text was modified
      // Many valid revisions keep the text but improve context (e.g., "clarify this", "improve flow")
      const contextChanged = checkContextChanged(originalContent, revisedContent, selectedText)

      if (contextChanged.changed) {
        result.status = 'addressed'
        result.evidence.push('The context around the highlighted text was modified')
        if (contextChanged.details) {
          result.evidence.push(contextChanged.details)
        }
      } else {
        // Check if overall content improved significantly
        const significantChange = checkSignificantChange(originalContent, revisedContent)

        if (significantChange) {
          result.status = 'addressed'
          result.evidence.push('Content was significantly revised')
        } else {
          result.status = 'partial'
          result.evidence.push('Content was changed but the specific selection may not have been addressed')
          result.warnings.push('Please verify this change manually')
        }
      }
    }
  } else {
    result.status = 'failed'
    result.evidence.push('No changes detected in the content')
  }

  return result
}

/**
 * Check if the context around selected text was changed
 * Looks at the paragraph/section containing the selected text
 */
function checkContextChanged(originalContent, revisedContent, selectedText) {
  if (!selectedText || selectedText.length < 5) {
    return { changed: false }
  }

  // Find the paragraph containing the selected text in original
  const paragraphs = originalContent.split(/<\/p>|<\/h[2-6]>|<\/li>/i)
  let containingParagraph = null
  let paragraphIndex = -1

  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(selectedText.substring(0, Math.min(50, selectedText.length)))) {
      containingParagraph = paragraphs[i]
      paragraphIndex = i
      break
    }
  }

  if (!containingParagraph) {
    return { changed: false }
  }

  // Find the corresponding paragraph in revised content
  const revisedParagraphs = revisedContent.split(/<\/p>|<\/h[2-6]>|<\/li>/i)

  // Check if the paragraph was modified
  if (paragraphIndex < revisedParagraphs.length) {
    const originalPara = containingParagraph.replace(/<[^>]+>/g, '').trim()
    const revisedPara = revisedParagraphs[paragraphIndex].replace(/<[^>]+>/g, '').trim()

    // Calculate simple difference ratio
    const lengthDiff = Math.abs(originalPara.length - revisedPara.length)
    const avgLength = (originalPara.length + revisedPara.length) / 2
    const diffRatio = avgLength > 0 ? lengthDiff / avgLength : 0

    // If paragraph length changed by more than 10%, consider it modified
    if (diffRatio > 0.1 || originalPara !== revisedPara) {
      return {
        changed: true,
        details: `Paragraph containing selection was modified (${Math.round(diffRatio * 100)}% length change)`
      }
    }
  }

  return { changed: false }
}

/**
 * Check if the content was significantly changed overall
 * Useful for generic feedback like "improve this article"
 */
function checkSignificantChange(originalContent, revisedContent) {
  // Strip HTML for comparison
  const originalText = originalContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const revisedText = revisedContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // Calculate word-level differences
  const originalWords = originalText.split(' ').length
  const revisedWords = revisedText.split(' ').length
  const wordDiff = Math.abs(originalWords - revisedWords)

  // If more than 5% of words changed, consider it significant
  if (wordDiff / Math.max(originalWords, revisedWords) > 0.05) {
    return true
  }

  // Check character-level difference
  const charDiff = Math.abs(originalText.length - revisedText.length)
  if (charDiff / Math.max(originalText.length, 1) > 0.05) {
    return true
  }

  return false
}

/**
 * Detect if feedback is requesting a link
 */
function isLinkRequest(comment) {
  const linkKeywords = [
    'link', 'href', 'url', 'ranking report', 'add a link',
    'needs a link', 'should link', 'link to', 'hyperlink',
    'reference', 'cite', 'source'
  ]
  return linkKeywords.some(kw => comment.includes(kw))
}

/**
 * Validate that a link was actually added
 */
function validateLinkAddition(originalContent, revisedContent, comment, selectedText) {
  const result = {
    status: 'unknown',
    evidence: [],
    warnings: []
  }

  // Count links in original vs revised
  const originalLinkCount = (originalContent.match(/<a\s+[^>]*href/gi) || []).length
  const revisedLinkCount = (revisedContent.match(/<a\s+[^>]*href/gi) || []).length

  // Check for ranking report links specifically
  if (comment.includes('ranking') || comment.includes('report')) {
    const hasRankingLink = revisedContent.includes('ranking') && revisedContent.includes('<a')
    const rankingLinkPattern = /<a[^>]*href[^>]*>[^<]*rank/i

    if (rankingLinkPattern.test(revisedContent) || (hasRankingLink && revisedLinkCount > originalLinkCount)) {
      result.status = 'addressed'
      result.evidence.push('A ranking-related link appears to have been added')
    } else {
      result.status = 'failed'
      result.evidence.push('No ranking report link was found in the revised content')
      result.warnings.push('The AI may not have added the requested ranking report link')
    }
    return result
  }

  // General link check
  if (revisedLinkCount > originalLinkCount) {
    result.status = 'addressed'
    result.evidence.push(`Link count increased from ${originalLinkCount} to ${revisedLinkCount}`)
  } else if (revisedLinkCount === originalLinkCount) {
    // Check if links were changed (not just added)
    const originalLinks = extractLinks(originalContent)
    const revisedLinks = extractLinks(revisedContent)
    const newLinks = revisedLinks.filter(l => !originalLinks.includes(l))

    if (newLinks.length > 0) {
      result.status = 'addressed'
      result.evidence.push(`New links added: ${newLinks.slice(0, 3).join(', ')}${newLinks.length > 3 ? '...' : ''}`)
    } else {
      result.status = 'failed'
      result.evidence.push('No new links were added to the content')
      result.warnings.push('The requested link may not have been inserted')
    }
  } else {
    result.status = 'partial'
    result.evidence.push('Some links may have been removed or changed')
    result.warnings.push('Please verify the link changes manually')
  }

  return result
}

/**
 * Extract all href URLs from content
 */
function extractLinks(content) {
  const matches = content.match(/href=["']([^"']+)["']/gi) || []
  return matches.map(m => m.replace(/href=["']|["']/g, ''))
}

/**
 * Detect if feedback is requesting text correction
 */
function isTextCorrectionRequest(comment, selectedText) {
  const correctionKeywords = [
    'typo', 'error', 'incorrect', 'wrong', 'fix', 'correct',
    'should be', 'change to', 'replace with', 'update to'
  ]
  // Also check for obvious formatting errors in selected text
  const hasFormattingError = /\$[\d,]+[^\d\s]/.test(selectedText) // e.g., "$15,5006"

  return correctionKeywords.some(kw => comment.includes(kw)) || hasFormattingError
}

/**
 * Validate that text was corrected
 */
function validateTextCorrection(originalContent, revisedContent, selectedText, comment) {
  const result = {
    status: 'unknown',
    evidence: [],
    warnings: []
  }

  // Check if the problematic text was removed
  const originalHasText = originalContent.includes(selectedText)
  const revisedHasText = revisedContent.includes(selectedText)

  if (originalHasText && !revisedHasText) {
    result.status = 'addressed'
    result.evidence.push(`The problematic text "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}" was corrected`)
  } else if (!originalHasText) {
    result.status = 'partial'
    result.evidence.push('The selected text was not found in the original content')
    result.warnings.push('Unable to verify correction')
  } else {
    // Text still exists - this is a failure
    result.status = 'failed'
    result.evidence.push(`The text "${selectedText.substring(0, 30)}..." still appears in the revised content`)
    result.warnings.push('The AI may not have made the requested correction')
  }

  return result
}

/**
 * Detect if feedback is requesting removal
 */
function isRemovalRequest(comment) {
  const removalKeywords = [
    'remove', 'delete', 'cut', 'eliminate', 'get rid of',
    'should not', 'shouldn\'t', 'don\'t need', 'unnecessary'
  ]
  return removalKeywords.some(kw => comment.includes(kw))
}

/**
 * Validate that content was removed
 */
function validateRemoval(originalContent, revisedContent, selectedText) {
  const result = {
    status: 'unknown',
    evidence: [],
    warnings: []
  }

  if (!selectedText) {
    result.status = 'partial'
    result.evidence.push('No specific text was selected for removal')
    return result
  }

  const originalHasText = originalContent.includes(selectedText)
  const revisedHasText = revisedContent.includes(selectedText)

  if (originalHasText && !revisedHasText) {
    result.status = 'addressed'
    result.evidence.push('The selected content was successfully removed')
  } else if (!originalHasText) {
    result.status = 'partial'
    result.evidence.push('The selected text was not found in original')
  } else {
    result.status = 'failed'
    result.evidence.push('The selected content still appears in the revised version')
  }

  return result
}

/**
 * Detect if feedback is requesting addition
 */
function isAdditionRequest(comment) {
  const additionKeywords = [
    'add', 'include', 'insert', 'needs', 'missing', 'should have',
    'should include', 'please add', 'could use'
  ]
  return additionKeywords.some(kw => comment.includes(kw))
}

/**
 * Validate that content was added
 */
function validateAddition(originalContent, revisedContent, comment) {
  const result = {
    status: 'unknown',
    evidence: [],
    warnings: []
  }

  // Check if revised content is longer
  const originalLength = originalContent.length
  const revisedLength = revisedContent.length

  if (revisedLength > originalLength) {
    result.status = 'addressed'
    result.evidence.push(`Content length increased from ${originalLength} to ${revisedLength} characters`)
  } else {
    result.status = 'partial'
    result.evidence.push('Content length did not increase')
    result.warnings.push('The requested addition may not have been made')
  }

  return result
}

/**
 * Generate a human-readable summary of validation results
 */
export function generateValidationSummary(validationResult) {
  const { items, addressedCount, failedCount, partialCount } = validationResult

  let summary = []

  if (failedCount > 0) {
    summary.push(`⚠️ ${failedCount} item(s) may need manual review:`)
    items.filter(i => i.status === 'failed').forEach(item => {
      summary.push(`  - ${item.comment.substring(0, 60)}${item.comment.length > 60 ? '...' : ''}`)
      if (item.warnings.length > 0) {
        summary.push(`    Reason: ${item.warnings[0]}`)
      }
    })
  }

  if (addressedCount > 0) {
    summary.push(`✅ ${addressedCount} item(s) successfully addressed`)
  }

  if (partialCount > 0) {
    summary.push(`⚡ ${partialCount} item(s) partially addressed (please verify)`)
  }

  return summary.join('\n')
}

export default {
  validateRevision,
  generateValidationSummary
}
