/**
 * Content Utilities
 * Helper functions for processing article content
 */

/**
 * Strip images from HTML content
 * Removes <img> tags to prevent logos/images from appearing in AI-revised content
 * Per Bug #3: Large logos appearing in articles because images aren't stripped before AI revision
 *
 * @param {string} html - HTML content string
 * @returns {string} HTML content with images removed
 */
export function stripImagesFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return html || ''
  }

  // Remove <img> tags (self-closing and with closing tags)
  // Handles: <img src="..." />, <img src="...">, <img ... ></img>
  let cleaned = html.replace(/<img[^>]*\/?>/gi, '')

  // Remove <figure> tags that wrap images (common in WordPress content)
  // Keep the figcaption text but remove the image wrapper
  cleaned = cleaned.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, (match) => {
    // Try to extract figcaption content to preserve it
    const figcaptionMatch = match.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
    if (figcaptionMatch) {
      return `<p class="image-caption">${figcaptionMatch[1]}</p>`
    }
    return ''
  })

  // Remove empty paragraphs that may remain after image removal
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '')

  // Remove consecutive line breaks that may result from image removal
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

/**
 * Strip all media from HTML content (images, videos, iframes)
 * More aggressive version for cases where all embedded media should be removed
 *
 * @param {string} html - HTML content string
 * @returns {string} HTML content with all media removed
 */
export function stripMediaFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return html || ''
  }

  let cleaned = stripImagesFromHtml(html)

  // Remove video tags
  cleaned = cleaned.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '')

  // Remove iframe embeds (YouTube, etc.)
  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')

  // Remove object/embed tags (Flash, etc.)
  cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
  cleaned = cleaned.replace(/<embed[^>]*\/?>/gi, '')

  // Remove empty divs that may remain
  cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '')

  return cleaned.trim()
}

export default {
  stripImagesFromHtml,
  stripMediaFromHtml,
}
