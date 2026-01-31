import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  History,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Tag,
  GitCommit,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CHANGELOG, CURRENT_VERSION } from '@/data/changelog'

// Change type configuration
const CHANGE_TYPE_CONFIG = {
  fix: {
    label: 'Fix',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeVariant: 'outline',
    badgeClass: 'border-amber-300 text-amber-700 bg-amber-50',
  },
  feature: {
    label: 'New',
    icon: Sparkles,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badgeVariant: 'outline',
    badgeClass: 'border-green-300 text-green-700 bg-green-50',
  },
  improvement: {
    label: 'Improved',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeVariant: 'outline',
    badgeClass: 'border-blue-300 text-blue-700 bg-blue-50',
  },
  breaking: {
    label: 'Breaking',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeVariant: 'outline',
    badgeClass: 'border-red-300 text-red-700 bg-red-50',
  },
}

// Release type badge styling
const RELEASE_TYPE_CONFIG = {
  major: { label: 'Major', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  minor: { label: 'Minor', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  patch: { label: 'Patch', class: 'bg-gray-100 text-gray-800 border-gray-200' },
  hotfix: { label: 'Hotfix', class: 'bg-orange-100 text-orange-800 border-orange-200' },
}

function ChangeItem({ change, index }) {
  const config = CHANGE_TYPE_CONFIG[change.type] || CHANGE_TYPE_CONFIG.improvement
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}
    >
      <div className={`mt-0.5 ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-700">{change.description}</p>
      </div>
    </motion.div>
  )
}

function ReleaseCard({ release, index, isLatest }) {
  const releaseTypeConfig = RELEASE_TYPE_CONFIG[release.type] || RELEASE_TYPE_CONFIG.patch

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 -z-10" />

      {/* Timeline dot */}
      <div className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 ${
        isLatest ? 'bg-green-500 border-green-200' : 'bg-gray-400 border-gray-200'
      }`} />

      <Card className={`ml-12 mb-6 ${isLatest ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-gray-500" />
              <span className="font-mono font-bold text-lg text-gray-900">
                v{release.version}
              </span>
            </div>

            {isLatest && (
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Current
              </Badge>
            )}

            <Badge variant="outline" className={releaseTypeConfig.class}>
              {releaseTypeConfig.label} Release
            </Badge>

            <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
              <Calendar className="w-4 h-4" />
              {release.date}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {release.title}
          </h3>

          {/* Changes */}
          <div className="space-y-2">
            {release.changes.map((change, changeIndex) => (
              <ChangeItem key={changeIndex} change={change} index={changeIndex} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ReleaseHistory() {
  // Group releases by month/year for potential future filtering
  const totalChanges = CHANGELOG.reduce((sum, release) => sum + release.changes.length, 0)
  const totalFixes = CHANGELOG.reduce(
    (sum, release) => sum + release.changes.filter(c => c.type === 'fix').length,
    0
  )
  const totalFeatures = CHANGELOG.reduce(
    (sum, release) => sum + release.changes.filter(c => c.type === 'feature').length,
    0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Release History</h1>
              <p className="text-gray-500">
                Bug fixes, features, and improvements to Perdia Content Engine
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{CHANGELOG.length}</div>
                <div className="text-sm text-gray-500">Releases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{totalFeatures}</div>
                <div className="text-sm text-gray-500">New Features</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{totalFixes}</div>
                <div className="text-sm text-gray-500">Bug Fixes</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Current Version Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl p-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <span className="font-semibold text-green-800">
                You're on the latest version
              </span>
              <span className="text-green-600 ml-2">v{CURRENT_VERSION}</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {CHANGELOG.map((release, index) => (
            <ReleaseCard
              key={release.version}
              release={release}
              index={index}
              isLatest={index === 0}
            />
          ))}

          {/* End of timeline marker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: CHANGELOG.length * 0.1 }}
            className="ml-12 pt-4 pb-8 text-center text-gray-400"
          >
            <div className="absolute left-4 w-5 h-5 rounded-full bg-gray-200 border-4 border-gray-100" />
            <p className="text-sm">Beginning of changelog</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
