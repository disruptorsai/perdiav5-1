import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  X,
  Copy,
  Check,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronUp,
  Bug,
  AlertTriangle,
  XCircle,
  Wifi,
  Clock,
} from 'lucide-react'

// Error type configurations
const ERROR_TYPES = {
  network: {
    icon: Wifi,
    title: 'Network Error',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    suggestion: 'Check your internet connection and try again.',
  },
  api: {
    icon: XCircle,
    title: 'API Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    suggestion: 'The service may be temporarily unavailable. Please try again in a few minutes.',
  },
  validation: {
    icon: AlertTriangle,
    title: 'Validation Error',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    suggestion: 'Please check your input and try again.',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    suggestion: 'The request took too long. Please try again.',
  },
  unknown: {
    icon: Bug,
    title: 'Unexpected Error',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    suggestion: 'Something went wrong. Please try again or contact support.',
  },
}

/**
 * Generate a unique error code for tracking
 * Format: TYPE_STATUS_TIMESTAMP_RANDOM
 */
function generateErrorCode(errorType, statusCode) {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const type = errorType.toUpperCase().slice(0, 4)
  const status = statusCode || 'UNK'
  return `${type}_${status}_${timestamp}_${random}`
}

/**
 * Detect error type from error object
 */
function detectErrorType(error) {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status || error?.statusCode || error?.code

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network'
  }
  if (status === 408 || message.includes('timeout')) {
    return 'timeout'
  }
  if (status >= 400 && status < 500) {
    return 'validation'
  }
  if (status >= 500 || message.includes('api') || message.includes('server')) {
    return 'api'
  }
  return 'unknown'
}

/**
 * ErrorModal Component
 * Displays structured error information with copyable details
 *
 * Usage:
 * <ErrorModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   error={error}
 *   action="generate idea"
 *   onRetry={() => handleRetry()}
 * />
 */
export default function ErrorModal({
  isOpen,
  onClose,
  error,
  action = 'complete the operation',
  onRetry,
  onReport,
  context = {},
}) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen || !error) return null

  // Analyze error
  const errorType = detectErrorType(error)
  const config = ERROR_TYPES[errorType]
  const Icon = config.icon
  const statusCode = error?.status || error?.statusCode || error?.code
  const errorCode = generateErrorCode(errorType, statusCode)
  const timestamp = new Date().toISOString()

  // Build error details for copying
  const errorDetails = {
    errorCode,
    timestamp,
    type: errorType,
    message: error?.message || 'Unknown error',
    statusCode: statusCode || 'N/A',
    action,
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'N/A',
    ...context,
  }

  const copyableText = `Error Report
-----------
Error Code: ${errorCode}
Timestamp: ${timestamp}
Type: ${errorType}
Action: ${action}
Message: ${error?.message || 'Unknown error'}
Status: ${statusCode || 'N/A'}
URL: ${errorDetails.url}
${context.ideaTitle ? `Idea: ${context.ideaTitle}` : ''}
${context.articleId ? `Article ID: ${context.articleId}` : ''}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyableText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleReport = () => {
    if (onReport) {
      onReport(errorDetails)
    } else {
      // Default: Open email client
      const subject = encodeURIComponent(`Error Report: ${errorCode}`)
      const body = encodeURIComponent(copyableText)
      window.open(`mailto:support@geteducated.com?subject=${subject}&body=${body}`)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
                  <p className="text-sm text-gray-600">Failed to {action}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Error Message */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 font-medium">{error?.message || 'An unexpected error occurred'}</p>
              <p className="text-sm text-gray-500 mt-1">{config.suggestion}</p>
            </div>

            {/* Error Code */}
            <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Error Code</p>
                <p className="font-mono text-sm text-gray-800">{errorCode}</p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </>
                )}
              </button>
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide technical details' : 'Show technical details'}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {onRetry && (
              <button
                onClick={() => {
                  onClose()
                  onRetry()
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            <button
              onClick={handleReport}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Report Issue
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/**
 * Hook to manage error modal state
 *
 * Usage:
 * const { showError, errorModal } = useErrorModal()
 *
 * try {
 *   await someAction()
 * } catch (error) {
 *   showError(error, { action: 'generate idea', ideaTitle: 'My Idea' })
 * }
 *
 * return (
 *   <>
 *     {errorModal}
 *   </>
 * )
 */
export function useErrorModal() {
  const [state, setState] = useState({
    isOpen: false,
    error: null,
    action: '',
    context: {},
    onRetry: null,
  })

  const showError = (error, options = {}) => {
    setState({
      isOpen: true,
      error,
      action: options.action || 'complete the operation',
      context: options.context || {},
      onRetry: options.onRetry || null,
    })
  }

  const hideError = () => {
    setState({
      isOpen: false,
      error: null,
      action: '',
      context: {},
      onRetry: null,
    })
  }

  const errorModal = (
    <ErrorModal
      isOpen={state.isOpen}
      onClose={hideError}
      error={state.error}
      action={state.action}
      context={state.context}
      onRetry={state.onRetry}
    />
  )

  return { showError, hideError, errorModal }
}
