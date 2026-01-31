import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useKeywords,
  useKeywordStats,
  useCreateKeyword,
  useUpdateKeyword,
  useDeleteKeyword,
  useBulkImportKeywords,
} from '@/hooks/useKeywords'
import {
  useClusters,
  useClusterStats,
  useCreateCluster,
  useUpdateCluster,
  useDeleteCluster,
} from '@/hooks/useClusters'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Icons
import {
  Search,
  Plus,
  Upload,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  Target,
  TrendingUp,
  Layers,
  Hash,
  FileText,
  Filter,
  FolderTree,
  ChevronRight,
  BarChart2,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// Intent colors and labels
const INTENT_CONFIG = {
  informational: { label: 'Informational', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  navigational: { label: 'Navigational', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  transactional: { label: 'Transactional', color: 'bg-green-50 text-green-700 border-green-200' },
  commercial: { label: 'Commercial', color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

// Difficulty colors
const getDifficultyColor = (score) => {
  if (score <= 30) return 'text-green-600 bg-green-50'
  if (score <= 60) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

const getDifficultyLabel = (score) => {
  if (score <= 30) return 'Easy'
  if (score <= 60) return 'Medium'
  return 'Hard'
}

export default function KeywordsAndClusters() {
  const [activeTab, setActiveTab] = useState('keywords')

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            Keywords & Clusters
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your keyword research and topic clusters for content strategy
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="keywords" className="gap-2">
              <Hash className="w-4 h-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="clusters" className="gap-2">
              <FolderTree className="w-4 h-4" />
              Clusters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="space-y-6 mt-6">
            <KeywordsTab />
          </TabsContent>

          <TabsContent value="clusters" className="space-y-6 mt-6">
            <ClustersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Keywords Tab Component
function KeywordsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCluster, setSelectedCluster] = useState('all')
  const [intentFilter, setIntentFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState(null)
  const [importText, setImportText] = useState('')
  const [formData, setFormData] = useState({
    keyword: '',
    search_volume: '',
    intent: '',
    difficulty_score: '',
    cluster_id: '',
  })

  // Hooks
  const { data: keywords = [], isLoading } = useKeywords({
    search: searchQuery || undefined,
    clusterId: selectedCluster !== 'all' ? selectedCluster : undefined,
  })
  const stats = useKeywordStats()
  const { data: clusters = [] } = useClusters()
  const createMutation = useCreateKeyword()
  const updateMutation = useUpdateKeyword()
  const deleteMutation = useDeleteKeyword()
  const bulkImportMutation = useBulkImportKeywords()

  // Filter keywords by intent
  const filteredKeywords = keywords.filter(kw => {
    if (intentFilter !== 'all' && kw.intent !== intentFilter) return false
    return true
  })

  // Handlers
  const handleAddKeyword = async (e) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync({
        keyword: formData.keyword,
        search_volume: formData.search_volume ? parseInt(formData.search_volume) : null,
        intent: formData.intent || null,
        difficulty_score: formData.difficulty_score ? parseInt(formData.difficulty_score) : null,
        cluster_id: formData.cluster_id || null,
      })
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating keyword:', error)
    }
  }

  const handleEditKeyword = async (e) => {
    e.preventDefault()
    if (!editingKeyword) return

    try {
      await updateMutation.mutateAsync({
        id: editingKeyword.id,
        updates: {
          keyword: formData.keyword,
          search_volume: formData.search_volume ? parseInt(formData.search_volume) : null,
          intent: formData.intent || null,
          difficulty_score: formData.difficulty_score ? parseInt(formData.difficulty_score) : null,
          cluster_id: formData.cluster_id || null,
        },
      })
      setIsEditDialogOpen(false)
      setEditingKeyword(null)
      resetForm()
    } catch (error) {
      console.error('Error updating keyword:', error)
    }
  }

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm('Are you sure you want to delete this keyword?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting keyword:', error)
    }
  }

  const handleBulkImport = async () => {
    if (!importText.trim()) return

    try {
      // Parse format: keyword, search_volume, intent, difficulty
      const lines = importText.trim().split('\n')
      const keywordsToImport = lines
        .map(line => {
          const parts = line.split(/[,\t]/).map(p => p.trim())
          if (!parts[0]) return null
          return {
            keyword: parts[0],
            search_volume: parts[1] ? parseInt(parts[1]) : null,
            intent: parts[2] || null,
            difficulty_score: parts[3] ? parseInt(parts[3]) : null,
          }
        })
        .filter(Boolean)

      if (keywordsToImport.length === 0) {
        alert('No valid keywords found in import data')
        return
      }

      await bulkImportMutation.mutateAsync(keywordsToImport)
      setIsImportDialogOpen(false)
      setImportText('')
    } catch (error) {
      console.error('Error importing keywords:', error)
    }
  }

  const handleExport = () => {
    const csvContent = keywords
      .map(k => `${k.keyword},${k.search_volume || ''},${k.intent || ''},${k.difficulty_score || ''}`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `keywords-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openEditDialog = (keyword) => {
    setEditingKeyword(keyword)
    setFormData({
      keyword: keyword.keyword,
      search_volume: keyword.search_volume?.toString() || '',
      intent: keyword.intent || '',
      difficulty_score: keyword.difficulty_score?.toString() || '',
      cluster_id: keyword.cluster_id || '',
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      keyword: '',
      search_volume: '',
      intent: '',
      difficulty_score: '',
      cluster_id: '',
    })
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Hash className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{stats.target}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ranking</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ranked}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <BarChart2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Position</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgPosition || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cluster Filter */}
            <Select value={selectedCluster} onValueChange={setSelectedCluster}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Clusters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clusters</SelectItem>
                {clusters.map(cluster => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Intent Filter */}
            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intents</SelectItem>
                {Object.entries(INTENT_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Keyword
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="p-12 text-center">
              <Hash className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No keywords found
              </h3>
              <p className="text-gray-500 mb-4">
                Start building your keyword research database
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Keyword
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Keyword</th>
                    <th className="text-left p-4 font-medium text-gray-600">Volume</th>
                    <th className="text-left p-4 font-medium text-gray-600">Intent</th>
                    <th className="text-left p-4 font-medium text-gray-600">Difficulty</th>
                    <th className="text-left p-4 font-medium text-gray-600">Cluster</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <AnimatePresence>
                    {filteredKeywords.map((keyword, index) => (
                      <motion.tr
                        key={keyword.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <span className="font-medium text-gray-900">{keyword.keyword}</span>
                        </td>
                        <td className="p-4">
                          {keyword.search_volume ? (
                            <span className="text-gray-600">
                              {keyword.search_volume.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {keyword.intent ? (
                            <Badge
                              variant="outline"
                              className={INTENT_CONFIG[keyword.intent]?.color || ''}
                            >
                              {INTENT_CONFIG[keyword.intent]?.label || keyword.intent}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {keyword.difficulty_score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(keyword.difficulty_score)}`}>
                                {keyword.difficulty_score}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getDifficultyLabel(keyword.difficulty_score)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {keyword.clusters?.name ? (
                            <Badge variant="secondary">
                              {keyword.clusters.name}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(keyword)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteKeyword(keyword.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Keyword Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Keyword</DialogTitle>
            <DialogDescription>
              Add a new keyword to your research database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddKeyword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword *</Label>
                <Input
                  id="keyword"
                  placeholder="Enter keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search_volume">Search Volume</Label>
                  <Input
                    id="search_volume"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.search_volume}
                    onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty (0-100)</Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 45"
                    value={formData.difficulty_score}
                    onChange={(e) => setFormData({ ...formData, difficulty_score: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intent">Search Intent</Label>
                <Select
                  value={formData.intent}
                  onValueChange={(value) => setFormData({ ...formData, intent: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTENT_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cluster">Cluster</Label>
                <Select
                  value={formData.cluster_id}
                  onValueChange={(value) => setFormData({ ...formData, cluster_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map(cluster => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Keyword'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Keyword Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
            <DialogDescription>
              Update keyword details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditKeyword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-keyword">Keyword *</Label>
                <Input
                  id="edit-keyword"
                  placeholder="Enter keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-search_volume">Search Volume</Label>
                  <Input
                    id="edit-search_volume"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.search_volume}
                    onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Difficulty (0-100)</Label>
                  <Input
                    id="edit-difficulty"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 45"
                    value={formData.difficulty_score}
                    onChange={(e) => setFormData({ ...formData, difficulty_score: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-intent">Search Intent</Label>
                <Select
                  value={formData.intent}
                  onValueChange={(value) => setFormData({ ...formData, intent: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTENT_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cluster">Cluster</Label>
                <Select
                  value={formData.cluster_id}
                  onValueChange={(value) => setFormData({ ...formData, cluster_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map(cluster => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Keywords</DialogTitle>
            <DialogDescription>
              Import keywords in CSV format: keyword, search_volume, intent, difficulty
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={`best running shoes,5400,commercial,65
how to run faster,2900,informational,35
nike running shoes,8100,navigational,85`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">Format Guide:</p>
              <p>keyword, search_volume, intent, difficulty</p>
              <p className="text-blue-600 mt-1">Intent: informational, navigational, transactional, commercial</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={!importText.trim() || bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import Keywords'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Clusters Tab Component
function ClustersTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_cluster_id: '',
  })

  // Hooks
  const { data: clusters = [], isLoading } = useClusters({
    search: searchQuery || undefined,
  })
  const stats = useClusterStats()
  const createMutation = useCreateCluster()
  const updateMutation = useUpdateCluster()
  const deleteMutation = useDeleteCluster()

  // Handlers
  const handleAddCluster = async (e) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        parent_cluster_id: formData.parent_cluster_id || null,
      })
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating cluster:', error)
    }
  }

  const handleEditCluster = async (e) => {
    e.preventDefault()
    if (!editingCluster) return

    try {
      await updateMutation.mutateAsync({
        id: editingCluster.id,
        updates: {
          name: formData.name,
          description: formData.description || null,
          parent_cluster_id: formData.parent_cluster_id || null,
        },
      })
      setIsEditDialogOpen(false)
      setEditingCluster(null)
      resetForm()
    } catch (error) {
      console.error('Error updating cluster:', error)
    }
  }

  const handleDeleteCluster = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cluster? Keywords will be unassigned.')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting cluster:', error)
    }
  }

  const openEditDialog = (cluster) => {
    setEditingCluster(cluster)
    setFormData({
      name: cluster.name,
      description: cluster.description || '',
      parent_cluster_id: cluster.parent_cluster_id || '',
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_cluster_id: '',
    })
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Clusters</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Clusters</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Hash className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKeywords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search clusters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Cluster
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clusters Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <FolderTree className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No clusters found
            </h3>
            <p className="text-gray-500 mb-4">
              Create topic clusters to organize your keywords and content
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Cluster
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {clusters.map((cluster, index) => (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-sm hover:shadow-md transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <Layers className="w-6 h-6 text-blue-600" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(cluster)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCluster(cluster.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {cluster.name}
                    </h3>

                    {cluster.description && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {cluster.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Hash className="w-4 h-4" />
                        <span>{cluster.keyword_count || 0} keywords</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span>{cluster.article_count || 0} articles</span>
                      </div>
                    </div>

                    {cluster.status && (
                      <div className="mt-4">
                        <Badge
                          variant="outline"
                          className={cluster.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {cluster.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Cluster Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create Cluster</DialogTitle>
            <DialogDescription>
              Create a new topic cluster to organize your keywords and content.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCluster}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Running & Fitness"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this topic cluster..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Cluster (optional)</Label>
                <Select
                  value={formData.parent_cluster_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_cluster_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map(cluster => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Cluster'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Cluster Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Cluster</DialogTitle>
            <DialogDescription>
              Update cluster details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCluster}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Running & Fitness"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe this topic cluster..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent">Parent Cluster</Label>
                <Select
                  value={formData.parent_cluster_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_cluster_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters
                      .filter(c => c.id !== editingCluster?.id)
                      .map(cluster => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
