# AI Reasoning Output Specification

**Created:** December 18, 2025
**Source:** Technical meeting - Tony's request for debugging AI decisions

---

## Overview

Tony requested that AI-generated articles include reasoning/thinking output to help debug issues and understand why the AI made certain decisions.

**Tony's Quote:**
> "Would it be helpful if when the AI writes the article, it wrote a secondary kind of—if it wrote basically reasoning for why it wrote the article the way it did."

**Justin's Agreement:**
> "May always tell me that for any day it does tell me how you got there."

## Purpose

The AI reasoning output helps:
1. Debug content issues (wrong data, bad links, outdated references)
2. Understand AI decision-making process
3. Improve prompts based on AI's interpretation
4. Identify hallucinations or incorrect assumptions
5. Train team on how AI processes requests

## Implementation

### Reasoning Data Structure

```javascript
/**
 * AI Reasoning output structure
 * Stored alongside article in database
 */
const reasoningSchema = {
  // Generation metadata
  generated_at: "2025-12-18T12:00:00Z",
  model_used: "grok-beta",
  temperature: 0.7,
  total_tokens: 3500,

  // Content decisions
  decisions: {
    topic_interpretation: {
      input_idea: "Write about online MBA programs",
      understood_as: "Guide to choosing an online MBA program for working professionals",
      reasoning: "The term 'online MBA' suggests the target audience is working professionals seeking flexible education options. Focused on practical decision-making factors."
    },

    contributor_selection: {
      selected: "Tony Huffman",
      score: 85,
      reasoning: "Tony's expertise includes 'ranking reports' and 'data analysis'. This article involves ranking programs by factors, matching his analytical style.",
      alternatives_considered: [
        { name: "Kayleigh Gilbert", score: 60, reason: "Healthcare focus not relevant to MBA topic" }
      ]
    },

    degree_level_detection: {
      detected: "masters",
      confidence: 0.95,
      signals: ["MBA explicitly mentioned", "graduate-level content", "career advancement focus"]
    },

    monetization_category: {
      selected: {
        category: "business",
        concentration: "mba",
        level: "masters"
      },
      reasoning: "Direct match to article topic. 23 sponsored schools available in this category.",
      sponsored_count: 23
    },

    internal_links: {
      links_added: 5,
      selection_reasoning: [
        {
          url: "/online-degrees/business/mba/",
          anchor: "online MBA programs",
          reason: "Direct relevance to article topic, high-traffic page"
        },
        {
          url: "/resources/careers/mba-salary-guide/",
          anchor: "MBA salary expectations",
          reason: "Supports ROI discussion in article, recent article (2024)"
        }
      ]
    },

    external_sources: {
      sources_cited: 3,
      selection_reasoning: [
        {
          url: "https://www.bls.gov/ooh/management/",
          reason: "Official government salary data for credibility"
        },
        {
          url: "https://nces.ed.gov/programs/digest/",
          reason: "Official education statistics for enrollment data"
        }
      ]
    },

    ranking_data: {
      reports_referenced: ["Best Online MBA Programs 2024"],
      data_freshness: "2024-11-15",
      reasoning: "Used most recent ranking report. Ignored 2022 version despite it appearing in search."
    }
  },

  // Potential issues flagged
  warnings: [
    {
      type: "data_freshness",
      message: "Cost data is 6 months old. Consider verifying current prices.",
      severity: "low"
    }
  ],

  // Humanization impact
  humanization: {
    provider: "stealthgpt",
    mode: "high",
    changes_made: "Varied sentence structure, added conversational transitions, removed AI-typical phrases",
    ai_detection_score_before: 95,
    ai_detection_score_after: 12
  }
}
```

### Database Schema

```sql
-- Add reasoning column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS ai_reasoning JSONB;

-- Or create separate table for detailed tracking
CREATE TABLE IF NOT EXISTS article_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

  -- Generation context
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  model_used TEXT,
  temperature DECIMAL(2,1),
  total_tokens INTEGER,

  -- Full reasoning JSON
  reasoning JSONB,

  -- Quick access fields
  contributor_reasoning TEXT,
  monetization_reasoning TEXT,
  link_reasoning TEXT,
  warnings JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_generation_logs_article
ON article_generation_logs(article_id);
```

