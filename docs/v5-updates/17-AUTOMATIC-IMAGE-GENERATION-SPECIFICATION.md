# Automatic Image Generation Specification

**Created:** January 12, 2026
**Status:** PLANNING (Implementation Ready)
**Priority:** HIGH (Required for full auto-publish workflow)

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Architecture](#architecture)
4. [Image Generation Pipeline](#image-generation-pipeline)
5. [WordPress Media Integration](#wordpress-media-integration)
6. [Prompt Engineering Strategy](#prompt-engineering-strategy)
7. [Quality Assurance](#quality-assurance)
8. [Cost Management](#cost-management)
9. [Error Handling & Fallbacks](#error-handling--fallbacks)
10. [Implementation Phases](#implementation-phases)
11. [Technical Specifications](#technical-specifications)
12. [Testing Checklist](#testing-checklist)

---

## Overview

### Problem Statement

The current Perdia v5 auto-publish workflow cannot fully operate without human intervention because:
1. Articles require images for SEO and engagement
2. Images must be uploaded to WordPress Media Library
3. Featured images must be set on posts
4. Alt text must be generated for accessibility/SEO

### Solution

Integrate automatic image generation (GPT Image 1 / Nano Banana Pro) into the article generation pipeline with direct WordPress Media Library upload, enabling true zero-touch publishing.

### Goals

- **Zero Human Intervention:** Complete articles published with images automatically
- **Ideal Images Every Time:** Consistent, high-quality images matching content
- **Cost Controlled:** Stay within budget limits ($5/day, $50/month)
- **SEO Optimized:** Proper alt text, file naming, featured image designation

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Generate 1-3 images per article automatically | MUST |
| FR-2 | Upload images to WordPress Media Library | MUST |
| FR-3 | Set featured image on WordPress post | MUST |
| FR-4 | Generate SEO-friendly alt text for each image | MUST |
| FR-5 | Insert images at appropriate positions in article content | MUST |
| FR-6 | Support both new article creation and article updates | MUST |
| FR-7 | Track image generation costs per article | SHOULD |
| FR-8 | Allow manual image override before publish | SHOULD |
| FR-9 | Generate multiple image options for human selection | COULD |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Image generation time | < 30 seconds per image |
| NFR-2 | Image quality | Medium (GPT) or 2K (Nano) |
| NFR-3 | Cost per article | < $0.50 average |
| NFR-4 | Success rate | > 95% |
| NFR-5 | Retry limit | 3 attempts per image |

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARTICLE GENERATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Stage 1: Contributor Assignment                                         │
│      ↓                                                                   │
│  Stage 2: Draft Generation (Grok)                                        │
│      ↓                                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Stage 2B: IMAGE GENERATION (NEW)                              │     │
│  │                                                                 │     │
│  │  1. Analyze content → Extract key topics/themes                │     │
│  │  2. Generate image prompts from H2 headings + context          │     │
│  │  3. Call GPT Image 1 API (default) or Nano Banana Pro          │     │
│  │  4. Receive image URLs/base64                                   │     │
│  │  5. Generate alt text using Claude                              │     │
│  │  6. Store image data in article record                          │     │
│  │  7. Insert <img> tags at optimal positions                      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│      ↓                                                                   │
│  Stage 3: Humanization (StealthGPT)                                     │
│      ↓                                                                   │
│  Stage 4: Quality Scoring (includes image checks)                       │
│      ↓                                                                   │
│  Stage 5: Internal Linking                                               │
│      ↓                                                                   │
│  SAVE TO DATABASE                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          PUBLISH PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Pre-publish validation (includes image checks)                       │
│      ↓                                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  2. WORDPRESS MEDIA UPLOAD (NEW)                               │     │
│  │                                                                 │     │
│  │  a. For each image in article.images[]:                        │     │
│  │     - POST to /wp-json/wp/v2/media                             │     │
│  │     - Include Content-Disposition header                        │     │
│  │     - Set alt_text in media metadata                            │     │
│  │     - Receive WordPress media_id                                │     │
│  │                                                                 │     │
│  │  b. Update article content:                                     │     │
│  │     - Replace temp image URLs with WordPress URLs               │     │
│  │     - Store media_ids for featured image assignment             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│      ↓                                                                   │
│  3. Build webhook payload (includes featured_media_id)                   │
│      ↓                                                                   │
│  4. POST to n8n webhook                                                  │
│      ↓                                                                   │
│  5. n8n creates WordPress post with:                                     │
│     - Content containing WordPress image URLs                            │
│     - featured_media = first uploaded media_id                           │
│     - wp_postmeta for Article Contributor                                │
│      ↓                                                                   │
│  6. Sync to GetEducated catalog                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### New Service Files

```
src/services/
├── ai/
│   ├── grokClient.js           (existing)
│   ├── claudeClient.js         (existing)
│   ├── stealthGptClient.js     (existing)
│   └── imageGenerationClient.js (NEW - GPT Image 1 / Nano)
│
├── imageService.js              (NEW - orchestrates image workflow)
├── wordpressMediaService.js     (NEW - WordPress Media API)
└── generationService.js         (MODIFIED - add Stage 2B)
```

---

## Image Generation Pipeline

### Stage 2B: Image Generation

```javascript
// src/services/imageService.js

class ImageService {
  constructor() {
    this.imageClient = new ImageGenerationClient()
    this.claudeClient = new ClaudeClient()
  }

  /**
   * Generate images for an article
   * @param {Object} articleContent - Draft HTML content
   * @param {Object} metadata - Article metadata (title, topics, contentType)
   * @returns {Object} { images: [], featuredImage: {}, cost: number }
   */
  async generateArticleImages(articleContent, metadata) {
    const { title, topics, contentType, targetImageCount = 2 } = metadata

    // Step 1: Extract image placement points
    const placements = this.identifyImagePlacements(articleContent)

    // Step 2: Generate prompts for each placement
    const prompts = await this.generateImagePrompts(placements, metadata)

    // Step 3: Generate images (with cost tracking)
    const images = []
    let totalCost = 0

    for (const prompt of prompts.slice(0, targetImageCount)) {
      const result = await this.imageClient.generate({
        prompt: prompt.text,
        model: 'gpt-image-1',
        quality: 'medium',  // Balance cost/quality
        size: '1536x1024',  // Landscape for articles
        style: 'photorealistic'
      })

      if (result.success) {
        // Step 4: Generate alt text
        const altText = await this.generateAltText(prompt.context, title)

        images.push({
          url: result.url,
          base64: result.base64,
          altText: altText,
          placement: prompt.placement,
          prompt: prompt.text,
          cost: result.cost
        })

        totalCost += result.cost
      }
    }

    return {
      images,
      featuredImage: images[0] || null,
      totalCost,
      reasoning: this.buildReasoningLog(prompts, images)
    }
  }

  /**
   * Identify optimal image placement points in HTML content
   */
  identifyImagePlacements(htmlContent) {
    const placements = []

    // Featured image (before first paragraph)
    placements.push({
      type: 'featured',
      position: 'before-first-p',
      context: 'Main article visual representing the overall topic'
    })

    // After H2 headings (select 1-2 key sections)
    const h2Matches = htmlContent.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)
    for (const match of h2Matches) {
      placements.push({
        type: 'section',
        position: `after-h2-${match[1].toLowerCase().replace(/\s+/g, '-')}`,
        context: match[1],
        heading: match[1]
      })
    }

    return placements
  }

  /**
   * Generate image prompts from placement context
   */
  async generateImagePrompts(placements, metadata) {
    const { title, topics, contentType, author } = metadata

    const systemPrompt = `You are an expert at creating image prompts for educational articles.

CONTEXT:
- Article Title: ${title}
- Content Type: ${contentType}
- Topics: ${topics.join(', ')}
- Target Audience: Adult learners researching online education

RULES:
1. Create photorealistic, professional images
2. Include diverse representation in any people shown
3. Avoid text in images (no overlays, no words)
4. Use warm, inviting lighting
5. Match the educational/professional tone
6. Images should feel aspirational but realistic

OUTPUT: Return a JSON array of prompts with this structure:
[
  {
    "placement": "featured",
    "text": "detailed prompt here",
    "context": "why this image works"
  }
]`

    const userPrompt = `Generate image prompts for these placements:
${JSON.stringify(placements.slice(0, 3), null, 2)}

Focus on the featured image and 1-2 key section images.`

    const response = await this.claudeClient.generateStructured(
      systemPrompt,
      userPrompt,
      { temperature: 0.7 }
    )

    return response.prompts
  }

  /**
   * Generate SEO-friendly alt text for an image
   */
  async generateAltText(imageContext, articleTitle) {
    const response = await this.claudeClient.generate({
      systemPrompt: `Generate concise alt text for accessibility and SEO.
Rules:
- 10-15 words maximum
- Describe what's IN the image, not the article topic
- Include relevant keywords naturally
- No "image of" or "picture of" prefixes
- No promotional language`,
      userPrompt: `Article: "${articleTitle}"
Image context: "${imageContext}"

Generate alt text:`,
      maxTokens: 50
    })

    return response.trim()
  }
}
```

### Supported Image Types by Content

| Content Type | Recommended Image Style | Example Prompt Elements |
|--------------|------------------------|------------------------|
| **Ranking/Best-of** | Professional setting, comparison visualization | "Professional adult reviewing options on laptop" |
| **Guide/How-to** | Step visualization, process imagery | "Person at crossroads of career paths" |
| **Career Overview** | Professional in role, workplace | "Healthcare professional in modern clinic" |
| **Degree Explainer** | Academic/campus imagery | "Graduate celebrating achievement" |
| **Cost Analysis** | Financial planning imagery | "Person reviewing education investment documents" |

---

## WordPress Media Integration

### Direct Upload to WordPress Media Library

```javascript
// src/services/wordpressMediaService.js

class WordPressMediaService {
  constructor() {
    this.baseUrl = process.env.VITE_WORDPRESS_API_URL
    this.credentials = btoa(
      `${process.env.VITE_WORDPRESS_USERNAME}:${process.env.VITE_WORDPRESS_APP_PASSWORD}`
    )
  }

  /**
   * Upload an image to WordPress Media Library
   * @param {Object} image - Image data from imageService
   * @returns {Object} { mediaId, url, success }
   */
  async uploadImage(image) {
    const { base64, altText, filename } = image

    // Convert base64 to binary
    const binaryData = this.base64ToBinary(base64)

    // Generate SEO-friendly filename
    const seoFilename = this.generateFilename(altText, filename)

    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Disposition': `attachment; filename="${seoFilename}"`,
          'Content-Type': 'image/jpeg'
        },
        body: binaryData
      })

      if (!response.ok) {
        throw new Error(`WordPress upload failed: ${response.status}`)
      }

      const mediaData = await response.json()

      // Update alt text
      await this.updateMediaMeta(mediaData.id, {
        alt_text: altText,
        caption: '',
        description: ''
      })

      return {
        success: true,
        mediaId: mediaData.id,
        url: mediaData.source_url,
        thumbnailUrl: mediaData.media_details?.sizes?.medium?.source_url
      }
    } catch (error) {
      console.error('[WordPressMediaService] Upload failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update media metadata (alt text, caption)
   */
  async updateMediaMeta(mediaId, meta) {
    await fetch(`${this.baseUrl}/wp-json/wp/v2/media/${mediaId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meta)
    })
  }

  /**
   * Generate SEO-friendly filename
   */
  generateFilename(altText, fallback = 'article-image') {
    const slug = altText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)

    const timestamp = Date.now()
    return `${slug}-${timestamp}.jpg`
  }

  /**
   * Convert base64 to binary for upload
   */
  base64ToBinary(base64) {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}
```

### Updated Webhook Payload

```javascript
// Updated publishService.js buildWebhookPayload

const payload = {
  // ... existing fields ...

  // NEW: Image data
  images: [
    {
      media_id: 12345,           // WordPress media ID
      url: 'https://www.geteducated.com/wp-content/uploads/...',
      alt_text: 'Adult learner reviewing online degree options',
      is_featured: true
    }
  ],

  // NEW: Featured image (WordPress media ID)
  featured_media: 12345,

  // Content now includes WordPress image URLs
  content: '<p>Article content...</p><img src="https://www.geteducated.com/wp-content/uploads/..." alt="...">'
}
```

### n8n Workflow Updates

The n8n workflow must be updated to:

1. **Receive images array** - Already uploaded to WordPress
2. **Set featured_media** - Use the media_id from first image
3. **Preserve image URLs in content** - Already WordPress URLs

```javascript
// n8n Node: WordPress Post Create/Update

{
  "title": "{{ $json.title }}",
  "content": "{{ $json.content }}",
  "status": "{{ $json.status }}",
  "featured_media": {{ $json.featured_media }},  // NEW
  "meta": {
    "written_by": {{ $json.written_by }},
    "edited_by": {{ $json.edited_by || null }},
    "expert_review_by": {{ $json.expert_review_by || null }}
  }
}
```

---

## Prompt Engineering Strategy

### Educational Article Image Prompt Template

```
TEMPLATE:
A [subject type] [doing action], [setting/environment], [lighting],
[style modifiers], [technical specs], [exclusions]

SUBJECT TYPES (by content type):
- Rankings: "Professional adult researching education options"
- Career Guide: "Person in [career field] workplace"
- Degree Overview: "Student engaged in [field] coursework"
- How-to: "Person following a [process] step-by-step"

SETTINGS (appropriate for education content):
- Modern home office with natural lighting
- Professional workplace setting
- Contemporary library or study space
- Virtual learning environment
- Campus or academic setting

LIGHTING:
- Warm natural light through windows
- Soft professional studio lighting
- Golden hour ambient lighting
- Clean, bright workspace lighting

STYLE MODIFIERS:
- Photorealistic, editorial quality
- Professional stock photography style
- Aspirational but authentic
- Inclusive, diverse representation

EXCLUSIONS:
- No text or watermarks
- No logos or brand identifiers
- No unrealistic perfection
- No cliched stock photo poses
```

### Topic-Specific Prompt Library

```javascript
// src/config/imagePromptTemplates.js

export const PROMPT_TEMPLATES = {
  'online-degrees': {
    featured: 'Adult professional reviewing online degree programs on laptop in modern home office, warm natural lighting, focused expression, comfortable learning environment, photorealistic',
    section: 'Person researching {topic} on computer, organized workspace, educational materials visible, professional but relaxed atmosphere'
  },

  'healthcare-careers': {
    featured: 'Healthcare professional in modern medical facility, diverse team in background, compassionate expression, clean clinical environment, professional photography',
    section: 'Medical professional demonstrating {topic}, patient care setting, modern equipment, warm interpersonal interaction'
  },

  'business-degrees': {
    featured: 'Business professional in modern office, collaborative team meeting, contemporary workspace design, confident professional demeanor, natural lighting',
    section: 'Professional working on {topic} analysis, laptop and documents visible, strategic planning environment'
  },

  'teaching-careers': {
    featured: 'Educator in modern classroom setting, engaged with learning materials, warm educational environment, diverse students visible, inspiring atmosphere',
    section: 'Teacher facilitating {topic} instruction, interactive learning, positive classroom energy'
  },

  'technology-careers': {
    featured: 'Tech professional at modern workstation, multiple monitors with code, contemporary tech office, focused development work, natural lighting',
    section: 'Developer or analyst working on {topic}, collaborative tech environment, modern equipment'
  },

  'default': {
    featured: 'Professional adult in educational or career setting, modern environment, aspirational but authentic, diverse representation, natural lighting',
    section: 'Person engaged with {topic} content, professional setting, focused and motivated expression'
  }
}

/**
 * Get appropriate prompt template based on article topics
 */
export function getPromptTemplate(topics, contentType) {
  // Match topics to templates
  const topicLower = topics[0]?.toLowerCase() || ''

  if (topicLower.includes('health') || topicLower.includes('nursing') || topicLower.includes('medical')) {
    return PROMPT_TEMPLATES['healthcare-careers']
  }
  if (topicLower.includes('business') || topicLower.includes('mba') || topicLower.includes('management')) {
    return PROMPT_TEMPLATES['business-degrees']
  }
  if (topicLower.includes('teach') || topicLower.includes('education') || topicLower.includes('instruction')) {
    return PROMPT_TEMPLATES['teaching-careers']
  }
  if (topicLower.includes('tech') || topicLower.includes('computer') || topicLower.includes('software')) {
    return PROMPT_TEMPLATES['technology-careers']
  }
  if (topicLower.includes('online') || topicLower.includes('degree')) {
    return PROMPT_TEMPLATES['online-degrees']
  }

  return PROMPT_TEMPLATES['default']
}
```

---

## Quality Assurance

### Image Quality Checklist

The existing quality scoring system (`qualityScoreService.js`) already tracks:
- Minimum images (default: 1)
- Alt text presence

### Enhanced Quality Checks

```javascript
// Additional quality checks for images

const imageQualityChecks = {
  // Minimum image requirement
  minImages: {
    threshold: 1,
    critical: false,
    check: (images) => images.length >= 1
  },

  // Featured image required
  hasFeaturedImage: {
    threshold: 1,
    critical: true,  // Block publish without featured
    check: (images) => images.some(img => img.is_featured)
  },

  // All images have alt text
  allHaveAltText: {
    threshold: 100,  // 100%
    critical: false,
    check: (images) => images.every(img => img.alt_text?.length > 0)
  },

  // Alt text quality (not generic)
  altTextQuality: {
    threshold: 10,  // min 10 characters
    critical: false,
    check: (images) => images.every(img =>
      img.alt_text?.length >= 10 &&
      !img.alt_text.toLowerCase().includes('image') &&
      !img.alt_text.toLowerCase().includes('picture')
    )
  },

  // Image successfully uploaded to WordPress
  allUploaded: {
    threshold: 100,
    critical: true,
    check: (images) => images.every(img => img.media_id)
  }
}
```

### Pre-Publish Image Validation

```javascript
// src/services/validation/imageValidation.js

export function validateArticleImages(article) {
  const issues = []
  const images = article.images || []

  // Must have at least 1 image
  if (images.length === 0) {
    issues.push({
      severity: 'critical',
      message: 'Article has no images. At least 1 image required.',
      suggestion: 'Run image generation or manually upload an image.'
    })
  }

  // Must have featured image
  const hasFeatured = images.some(img => img.is_featured)
  if (!hasFeatured && images.length > 0) {
    issues.push({
      severity: 'warning',
      message: 'No featured image designated.',
      suggestion: 'First image will be used as featured image.'
    })
  }

  // All images must have alt text
  const missingAlt = images.filter(img => !img.alt_text)
  if (missingAlt.length > 0) {
    issues.push({
      severity: 'warning',
      message: `${missingAlt.length} image(s) missing alt text.`,
      suggestion: 'Generate alt text for accessibility and SEO.'
    })
  }

  // All images must be uploaded to WordPress
  const notUploaded = images.filter(img => !img.media_id)
  if (notUploaded.length > 0) {
    issues.push({
      severity: 'critical',
      message: `${notUploaded.length} image(s) not uploaded to WordPress.`,
      suggestion: 'Upload images before publishing.'
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'critical').length === 0,
    issues
  }
}
```

---

## Cost Management

### Budget Allocation

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Per Article** | $0.15 - $0.30 | 2 images at medium quality |
| **Daily** | $3.00 | ~10-15 articles/day |
| **Weekly** | $15.00 | ~70-100 articles/week |
| **Monthly** | $50.00 | Shared with BB1 budget |

### Cost Calculation

```javascript
// src/services/ai/imageGenerationClient.js

const COST_TABLE = {
  'gpt-image-1': {
    low: { '1024x1024': 0.02, '1536x1024': 0.03, '1024x1536': 0.03 },
    medium: { '1024x1024': 0.07, '1536x1024': 0.10, '1024x1536': 0.10 },
    high: { '1024x1024': 0.19, '1536x1024': 0.25, '1024x1536': 0.25 }
  },
  'nano-banana-pro': {
    '1K': 0.134,
    '2K': 0.134,
    '4K': 0.24
  }
}

/**
 * Calculate cost before generation
 */
function estimateCost(model, quality, size, count = 1) {
  let unitCost = 0

  if (model === 'gpt-image-1') {
    unitCost = COST_TABLE[model][quality][size] || 0.10
  } else if (model === 'nano-banana-pro') {
    unitCost = COST_TABLE[model][size] || 0.134
  }

  return unitCost * count
}

/**
 * Check if generation is within budget
 */
async function checkBudget(estimatedCost) {
  const usage = await getUsageForPeriod('day')
  const dailyLimit = 5.00

  if (usage.total + estimatedCost > dailyLimit) {
    return {
      allowed: false,
      remaining: dailyLimit - usage.total,
      message: `Daily budget exceeded. Remaining: $${(dailyLimit - usage.total).toFixed(2)}`
    }
  }

  return { allowed: true, remaining: dailyLimit - usage.total }
}
```

### Cost Optimization Strategies

1. **Default to Medium Quality**
   - Use `medium` quality for most articles
   - Reserve `high` quality for flagship content

2. **Generate 2 Images, Not 3**
   - 1 featured + 1 section = $0.20 average
   - 3 images only for long-form (3000+ words)

3. **Cache and Reuse**
   - Store generated prompts for similar topics
   - Reuse images for closely related articles (same topic)

4. **Time-Based Generation**
   - Batch image generation during off-peak hours
   - Queue articles without images for nightly processing

---

## Error Handling & Fallbacks

### Failure Scenarios

| Scenario | Detection | Fallback |
|----------|-----------|----------|
| API rate limit | 429 status code | Queue for retry in 60s |
| API unavailable | 5xx status code | Use cached/stock image |
| Budget exceeded | Budget check fails | Skip images, flag for manual |
| WordPress upload fails | Upload error | Retry 3x, then skip |
| Alt text generation fails | Claude error | Use title-based fallback |
| Content filter rejection | API rejection | Regenerate with safer prompt |

### Retry Logic

```javascript
async function generateWithRetry(prompt, options, maxRetries = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await imageClient.generate(prompt, options)
      return result
    } catch (error) {
      lastError = error
      console.error(`[ImageService] Attempt ${attempt} failed:`, error.message)

      // Rate limit - wait longer
      if (error.status === 429) {
        await sleep(60000 * attempt)  // 1min, 2min, 3min
        continue
      }

      // Content filter - modify prompt
      if (error.code === 'content_policy_violation') {
        prompt = sanitizePrompt(prompt)
        continue
      }

      // Server error - short wait
      if (error.status >= 500) {
        await sleep(5000 * attempt)
        continue
      }

      // Unknown error - don't retry
      break
    }
  }

  return { success: false, error: lastError?.message }
}
```

### Fallback Image Strategy

```javascript
// src/config/fallbackImages.js

export const FALLBACK_IMAGES = {
  'online-degrees': {
    url: 'https://www.geteducated.com/wp-content/uploads/stock/online-learning-generic.jpg',
    mediaId: 12345,  // Pre-uploaded to WordPress
    altText: 'Student learning online at computer'
  },
  'healthcare-careers': {
    url: 'https://www.geteducated.com/wp-content/uploads/stock/healthcare-professional.jpg',
    mediaId: 12346,
    altText: 'Healthcare professional in medical setting'
  },
  // ... more fallbacks by category
  'default': {
    url: 'https://www.geteducated.com/wp-content/uploads/stock/education-generic.jpg',
    mediaId: 12340,
    altText: 'Professional adult pursuing education goals'
  }
}

/**
 * Get fallback image when generation fails
 */
export function getFallbackImage(topics) {
  const category = categorizeTopics(topics)
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['default']
}
```

---

## Implementation Phases

### Phase 1: Image Generation Service (Week 1)

**Tasks:**
1. Create `imageGenerationClient.js` with GPT Image 1 support
2. Create `imageService.js` for orchestration
3. Add prompt templates by content type
4. Implement cost tracking and budget checks
5. Add alt text generation via Claude

**Deliverable:** Working image generation that returns images and alt text

### Phase 2: WordPress Media Integration (Week 2)

**Tasks:**
1. Create `wordpressMediaService.js`
2. Implement Media Library upload via REST API
3. Add metadata update (alt text)
4. Test with staging WordPress
5. Handle upload errors and retries

**Deliverable:** Working WordPress upload returning media IDs

### Phase 3: Pipeline Integration (Week 3)

**Tasks:**
1. Add Stage 2B to `generationService.js`
2. Update article schema for images array
3. Modify content insertion for `<img>` tags
4. Update quality scoring for images
5. Add image validation to pre-publish

**Deliverable:** Images generated and inserted during article generation

### Phase 4: Publish Flow (Week 4)

**Tasks:**
1. Update `publishService.js` payload
2. Update n8n workflow for featured_media
3. Add image upload step before publish
4. Update content with WordPress URLs
5. End-to-end testing

**Deliverable:** Full auto-publish with images, no human intervention

### Phase 5: Optimization & Fallbacks (Week 5)

**Tasks:**
1. Implement retry logic
2. Add fallback image system
3. Optimize prompts based on results
4. Add manual override UI
5. Monitor and tune costs

**Deliverable:** Production-ready system with 95%+ success rate

---

## Technical Specifications

### Database Schema Updates

```sql
-- Add images JSONB column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add image metadata columns
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS featured_media_id INTEGER,
ADD COLUMN IF NOT EXISTS image_generation_cost DECIMAL(10,4) DEFAULT 0;

-- Index for image queries
CREATE INDEX IF NOT EXISTS idx_articles_featured_media
ON articles(featured_media_id) WHERE featured_media_id IS NOT NULL;
```

### Image Data Structure

```typescript
interface ArticleImage {
  id: string                   // UUID
  url: string                  // Original generation URL or WordPress URL
  media_id?: number            // WordPress media library ID
  alt_text: string             // Generated alt text
  is_featured: boolean         // True for featured image
  placement: string            // 'featured' | 'after-h2-{slug}'
  prompt: string               // Generation prompt used
  model: string                // 'gpt-image-1' | 'nano-banana-pro'
  cost: number                 // Generation cost in USD
  generated_at: string         // ISO timestamp
  uploaded_at?: string         // WordPress upload timestamp
}

interface ArticleWithImages extends Article {
  images: ArticleImage[]
  featured_media_id?: number
  image_generation_cost: number
}
```

### Environment Variables

```bash
# .env.local (add to existing)

# Image Generation
VITE_OPENAI_API_KEY=sk-...              # GPT Image 1 (already have for other features)
VITE_GOOGLE_AI_API_KEY=...              # Nano Banana Pro (optional)
VITE_DEFAULT_IMAGE_MODEL=gpt-image-1    # Default model
VITE_IMAGE_QUALITY=medium               # Default quality
VITE_MAX_IMAGES_PER_ARTICLE=2           # Default image count

# WordPress Media (new)
VITE_WORDPRESS_MEDIA_ENABLED=true       # Enable media upload
VITE_WORDPRESS_FALLBACK_ENABLED=true    # Use fallbacks on failure
```

### API Endpoints Used

| Service | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| OpenAI | `api.openai.com/v1/images/generations` | POST | Generate images |
| Google AI | `generativelanguage.googleapis.com/...` | POST | Nano Banana Pro |
| WordPress | `/wp-json/wp/v2/media` | POST | Upload image |
| WordPress | `/wp-json/wp/v2/media/{id}` | POST | Update metadata |

---

## Testing Checklist

### Unit Tests

- [ ] `imageGenerationClient.generate()` returns valid image
- [ ] `imageService.generateArticleImages()` returns images array
- [ ] `imageService.identifyImagePlacements()` finds correct positions
- [ ] `imageService.generateImagePrompts()` returns valid prompts
- [ ] `imageService.generateAltText()` returns appropriate text
- [ ] `wordpressMediaService.uploadImage()` returns media ID
- [ ] Cost calculation matches expected values
- [ ] Budget checks work correctly

### Integration Tests

- [ ] Full pipeline: idea → article with images → saved
- [ ] WordPress upload works with staging site
- [ ] Featured image appears on published post
- [ ] Images display correctly in WordPress content
- [ ] Retry logic handles failures gracefully
- [ ] Fallback images used when generation fails

### End-to-End Tests

- [ ] Generate 5 articles across different topics
- [ ] Verify images are appropriate for content
- [ ] Verify alt text is relevant and SEO-friendly
- [ ] Verify WordPress posts have featured images
- [ ] Verify total cost stays within budget
- [ ] Test auto-publish flow with no human intervention

### Performance Tests

- [ ] Image generation < 30 seconds per image
- [ ] WordPress upload < 10 seconds per image
- [ ] Full pipeline (with images) < 2 minutes total
- [ ] Memory usage stays stable with batch generation

---

## Appendix: Sample Generated Images

### Example 1: Online Degree Rankings

**Topic:** Best Online MBA Programs
**Content Type:** Ranking

**Featured Image Prompt:**
```
Professional adult reviewing online MBA program rankings on laptop in modern home
office, warm natural lighting through large windows, organized desk with notebook
and coffee, focused contemplative expression, business casual attire, aspirational
but authentic, photorealistic editorial style, diverse representation
```

**Generated Alt Text:**
```
Business professional researching online MBA program options at home office desk
```

### Example 2: Healthcare Career Guide

**Topic:** How to Become an RN Online
**Content Type:** Career Guide

**Featured Image Prompt:**
```
Nursing student studying for RN certification at modern study space, medical
textbooks and laptop visible, warm encouraging lighting, determined expression,
healthcare education materials, diverse female professional, photorealistic,
aspirational learning environment
```

**Generated Alt Text:**
```
Nursing student preparing for RN certification through online program
```

---

## Related Documents

- [07-REMAINING-IMPLEMENTATION.md](./07-REMAINING-IMPLEMENTATION.md) - Gap analysis
- [13-WORDPRESS-INTEGRATION-SPECIFICATION.md](./13-WORDPRESS-INTEGRATION-SPECIFICATION.md) - WordPress API details
- [16-AI-REASONING-OUTPUT-SPECIFICATION.md](./16-AI-REASONING-OUTPUT-SPECIFICATION.md) - Logging requirements
- [BB1 Image Generation System](/Operations/image-generation/README.md) - Cost controls

---

## Appendix: WordPress REST API Media Upload Reference

### Official WordPress Media Upload via REST API

You can upload images to the WordPress Media Library using the built-in WordPress REST API. This process involves sending a POST request to the media endpoint (`/wp-json/wp/v2/media`) with the image file and appropriate headers.

### Steps to Upload an Image via the REST API

Uploading an image programmatically requires proper authentication and a well-formed HTTP request.

#### 1. Set up Authentication

For production use, **Application Passwords** are the recommended authentication method. You can generate an application password in your WordPress user profile settings. For testing, Basic Authentication can also be used.

#### 2. Send a POST Request

You need to send a POST request to the media endpoint of your WordPress site. The request should include the following:

| Component | Value |
|-----------|-------|
| **Endpoint URL** | `https://your-site.com/wp-json/wp/v2/media` |
| **Authorization Header** | Your authentication credentials (e.g., `Basic YWRtaW46cGFzc3dvcmQ=`) |
| **Content-Disposition Header** | Must be set to `attachment; filename="your_image_name.jpg"` |
| **Content-Type Header** | Specifies the image's MIME type (e.g., `image/jpeg`, `image/png`) |
| **Body** | The binary data of the image file |

#### Example using cURL

The following cURL command demonstrates how to upload an image from your local computer:

```bash
curl --request POST https://your-site.com/wp-json/wp/v2/media \
  --header "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  --header "Content-Disposition: attachment; filename=example.jpg" \
  --header "Content-Type: image/jpeg" \
  --data-binary "@/path/to/image.jpg"
```

#### Example Response

```json
{
  "id": 12345,
  "date": "2026-01-12T10:30:00",
  "slug": "example",
  "type": "attachment",
  "link": "https://your-site.com/example/",
  "title": { "rendered": "example" },
  "source_url": "https://your-site.com/wp-content/uploads/2026/01/example.jpg",
  "media_details": {
    "width": 1536,
    "height": 1024,
    "file": "2026/01/example.jpg",
    "sizes": {
      "thumbnail": { "source_url": "..." },
      "medium": { "source_url": "..." },
      "large": { "source_url": "..." }
    }
  }
}
```

#### JavaScript Implementation

```javascript
async function uploadToWordPress(imageBase64, filename, altText) {
  const credentials = btoa(`${username}:${appPassword}`)

  // Convert base64 to binary
  const binaryData = Uint8Array.from(
    atob(imageBase64.replace(/^data:image\/\w+;base64,/, '')),
    c => c.charCodeAt(0)
  )

  // Upload image
  const response = await fetch('https://your-site.com/wp-json/wp/v2/media', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'image/jpeg'
    },
    body: binaryData
  })

  const media = await response.json()

  // Update alt text (separate request)
  await fetch(`https://your-site.com/wp-json/wp/v2/media/${media.id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ alt_text: altText })
  })

  return {
    mediaId: media.id,
    url: media.source_url
  }
}
```

#### Setting as Featured Image

After uploading, use the returned `media.id` as the `featured_media` value when creating/updating a post:

```javascript
await fetch('https://your-site.com/wp-json/wp/v2/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Article Title',
    content: '<p>Content here...</p>',
    status: 'draft',
    featured_media: 12345  // The media ID from upload
  })
})
```

#### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid credentials | Verify Application Password is correct |
| 403 Forbidden | User lacks upload permission | Ensure user has `upload_files` capability |
| 413 Entity Too Large | Image file too large | Compress image or increase server limit |
| 415 Unsupported Media Type | Wrong Content-Type | Match header to actual image format |
| Image uploads but no thumbnail | Server can't process | Check GD/Imagick PHP extension |

---

**Document Version:** 1.0.0
**Last Updated:** January 12, 2026
**Author:** Claude Code (Perdia v5 Development)
