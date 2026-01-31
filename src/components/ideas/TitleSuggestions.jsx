import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import { useGenerateTitleSuggestions } from '../../hooks/useContentIdeas'

/**
 * TitleSuggestions - AI-powered title generation component
 * Shows 3 title suggestions based on description/topics
 * Per Dec 22, 2025 meeting: Toggle between manual title and AI-generated
 */
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
      console.error('Failed to generate title suggestions:', error)
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
      {/* Generate Button */}
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

      {/* Suggestions List */}
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

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && description?.trim() && (
        <p className="text-sm text-gray-500 italic">
          Click "Generate Title Ideas" to get AI-powered suggestions
        </p>
      )}
    </div>
  )
}

export default TitleSuggestions