### Generation Service Integration

```javascript
// src/services/generationService.js

class GenerationService {
  constructor() {
    this.reasoningLog = {
      decisions: {},
      warnings: []
    }
  }

  /**
   * Log a reasoning decision
   */
  logReasoning(category, data) {
    this.reasoningLog.decisions[category] = {
      ...data,
      logged_at: new Date().toISOString()
    }
  }

  /**
   * Add a warning to reasoning
   */
  logWarning(type, message, severity = 'medium') {
    this.reasoningLog.warnings.push({
      type,
      message,
      severity,
      logged_at: new Date().toISOString()
    })
  }

  /**
   * Get final reasoning output
   */
  getReasoningOutput() {
    return {
      ...this.reasoningLog,
      generated_at: new Date().toISOString(),
      model_used: this.modelUsed,
      temperature: this.temperature
    }
  }

  async generateArticle(idea, options = {}) {
    // Reset reasoning for new generation
    this.reasoningLog = { decisions: {}, warnings: [] }

    // Log topic interpretation
    this.logReasoning('topic_interpretation', {
      input_idea: idea.title,
      understood_as: this.interpretTopic(idea),
      reasoning: `Analyzed title keywords and description to determine article focus.`
    })

    // Contributor selection with reasoning
    const contributor = await this.assignContributor(idea)
    this.logReasoning('contributor_selection', {
      selected: contributor.name,
      score: contributor.matchScore,
      reasoning: contributor.matchReason,
      alternatives_considered: contributor.alternatives
    })

    // ... rest of generation ...

    // At the end, attach reasoning to article
    const article = await this.finalizeArticle(generatedContent)
    article.ai_reasoning = this.getReasoningOutput()

    return article
  }

  /**
   * Enhanced contributor assignment with reasoning
   */
  async assignContributor(idea) {
    const contributors = await this.getContributors()
    const scores = []

    for (const contributor of contributors) {
      const score = this.calculateContributorScore(contributor, idea)
      const reason = this.explainContributorScore(contributor, idea, score)
      scores.push({ ...contributor, matchScore: score, matchReason: reason })
    }

    // Sort by score
    scores.sort((a, b) => b.matchScore - a.matchScore)

    const selected = scores[0]
    const alternatives = scores.slice(1, 3).map(c => ({
      name: c.name,
      score: c.matchScore,
      reason: c.matchReason
    }))

    return { ...selected, alternatives }
  }

  /**
   * Explain why a contributor scored as they did
   */
  explainContributorScore(contributor, idea, score) {
    const reasons = []

    if (contributor.expertise_areas?.some(e =>
      idea.title.toLowerCase().includes(e.toLowerCase())
    )) {
      reasons.push(`Expertise matches: ${contributor.expertise_areas.join(', ')}`)
    }

    if (contributor.content_types?.includes(idea.content_type)) {
      reasons.push(`Content type match: ${idea.content_type}`)
    }

    return reasons.join('. ') || 'General compatibility based on profile'
  }
}
```

### UI Component

