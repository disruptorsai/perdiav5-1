# V5 Missing Features - Patch Documentation

## Analysis Summary

After comparing the `updates` branch against `origin/v5` and reviewing the Dec 22, 2025 meeting requirements, **v5 already has most features implemented**. Only 3 features from the `updates` branch are missing:

| Feature | Priority | Status |
|---------|----------|--------|
| Title Generation Toggle | HIGH | Missing |
| "Update with Rules" Button | HIGH | Missing |
| N8N Settings UI | LOW | Missing (optional) |

---

## Feature 1: Title Generation Toggle

### Description
AI-powered title suggestions when creating content ideas. User enters description/topics, clicks "Generate Title Ideas", and gets 3 suggestions with reasoning.

### Files to Add/Modify

#### 1.1 New Component: `src/components/ideas/TitleSuggestions.jsx`

```jsx
import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import { useGenerateTitleSuggestions } from '../../hooks/useContentIdeas'

function TitleSuggestions({ description, topics, onSelectTitle, disabled }) {
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)

  const generateSuggestions = useGenerateTitleSuggestions()

  const handleGenerate = async () => {
    if (!description?.trim()) return

    try {
      const topicsArray = typeof topics === 'string'
        ? topics.split(',').map(t => t.trim()).filter(Boolean)
        : topics || []

      const results = await generateSuggestions.mutateAsync({
        description,
        topics: topicsArray,
        count: 3,
      })

      setSuggestions(results)
      setSelectedIndex(null)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }

  const handleSelect = (index) => {
    setSelectedIndex(index)
    if (onSelectTitle && suggestions[index]) {
      onSelectTitle(suggestions[index].title)
    }
  }

  const isLoading = generateSuggestions.isPending

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || isLoading || !description?.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Title Ideas
            </>
          )}
        </button>

        {suggestions.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled || isLoading}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span>Click a suggestion to use it:</span>
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(index)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedIndex === index
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedIndex === index
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {selectedIndex === index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${
                      selectedIndex === index ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {suggestion.title}
                    </p>
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && description?.trim() && (
        <p className="text-sm text-gray-500 italic">
          Click "Generate Title Ideas" to get AI-powered suggestions
        </p>
      )}
    </div>
  )
}

export default TitleSuggestions
```

#### 1.2 Add to GrokClient: `generateTitleSuggestions()` method

```javascript
async generateTitleSuggestions(description, topics = [], count = 3) {
  const topicsList = topics.length > 0 ? topics.join(', ') : 'general'

  const prompt = `Generate ${count} compelling article title suggestions based on:

Description: ${description}
Topics: ${topicsList}

Requirements:
- Each title should be SEO-friendly (50-60 characters ideal)
- Use power words and emotional triggers
- Make titles specific and actionable
- Vary the approaches (how-to, list, question, statement)

Return a JSON array with exactly ${count} objects:
[
  {
    "title": "The article title",
    "reasoning": "Brief explanation of why this title works"
  }
]

Return ONLY the JSON array, no other text.`

  const response = await this.client.chat.completions.create({
    model: this.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1000,
  })

  const content = response.choices[0]?.message?.content || '[]'

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse title suggestions:', error)
    return []
  }
}
```

#### 1.3 Add Hook: `useGenerateTitleSuggestions()` in useContentIdeas.js

```javascript
export function useGenerateTitleSuggestions() {
  return useMutation({
    mutationFn: async ({ description, topics, count = 3 }) => {
      const suggestions = await grokClient.generateTitleSuggestions(
        description,
        topics,
        count
      )
      return suggestions
    },
  })
}
```

---

## Feature 2: "Update with Rules" Button

### Description
Button in article editor to re-apply current content rules without regenerating the entire article. Updates shortcodes, internal links, and applies latest rules.

### Files to Modify

#### 2.1 Add to GenerationService: `refreshWithRules()` method

