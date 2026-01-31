# WordPress Integration Specification

**Created:** December 18, 2025
**Source:** Technical meeting with Justin (GetEducated Developer)

---

## Overview

GetEducated uses a custom WordPress setup with custom post types and meta fields that differ from standard WordPress. This document specifies the exact integration requirements.

## Current Integration

The app currently publishes via webhook to n8n, which then posts to WordPress. This approach is confirmed and will continue.

```
Perdia App → n8n Webhook → WordPress REST API
```

## Article Contributor System

### CRITICAL: Do NOT Use Standard WordPress Authors

GetEducated overrides the standard WordPress `post_author` field with a custom Article Contributor CPT (Custom Post Type).

**Wrong Approach:**
```javascript
// DO NOT DO THIS
post_author: 4  // Standard WordPress user ID
```

**Correct Approach:**
```javascript
// USE THIS - Custom meta keys
wp_postmeta: {
  written_by: 12345,      // Article Contributor CPT ID
  edited_by: null,        // Optional editor
  expert_review_by: null  // Optional expert reviewer (EEAT)
}
```

### WordPress Article Contributor CPT

**Admin URL:** `https://stage.geteducated.com/wp-admin/edit.php?post_type=article_contributor`

Each Article Contributor has:
- Custom Post ID (the `written_by` value)
- Display name
- Bio
- Photo
- Expertise areas
- Public profile page URL

### Contributor ID Mapping

| Real Name | Internal Style Proxy | WordPress CPT ID | Notes |
|-----------|---------------------|------------------|-------|
| Tony Huffman | Kif | **TBD** | Need from Justin |
| Kayleigh Gilbert | Alicia | **TBD** | Need from Justin |
| Sara Raines | Danny | **TBD** | Need from Justin |
| Charity | Julia | **TBD** | Need from Justin |

**ACTION REQUIRED:** Get exact WordPress CPT IDs from Justin for each contributor.

### Meta Keys to Set

When publishing an article, set these `wp_postmeta` entries:

```javascript
const postMeta = {
  // Required: Primary author
  written_by: contributorCptId,

  // Optional: Editor (if different from author)
  edited_by: editorCptId || null,

  // Optional: Expert reviewer (for EEAT signals)
  expert_review_by: expertCptId || null
}
```

## Webhook Payload Structure

### Current Payload (updated)

```javascript
{
  // Article identification
  article_id: "uuid-here",

  // Content
  title: "Article Title",
  content: "<p>HTML content...</p>",
  excerpt: "Short description...",

  // Author info (legacy - for backwards compatibility)
  author: "Tony Huffman",
  author_display_name: "Tony Huffman",

  // WordPress Article Contributor CPT mapping (NEW - REQUIRED)
  written_by: 12345,           // WordPress CPT ID
  edited_by: null,             // Optional
  expert_review_by: null,      // Optional
  contributor_page_url: "https://www.geteducated.com/article-contributors/tony-huffman",

  // SEO metadata
  meta_title: "SEO Title",
  meta_description: "Meta description for search",
  focus_keyword: "primary keyword",
  slug: "article-url-slug",

  // Structured data
  faqs: [
    { question: "Q1?", answer: "A1" },
    { question: "Q2?", answer: "A2" }
  ],

  // Publishing settings
  status: "draft",  // or "publish"
  environment: "staging",  // or "production"
  published_at: "2025-12-18T12:00:00Z",

  // Quality metrics
  quality_score: 85,
  risk_level: "LOW",
  word_count: 2150
}
```

## Publishing Modes

### Update Existing Article

When updating an existing GetEducated article (from site catalog):

```javascript
{
  wordpress_post_id: 12345,  // Existing WP post ID
  action: "update",          // Signal to update, not create
  // ... rest of payload
}
```

### Create New Article

When creating a brand new article:

```javascript
{
  wordpress_post_id: null,   // No existing post
  action: "create",          // Signal to create new
  // ... rest of payload
}
```

## Throttling Requirements

From Justin: "Put throttling in there, maybe like 5 every minute."

### Rate Limiting Implementation

