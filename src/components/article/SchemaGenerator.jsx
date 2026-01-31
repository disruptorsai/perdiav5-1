import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Code, Copy, Check } from 'lucide-react'

/**
 * FAQ Schema Generator Component
 * Generates structured data for FAQ sections
 */
export default function SchemaGenerator({ article, faqs: initialFaqs, onSchemaUpdate }) {
  const [faqs, setFaqs] = useState(initialFaqs || article?.faqs || [])
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [copied, setCopied] = useState(false)

  // Sync with external faqs prop
  useEffect(() => {
    if (initialFaqs) {
      setFaqs(initialFaqs)
    } else if (article?.faqs) {
      setFaqs(article.faqs)
    }
  }, [initialFaqs, article?.faqs])

  const generateSchema = (faqList) => {
    if (faqList.length === 0) return null

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqList.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    }
  }

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return

    const updatedFaqs = [...faqs, {
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    }]

    setFaqs(updatedFaqs)
    onSchemaUpdate?.(updatedFaqs, generateSchema(updatedFaqs))
    setNewQuestion('')
    setNewAnswer('')
  }

  const handleRemoveFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index)
    setFaqs(updatedFaqs)
    onSchemaUpdate?.(updatedFaqs, generateSchema(updatedFaqs))
  }

  const handleUpdateFaq = (index, field, value) => {
    const updatedFaqs = faqs.map((faq, i) =>
      i === index ? { ...faq, [field]: value } : faq
    )
    setFaqs(updatedFaqs)
    onSchemaUpdate?.(updatedFaqs, generateSchema(updatedFaqs))
  }

  const handleCopySchema = async () => {
    const schema = generateSchema(faqs)
    if (!schema) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddFaq()
    }
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            Schema Generator
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing FAQs */}
        {faqs.length > 0 && (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="font-semibold text-blue-600 text-sm mt-0.5">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <Input
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                        className="font-medium text-sm text-gray-900 bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                        placeholder="Question"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFaq(index)}
                    className="h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                  className="text-xs text-gray-600 ml-5 bg-transparent border-0 p-0 min-h-0 focus-visible:ring-0 resize-none"
                  placeholder="Answer"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add New FAQ Form */}
        <div className="space-y-2 pt-4 border-t">
          <Input
            placeholder="FAQ Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
          <Textarea
            placeholder="FAQ Answer"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            className="text-sm"
          />
          <Button
            onClick={handleAddFaq}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </Button>
        </div>

        {/* Copy Schema Button */}
        {faqs.length > 0 && (
          <Button
            onClick={handleCopySchema}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Schema JSON
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-gray-500 text-center">
          Press Ctrl+Enter to quickly add FAQ
        </p>
      </CardContent>
    </Card>
  )
}
