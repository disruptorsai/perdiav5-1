import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  useContributor,
  useContributorArticles,
  useUpdateContributor,
  APPROVED_AUTHORS,
  AUTHOR_DISPLAY_NAMES,
  getAuthorSystemPrompt,
} from '@/hooks/useContributors'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Icons
import {
  ArrowLeft,
  Save,
  User,
  Pencil,
  FileText,
  Star,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  BookOpen,
  MessageSquare,
  Target,
  Ban,
  Layout,
  Users,
  Sparkles,
  Code,
  RotateCcw,
} from 'lucide-react'

// Content type options
const CONTENT_TYPE_OPTIONS = [
  { value: 'guide', label: 'Guide' },
  { value: 'listicle', label: 'Listicle' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'review', label: 'Review' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'how-to', label: 'How-To' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'career-guide', label: 'Career Guide' },
  { value: 'landing-page', label: 'Landing Page' },
  { value: 'overview', label: 'Overview' },
  { value: 'analysis', label: 'Analysis' },
]

// Expertise area suggestions
const EXPERTISE_SUGGESTIONS = [
  'rankings', 'cost-analysis', 'online-degrees', 'affordability', 'accreditation',
  'healthcare', 'nursing', 'social-work', 'hospitality', 'professional-licensure',
  'technical-education', 'career-pathways', 'general-degrees', 'online-learning',
  'teaching', 'education-degrees', 'certification', 'career-change', 'teacher-licensure',
  'business', 'mba', 'finance', 'marketing', 'management',
]

// Personality trait suggestions
const PERSONALITY_SUGGESTIONS = [
  'analytical', 'pragmatic', 'authoritative', 'helpful', 'direct',
  'thorough', 'professional', 'knowledgeable', 'organized',
  'friendly', 'patient', 'encouraging', 'clear', 'relatable',
  'supportive', 'practical', 'empathetic', 'honest', 'motivating',
]

