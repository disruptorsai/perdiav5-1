import { useEffect, useState } from 'react'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { validateContent, BLOCKED_COMPETITORS, ALLOWED_EXTERNAL_DOMAINS } from '@/services/validation/linkValidator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Home,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

/**
 * Link Compliance Checker Component
 * Analyzes internal and external links in content
 * CRITICAL: Enforces GetEducated linking rules:
 * - No .edu links (use GetEducated school pages)
 * - No competitor links (onlineu.com, usnews.com, etc.)
 * - External links only to BLS, government, nonprofit sites
 */
export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [validationResult, setValidationResult] = useState(null)
  const [showBlockingDetails, setShowBlockingDetails] = useState(false)
  const [showWarningDetails, setShowWarningDetails] = useState(false)
  const [showLinkDetails, setShowLinkDetails] = useState(false)

  const { getIntValue, getBoolValue } = useSettingsMap()

  const minInternalLinks = getIntValue('min_internal_links', 3)
  const minExternalLinks = getIntValue('min_external_links', 1)
  // These settings are used by the validateContent service, not directly in this component
  getBoolValue('block_edu_links', true)
  getBoolValue('block_competitor_links', true)

  useEffect(() => {
    if (!content) {
      const emptyResult = {
        isCompliant: false,
        totalLinks: 0,
        internalLinks: 0,
        externalLinks: 0,
        blockingIssues: [],
        warnings: [],
        links: [],
      }
      setValidationResult(emptyResult)
      onComplianceChange?.(false, emptyResult)
      return
    }

    // Use the validation service
    const result = validateContent(content)

    // Check minimum link requirements
    const meetsInternalMin = result.internalLinks >= minInternalLinks
    const meetsExternalMin = result.externalLinks >= minExternalLinks

    // Add minimum link issues if not met
    if (!meetsInternalMin) {
      result.warnings.push({
        url: null,
        issues: [`Need ${minInternalLinks - result.internalLinks} more internal links (minimum: ${minInternalLinks})`],
      })
    }
    if (!meetsExternalMin) {
      result.warnings.push({
        url: null,
        issues: [`Need ${minExternalLinks - result.externalLinks} more external citations (minimum: ${minExternalLinks})`],
      })
    }

    // Overall compliance check
    const isFullyCompliant = result.isCompliant && meetsInternalMin && meetsExternalMin

    setValidationResult({ ...result, isFullyCompliant, meetsInternalMin, meetsExternalMin })
    onComplianceChange?.(isFullyCompliant, result)
  }, [content, minInternalLinks, minExternalLinks, onComplianceChange])

  if (!validationResult) return null

  const {
    isFullyCompliant,
    totalLinks,
    internalLinks,
    externalLinks,
    blockingIssues,
    warnings,
    links,
    meetsInternalMin,
    meetsExternalMin,
  } = validationResult

  const hasBlockingIssues = blockingIssues.length > 0
  const hasWarnings = warnings.length > 0

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link Compliance
          </CardTitle>
          {hasBlockingIssues ? (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <XCircle className="w-3 h-3 mr-1" />
              Blocked
            </Badge>
          ) : isFullyCompliant ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Review
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Blocking Issues Alert */}
        {hasBlockingIssues && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {blockingIssues.length} Blocking Issue{blockingIssues.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockingDetails(!showBlockingDetails)}
                className="text-red-600 h-6 px-2"
              >
                {showBlockingDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-red-600 mt-1">
              These links must be removed before publishing
            </p>
            {showBlockingDetails && (
              <div className="mt-2 space-y-2">
                {blockingIssues.map((issue, index) => (
                  <div key={index} className="p-2 bg-red-100 rounded text-xs">
                    <p className="font-medium text-red-800 truncate">
                      {issue.anchorText || issue.url}
                    </p>
                    <p className="text-red-600 truncate">{issue.url}</p>
                    <p className="text-red-700 mt-1">{issue.issues[0]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Internal Links */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          meetsInternalMin
            ? 'bg-blue-50 border-blue-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <Home className={`w-4 h-4 ${meetsInternalMin ? 'text-blue-600' : 'text-yellow-600'}`} />
            <span className="text-sm font-medium text-gray-900">Internal Links</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={meetsInternalMin
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
            >
              {internalLinks}/{minInternalLinks}
            </Badge>
            {meetsInternalMin ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* External Links */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          meetsExternalMin
            ? 'bg-purple-50 border-purple-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <Globe className={`w-4 h-4 ${meetsExternalMin ? 'text-purple-600' : 'text-yellow-600'}`} />
            <span className="text-sm font-medium text-gray-900">External Citations</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={meetsExternalMin
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
            >
              {externalLinks}/{minExternalLinks}
            </Badge>
            {meetsExternalMin ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* Warnings */}
        {hasWarnings && !hasBlockingIssues && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWarningDetails(!showWarningDetails)}
                className="text-yellow-600 h-6 px-2"
              >
                {showWarningDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            {showWarningDetails && (
              <div className="mt-2 space-y-1">
                {warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-yellow-700">
                    {warning.url ? `• ${warning.url}: ${warning.issues[0]}` : `• ${warning.issues[0]}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Status */}
        {isFullyCompliant && !hasBlockingIssues && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-800 font-medium">
                All link requirements met!
              </p>
            </div>
          </div>
        )}

        {/* GetEducated Rules Reference */}
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">GetEducated Link Rules</span>
          </div>
          <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4">
            <li>• No .edu links (use GetEducated school pages)</li>
            <li>• No competitor links (onlineu, usnews, etc.)</li>
            <li>• External links: BLS, government, nonprofit only</li>
          </ul>
        </div>

        {/* Total Links Summary */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">Total Links Found</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowLinkDetails(!showLinkDetails)}
          >
            {totalLinks} links
            {showLinkDetails ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </Button>
        </div>

        {/* Link Details */}
        {showLinkDetails && links.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {links.map((link, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  link.severity === 'blocking'
                    ? 'bg-red-50 border border-red-200'
                    : link.severity === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : link.type === 'internal'
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-purple-50 border border-purple-100'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {link.severity === 'blocking' ? (
                    <XCircle className="w-3 h-3 text-red-600" />
                  ) : link.severity === 'warning' ? (
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  ) : link.type === 'internal' ? (
                    <Home className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ExternalLink className="w-3 h-3 text-purple-600" />
                  )}
                  <span className="font-medium truncate">{link.anchorText || 'No anchor text'}</span>
                </div>
                <p className="text-gray-500 truncate text-[10px]">{link.url}</p>
                {link.issues?.length > 0 && (
                  <p className={`text-[10px] mt-1 ${
                    link.severity === 'blocking' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {link.issues[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
