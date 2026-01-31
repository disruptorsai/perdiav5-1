import { useState } from 'react'
import {
  Users,
  Plus,
  Trash2,
  Tag,
  FileText,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const AUTHOR_COLORS = {
  'Tony Huffman': 'border-blue-400 bg-blue-50',
  'Kayleigh Gilbert': 'border-purple-400 bg-purple-50',
  'Sara': 'border-green-400 bg-green-50',
  'Charity': 'border-orange-400 bg-orange-50',
}

/**
 * AuthorMappingEditor - Map authors to their expertise areas and content types
 */
export default function AuthorMappingEditor({ value = {}, onChange }) {
  const [selectedAuthor, setSelectedAuthor] = useState(Object.keys(value)[0] || null)
  const [newExpertise, setNewExpertise] = useState('')
  const [newContentType, setNewContentType] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const authors = Object.keys(value)

  const updateAuthorField = (author, field, newVal) => {
    onChange({
      ...value,
      [author]: {
        ...value[author],
        [field]: newVal,
      },
    })
  }

  const addToAuthorList = (author, field, item, setter) => {
    if (!item.trim()) return
    const currentList = value[author]?.[field] || []
    updateAuthorField(author, field, [...currentList, item.trim()])
    setter('')
  }

  const removeFromAuthorList = (author, field, item) => {
    const currentList = value[author]?.[field] || []
    updateAuthorField(author, field, currentList.filter(i => i !== item))
  }

  const currentAuthorData = selectedAuthor ? value[selectedAuthor] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Author Content Mapping</h3>
      </div>

      <p className="text-sm text-gray-500">
        Define each author's expertise areas, preferred content types, and matching keywords.
        This helps the AI assign the right author to each article.
      </p>

      <div className="flex gap-6">
        {/* Author list */}
        <div className="w-48 flex-shrink-0">
          <Label className="mb-2 block text-xs text-gray-500 uppercase">Authors</Label>
          <div className="space-y-2">
            {authors.map(author => (
              <button
                key={author}
                onClick={() => setSelectedAuthor(author)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg border transition-all',
                  selectedAuthor === author
                    ? AUTHOR_COLORS[author] || 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="font-medium text-sm">{author}</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Tag className="w-3 h-3" />
                  {(value[author]?.expertise_areas || []).length} areas
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Author details */}
        {selectedAuthor && currentAuthorData && (
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className={cn(
              'p-4 rounded-lg border-2',
              AUTHOR_COLORS[selectedAuthor] || 'border-gray-200 bg-gray-50'
            )}>
              <h4 className="font-semibold text-lg">{selectedAuthor}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Configure expertise areas, content types, and matching keywords for this author.
              </p>
            </div>

            {/* Expertise Areas */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-blue-600" />
                <Label>Expertise Areas</Label>
                <Badge variant="outline" className="ml-auto text-xs">
                  {(currentAuthorData.expertise_areas || []).length}
                </Badge>
              </div>

              <div className="flex gap-2 mb-3">
                <Input
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  placeholder="e.g., data analysis, rankings..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addToAuthorList(selectedAuthor, 'expertise_areas', newExpertise, setNewExpertise)}
                />
                <Button
                  onClick={() => addToAuthorList(selectedAuthor, 'expertise_areas', newExpertise, setNewExpertise)}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(currentAuthorData.expertise_areas || []).map((area, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="py-1.5 border-blue-300 bg-blue-50"
                  >
                    {area}
                    <button
                      onClick={() => removeFromAuthorList(selectedAuthor, 'expertise_areas', area)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(currentAuthorData.expertise_areas || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No expertise areas defined</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Content Types */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <Label>Content Types</Label>
                <Badge variant="outline" className="ml-auto text-xs">
                  {(currentAuthorData.content_types || []).length}
                </Badge>
              </div>

              <div className="flex gap-2 mb-3">
                <Input
                  value={newContentType}
                  onChange={(e) => setNewContentType(e.target.value)}
                  placeholder="e.g., ranking, guide, listicle..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addToAuthorList(selectedAuthor, 'content_types', newContentType, setNewContentType)}
                />
                <Button
                  onClick={() => addToAuthorList(selectedAuthor, 'content_types', newContentType, setNewContentType)}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(currentAuthorData.content_types || []).map((type, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="py-1.5 border-purple-300 bg-purple-50"
                  >
                    {type}
                    <button
                      onClick={() => removeFromAuthorList(selectedAuthor, 'content_types', type)}
                      className="ml-2 text-purple-500 hover:text-purple-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(currentAuthorData.content_types || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No content types defined</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Keywords */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-green-600" />
                <Label>Matching Keywords</Label>
                <Badge variant="outline" className="ml-auto text-xs">
                  {(currentAuthorData.keywords || []).length}
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Keywords in article titles that trigger this author assignment.
              </p>

              <div className="flex gap-2 mb-3">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., affordable, cheapest, nursing..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addToAuthorList(selectedAuthor, 'keywords', newKeyword, setNewKeyword)}
                />
                <Button
                  onClick={() => addToAuthorList(selectedAuthor, 'keywords', newKeyword, setNewKeyword)}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(currentAuthorData.keywords || []).map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="py-1.5 border-green-300 bg-green-50"
                  >
                    {keyword}
                    <button
                      onClick={() => removeFromAuthorList(selectedAuthor, 'keywords', keyword)}
                      className="ml-2 text-green-500 hover:text-green-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(currentAuthorData.keywords || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No keywords defined</p>
                )}
              </div>
            </section>
          </div>
        )}

        {!selectedAuthor && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select an author to edit their mapping</p>
          </div>
        )}
      </div>
    </div>
  )
}
