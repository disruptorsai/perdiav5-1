import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useTrainingData,
  useTrainingStats,
  useUpdateTrainingData,
  useDeleteTrainingData,
  useMarkTrainingApplied,
  useBulkApplyTraining,
} from '@/hooks/useTrainingData'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Progress } from '@/components/ui/progress'

// Icons
import {
  Brain,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Trash2,
  Eye,
  Zap,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  RefreshCcw,
  CheckCheck,
  ArrowRight,
  Sparkles,
  Lightbulb,
  FileText,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// Status configurations
const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  applied: { label: 'Applied', icon: Zap, color: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function AITraining() {
  // State
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [viewingItem, setViewingItem] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Hooks
  const { data: trainingData = [], isLoading } = useTrainingData({
    status: activeTab !== 'all' ? activeTab : undefined,
  })
  const stats = useTrainingStats()

  // Mutations
  const updateMutation = useUpdateTrainingData()
  const deleteMutation = useDeleteTrainingData()
  const markAppliedMutation = useMarkTrainingApplied()
  const bulkApplyMutation = useBulkApplyTraining()

  // Filter by search
  const filteredData = trainingData.filter(item => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      item.patterns_learned?.some(p => p.toLowerCase().includes(searchLower)) ||
      item.feedback_items?.some(f => f.comment?.toLowerCase().includes(searchLower))
    )
  })

  // Handlers
  const handleApprove = async (id) => {
    try {
      await updateMutation.mutateAsync({
        id,
        updates: { status: 'approved' },
      })
    } catch (error) {
      console.error('Error approving:', error)
    }
  }

  const handleReject = async (id) => {
    try {
      await updateMutation.mutateAsync({
        id,
        updates: { status: 'rejected' },
      })
    } catch (error) {
      console.error('Error rejecting:', error)
    }
  }

  const handleApply = async (id) => {
    try {
      await markAppliedMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error applying:', error)
    }
  }

  const handleBulkApply = async () => {
    if (selectedItems.length === 0) return
    try {
      await bulkApplyMutation.mutateAsync(selectedItems)
      setSelectedItems([])
    } catch (error) {
      console.error('Error bulk applying:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training data?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredData.map(d => d.id))
    }
  }

  const openViewDialog = (item) => {
    setViewingItem(item)
    setIsViewDialogOpen(true)
  }

  // Get status counts
  const statusCounts = {
    pending: trainingData.filter(d => d.status === 'pending').length,
    approved: trainingData.filter(d => d.status === 'approved').length,
    applied: trainingData.filter(d => d.status === 'applied').length,
    rejected: trainingData.filter(d => d.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            AI Training
          </h1>
          <p className="text-gray-600 text-lg">
            Learn from editorial feedback to continuously improve content quality
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Learnings</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Applied</p>
                  <p className="text-xl font-bold text-gray-900">{stats.applied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Impact</p>
                  <p className="text-xl font-bold text-gray-900">{stats.avgImpactScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pattern Types</p>
                  <p className="text-xl font-bold text-gray-900">{stats.patternTypes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="border-none shadow-sm bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">How AI Training Works</h3>
                <p className="text-gray-600 text-sm">
                  When you review and edit articles, the system captures patterns from your feedback.
                  These patterns are then used to improve future content generation, reducing the need
                  for similar corrections over time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Data Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedItems([]) }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending
                {statusCounts.pending > 0 && (
                  <Badge variant="secondary" className="ml-1">{statusCounts.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="applied" className="gap-2">
                <Zap className="w-4 h-4" />
                Applied
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="w-4 h-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              {selectedItems.length > 0 && activeTab === 'approved' && (
                <Button
                  onClick={handleBulkApply}
                  className="gap-2"
                  disabled={bulkApplyMutation.isPending}
                >
                  <CheckCheck className="w-4 h-4" />
                  Apply Selected ({selectedItems.length})
                </Button>
              )}
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-12 text-center">
                  <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No training data found
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'pending'
                      ? 'No pending learnings to review'
                      : `No ${activeTab} training data available`}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Select All Header */}
                  {(activeTab === 'approved' || activeTab === 'pending') && filteredData.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === filteredData.length}
                          onChange={selectAll}
                          className="rounded border-gray-300"
                        />
                        Select all ({filteredData.length})
                      </label>
                    </div>
                  )}

                  <AnimatePresence>
                    {filteredData.map((item, index) => {
                      const statusConfig = STATUS_CONFIG[item.status]

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            {(activeTab === 'approved' || activeTab === 'pending') && (
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                className="mt-1 rounded border-gray-300"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className={statusConfig.color}>
                                    {statusConfig.label}
                                  </Badge>
                                  {item.impact_score && (
                                    <Badge variant="secondary" className="gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {item.impact_score}% impact
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openViewDialog(item)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {item.status === 'pending' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleReject(item.id)}>
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {item.status === 'approved' && (
                                      <DropdownMenuItem onClick={() => handleApply(item.id)}>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Apply to System
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(item.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Patterns Learned */}
                              {item.patterns_learned && item.patterns_learned.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1.5">Patterns Learned:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.patterns_learned.slice(0, 4).map((pattern, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
                                      >
                                        <Lightbulb className="w-3 h-3" />
                                        {pattern}
                                      </span>
                                    ))}
                                    {item.patterns_learned.length > 4 && (
                                      <span className="text-xs text-gray-500">
                                        +{item.patterns_learned.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Feedback Summary */}
                              {item.feedback_items && item.feedback_items.length > 0 && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-2">
                                    Based on {item.feedback_items.length} feedback item{item.feedback_items.length > 1 ? 's' : ''}:
                                  </p>
                                  <p className="text-sm text-gray-700 line-clamp-2">
                                    {item.feedback_items[0]?.comment || 'No comment'}
                                  </p>
                                </div>
                              )}

                              {/* Action Buttons for Pending */}
                              {item.status === 'pending' && (
                                <div className="flex items-center gap-2 mt-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(item.id)}
                                    className="gap-2"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(item.id)}
                                    className="gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {/* Apply Button for Approved */}
                              {item.status === 'approved' && (
                                <div className="mt-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApply(item.id)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Zap className="w-4 h-4" />
                                    Apply to System
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>

        {/* Results Count */}
        {!isLoading && filteredData.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Showing {filteredData.length} training item{filteredData.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Training Data Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Status and Impact */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={STATUS_CONFIG[viewingItem.status]?.color}>
                  {STATUS_CONFIG[viewingItem.status]?.label}
                </Badge>
                {viewingItem.impact_score && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Impact Score:</span>
                    <Progress value={viewingItem.impact_score} className="w-24 h-2" />
                    <span className="text-sm font-medium">{viewingItem.impact_score}%</span>
                  </div>
                )}
              </div>

              {/* Patterns Learned */}
              {viewingItem.patterns_learned && viewingItem.patterns_learned.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Patterns Learned</h4>
                  <div className="space-y-2">
                    {viewingItem.patterns_learned.map((pattern, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg"
                      >
                        <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5" />
                        <span className="text-sm text-purple-800">{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Items */}
              {viewingItem.feedback_items && viewingItem.feedback_items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Original Feedback</h4>
                  <div className="space-y-3">
                    {viewingItem.feedback_items.map((feedback, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {feedback.category && (
                            <Badge variant="secondary" className="text-xs">
                              {feedback.category}
                            </Badge>
                          )}
                          {feedback.severity && (
                            <Badge
                              variant="outline"
                              className={
                                feedback.severity === 'critical' ? 'text-red-600' :
                                feedback.severity === 'major' ? 'text-orange-600' :
                                'text-gray-600'
                              }
                            >
                              {feedback.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before/After Comparison */}
              {(viewingItem.original_content || viewingItem.revised_content) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingItem.original_content && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Original</p>
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-gray-700 line-clamp-6">
                          {viewingItem.original_content}
                        </div>
                      </div>
                    )}
                    {viewingItem.revised_content && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Revised</p>
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700 line-clamp-6">
                          {viewingItem.revised_content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 pt-4 border-t text-sm text-gray-500">
                <span>Created: {format(new Date(viewingItem.created_at), 'MMM d, yyyy h:mm a')}</span>
                {viewingItem.applied_at && (
                  <span>Applied: {format(new Date(viewingItem.applied_at), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