```javascript
async refreshWithRules(article) {
  const { data: rules } = await supabase
    .from('content_rules')
    .select('*')
    .eq('is_active', true)

  let updatedContent = article.content

  // Re-apply shortcodes based on current rules
  const { data: shortcodes } = await supabase
    .from('shortcodes')
    .select('*')
    .eq('is_active', true)

  if (shortcodes?.length > 0) {
    for (const sc of shortcodes) {
      if (sc.content_types?.includes(article.content_type) || !sc.content_types) {
        if (sc.placement === 'after_intro' && !updatedContent.includes(sc.shortcode)) {
          // Insert after first paragraph
          const firstPEnd = updatedContent.indexOf('</p>')
          if (firstPEnd > -1) {
            updatedContent =
              updatedContent.slice(0, firstPEnd + 4) +
              '\n\n' + sc.shortcode + '\n\n' +
              updatedContent.slice(firstPEnd + 4)
          }
        } else if (sc.placement === 'before_conclusion' && !updatedContent.includes(sc.shortcode)) {
          // Insert before last heading
          const lastH2 = updatedContent.lastIndexOf('<h2')
          if (lastH2 > -1) {
            updatedContent =
              updatedContent.slice(0, lastH2) +
              '\n\n' + sc.shortcode + '\n\n' +
              updatedContent.slice(lastH2)
          }
        }
      }
    }
  }

  // Refresh internal links
  const relevantArticles = await this.getRelevantSiteArticles(article.title, article.topics || [])
  if (relevantArticles.length > 0) {
    updatedContent = await this.claudeClient.insertInternalLinks(updatedContent, relevantArticles)
  }

  // Recalculate quality score
  const qualityMetrics = this.calculateQualityMetrics(updatedContent, article.faqs || [])

  return {
    ...article,
    content: updatedContent,
    quality_score: qualityMetrics.score,
    quality_issues: qualityMetrics.issues,
    rules_applied_at: new Date().toISOString(),
  }
}
```

#### 2.2 Add Button to ArticleReview/ArticleEditor

```jsx
// In the article editor toolbar
<button
  onClick={async () => {
    setIsRefreshing(true)
    try {
      const updated = await generationService.refreshWithRules(article)
      await updateArticle.mutateAsync({
        articleId: article.id,
        updates: {
          content: updated.content,
          quality_score: updated.quality_score,
          quality_issues: updated.quality_issues,
        }
      })
      toast.success('Article updated with latest rules')
    } catch (error) {
      toast.error('Failed to refresh rules')
    } finally {
      setIsRefreshing(false)
    }
  }}
  disabled={isRefreshing}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
>
  {isRefreshing ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <RefreshCw className="w-4 h-4" />
  )}
  Update with Rules
</button>
```

---

## Feature 3: N8N Settings UI (Low Priority)

### Description
Settings panel to configure N8N webhook URL for publishing. Already have hooks (`useN8NSettings`, `useUpdateN8NSettings`), just need UI.

### Location
Add to Settings.jsx in the WordPress/Publishing section.

### Implementation Notes
This is low priority since:
1. N8N webhook URL can be set directly in database
2. Main publishing flow via publishService.js already works
3. Most users will configure this once and forget

---

## Implementation Plan

1. **Switch to v5 branch**
2. **Implement Feature 1** (Title Suggestions):
   - Add TitleSuggestions.jsx component
   - Add generateTitleSuggestions() to grokClient.js
   - Add useGenerateTitleSuggestions hook
   - Integrate into CreateIdeaModal or NewIdeaForm
3. **Implement Feature 2** (Update with Rules):
   - Add refreshWithRules() to generationService.js
   - Add button to ArticleReview.jsx
4. **Optional: Feature 3** (N8N Settings UI)
5. **Test all features**
6. **Commit with clear message**

---

## Notes

- The `updates` branch can be archived/deleted after these features are ported
- V5 is the authoritative branch with 53 migrations
- All Dec 22 meeting requirements are now accounted for