```jsx
// src/components/article/AIReasoningPanel.jsx

import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain, AlertTriangle } from 'lucide-react'

export function AIReasoningPanel({ reasoning }) {
  const [expanded, setExpanded] = useState(false)

  if (!reasoning) {
    return (
      <div className="text-sm text-gray-500">
        No AI reasoning available for this article.
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-gray-50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="text-purple-600" size={18} />
          <span className="font-medium">AI Reasoning</span>
          {reasoning.warnings?.length > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
              {reasoning.warnings.length} warnings
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Metadata */}
          <div className="text-xs text-gray-500 flex gap-4">
            <span>Model: {reasoning.model_used}</span>
            <span>Temp: {reasoning.temperature}</span>
            <span>Generated: {new Date(reasoning.generated_at).toLocaleString()}</span>
          </div>

          {/* Warnings */}
          {reasoning.warnings?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-medium text-yellow-800 flex items-center gap-1">
                <AlertTriangle size={14} />
                Warnings
              </h4>
              <ul className="mt-2 space-y-1">
                {reasoning.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-yellow-700">
                    {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decisions */}
          <div className="space-y-3">
            {/* Topic Interpretation */}
            {reasoning.decisions?.topic_interpretation && (
              <ReasoningSection
                title="Topic Interpretation"
                data={reasoning.decisions.topic_interpretation}
              />
            )}

            {/* Contributor Selection */}
            {reasoning.decisions?.contributor_selection && (
              <ReasoningSection
                title="Author Selection"
                data={reasoning.decisions.contributor_selection}
              />
            )}

            {/* Monetization */}
            {reasoning.decisions?.monetization_category && (
              <ReasoningSection
                title="Monetization Category"
                data={reasoning.decisions.monetization_category}
              />
            )}

            {/* Internal Links */}
            {reasoning.decisions?.internal_links && (
              <ReasoningSection
                title="Internal Link Selection"
                data={reasoning.decisions.internal_links}
              />
            )}

            {/* Data Sources */}
            {reasoning.decisions?.ranking_data && (
              <ReasoningSection
                title="Data Sources"
                data={reasoning.decisions.ranking_data}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ReasoningSection({ title, data }) {
  return (
    <div className="border-l-2 border-purple-200 pl-3">
      <h5 className="text-sm font-medium text-gray-700">{title}</h5>
      <div className="mt-1 text-sm text-gray-600">
        {typeof data.reasoning === 'string' ? (
          <p>{data.reasoning}</p>
        ) : (
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
```

### Article Editor Integration

Add the reasoning panel to the article editor:

```jsx
// In src/pages/ArticleEditor.jsx

<Tabs defaultValue="content">
  <TabsList>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="seo">SEO</TabsTrigger>
    <TabsTrigger value="quality">Quality</TabsTrigger>
    <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>  {/* NEW */}
  </TabsList>

  {/* ... other tabs ... */}

  <TabsContent value="reasoning">
    <AIReasoningPanel reasoning={article.ai_reasoning} />
  </TabsContent>
</Tabs>
```

## Debugging Use Cases

### Use Case 1: Wrong Ranking Report Version

**Problem:** AI referenced 2022 ranking report instead of 2024.

**How Reasoning Helps:**
```json
{
  "ranking_data": {
    "reports_referenced": ["Best Online MBA Programs 2022"],
    "data_freshness": "2022-03-15",
    "reasoning": "Selected oldest matching report. Site catalog not updated with 2024 version."
  }
}
```

**Fix:** Update site catalog, ensure lastmod sorting.

### Use Case 2: Wrong Author Assigned

**Problem:** Article about nursing assigned to Tony instead of Kayleigh.

**How Reasoning Helps:**
```json
{
  "contributor_selection": {
    "selected": "Tony Huffman",
    "score": 45,
    "reasoning": "Matched 'best' keyword to Tony's ranking expertise. Did not detect nursing topic.",
    "alternatives_considered": [
      { "name": "Kayleigh Gilbert", "score": 40, "reason": "No keywords matched" }
    ]
  }
}
```

**Fix:** Add "nursing" to Kayleigh's expertise areas, improve topic detection.

### Use Case 3: Bad Internal Links

**Problem:** Article links to unrelated pages.

**How Reasoning Helps:**
```json
{
  "internal_links": {
    "links_added": 3,
    "selection_reasoning": [
      {
        "url": "/rankings/best-liberal-arts/",
        "anchor": "financial aid options",
        "reason": "Highest relevance score (0.65) from limited catalog. No direct matches found."
      }
    ]
  },
  "warnings": [
    {
      "type": "low_relevance_links",
      "message": "Internal link relevance scores below 0.7 threshold. Catalog may be incomplete."
    }
  ]
}
```

**Fix:** Populate site catalog with more articles, especially financial aid content.

## Testing

- [ ] Reasoning logged for contributor selection
- [ ] Reasoning logged for monetization category
- [ ] Reasoning logged for internal links
- [ ] Warnings captured for data freshness issues
- [ ] UI panel displays reasoning correctly
- [ ] Reasoning stored in database
- [ ] Reasoning accessible from article editor

## Summary

AI reasoning output provides transparency into the generation process, enabling:
- Quick debugging of content issues
- Understanding AI decision patterns
- Continuous improvement of prompts and training
- Team education on AI behavior