export default function ContributorDetail() {
  const { contributorId } = useParams()
  const navigate = useNavigate()

  // Data hooks
  const { data: contributor, isLoading, error } = useContributor(contributorId)
  const { data: articles = [] } = useContributorArticles(contributorId, 20)
  const updateMutation = useUpdateContributor()

  // Form state
  const [formData, setFormData] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPromptPreview, setShowPromptPreview] = useState(false)

  // Initialize form data when contributor loads
  useEffect(() => {
    if (contributor && !formData) {
      setFormData({
        name: contributor.name || '',
        display_name: contributor.display_name || '',
        bio: contributor.bio || '',
        author_page_url: contributor.author_page_url || '',
        expertise_areas: contributor.expertise_areas || [],
        content_types: contributor.content_types || [],
        writing_style_profile: contributor.writing_style_profile || {},
        voice_description: contributor.voice_description || '',
        writing_guidelines: contributor.writing_guidelines || '',
        signature_phrases: contributor.signature_phrases || [],
        phrases_to_avoid: contributor.phrases_to_avoid || [],
        preferred_structure: contributor.preferred_structure || '',
        target_audience: contributor.target_audience || '',
        personality_traits: contributor.personality_traits || [],
        seo_approach: contributor.seo_approach || '',
        intro_style: contributor.intro_style || '',
        conclusion_style: contributor.conclusion_style || '',
        sample_excerpts: contributor.sample_excerpts || [],
        custom_system_prompt: contributor.custom_system_prompt || '',
      })
    }
  }, [contributor, formData])

  // Track changes
  useEffect(() => {
    if (contributor && formData) {
      const changed = JSON.stringify(formData) !== JSON.stringify({
        name: contributor.name || '',
        display_name: contributor.display_name || '',
        bio: contributor.bio || '',
        author_page_url: contributor.author_page_url || '',
        expertise_areas: contributor.expertise_areas || [],
        content_types: contributor.content_types || [],
        writing_style_profile: contributor.writing_style_profile || {},
        voice_description: contributor.voice_description || '',
        writing_guidelines: contributor.writing_guidelines || '',
        signature_phrases: contributor.signature_phrases || [],
        phrases_to_avoid: contributor.phrases_to_avoid || [],
        preferred_structure: contributor.preferred_structure || '',
        target_audience: contributor.target_audience || '',
        personality_traits: contributor.personality_traits || [],
        seo_approach: contributor.seo_approach || '',
        intro_style: contributor.intro_style || '',
        conclusion_style: contributor.conclusion_style || '',
        sample_excerpts: contributor.sample_excerpts || [],
        custom_system_prompt: contributor.custom_system_prompt || '',
      })
      setHasChanges(changed)
    }
  }, [contributor, formData])

  const isApproved = contributor && APPROVED_AUTHORS.includes(contributor.name)

  // Handlers
  const handleSave = async () => {
    if (!formData) return

    try {
      await updateMutation.mutateAsync({
        id: contributorId,
        updates: {
          ...formData,
          updated_at: new Date().toISOString(),
        },
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving contributor:', error)
    }
  }

  const handleDiscard = () => {
    if (contributor) {
      setFormData({
        name: contributor.name || '',
        display_name: contributor.display_name || '',
        bio: contributor.bio || '',
        author_page_url: contributor.author_page_url || '',
        expertise_areas: contributor.expertise_areas || [],
        content_types: contributor.content_types || [],
        writing_style_profile: contributor.writing_style_profile || {},
        voice_description: contributor.voice_description || '',
        writing_guidelines: contributor.writing_guidelines || '',
        signature_phrases: contributor.signature_phrases || [],
        phrases_to_avoid: contributor.phrases_to_avoid || [],
        preferred_structure: contributor.preferred_structure || '',
        target_audience: contributor.target_audience || '',
        personality_traits: contributor.personality_traits || [],
        seo_approach: contributor.seo_approach || '',
        intro_style: contributor.intro_style || '',
        conclusion_style: contributor.conclusion_style || '',
        sample_excerpts: contributor.sample_excerpts || [],
        custom_system_prompt: contributor.custom_system_prompt || '',
      })
      setHasChanges(false)
    }
    setShowDiscardDialog(false)
  }

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardDialog(true)
    } else {
      navigate('/contributors')
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }))
  }

  const addArrayItem = (field, value) => {
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value],
      }))
    }
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addSampleExcerpt = () => {
    setFormData(prev => ({
      ...prev,
      sample_excerpts: [...prev.sample_excerpts, { title: '', excerpt: '' }],
    }))
  }

  const updateSampleExcerpt = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sample_excerpts: prev.sample_excerpts.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const removeSampleExcerpt = (index) => {
    setFormData(prev => ({
      ...prev,
      sample_excerpts: prev.sample_excerpts.filter((_, i) => i !== index),
    }))
  }

  const copyPromptToClipboard = () => {
    const prompt = getAuthorSystemPrompt(formData)
    navigator.clipboard.writeText(prompt)
  }

  // Calculate stats
  const avgQuality = articles.length > 0
    ? Math.round(articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.length)
    : 0
  const publishedCount = articles.filter(a => a.status === 'published').length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Contributor Not Found
              </h3>
              <p className="text-gray-500 mb-4">
                The contributor you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/contributors')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contributors
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {contributor.name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{contributor.name}</h1>
                  {isApproved && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approved Author
                    </Badge>
                  )}
                  {!contributor.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                {contributor.display_name && (
                  <p className="text-gray-500">
                    Writes as: <span className="font-medium">{contributor.display_name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="ghost" onClick={() => setShowDiscardDialog(true)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
                <p className="text-xs text-gray-500">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
                <p className="text-xs text-gray-500">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgQuality}%</p>
                <p className="text-xs text-gray-500">Avg Quality</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formData?.content_types?.length || 0}</p>
                <p className="text-xs text-gray-500">Content Types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        {formData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="voice" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Voice & Style
              </TabsTrigger>
              <TabsTrigger value="structure" className="gap-2">
                <Layout className="w-4 h-4" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="samples" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Samples
              </TabsTrigger>
              <TabsTrigger value="prompt" className="gap-2">
                <Code className="w-4 h-4" />
                System Prompt
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-2">
                <FileText className="w-4 h-4" />
                Articles
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Core author details and categorization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Internal Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g., Tony Huffman"
                      />
                      <p className="text-xs text-gray-500">Used internally for assignment</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name (Pen Name)</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => updateField('display_name', e.target.value)}
                        placeholder="e.g., Kif"
                      />
                      <p className="text-xs text-gray-500">Shown on published articles</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Author Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="A brief biography describing this author's background and expertise..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author_page_url">Author Page URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="author_page_url"
                        value={formData.author_page_url}
                        onChange={(e) => updateField('author_page_url', e.target.value)}
                        placeholder="https://www.geteducated.com/article-contributors/..."
                      />
                      {formData.author_page_url && (
                        <a
                          href={formData.author_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Textarea
                      id="target_audience"
                      value={formData.target_audience}
                      onChange={(e) => updateField('target_audience', e.target.value)}
                      placeholder="Describe who this author writes for: their education level, goals, concerns..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Expertise Areas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.expertise_areas.map((area, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {area}
                          <button
                            onClick={() => removeArrayItem('expertise_areas', i)}
                            className="ml-1 hover:text-red-600"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {EXPERTISE_SUGGESTIONS.filter(s => !formData.expertise_areas.includes(s)).slice(0, 10).map(suggestion => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => addArrayItem('expertise_areas', suggestion)}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Content Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_TYPE_OPTIONS.map(type => (
                        <Badge
                          key={type.value}
                          variant={formData.content_types.includes(type.value) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleArrayItem('content_types', type.value)}
                        >
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Personality Traits</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.personality_traits.map((trait, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {trait}
                          <button
                            onClick={() => removeArrayItem('personality_traits', i)}
                            className="ml-1 hover:text-red-600"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PERSONALITY_SUGGESTIONS.filter(s => !formData.personality_traits.includes(s)).map(suggestion => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => addArrayItem('personality_traits', suggestion)}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice & Style Tab */}
            <TabsContent value="voice">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Voice & Writing Style</CardTitle>
                  <CardDescription>
                    Define how this author sounds and writes - this is used directly in AI prompts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="voice_description">Voice Description</Label>
                    <Textarea
                      id="voice_description"
                      value={formData.voice_description}
                      onChange={(e) => updateField('voice_description', e.target.value)}
                      placeholder="Describe this author's voice in detail. How do they sound? What makes their writing distinctive? e.g., 'Authoritative and data-driven. Writes with confidence about online education costs and rankings...'"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      This is the primary description used in AI prompts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="writing_guidelines">Writing Guidelines</Label>
                    <Textarea
                      id="writing_guidelines"
                      value={formData.writing_guidelines}
                      onChange={(e) => updateField('writing_guidelines', e.target.value)}
                      placeholder="Numbered list of specific writing rules for this author:&#10;1. Lead with data and specific numbers&#10;2. Always mention accreditation status&#10;3. Use comparison language&#10;..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Specific instructions the AI will follow when writing as this author
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        Signature Phrases
                      </Label>
                      <div className="space-y-2">
                        {formData.signature_phrases.map((phrase, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={phrase}
                              onChange={(e) => {
                                const newPhrases = [...formData.signature_phrases]
                                newPhrases[i] = e.target.value
                                updateField('signature_phrases', newPhrases)
                              }}
                              placeholder="e.g., 'best value', 'according to our research'"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem('signature_phrases', i)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('signature_phrases', '')}
                          className="w-full"
                        >
                          + Add Phrase
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Phrases this author naturally uses
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-600" />
                        Phrases to Avoid
                      </Label>
                      <div className="space-y-2">
                        {formData.phrases_to_avoid.map((phrase, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={phrase}
                              onChange={(e) => {
                                const newPhrases = [...formData.phrases_to_avoid]
                                newPhrases[i] = e.target.value
                                updateField('phrases_to_avoid', newPhrases)
                              }}
                              placeholder="e.g., 'amazing', 'game-changer'"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem('phrases_to_avoid', i)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('phrases_to_avoid', '')}
                          className="w-full"
                        >
                          + Add Phrase
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Words/phrases this author never uses
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_approach">SEO Approach</Label>
                    <Textarea
                      id="seo_approach"
                      value={formData.seo_approach}
                      onChange={(e) => updateField('seo_approach', e.target.value)}
                      placeholder="Describe how this author approaches SEO: keyword preferences, content structure for rankings, featured snippet optimization..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Structure Tab */}
            <TabsContent value="structure">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Article Structure Preferences</CardTitle>
                  <CardDescription>
                    Define how this author structures their articles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_structure">Preferred Article Structure</Label>
                    <Textarea
                      id="preferred_structure"
                      value={formData.preferred_structure}
                      onChange={(e) => updateField('preferred_structure', e.target.value)}
                      placeholder="Outline the typical structure:&#10;1. Brief intro with key takeaway&#10;2. Quick comparison table&#10;3. Detailed breakdowns&#10;4. FAQ section&#10;5. Conclusion"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="intro_style">Introduction Style</Label>
                      <Textarea
                        id="intro_style"
                        value={formData.intro_style}
                        onChange={(e) => updateField('intro_style', e.target.value)}
                        placeholder="How does this author start their articles? e.g., 'Start with a compelling data point or direct answer to the search intent. No lengthy preambles.'"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conclusion_style">Conclusion Style</Label>
                      <Textarea
                        id="conclusion_style"
                        value={formData.conclusion_style}
                        onChange={(e) => updateField('conclusion_style', e.target.value)}
                        placeholder="How does this author end their articles? e.g., 'Summarize key findings, restate best options, and provide a clear call to action.'"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Legacy writing style profile fields */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Legacy Style Settings</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tone" className="text-xs">Tone</Label>
                        <Input
                          id="tone"
                          value={formData.writing_style_profile?.tone || ''}
                          onChange={(e) => updateField('writing_style_profile', {
                            ...formData.writing_style_profile,
                            tone: e.target.value,
                          })}
                          placeholder="e.g., authoritative"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complexity" className="text-xs">Complexity Level</Label>
                        <Input
                          id="complexity"
                          value={formData.writing_style_profile?.complexity_level || ''}
                          onChange={(e) => updateField('writing_style_profile', {
                            ...formData.writing_style_profile,
                            complexity_level: e.target.value,
                          })}
                          placeholder="e.g., intermediate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sentence_length" className="text-xs">Sentence Length</Label>
                        <Input
                          id="sentence_length"
                          value={formData.writing_style_profile?.sentence_length_preference || ''}
                          onChange={(e) => updateField('writing_style_profile', {
                            ...formData.writing_style_profile,
                            sentence_length_preference: e.target.value,
                          })}
                          placeholder="e.g., medium"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Samples Tab */}
            <TabsContent value="samples">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Sample Excerpts</CardTitle>
                  <CardDescription>
                    Add example passages that demonstrate this author's writing style
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.sample_excerpts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No sample excerpts yet</p>
                      <p className="text-sm">Add examples to help the AI match this author's style</p>
                    </div>
                  ) : (
                    formData.sample_excerpts.map((sample, i) => (
                      <div key={i} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sample {i + 1}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSampleExcerpt(i)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                        <Input
                          value={sample.title || ''}
                          onChange={(e) => updateSampleExcerpt(i, 'title', e.target.value)}
                          placeholder="Sample title or article name (optional)"
                        />
                        <Textarea
                          value={sample.excerpt || ''}
                          onChange={(e) => updateSampleExcerpt(i, 'excerpt', e.target.value)}
                          placeholder="Paste a representative excerpt from this author's writing..."
                          rows={4}
                        />
                      </div>
                    ))
                  )}
                  <Button variant="outline" onClick={addSampleExcerpt} className="w-full">
                    + Add Sample Excerpt
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Prompt Tab */}
            <TabsContent value="prompt">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Generated System Prompt</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyPromptToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPromptPreview(!showPromptPreview)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showPromptPreview ? 'Hide' : 'Preview'}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    This prompt is automatically generated from the profile fields above and used when generating articles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {showPromptPreview && (
                    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {getAuthorSystemPrompt(formData) || '(No prompt generated - fill in profile fields above)'}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="custom_prompt" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Custom System Prompt Override
                    </Label>
                    <Textarea
                      id="custom_prompt"
                      value={formData.custom_system_prompt}
                      onChange={(e) => updateField('custom_system_prompt', e.target.value)}
                      placeholder="Leave empty to use auto-generated prompt from profile fields. If you enter a custom prompt here, it will REPLACE all auto-generated content."
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-amber-600">
                      Warning: Setting a custom prompt will ignore all profile fields above
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Articles by {contributor.name}</CardTitle>
                  <CardDescription>
                    Recent articles written by this author
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {articles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No articles yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {articles.map((article) => (
                        <Link
                          key={article.id}
                          to={`/editor/${article.id}`}
                          className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {article.title || 'Untitled'}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                                <Badge variant="outline" className="text-xs">
                                  {article.status}
                                </Badge>
                              </div>
                            </div>
                            {article.quality_score && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{article.quality_score}%</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
