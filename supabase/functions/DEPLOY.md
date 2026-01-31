# Supabase Edge Functions Deployment Guide

This guide explains how to deploy the Edge Functions to secure your API keys.

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdiav5"
supabase link --project-ref nvffvcjtrgxnunncdafz
```

## Set Environment Secrets

Edge Functions need access to your API keys, but they should be stored as secrets (not in code):

```bash
# Set AI API keys
supabase secrets set GROK_API_KEY=your-grok-api-key-here
supabase secrets set CLAUDE_API_KEY=your-claude-api-key-here
supabase secrets set STEALTHGPT_API_KEY=your-stealthgpt-api-key-here

# Set DataForSEO credentials (optional)
supabase secrets set DATAFORSEO_USERNAME=your-dataforseo-username
supabase secrets set DATAFORSEO_PASSWORD=your-dataforseo-password
```

**Note**: After setting secrets, you can remove these keys from `.env.local` (keep only VITE_SUPABASE_* keys).

## Deploy Functions

Deploy each function individually:

```bash
# Deploy modular AI API functions (CRITICAL - security fix)
supabase functions deploy grok-api
supabase functions deploy claude-api
supabase functions deploy stealthgpt-humanize

# Deploy full pipeline function
supabase functions deploy generate-article

# Deploy utility functions
supabase functions deploy publish-to-wordpress
supabase functions deploy generate-ideas-from-keywords
```

Or deploy all at once:

```bash
supabase functions deploy
```

### Function Overview:

1. **grok-api** - Modular Grok API client for individual operations (generateDraft, generateIdeas, generateMetadata)
2. **claude-api** - Modular Claude API client for individual operations (humanize, autoFixQualityIssues, reviseWithFeedback, extractLearningPatterns, addInternalLinks)
3. **stealthgpt-humanize** - StealthGPT API proxy for content humanization (bypasses CORS, secures API key)
4. **generate-article** - Full two-pass pipeline (Grok → Claude) for complete article generation
5. **publish-to-wordpress** - WordPress publishing via REST API
6. **generate-ideas-from-keywords** - DataForSEO + Grok for idea generation

## Verify Deployment

After deployment, verify the functions are working:

1. Go to Supabase Dashboard → Edge Functions
2. You should see all 7 functions listed (grok-api, claude-api, stealthgpt-humanize, generate-article, publish-to-wordpress, generate-ideas-from-keywords, auto-publish-scheduler)
3. Click on each to see deployment logs

## Testing Edge Functions

You can test functions from the dashboard:

1. Go to Edge Functions → select function
2. Click "Invoke Function"
3. Enter test payload:

### Test grok-api:
```json
{
  "action": "generateDraft",
  "payload": {
    "idea": {
      "title": "How to Build a React App",
      "description": "A comprehensive guide",
      "seed_topics": ["react", "javascript"]
    },
    "contentType": "guide",
    "targetWordCount": 2000
  }
}
```

Or for generating ideas:
```json
{
  "action": "generateIdeas",
  "payload": {
    "seedTopics": ["react", "supabase"],
    "count": 5
  }
}
```

### Test claude-api:
```json
{
  "action": "humanize",
  "payload": {
    "content": "<h1>Your HTML content here</h1><p>Article text...</p>",
    "contributorProfile": null,
    "targetPerplexity": "high",
    "targetBurstiness": "high"
  }
}
```

### Test stealthgpt-humanize:
```json
{
  "prompt": "<p>Your AI-generated content to humanize...</p>",
  "tone": "College",
  "mode": "High",
  "business": true,
  "detector": "gptzero"
}
```

Response format:
```json
{
  "success": true,
  "result": "<p>Humanized content...</p>",
  "howLikelyToBeDetected": 15
}
```

### Test generate-article (full pipeline):
```json
{
  "ideaId": "your-idea-uuid",
  "userId": "your-user-uuid",
  "options": {
    "contentType": "guide",
    "targetWordCount": 2000
  }
}
```

### Test publish-to-wordpress:
```json
{
  "articleId": "your-article-uuid",
  "connectionId": "your-connection-uuid"
}
```

### Test generate-ideas-from-keywords:
```json
{
  "seedKeywords": ["react", "supabase", "tutorial"],
  "count": 5,
  "userId": "your-user-uuid"
}
```

## Troubleshooting

### Error: "Function not found"
- Make sure you ran `supabase link` with correct project ref
- Re-deploy the function

### Error: "Missing API key"
- Check secrets are set: `supabase secrets list`
- Re-set the secret if missing

### Error: "CORS error"
- CORS headers are already configured in functions
- Make sure you're calling from allowed origin

### Error: "Permission denied"
- Check RLS policies allow the operation
- Verify user authentication token is being passed

## Next Steps

After deploying Edge Functions:

1. Remove `dangerouslyAllowBrowser: true` from `src/services/ai/claudeClient.js`
2. Update frontend code to call Edge Functions instead of AI APIs directly
3. Remove AI API keys from `.env.local` (they're now server-side only)
4. Test article generation end-to-end
5. Monitor function logs in Supabase Dashboard

## Monitoring

View logs in real-time:

```bash
# Monitor specific functions
supabase functions logs grok-api --tail
supabase functions logs claude-api --tail
supabase functions logs stealthgpt-humanize --tail
supabase functions logs generate-article --tail
```

Or view in Supabase Dashboard → Edge Functions → [function name] → Logs

## Cost Considerations

- Edge Functions: Free tier includes 500K invocations/month
- AI APIs: Billed by provider (xAI, Anthropic)
- Monitor usage in respective dashboards

## Security Benefits

✅ API keys never exposed in browser
✅ Server-side validation and error handling
✅ Centralized API call management
✅ Better rate limiting and caching options
