import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useWordPressConnections,
  useCreateWordPressConnection,
  useUpdateWordPressConnection,
  useDeleteWordPressConnection,
  useTestWordPressConnection,
} from '@/hooks/useWordPress'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'

// Icons
import {
  Globe,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ExternalLink,
  Key,
  Loader2,
  Shield,
  Plug,
  Unplug,
  Eye,
  EyeOff,
} from 'lucide-react'

// Integration types
const INTEGRATION_TYPES = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Publish articles directly to your WordPress site',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600',
    available: true,
  },
]

const AUTH_TYPES = [
  { value: 'application_password', label: 'Application Password (Recommended)' },
  { value: 'basic_auth', label: 'Basic Auth' },
  { value: 'jwt', label: 'JWT Token' },
]

export default function Integrations() {
  // State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    site_url: '',
    auth_type: 'application_password',
    username: '',
    password: '',
    default_post_status: 'draft',
  })

  // Hooks
  const { data: connections = [], isLoading } = useWordPressConnections()
  const createMutation = useCreateWordPressConnection()
  const updateMutation = useUpdateWordPressConnection()
  const deleteMutation = useDeleteWordPressConnection()
  const testMutation = useTestWordPressConnection()

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault()
    setTestResult(null)

    try {
      // Clean up site URL
      let siteUrl = formData.site_url.trim()
      if (!siteUrl.startsWith('http')) {
        siteUrl = 'https://' + siteUrl
      }
      if (siteUrl.endsWith('/')) {
        siteUrl = siteUrl.slice(0, -1)
      }

      await createMutation.mutateAsync({
        ...formData,
        site_url: siteUrl,
        is_active: true,
      })

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingConnection) return
    setTestResult(null)

    try {
      let siteUrl = formData.site_url.trim()
      if (!siteUrl.startsWith('http')) {
        siteUrl = 'https://' + siteUrl
      }
      if (siteUrl.endsWith('/')) {
        siteUrl = siteUrl.slice(0, -1)
      }

      await updateMutation.mutateAsync({
        id: editingConnection.id,
        ...formData,
        site_url: siteUrl,
      })

      setIsEditDialogOpen(false)
      setEditingConnection(null)
      resetForm()
    } catch (error) {
      console.error('Error updating connection:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting connection:', error)
    }
  }

  const handleTest = async (connection) => {
    setTestResult(null)
    try {
      const result = await testMutation.mutateAsync(connection)
      setTestResult({ success: true, message: result.message, connectionId: connection.id })
    } catch (error) {
      setTestResult({ success: false, message: error.message, connectionId: connection.id })
    }
  }

  const handleToggleActive = async (connection) => {
    try {
      await updateMutation.mutateAsync({
        id: connection.id,
        is_active: !connection.is_active,
      })
    } catch (error) {
      console.error('Error toggling connection:', error)
    }
  }

  const openEditDialog = (connection) => {
    setEditingConnection(connection)
    setFormData({
      name: connection.name,
      site_url: connection.site_url,
      auth_type: connection.auth_type,
      username: connection.username || '',
      password: connection.password || '',
      default_post_status: connection.default_post_status || 'draft',
    })
    setTestResult(null)
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      site_url: '',
      auth_type: 'application_password',
      username: '',
      password: '',
      default_post_status: 'draft',
    })
    setShowPassword(false)
    setTestResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            WordPress
          </h1>
          <p className="text-gray-600 text-lg">
            Connect your WordPress sites for direct publishing
          </p>
        </motion.div>

        {/* Available Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INTEGRATION_TYPES.map((integration, index) => {
            const Icon = integration.icon
            const connectionCount = integration.id === 'wordpress'
              ? connections.filter(c => c.is_active).length
              : 0

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-none shadow-sm h-full ${!integration.available ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${integration.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {integration.available ? (
                        connectionCount > 0 ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            {connectionCount} connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not connected</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Coming soon</Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {integration.description}
                    </p>
                    {integration.available && (
                      <Button
                        className="w-full mt-4"
                        variant={connectionCount > 0 ? 'outline' : 'default'}
                        onClick={() => {
                          resetForm()
                          setIsAddDialogOpen(true)
                        }}
                      >
                        {connectionCount > 0 ? 'Add Another' : 'Connect'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* WordPress Connections */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>WordPress Connections</CardTitle>
                <CardDescription>
                  Manage your WordPress site connections for direct publishing
                </CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setIsAddDialogOpen(true) }} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No connections yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Add your first WordPress connection to start publishing
                </p>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true) }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add WordPress Connection
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {connections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${connection.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
                            {connection.is_active ? (
                              <Plug className="w-5 h-5 text-green-600" />
                            ) : (
                              <Unplug className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {connection.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={connection.is_active
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-gray-100 text-gray-600'
                                }
                              >
                                {connection.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <a
                              href={connection.site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {connection.site_url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Key className="w-3 h-3" />
                                {AUTH_TYPES.find(a => a.value === connection.auth_type)?.label || connection.auth_type}
                              </span>
                              <span>
                                Default: {connection.default_post_status}
                              </span>
                              {connection.last_test_at && (
                                <span className="flex items-center gap-1">
                                  {connection.last_test_success ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  Tested {format(new Date(connection.last_test_at), 'MMM d')}
                                </span>
                              )}
                            </div>

                            {/* Test Result */}
                            {testResult && testResult.connectionId === connection.id && (
                              <div className={`mt-3 p-2 rounded text-sm ${
                                testResult.success
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {testResult.success ? (
                                  <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {testResult.message}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    {testResult.message}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTest(connection)}
                            disabled={testMutation.isPending}
                            className="gap-2"
                          >
                            {testMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-4 h-4" />
                            )}
                            Test
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(connection)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(connection)}>
                                {connection.is_active ? (
                                  <>
                                    <Unplug className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Plug className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(connection.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Credentials are stored securely in your Supabase database. For production use,
            we recommend using WordPress Application Passwords instead of your account password.
            <a
              href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 hover:underline"
            >
              Learn more
            </a>
          </AlertDescription>
        </Alert>
      </div>

      {/* Add Connection Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add WordPress Connection</DialogTitle>
            <DialogDescription>
              Connect your WordPress site to publish articles directly
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name *</Label>
                <Input
                  id="name"
                  placeholder="My WordPress Site"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_url">Site URL *</Label>
                <Input
                  id="site_url"
                  placeholder="https://example.com"
                  value={formData.site_url}
                  onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter your WordPress site URL (without trailing slash)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth_type">Authentication Type</Label>
                <Select
                  value={formData.auth_type}
                  onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {formData.auth_type === 'application_password' ? 'Application Password' : 'Password'} *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={formData.auth_type === 'application_password' ? 'xxxx xxxx xxxx xxxx' : '••••••••'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_status">Default Post Status</Label>
                <Select
                  value={formData.default_post_status}
                  onValueChange={(value) => setFormData({ ...formData, default_post_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Connection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Connection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit WordPress Connection</DialogTitle>
            <DialogDescription>
              Update your WordPress connection settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Connection Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="My WordPress Site"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-site_url">Site URL *</Label>
                <Input
                  id="edit-site_url"
                  placeholder="https://example.com"
                  value={formData.site_url}
                  onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-auth_type">Authentication Type</Label>
                <Select
                  value={formData.auth_type}
                  onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  {formData.auth_type === 'application_password' ? 'Application Password' : 'Password'} *
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-default_status">Default Post Status</Label>
                <Select
                  value={formData.default_post_status}
                  onValueChange={(value) => setFormData({ ...formData, default_post_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Publish</SelectItem>
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
    </div>
  )
}
