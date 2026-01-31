import { useState, useMemo } from 'react'
import { useApprovedContributors } from '@/hooks/useContributors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react'

/**
 * Contributor Assignment Component
 * CRITICAL: Only displays the 4 approved GetEducated authors
 * - Tony Huffman (Kif)
 * - Kayleigh Gilbert (Alicia Carrasco)
 * - Sara (Daniel Catena)
 * - Charity (Julia Tell)
 */
export default function ContributorAssignment({
  article,
  selectedContributorId,
  onContributorSelect,
  onAutoAssign
}) {
  // CRITICAL: Use approved contributors only
  const { data: contributors = [], isLoading } = useApprovedContributors()
  const [expanded] = useState(false) // Note: setExpanded not used yet - expand functionality TBD
  const [isAutoAssigning, setIsAutoAssigning] = useState(false)

  const selectedContributor = useMemo(
    () => contributors.find(c => c.id === selectedContributorId),
    [contributors, selectedContributorId]
  )

  const handleAutoAssign = async () => {
    if (!onAutoAssign) return

    setIsAutoAssigning(true)
    try {
      await onAutoAssign()
    } catch (error) {
      console.error('Auto-assign error:', error)
    } finally {
      setIsAutoAssigning(false)
    }
  }

  // Score contributors based on article content for recommendation
  const scoredContributors = useMemo(() => {
    if (!article) return contributors

    const title = article.title?.toLowerCase() || ''
    const topics = article.topics || []
    const contentType = article.content_type || ''

    return contributors.map(contributor => {
      let score = 0

      // Match expertise areas with topics
      const expertiseAreas = contributor.expertise_areas || []
      expertiseAreas.forEach(area => {
        if (title.includes(area.toLowerCase())) score += 20
        topics.forEach(topic => {
          if (area.toLowerCase().includes(topic.toLowerCase())) score += 15
        })
      })

      // Match content types
      const contentTypes = contributor.content_types || []
      if (contentTypes.includes(contentType)) score += 25

      // Match writing style keywords in title
      const writingStyle = contributor.writing_style?.toLowerCase() || ''
      if (writingStyle.includes('technical') && title.includes('how to')) score += 10
      if (writingStyle.includes('friendly') && title.includes('guide')) score += 10

      return { ...contributor, matchScore: score }
    }).sort((a, b) => b.matchScore - a.matchScore)
  }, [contributors, article])

  const displayContributors = expanded
    ? scoredContributors
    : scoredContributors.slice(0, 3)

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AI'
  }

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Contributor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Contributor
          </CardTitle>
          {selectedContributor && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Assigned
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Auto-assign Button */}
        {onAutoAssign && (
          <Button
            onClick={handleAutoAssign}
            disabled={isAutoAssigning}
            variant="outline"
            className="w-full gap-2 mb-2"
            size="sm"
          >
            {isAutoAssigning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Finding Best Match...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-Assign Best Match
              </>
            )}
          </Button>
        )}

        {/* Selected Contributor */}
        {selectedContributor && (
          <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-500">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedContributor.avatar_url} />
                <AvatarFallback className="bg-blue-200 text-blue-700">
                  {getInitials(selectedContributor.display_name || selectedContributor.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {selectedContributor.display_name || selectedContributor.name}
                  </p>
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  ({selectedContributor.name})
                </p>
                {selectedContributor.article_count > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {selectedContributor.article_count} articles
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Approved Author Badge */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-blue-200">
              <Shield className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-700">GetEducated Approved Author</span>
            </div>
          </div>
        )}

        {/* Contributor List */}
        <div className="space-y-2">
          {displayContributors.map((contributor, index) => {
            const isSelected = contributor.id === selectedContributorId
            const isRecommended = index === 0 && contributor.matchScore > 0

            if (isSelected) return null // Already shown above

            return (
              <button
                key={contributor.id || contributor.name}
                onClick={() => onContributorSelect?.(contributor.id)}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${isRecommended
                    ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={contributor.avatar_url} />
                    <AvatarFallback className={
                      isRecommended ? 'bg-yellow-200 text-yellow-700' : 'bg-gray-200 text-gray-700'
                    }>
                      {getInitials(contributor.display_name || contributor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {contributor.display_name || contributor.name}
                      </p>
                      {isRecommended && (
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0">
                          <Star className="w-3 h-3 mr-0.5" />
                          Best
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      ({contributor.name})
                    </p>
                    {contributor.expertise_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contributor.expertise_areas.slice(0, 2).map((area, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {area}
                          </Badge>
                        ))}
                        {contributor.expertise_areas.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            +{contributor.expertise_areas.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* GetEducated Authors Info */}
        <div className="p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">
              Only approved GetEducated authors shown
            </span>
          </div>
        </div>

        {/* No Contributors */}
        {contributors.length === 0 && (
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No approved authors available</p>
            <p className="text-xs text-gray-400">
              Run the GetEducated migration to add approved authors
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
