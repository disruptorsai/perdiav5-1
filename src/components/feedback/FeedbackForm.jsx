import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, Bug, HelpCircle, Lightbulb, AlertCircle, MessageCircle, CheckCircle } from 'lucide-react'
import { useSubmitDevFeedback, FEEDBACK_CATEGORIES } from '@/hooks/useDevFeedback'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Map categories to icons
const CATEGORY_ICONS = {
  bug: Bug,
  question: HelpCircle,
  suggestion: Lightbulb,
  confusion: AlertCircle,
  other: MessageCircle,
}

// Map categories to colors
const CATEGORY_COLORS = {
  bug: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  question: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  suggestion: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
  confusion: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
  other: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
}

const CATEGORY_SELECTED = {
  bug: 'border-red-500 bg-red-100 text-red-800 ring-2 ring-red-500/20',
  question: 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-500/20',
  suggestion: 'border-purple-500 bg-purple-100 text-purple-800 ring-2 ring-purple-500/20',
  confusion: 'border-orange-500 bg-orange-100 text-orange-800 ring-2 ring-orange-500/20',
  other: 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-500/20',
}

function FeedbackForm({ onSuccess }) {
  const location = useLocation()
  const submitFeedback = useSubmitDevFeedback()

  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!category || !message.trim()) return

    try {
      await submitFeedback.mutateAsync({
        category,
        message: message.trim(),
        pagePath: location.pathname,
        pageTitle: document.title || null,
      })

      setIsSubmitted(true)

      // Reset after a delay or call onSuccess
      setTimeout(() => {
        setCategory('')
        setMessage('')
        setIsSubmitted(false)
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 mb-4 bg-green-100 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Thank you!</h3>
        <p className="text-sm text-gray-600">Your feedback has been submitted.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Current page indicator */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
        Submitting feedback for: <span className="font-medium text-gray-700">{location.pathname}</span>
      </div>

      {/* Category selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          What type of feedback is this?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FEEDBACK_CATEGORIES).map(([key, config]) => {
            const Icon = CATEGORY_ICONS[key]
            const isSelected = category === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                  isSelected ? CATEGORY_SELECTED[key] : CATEGORY_COLORS[key]
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
        {category && (
          <p className="text-xs text-gray-500 mt-1">
            {FEEDBACK_CATEGORIES[category].description}
          </p>
        )}
      </div>

      {/* Message textarea */}
      <div className="space-y-2">
        <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700">
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            category === 'bug'
              ? "Describe what's broken and what you expected to happen..."
              : category === 'question'
              ? "What would you like to know or understand better?"
              : category === 'suggestion'
              ? "Describe your idea or improvement suggestion..."
              : category === 'confusion'
              ? "What's unclear or confusing? What would make it clearer?"
              : "Share your thoughts..."
          }
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          required
        />
        <p className="text-xs text-gray-500">
          Be as specific as possible. Include steps to reproduce if reporting a bug.
        </p>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!category || !message.trim() || submitFeedback.isPending}
        className="w-full"
      >
        {submitFeedback.isPending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Feedback
          </span>
        )}
      </Button>
    </form>
  )
}

export default FeedbackForm
