import { useState, useMemo, useEffect } from 'react'
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { useArticles } from '@/hooks/useArticles'
import { useContentIdeas } from '@/hooks/useContentIdeas'
import { useContributors } from '@/hooks/useContributors'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Icons
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  RefreshCcw,
} from 'lucide-react'

// Colors for charts
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

const STATUS_COLORS = {
  idea: '#9ca3af',
  drafting: '#8b5cf6',
  refinement: '#f59e0b',
  qa_review: '#3b82f6',
  ready_to_publish: '#22c55e',
  published: '#059669',
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

// Animation configuration
const CHART_ANIMATION = {
  duration: 1200,
  easing: 'ease-out',
}

// Framer Motion variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  // Data hooks
  const { data: articles = [], isLoading: articlesLoading } = useArticles()
  const { data: ideas = [], isLoading: ideasLoading } = useContentIdeas()
  const { data: contributors = [] } = useContributors()

  // Calculate date range
  const daysAgo = parseInt(dateRange)
  const startDate = startOfDay(subDays(new Date(), daysAgo))

  // Filter articles by date range
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const createdAt = parseISO(a.created_at)
      return createdAt >= startDate
    })
  }, [articles, startDate])

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredArticles.length
    const published = filteredArticles.filter(a => a.status === 'published').length
    const inProgress = filteredArticles.filter(a =>
      ['drafting', 'refinement', 'qa_review'].includes(a.status)
    ).length
    const readyToPublish = filteredArticles.filter(a => a.status === 'ready_to_publish').length

    const avgQuality = total > 0
      ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / total)
      : 0

    const avgWordCount = total > 0
      ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.word_count || 0), 0) / total)
      : 0

    const totalWords = filteredArticles.reduce((sum, a) => sum + (a.word_count || 0), 0)

    // Calculate previous period for comparison
    const prevStartDate = subDays(startDate, daysAgo)
    const prevArticles = articles.filter(a => {
      const createdAt = parseISO(a.created_at)
      return createdAt >= prevStartDate && createdAt < startDate
    })
    const prevTotal = prevArticles.length

    const growth = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0

    return {
      total,
      published,
      inProgress,
      readyToPublish,
      avgQuality,
      avgWordCount,
      totalWords,
      growth,
      ideas: ideas.length,
      approvedIdeas: ideas.filter(i => i.status === 'approved').length,
    }
  }, [filteredArticles, articles, ideas, startDate, daysAgo])

  // Generate daily data for area chart
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() })

    return days.map(day => {
      const dayArticles = articles.filter(a => {
        const createdAt = parseISO(a.created_at)
        return format(createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })

      return {
        date: format(day, 'MMM d'),
        articles: dayArticles.length,
        words: dayArticles.reduce((sum, a) => sum + (a.word_count || 0), 0),
        quality: dayArticles.length > 0
          ? Math.round(dayArticles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / dayArticles.length)
          : 0,
      }
    })
  }, [articles, startDate])

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const statusCounts = filteredArticles.reduce((acc, article) => {
      acc[article.status] = (acc[article.status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
      color: STATUS_COLORS[status] || '#9ca3af',
    }))
  }, [filteredArticles])

  // Content type distribution
  const contentTypeData = useMemo(() => {
    const typeCounts = filteredArticles.reduce((acc, article) => {
      const type = article.content_type || 'unspecified'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' '),
        articles: count,
      }))
      .sort((a, b) => b.articles - a.articles)
  }, [filteredArticles])

  // Quality distribution
  const qualityDistribution = useMemo(() => {
    const ranges = [
      { name: '0-50', min: 0, max: 50 },
      { name: '51-70', min: 51, max: 70 },
      { name: '71-85', min: 71, max: 85 },
      { name: '86-100', min: 86, max: 100 },
    ]

    return ranges.map(range => ({
      name: range.name,
      count: filteredArticles.filter(a =>
        (a.quality_score || 0) >= range.min && (a.quality_score || 0) <= range.max
      ).length,
    }))
  }, [filteredArticles])

  // Contributor performance
  const contributorPerformance = useMemo(() => {
    const contributorStats = contributors.map(contributor => {
      const contributorArticles = filteredArticles.filter(a => a.contributor_id === contributor.id)
      return {
        name: contributor.name.split(' ')[0], // First name only for chart
        articles: contributorArticles.length,
        avgQuality: contributorArticles.length > 0
          ? Math.round(contributorArticles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / contributorArticles.length)
          : 0,
      }
    }).filter(c => c.articles > 0)
      .sort((a, b) => b.articles - a.articles)

    return contributorStats
  }, [contributors, filteredArticles])

  const isLoading = articlesLoading || ideasLoading

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
              Analytics
            </h1>
            <p className="text-gray-600 text-lg">
              Track your content production performance and trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Total Articles"
              value={metrics.total}
              icon={FileText}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              trend={metrics.growth}
              trendLabel="vs previous period"
              animate
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Published"
              value={metrics.published}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBg="bg-green-50"
              subtitle={`${metrics.readyToPublish} ready to publish`}
              animate
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Avg Quality Score"
              value={metrics.avgQuality}
              icon={Target}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
              suffix="%"
              trend={metrics.avgQuality >= 85 ? 5 : metrics.avgQuality >= 70 ? 0 : -5}
              animate
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Total Words"
              value={metrics.totalWords.toLocaleString()}
              icon={BarChart3}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
              subtitle={`${metrics.avgWordCount} avg per article`}
              animate
            />
          </motion.div>
        </motion.div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 rounded-xl">
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Content Ideas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.ideas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved Ideas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.approvedIdeas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Production Trend Chart */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Content Production Trend</CardTitle>
                <CardDescription>
                  Articles created and total words over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="articles"
                        name="Articles"
                        stroke={COLORS.primary}
                        fill="url(#colorArticles)"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={CHART_ANIMATION.duration}
                        animationEasing={CHART_ANIMATION.easing}
                        animationBegin={0}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="words"
                        name="Words"
                        stroke={COLORS.secondary}
                        fill="url(#colorWords)"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={CHART_ANIMATION.duration}
                        animationEasing={CHART_ANIMATION.easing}
                        animationBegin={200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status and Content Type Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>
                    Articles by workflow status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          isAnimationActive={true}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                          animationBegin={0}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Content Type Distribution */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Content Types</CardTitle>
                  <CardDescription>
                    Articles by content type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contentTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="#9ca3af"
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar
                          dataKey="articles"
                          fill={COLORS.primary}
                          radius={[0, 4, 4, 0]}
                          isAnimationActive={true}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                          animationBegin={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            {/* Quality Trend */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
                <CardDescription>
                  Average quality score over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData.filter(d => d.quality > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="quality"
                        name="Quality Score"
                        stroke={COLORS.success}
                        strokeWidth={3}
                        dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={CHART_ANIMATION.duration}
                        animationEasing={CHART_ANIMATION.easing}
                        animationBegin={0}
                      />
                      {/* Threshold line */}
                      <Line
                        type="monotone"
                        dataKey={() => 85}
                        name="Target (85)"
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={CHART_ANIMATION.duration}
                        animationEasing={CHART_ANIMATION.easing}
                        animationBegin={400}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>
                  Number of articles in each quality range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qualityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Articles"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={CHART_ANIMATION.duration}
                        animationEasing={CHART_ANIMATION.easing}
                        animationBegin={0}
                      >
                        {qualityDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 3 ? COLORS.success : index === 2 ? COLORS.primary : index === 1 ? COLORS.warning : COLORS.danger}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributors" className="space-y-6">
            {/* Contributor Performance */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Contributor Performance</CardTitle>
                <CardDescription>
                  Articles created by each contributor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contributorPerformance.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No contributor data available</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contributorPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="#9ca3af"
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="articles"
                          name="Articles"
                          fill={COLORS.primary}
                          radius={[0, 4, 4, 0]}
                          isAnimationActive={true}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                          animationBegin={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contributor Quality Comparison */}
            {contributorPerformance.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Quality by Contributor</CardTitle>
                  <CardDescription>
                    Average quality score per contributor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contributorPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar
                          dataKey="avgQuality"
                          name="Avg Quality"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                          animationBegin={0}
                        >
                          {contributorPerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.avgQuality >= 85 ? COLORS.success : entry.avgQuality >= 70 ? COLORS.warning : COLORS.danger}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Animated number component
function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    // Parse the value - handle strings with commas
    const numericValue = typeof value === 'string'
      ? parseInt(value.replace(/,/g, ''), 10) || 0
      : value || 0

    if (numericValue === 0) {
      setDisplayValue(0)
      return
    }

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (numericValue - startValue) * easeOut)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  // Format with commas
  return displayValue.toLocaleString()
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendLabel,
  subtitle,
  suffix = '',
  animate = false,
}) {
  const isPositive = trend > 0
  const isNeutral = trend === 0

  // Determine if value is a number that can be animated
  const numericValue = typeof value === 'string'
    ? parseInt(value.replace(/,/g, ''), 10)
    : value
  const canAnimate = animate && !isNaN(numericValue)

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {canAnimate ? (
                <>
                  <AnimatedNumber value={numericValue} duration={1200} />
                  {suffix}
                </>
              ) : (
                <>{value}{suffix}</>
              )}
            </p>
            {trend !== undefined && (
              <motion.div
                className="flex items-center mt-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                ) : isNeutral ? (
                  <span className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span className="text-gray-400 ml-1">{trendLabel}</span>
                )}
              </motion.div>
            )}
            {subtitle && (
              <motion.p
                className="text-sm text-gray-500 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          <motion.div
            className={`p-3 ${iconBg} rounded-xl`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