```javascript
// src/services/publishService.js

const PUBLISH_RATE_LIMIT = {
  maxPerMinute: 5,
  delayBetweenMs: 12000  // 12 seconds between publishes
}

let lastPublishTime = 0
let publishCountThisMinute = 0
let minuteStartTime = Date.now()

export async function throttledPublish(article, options) {
  const now = Date.now()

  // Reset counter every minute
  if (now - minuteStartTime >= 60000) {
    publishCountThisMinute = 0
    minuteStartTime = now
  }

  // Check rate limit
  if (publishCountThisMinute >= PUBLISH_RATE_LIMIT.maxPerMinute) {
    const waitTime = 60000 - (now - minuteStartTime)
    console.log(`[PublishService] Rate limit reached, waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    publishCountThisMinute = 0
    minuteStartTime = Date.now()
  }

  // Ensure minimum delay between publishes
  const timeSinceLastPublish = now - lastPublishTime
  if (timeSinceLastPublish < PUBLISH_RATE_LIMIT.delayBetweenMs) {
    const delay = PUBLISH_RATE_LIMIT.delayBetweenMs - timeSinceLastPublish
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // Publish
  const result = await publishArticle(article, options)

  lastPublishTime = Date.now()
  publishCountThisMinute++

  return result
}
```

## WordPress Account Setup

### System Account Required

Create a dedicated WordPress account for Perdia automation:

| Field | Value |
|-------|-------|
| Username | `perdia-system` |
| Email | `perdia@geteducated.com` |
| Role | Editor (or custom role with publish permissions) |
| Purpose | Track AI-generated content separately |

**Credentials Storage:**
- Store in environment variables
- Never commit to version control
- Use Supabase secrets for Edge Functions

```bash
# .env.local
WORDPRESS_API_URL=https://www.geteducated.com/wp-json/wp/v2
WORDPRESS_USERNAME=perdia-system
WORDPRESS_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

## Revision Handling

### WordPress Revision Cap

Justin: "I cap revisions at five."

Our revisions are stored in Supabase (`article_versions` table), not WordPress. Only the final approved version is sent to WordPress.

**Flow:**
1. AI generates article → stored in Supabase
2. Human reviews/revises → revisions stored in Supabase
3. Final approval → single version sent to WordPress
4. WordPress stores minimal revisions (capped at 5)

### Never Send Multiple Revisions to WordPress

```javascript
// Always send single final version
export async function publishArticle(article, options) {
  // Only publish the current version, not revision history
  const payload = buildWebhookPayload(article, options.status)

  // Do NOT include revision_history in payload
  delete payload.revision_history

  return await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

## Stage Site Access

### Basic Authentication

The staging site requires basic auth:

| Field | Value |
|-------|-------|
| URL | `https://stage.geteducated.com` |
| Username | `ge2022` |
| Password | `!educated` |

**Note:** This is for browser access only, not API calls.

### Shortcode Documentation

Full shortcode specs available at:
```
https://stage.geteducated.com/shortcodes
```

Requires basic auth to access.

## Error Handling

### Common WordPress Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Bad credentials | Check app password |
| 403 Forbidden | Insufficient permissions | Check user role |
| 404 Not Found | Invalid post ID | Verify post exists |
| 500 Server Error | WordPress issue | Retry with backoff |

### Retry Logic

```javascript
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

export async function publishWithRetry(article, options) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await publishArticle(article, options)
      if (result.success) return result
    } catch (error) {
      console.error(`[PublishService] Attempt ${attempt} failed:`, error)

      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
```

## Testing Checklist

- [ ] Get WordPress CPT IDs for all 4 contributors
- [ ] Create `perdia-system` WordPress account
- [ ] Test webhook with `written_by` meta key
- [ ] Verify article displays correct author on frontend
- [ ] Test update existing article flow
- [ ] Test create new article flow
- [ ] Verify throttling works correctly
- [ ] Test error handling and retry logic

## Database Schema Updates

### Add WordPress Contributor IDs

```sql
-- Add WordPress CPT IDs to article_contributors table
ALTER TABLE article_contributors
ADD COLUMN IF NOT EXISTS wordpress_contributor_id INTEGER,
ADD COLUMN IF NOT EXISTS contributor_page_url TEXT;

-- Update with actual IDs (after getting from Justin)
UPDATE article_contributors
SET wordpress_contributor_id = CASE
  WHEN name = 'Tony Huffman' THEN 12345  -- TBD
  WHEN name = 'Kayleigh Gilbert' THEN 12346  -- TBD
  WHEN name = 'Sara' THEN 12347  -- TBD
  WHEN name = 'Charity' THEN 12348  -- TBD
  END,
contributor_page_url = CASE
  WHEN name = 'Tony Huffman' THEN 'https://www.geteducated.com/article-contributors/tony-huffman'
  WHEN name = 'Kayleigh Gilbert' THEN 'https://www.geteducated.com/article-contributors/kayleigh-gilbert'
  -- etc.
  END;
```

## n8n Webhook Configuration

The n8n workflow should:

1. Receive POST from Perdia
2. Extract `written_by` and other meta keys
3. Create/update WordPress post
4. Set `wp_postmeta` entries for Article Contributor
5. Return success with `post_id` and `url`

### Expected n8n Response

```json
{
  "success": true,
  "post_id": 173999,
  "url": "https://www.geteducated.com/resources/new-article-slug/",
  "status": "draft"
}
```
