/**
 * Monetization Preview Component
 * Shows a preview of how monetization blocks will render on GetEducated.com
 * Includes program selection, sponsored listing highlights, and shortcode details
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  DollarSign,
  Star,
  GraduationCap,
  ExternalLink,
  Building2,
  Award,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../../services/supabaseClient'

/**
 * Single program card in the preview
 */
function ProgramCard({ program, isSponsored, rank }) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        isSponsored ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isSponsored ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {rank}
          </div>

          <div className="flex-1">
            {/* School name */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">
                {program.school_name || 'University Name'}
              </span>
              {isSponsored && (
                <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0">
                  <Star className="h-3 w-3 mr-1" />
                  Sponsored
                </Badge>
              )}
            </div>

            {/* Program name */}
            <p className="text-sm text-muted-foreground mt-1">
              {program.program_name || 'Program Name'}
            </p>

            {/* Degree level and format */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {program.degree_level || 'Bachelor'}
              </Badge>
              {program.program_format && (
                <Badge variant="outline" className="text-xs">
                  {program.program_format}
                </Badge>
              )}
            </div>

            {/* Cost display */}
            {(program.total_cost || program.cost_per_credit) && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  {program.total_cost
                    ? `$${Number(program.total_cost).toLocaleString()}`
                    : `$${Number(program.cost_per_credit).toLocaleString()}/credit`}
                </span>
                <span className="text-muted-foreground text-xs">total cost</span>
              </div>
            )}

            {/* Accreditation */}
            {program.accreditation && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                {program.accreditation}
              </div>
            )}
          </div>
        </div>

        {/* CTA button */}
        <Button size="sm" className="flex-shrink-0">
          View Program
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Empty state when no programs match
 */
function EmptyState({ categoryId, concentrationId }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No programs found</p>
      <p className="text-sm mt-1">
        No programs match category {categoryId}, concentration {concentrationId}
      </p>
      <p className="text-xs mt-2">
        Programs will appear once the degrees database is populated
      </p>
    </div>
  )
}

/**
 * Main MonetizationPreview component
 */
export default function MonetizationPreview({
  categoryId,
  concentrationId,
  levelCode,
  maxPrograms = 5,
  // articleType can be used for future slot configuration
  // articleType = 'guide',
  className = '',
}) {
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState([])
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [error, setError] = useState(null)

  // Fetch programs when params change
  useEffect(() => {
    async function fetchPrograms() {
      if (!categoryId || !concentrationId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch category info
        const { data: categoryData } = await supabase
          .from('monetization_categories')
          .select('*')
          .eq('category_id', categoryId)
          .eq('concentration_id', concentrationId)
          .single()

        if (categoryData) {
          setCategoryInfo(categoryData)
        }

        // Fetch matching programs from degrees table
        let query = supabase
          .from('degrees')
          .select('*, schools(school_name, geteducated_url, is_sponsored)')
          .eq('category_id', categoryId)
          .eq('concentration_id', concentrationId)
          .eq('is_active', true)

        // Filter by level if specified
        if (levelCode) {
          query = query.eq('degree_level_code', levelCode)
        }

        // Order by sponsorship tier, then by school name
        query = query
          .order('is_sponsored', { ascending: false })
          .order('sponsorship_tier', { ascending: false })
          .order('school_name', { ascending: true })
          .limit(maxPrograms)

        const { data: degreesData, error: degreesError } = await query

        if (degreesError) throw degreesError

        setPrograms(degreesData || [])
      } catch (err) {
        console.error('Error fetching monetization preview:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [categoryId, concentrationId, levelCode, maxPrograms])

  // Calculate sponsored vs regular split
  const sponsoredCount = programs.filter((p) => p.is_sponsored).length
  const regularCount = programs.length - sponsoredCount

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monetization Preview
            </CardTitle>
            <CardDescription className="text-xs">
              {categoryInfo
                ? `${categoryInfo.category} > ${categoryInfo.concentration}`
                : 'Preview how degree blocks will render'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats banner */}
        {!loading && programs.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-amber-50">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              {sponsoredCount} Sponsored
            </Badge>
            <Badge variant="outline">
              {regularCount} Regular
            </Badge>
            <Badge variant="secondary">
              {programs.length} Total
            </Badge>
          </div>
        )}

        {/* Parameters display */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs">
          <p className="font-medium mb-2">Shortcode Parameters:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">category_id:</span>{' '}
              <span className="font-mono">{categoryId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">concentration_id:</span>{' '}
              <span className="font-mono">{concentrationId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">level:</span>{' '}
              <span className="font-mono">{levelCode || 'All'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">max:</span>{' '}
              <span className="font-mono">{maxPrograms}</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {/* Programs list */}
        {!loading && !error && (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3 space-y-3">
              {programs.length > 0 ? (
                <>
                  {/* Header like GetEducated */}
                  <div className="border-b pb-2">
                    <h3 className="font-semibold text-sm">
                      GetEducated&apos;s Picks
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sponsored listings appear first
                    </p>
                  </div>

                  {/* Program cards */}
                  {programs.map((program, index) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isSponsored={program.is_sponsored}
                      rank={index + 1}
                    />
                  ))}

                  {/* View all link */}
                  <div className="text-center pt-2">
                    <Button variant="link" size="sm" className="text-xs">
                      View All {categoryInfo?.concentration} Programs
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState
                  categoryId={categoryId}
                  concentrationId={concentrationId}
                />
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-3">
              <div className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto max-h-80">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      categoryInfo,
                      programCount: programs.length,
                      sponsoredCount,
                      programs: programs.map((p) => ({
                        id: p.id,
                        school_name: p.school_name,
                        program_name: p.program_name,
                        degree_level: p.degree_level,
                        is_sponsored: p.is_sponsored,
                        sponsorship_tier: p.sponsorship_tier,
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Compliance notice */}
        <Alert className="py-2">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Sponsored listings are prioritized per GetEducated requirements.
            All links point to GetEducated pages, never to .edu sites.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
