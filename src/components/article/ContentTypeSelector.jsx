import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  ListOrdered,
  Trophy,
  HelpCircle,
  Star,
  Lightbulb,
  FileText,
  Check
} from 'lucide-react'

const CONTENT_TYPES = [
  {
    id: 'guide',
    name: 'Guide',
    description: 'Comprehensive how-to content with step-by-step instructions',
    icon: BookOpen,
    color: 'blue',
    wordCount: '2000-3000',
    structure: ['Introduction', 'Steps/Sections', 'Tips', 'FAQ', 'Conclusion']
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'List-based article with numbered items or tips',
    icon: ListOrdered,
    color: 'purple',
    wordCount: '1500-2500',
    structure: ['Introduction', 'Numbered Items', 'Summary', 'FAQ']
  },
  {
    id: 'ranking',
    name: 'Ranking',
    description: 'Comparison or ranking of options (best X for Y)',
    icon: Trophy,
    color: 'yellow',
    wordCount: '2500-4000',
    structure: ['Introduction', 'Methodology', 'Ranked Items', 'Comparison Table', 'FAQ']
  },
  {
    id: 'explainer',
    name: 'Explainer',
    description: 'In-depth explanation of a concept or topic',
    icon: HelpCircle,
    color: 'green',
    wordCount: '1500-2500',
    structure: ['Introduction', 'What Is', 'How It Works', 'Examples', 'FAQ']
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Detailed review of a product, service, or program',
    icon: Star,
    color: 'orange',
    wordCount: '2000-3000',
    structure: ['Overview', 'Pros & Cons', 'Features', 'Pricing', 'Verdict', 'FAQ']
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step instructional content with examples',
    icon: Lightbulb,
    color: 'cyan',
    wordCount: '1500-2500',
    structure: ['Prerequisites', 'Steps', 'Examples', 'Troubleshooting', 'Next Steps']
  }
]

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    activeBg: 'bg-blue-100',
    activeBorder: 'border-blue-500',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    activeBg: 'bg-purple-100',
    activeBorder: 'border-purple-500',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700'
  },
  yellow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200',
    activeBg: 'bg-yellow-100',
    activeBorder: 'border-yellow-500',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700'
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    activeBg: 'bg-green-100',
    activeBorder: 'border-green-500',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700'
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200',
    activeBg: 'bg-orange-100',
    activeBorder: 'border-orange-500',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700'
  },
  cyan: {
    bg: 'bg-cyan-50 hover:bg-cyan-100',
    border: 'border-cyan-200',
    activeBg: 'bg-cyan-100',
    activeBorder: 'border-cyan-500',
    icon: 'text-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700'
  }
}

/**
 * Content Type Selector Component
 * Allows selection of article content type with descriptions
 */
export default function ContentTypeSelector({ value, onChange, showDetails = false }) {
  const selectedType = CONTENT_TYPES.find(t => t.id === value)

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Type
          </CardTitle>
          {selectedType && (
            <Badge className={colorClasses[selectedType.color].badge}>
              {selectedType.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_TYPES.map((type) => {
            const Icon = type.icon
            const colors = colorClasses[type.color]
            const isSelected = value === type.id

            return (
              <button
                key={type.id}
                onClick={() => onChange?.(type.id)}
                className={`
                  relative p-3 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? `${colors.activeBg} ${colors.activeBorder}`
                    : `${colors.bg} ${colors.border}`
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                )}
                <Icon className={`w-5 h-5 ${colors.icon} mb-1`} />
                <p className="font-medium text-sm text-gray-900">{type.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{type.description}</p>
              </button>
            )
          })}
        </div>

        {/* Selected Type Details */}
        {showDetails && selectedType && (
          <div className={`mt-4 p-3 rounded-lg ${colorClasses[selectedType.color].bg} border ${colorClasses[selectedType.color].border}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{selectedType.name} Structure</h4>
              <Badge variant="secondary" className="text-xs">
                {selectedType.wordCount} words
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedType.structure.map((section, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs bg-white/50"
                >
                  {section}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export content types for use in other components
export { CONTENT_TYPES }
