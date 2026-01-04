'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Calendar,
  Heart,
  Sparkles,
  Palette,
  Clock,
  User,
} from 'lucide-react'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { formatAgeMonths } from '@/lib/timeline-utils'

interface AnalyticsDashboardProps {
  artworks: ArtworkWithChild[]
  children: Child[]
  selectedChildId?: string
}

export function AnalyticsDashboard({
  artworks,
  children,
  selectedChildId,
}: AnalyticsDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter artworks by selected child
  const filteredArtworks = useMemo(() => {
    if (selectedChildId && selectedChildId !== 'all') {
      return artworks.filter(a => a.child_id === selectedChildId)
    }
    return artworks
  }, [artworks, selectedChildId])

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/analytics?${params.toString()}`)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalArtworks = filteredArtworks.length
    const favorites = filteredArtworks.filter(a => a.is_favorite).length
    const withAIDescription = filteredArtworks.filter(a => a.ai_description).length
    
    // Most productive month
    const monthCounts = new Map<number, number>()
    filteredArtworks.forEach(artwork => {
      const date = new Date(artwork.created_date)
      const month = date.getMonth()
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1)
    })
    const mostProductiveMonth = Array.from(monthCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]
    
    // Artworks per child
    const childCounts = new Map<string, number>()
    filteredArtworks.forEach(artwork => {
      const childId = artwork.child_id
      childCounts.set(childId, (childCounts.get(childId) || 0) + 1)
    })

    // Average age
    const ages = filteredArtworks
      .map(a => a.child_age_months)
      .filter((age): age is number => age !== null)
    const avgAge = ages.length > 0
      ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
      : null

    return {
      totalArtworks,
      favorites,
      withAIDescription,
      mostProductiveMonth,
      childCounts,
      avgAge,
    }
  }, [filteredArtworks])

  // Monthly artwork data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthMap = new Map<string, number>()
    
    filteredArtworks.forEach(artwork => {
      const date = new Date(artwork.created_date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
    })

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        const [year, month] = key.split('-')
        return {
          month: `${months[parseInt(month)]} ${year}`,
          count,
        }
      })
      .slice(-12) // Last 12 months
  }, [filteredArtworks])

  // Artworks by child
  const childData = useMemo(() => {
    const childCounts = new Map<string, number>()
    filteredArtworks.forEach(artwork => {
      const childName = artwork.child?.name || 'Unknown'
      childCounts.set(childName, (childCounts.get(childName) || 0) + 1)
    })

    return Array.from(childCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }))
  }, [filteredArtworks])

  // Age distribution
  const ageDistribution = useMemo(() => {
    const ranges = [
      { label: '0-2 years', min: 0, max: 24 },
      { label: '2-4 years', min: 24, max: 48 },
      { label: '4-6 years', min: 48, max: 72 },
      { label: '6-8 years', min: 72, max: 96 },
      { label: '8+ years', min: 96, max: Infinity },
    ]

    const distribution = ranges.map(range => ({
      label: range.label,
      count: filteredArtworks.filter(a => {
        const age = a.child_age_months
        return age !== null && age >= range.min && age < range.max
      }).length,
    }))

    return distribution.filter(d => d.count > 0)
  }, [filteredArtworks])

  // Color palette for charts
  const COLORS = ['#E91E63', '#9C27B0', '#3F51B5', '#009688', '#FF9800', '#F44336']

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Child
            </label>
            <Select
              value={selectedChildId || 'all'}
              onValueChange={(value) => updateParams('child', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Total Artworks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalArtworks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedChildId && selectedChildId !== 'all' 
                ? 'in this collection' 
                : 'in your gallery'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.favorites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalArtworks > 0 
                ? `${Math.round((stats.favorites / stats.totalArtworks) * 100)}% of total`
                : 'starred pieces'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Palette className="w-4 h-4" />
              AI Tagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.withAIDescription}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalArtworks > 0
                ? `${Math.round((stats.withAIDescription / stats.totalArtworks) * 100)}% auto-tagged`
                : 'with descriptions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.avgAge !== null ? formatAgeMonths(stats.avgAge) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              when created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Artwork Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#E91E63" 
                  strokeWidth={2}
                  dot={{ fill: '#E91E63', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Artworks by Child */}
        {childData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Artworks by Child</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={childData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {childData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Age Distribution */}
        {ageDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#E91E63" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Most Productive Month */}
      {stats.mostProductiveMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Most Productive Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-foreground mb-2">
                {monthNames[stats.mostProductiveMonth[0]]}
              </div>
              <p className="text-muted-foreground">
                {stats.mostProductiveMonth[1]} artwork{stats.mostProductiveMonth[1] !== 1 ? 's' : ''} created
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

