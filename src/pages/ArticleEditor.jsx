import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useArticle, useUpdateArticle } from '../hooks/useArticles'
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react'
import { RichTextEditor, getWordCount } from '@/components/ui/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

// SIMPLIFIED TEST VERSION - to find the navigation freeze culprit
// This version has: data fetching, basic state, editor, save
// NO: sidebar components, lock feature, feedback hooks, publishing

export default function ArticleEditor() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { data: article, isLoading } = useArticle(articleId)
  const updateArticle = useUpdateArticle()
  const { toast } = useToast()

  // Editor state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Track if we've loaded initial data
  const hasLoadedInitialDataRef = useRef(false)

  // Update local state when article loads - ONLY on initial load
  useEffect(() => {
    if (article && !hasLoadedInitialDataRef.current) {
      setTitle(article.title || '')
      setContent(article.content || '')
      hasLoadedInitialDataRef.current = true
    }
  }, [article])

  // Calculate word count
  const wordCount = useMemo(() => getWordCount(content), [content])

  // Save handler
  const handleSave = async () => {
    setSaving(true)
    try {
      await updateArticle.mutateAsync({
        articleId,
        updates: {
          title,
          content,
          word_count: wordCount,
        }
      })
      toast.success('Article saved successfully')
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Article not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Edit Article (Simplified Test)</h1>
          <Badge variant="secondary">{wordCount} words</Badge>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save</>
          )}
        </Button>
      </div>

      {/* Simple Editor */}
      <div className="max-w-4xl space-y-6">
        <div>
          <Label className="mb-2">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold"
            placeholder="Article title..."
          />
        </div>

        <div>
          <Label className="mb-2">Content</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your article content here..."
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  )
}
