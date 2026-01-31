import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Newspaper,
  TrendingUp,
  Globe,
  Loader2,
  Sparkles,
  Check,
  X,
  Search,
  Lightbulb,
} from 'lucide-react'

const SOURCES = [
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Trending discussions from education & career subreddits',
    icon: MessageSquare,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'news',
    name: 'Trending News',
    description: 'Current headlines in education and career development',
    icon: Newspaper,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'trends',
    name: 'Google Trends',
    description: 'Rising search queries and topic interest',
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 'general',
    name: 'General Topics',
    description: 'Evergreen content opportunities and seasonal trends',
    icon: Globe,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
]

export default function SourceSelector({
  open,
  onOpenChange,
  onDiscoverIdeas,
  existingTopics = [],
  isLoading = false,
}) {
  const [selectedSources, setSelectedSources] = useState(['reddit', 'news', 'trends'])
  const [customTopic, setCustomTopic] = useState('')
  const [discoveredIdeas, setDiscoveredIdeas] = useState([])
  const [selectedIdeas, setSelectedIdeas] = useState([])
  const [step, setStep] = useState('sources') // 'sources' | 'results' | 'selecting'

  const handleSourceToggle = (sourceId) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleDiscoverIdeas = async () => {
    if (selectedSources.length === 0) return

    setStep('results')

    try {
      const ideas = await onDiscoverIdeas({
        sources: selectedSources,
        customTopic,
        existingTopics,
      })

      setDiscoveredIdeas(ideas)
      setStep('selecting')
    } catch (error) {
      console.error('Discovery error:', error)
      setStep('sources')
    }
  }

  const handleIdeaToggle = (ideaIndex) => {
    setSelectedIdeas(prev =>
      prev.includes(ideaIndex)
        ? prev.filter(i => i !== ideaIndex)
        : [...prev, ideaIndex]
    )
  }

  const handleSelectAll = () => {
    if (selectedIdeas.length === discoveredIdeas.length) {
      setSelectedIdeas([])
    } else {
      setSelectedIdeas(discoveredIdeas.map((_, i) => i))
    }
  }

  const handleAddSelected = () => {
    const ideasToAdd = selectedIdeas.map(i => discoveredIdeas[i])
    onOpenChange(false, ideasToAdd)
    // Reset state
    setStep('sources')
    setDiscoveredIdeas([])
    setSelectedIdeas([])
    setCustomTopic('')
  }

  const handleClose = () => {
    onOpenChange(false)
    setStep('sources')
    setDiscoveredIdeas([])
    setSelectedIdeas([])
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {step === 'sources' && 'Find New Content Ideas'}
            {step === 'results' && 'Discovering Ideas...'}
            {step === 'selecting' && `Found ${discoveredIdeas.length} Ideas`}
          </DialogTitle>
          <DialogDescription>
            {step === 'sources' && 'Select sources to discover trending content ideas using AI'}
            {step === 'results' && 'Searching the web for trending topics and discussions...'}
            {step === 'selecting' && 'Select the ideas you want to add to your content queue'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            {step === 'sources' && (
              <motion.div
                key="sources"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Source Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Sources</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SOURCES.map((source) => {
                      const Icon = source.icon
                      const isSelected = selectedSources.includes(source.id)

                      return (
                        <motion.button
                          key={source.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSourceToggle(source.id)}
                          className={`
                            relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }
                          `}
                        >
                          <div className={`p-2 rounded-lg ${source.bgColor}`}>
                            <Icon className={`w-5 h-5 ${source.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{source.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{source.description}</div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <Check className="w-4 h-4 text-blue-500" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Topic */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Custom Topic Focus (Optional)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., online MBA programs, nursing careers, data science..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Specify a topic to focus the idea discovery, or leave blank for general discovery
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="mb-4"
                >
                  <Sparkles className="w-12 h-12 text-amber-500" />
                </motion.div>
                <p className="text-gray-600 font-medium">Searching for trending ideas...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Analyzing {selectedSources.length} source{selectedSources.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {selectedSources.map(sourceId => {
                    const source = SOURCES.find(s => s.id === sourceId)
                    return (
                      <Badge key={sourceId} variant="secondary">
                        {source?.name}
                      </Badge>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {step === 'selecting' && (
              <motion.div
                key="selecting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Select All */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedIdeas.length === discoveredIdeas.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedIdeas.length} of {discoveredIdeas.length} selected
                  </span>
                </div>

                {/* Ideas List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {discoveredIdeas.map((idea, index) => {
                    const isSelected = selectedIdeas.includes(index)
                    const source = SOURCES.find(s => s.id === idea.source)
                    const SourceIcon = source?.icon || Globe

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleIdeaToggle(index)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleIdeaToggle(index)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {idea.title}
                              </h4>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {idea.content_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {idea.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <SourceIcon className={`w-3 h-3 ${source?.color}`} />
                                {source?.name}
                              </span>
                              {idea.trending_reason && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                  {idea.trending_reason.substring(0, 40)}...
                                </span>
                              )}
                            </div>
                            {idea.target_keywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {idea.target_keywords.slice(0, 3).map((kw, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="border-t pt-4">
          {step === 'sources' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDiscoverIdeas}
                disabled={selectedSources.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Discover Ideas
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'selecting' && (
            <>
              <Button variant="outline" onClick={() => setStep('sources')}>
                Back
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedIdeas.length === 0}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Add {selectedIdeas.length} Idea{selectedIdeas.length !== 1 ? 's' : ''} to Queue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
