import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
} from 'lucide-react'
import { batchRecalculateQualityScores } from '@/services/qualityScoreService'
import { useToast } from '@/components/ui/toast'

/**
 * Quality Score Recalculator Component
 * Allows admin to recalculate all article quality scores to ensure consistency
 * between list views and article editor
 */
export default function QualityScoreRecalculator() {
  const { toast } = useToast()
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    setProgress({ current: 0, total: 0 })
    setResults(null)

    try {
      const result = await batchRecalculateQualityScores((current, total) => {
        setProgress({ current, total })
      })

      setResults(result)

      if (result.errors > 0) {
        toast({
          title: 'Recalculation Complete with Errors',
          description: `Updated ${result.updated} articles, ${result.errors} errors`,
          variant: 'warning',
        })
      } else {
        toast({
          title: 'Recalculation Complete',
          description: `Updated ${result.updated} articles`,
        })
      }
    } catch (error) {
      toast({
        title: 'Recalculation Failed',
        description: error.message,
        variant: 'destructive',
      })
      setResults({ updated: 0, errors: 1, details: [{ error: error.message }] })
    } finally {
      setIsRecalculating(false)
      setProgress(null)
    }
  }

  // Group results by change type
  const getResultsSummary = () => {
    if (!results?.details) return null

    const increased = results.details.filter(d => d.change > 0)
    const decreased = results.details.filter(d => d.change < 0)
    const unchanged = results.details.filter(d => !d.error && d.change === undefined)
    const errors = results.details.filter(d => d.error)

    return { increased, decreased, unchanged, errors }
  }

  const summary = results ? getResultsSummary() : null

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Quality Score Maintenance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Why recalculate?</strong> The quality scoring algorithm has been unified.
            Existing articles may have scores calculated with the old method. Recalculating
            ensures all scores are consistent with what's shown in the article editor.
          </AlertDescription>
        </Alert>

        {/* Progress indicator */}
        {progress && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Recalculating quality scores...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()} articles processed
            </p>
          </div>
        )}

        {/* Results */}
        {results && !progress && (
          <div className={`p-4 rounded-lg border ${results.errors > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {results.errors > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              <span className="text-sm font-medium">
                Recalculation Complete: {results.updated} articles updated
              </span>
            </div>

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                  <ArrowUpCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-700">{summary.increased.length}</p>
                    <p className="text-xs text-green-600">Scores Increased</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                  <ArrowDownCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-700">{summary.decreased.length}</p>
                    <p className="text-xs text-red-600">Scores Decreased</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                  <MinusCircle className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-lg font-bold text-gray-700">{summary.unchanged.length}</p>
                    <p className="text-xs text-gray-600">Unchanged</p>
                  </div>
                </div>
                {summary.errors.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-100 rounded">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-amber-700">{summary.errors.length}</p>
                      <p className="text-xs text-amber-600">Errors</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show some example changes */}
            {summary?.increased.length > 0 && (
              <div className="mt-3 text-xs">
                <p className="font-medium text-gray-700 mb-1">Sample increases:</p>
                <div className="space-y-1">
                  {summary.increased.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">
                        {item.oldScore || 0}% → {item.newScore}%
                      </Badge>
                      <span className="text-gray-500 truncate">{item.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary?.decreased.length > 0 && (
              <div className="mt-3 text-xs">
                <p className="font-medium text-gray-700 mb-1">Sample decreases:</p>
                <div className="space-y-1">
                  {summary.decreased.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-red-600">
                        {item.oldScore || 0}% → {item.newScore}%
                      </Badge>
                      <span className="text-gray-500 truncate">{item.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="gap-2"
          >
            {isRecalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Recalculate All Quality Scores
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          This will recalculate quality scores for all articles using the unified scoring algorithm.
          Scores will match what you see in the article editor.
        </p>
      </CardContent>
    </Card>
  )
}
