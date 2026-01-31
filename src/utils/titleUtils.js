/**
 * Title utility functions for cleaning and formatting titles
 * Used to ensure proper display of content idea and article titles
 */

/**
 * Clean and validate title to ensure it's a proper SEO title
 * - Removes trailing periods (titles shouldn't end with periods)
 * - Truncates overly long titles that look like descriptions
 * - Ensures title starts with uppercase
 * - Handles malformed AI-generated titles
 *
 * @param {string} title - The raw title to clean
 * @param {string} description - Optional description for context
 * @returns {string} Cleaned title
 */
export function cleanTitle(title, description = '') {
  if (!title) return ''

  let cleaned = title.trim()

  // Remove trailing period if present (titles shouldn't end with periods)
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1).trim()
  }

  // If title is too long (> 80 chars), it might be a description
  // Try to extract a proper title
  if (cleaned.length > 80) {
    // Check if it starts with a number pattern like "10 Best..." or "5 Ways..."
    const numberMatch = cleaned.match(/^(\d+\s+(?:Best|Top|Ways|Steps|Tips|Reasons|Types)\s+.{10,60}?)(?:\s*[-:;,]|$)/i)
    if (numberMatch) {
      cleaned = numberMatch[1].trim()
    } else {
      // Try to find a natural break point (colon, dash, or first sentence)
      const colonIndex = cleaned.indexOf(':')
      const dashIndex = cleaned.indexOf(' - ')

      if (colonIndex > 20 && colonIndex < 70) {
        // Use everything before the colon as the title
        cleaned = cleaned.substring(0, colonIndex).trim()
      } else if (dashIndex > 20 && dashIndex < 70) {
        // Use everything before the dash as the title
        cleaned = cleaned.substring(0, dashIndex).trim()
      } else {
        // Just truncate at a word boundary around 60 chars
        const truncateAt = cleaned.lastIndexOf(' ', 60)
        if (truncateAt > 30) {
          cleaned = cleaned.substring(0, truncateAt).trim()
        } else {
          cleaned = cleaned.substring(0, 60).trim()
        }
      }
    }
  }

  // Ensure title starts with uppercase
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1)
  }

  // Remove double spaces
  cleaned = cleaned.replace(/\s+/g, ' ')

  return cleaned
}

/**
 * Get a display-friendly title, truncating if needed
 *
 * @param {string} title - The title to display
 * @param {number} maxLength - Maximum length before truncating (default 60)
 * @returns {string} Display-ready title
 */
export function getDisplayTitle(title, maxLength = 60) {
  const cleaned = cleanTitle(title)
  if (cleaned.length <= maxLength) return cleaned

  // Find a good break point
  const truncateAt = cleaned.lastIndexOf(' ', maxLength - 3)
  if (truncateAt > maxLength * 0.5) {
    return cleaned.substring(0, truncateAt) + '...'
  }
  return cleaned.substring(0, maxLength - 3) + '...'
}

export default { cleanTitle, getDisplayTitle }
