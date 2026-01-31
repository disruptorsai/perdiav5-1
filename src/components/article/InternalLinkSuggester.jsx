import { useState, useMemo, useCallback } from 'react'
import { useSiteArticles } from '@/hooks/useSiteArticles'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Link2,
  Search,
  Plus,
  Check,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'

/**
 * Internal Link Suggester Component
 * Suggests relevant internal links based on article content
 */
export default function InternalLinkSuggester({
  article,
  content,
  onInsertLink
}) {
  const { data: siteArticles = [], isLoading } = useSiteArticles()
  const { getIntValue } = useSettingsMap()

  const [searchQuery, setSearchQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [insertedLinks, setInsertedLinks] = useState(new Set())

  const minInternalLinks = getIntValue('min_internal_links', 3)

  // Score articles by relevance to current article
  const scoredArticles = useMemo(() => {
    if (!article) return siteArticles

    const title = article.title?.toLowerCase() || ''
    const topics = article.topics || []
    const focusKeyword = article.focus_keyword?.toLowerCase() || ''

    return siteArticles
      .filter(sa => sa.id !== article.id) // Exclude current article
      .map(siteArticle => {
        let score = 0
        const saTitle = siteArticle.title?.toLowerCase() || ''
        const saTopics = siteArticle.topics || []

        // Title word overlap
        const titleWords = title.split(/\s+/).filter(w => w.length > 3)
        titleWords.forEach(word => {
          if (saTitle.includes(word)) score += 10
        })

        // Topic matches
        topics.forEach(topic => {
          if (saTopics.includes(topic)) score += 15
          if (saTitle.includes(topic.toLowerCase())) score += 10
        })

        // Focus keyword match
        if (focusKeyword && saTitle.includes(focusKeyword)) {
          score += 25
        }

        // Prefer articles with fewer existing links (spread link equity)
        if (siteArticle.times_linked_to < 5) score += 5

        return { ...siteArticle, relevanceScore: score }
      })
      .filter(sa => sa.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [siteArticles, article])

  // Filter by search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return scoredArticles

    const query = searchQuery.toLowerCase()
    return scoredArticles.filter(sa =>
      sa.title?.toLowerCase().includes(query) ||
      sa.topics?.some(t => t.toLowerCase().includes(query))
    )
  }, [scoredArticles, searchQuery])

  const displayArticles = expanded
    ? filteredArticles
    : filteredArticles.slice(0, 5)

  // Count current internal links in content
  const currentLinkCount = useMemo(() => {
    if (!content) return 0
    const matches = content.match(/<a\s+[^>]*href=["'][^"']*["'][^>]*>/gi) || []
    return matches.filter(link =>
      link.includes('geteducated.com') ||
      link.includes('localhost') ||
      link.match(/href=["']\/[^"']*["']/)
    ).length
  }, [content])

  const handleInsertLink = useCallback((siteArticle) => {
    if (!onInsertLink) return

    const linkHtml = `<a href="${siteArticle.url}" target="_blank" rel="noopener">${siteArticle.title}</a>`
    onInsertLink(linkHtml, siteArticle)
    setInsertedLinks(prev => new Set([...prev, siteArticle.id]))
  }, [onInsertLink])

  const handleAutoSuggest = useCallback(() => {
    // Get top 3 most relevant that haven't been inserted
    const toInsert = scoredArticles
      .filter(sa => !insertedLinks.has(sa.id))
      .slice(0, Math.max(0, minInternalLinks - currentLinkCount))

    toInsert.forEach(sa => handleInsertLink(sa))
  }, [scoredArticles, insertedLinks, minInternalLinks, currentLinkCount, handleInsertLink])

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Internal Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const needsMoreLinks = currentLinkCount < minInternalLinks
  const linksNeeded = minInternalLinks - currentLinkCount

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Internal Links
          </CardTitle>
          <Badge
            variant="outline"
            className={needsMoreLinks
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-green-50 text-green-700 border-green-200'
            }
          >
            {currentLinkCount}/{minInternalLinks}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        {needsMoreLinks && (
          <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              Add {linksNeeded} more internal link{linksNeeded !== 1 ? 's' : ''} for SEO
            </p>
          </div>
        )}

        {/* Auto-suggest button */}
        {needsMoreLinks && scoredArticles.length > 0 && (
          <Button
            onClick={handleAutoSuggest}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Insert Top {linksNeeded} Suggestions
          </Button>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Article Suggestions */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayArticles.length > 0 ? (
            displayArticles.map((siteArticle) => {
              const isInserted = insertedLinks.has(siteArticle.id)

              return (
                <div
                  key={siteArticle.id}
                  className={`p-3 rounded-lg border ${
                    isInserted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {siteArticle.title}
                      </p>
                      {siteArticle.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {siteArticle.topics.slice(0, 2).map((topic, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {siteArticle.relevanceScore > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-blue-50 text-blue-600 border-blue-200"
                          >
                            {siteArticle.relevanceScore}% match
                          </Badge>
                          {siteArticle.times_linked_to > 0 && (
                            <span className="text-[10px] text-gray-400">
                              Linked {siteArticle.times_linked_to}x
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(siteArticle.url, '_blank')}
                        className="h-7 w-7 p-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={isInserted ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleInsertLink(siteArticle)}
                        disabled={isInserted}
                        className="h-7 px-2"
                      >
                        {isInserted ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-4">
              <Link2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No matching articles' : 'No relevant articles found'}
              </p>
            </div>
          )}
        </div>

        {/* Show More/Less */}
        {filteredArticles.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show More ({filteredArticles.length - 5} more)
              </>
            )}
          </Button>
        )}

        {/* Catalog info */}
        <p className="text-xs text-gray-400 text-center">
          {siteArticles.length} articles in catalog
        </p>
      </CardContent>
    </Card>
  )
}
