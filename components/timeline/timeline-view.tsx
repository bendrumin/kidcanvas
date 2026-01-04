'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import {
  createTimelineData,
  getAgeRanges,
  filterArtworksByAgeRange,
  formatAgeMonths,
  type AgeRange,
} from '@/lib/timeline-utils'

interface TimelineViewProps {
  artworks: ArtworkWithChild[]
  children: Child[]
  selectedChildId?: string
  selectedAgeRange?: string
}

export function TimelineView({
  artworks,
  children,
  selectedChildId,
  selectedAgeRange,
}: TimelineViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get selected child
  const selectedChild = selectedChildId
    ? children.find(c => c.id === selectedChildId)
    : undefined

  // Parse age range filter
  const ageRangeFilter = useMemo(() => {
    if (!selectedAgeRange || selectedAgeRange === 'all') return undefined
    const [min, max] = selectedAgeRange.split('-').map(Number)
    return { minMonths: min, maxMonths: max }
  }, [selectedAgeRange])

  // Filter artworks by age range if specified
  const filteredArtworks = useMemo(() => {
    let filtered = artworks
    if (selectedChildId && selectedChildId !== 'all') {
      filtered = filtered.filter(a => a.child_id === selectedChildId)
    }
    if (ageRangeFilter) {
      filtered = filterArtworksByAgeRange(
        filtered,
        ageRangeFilter.minMonths,
        ageRangeFilter.maxMonths
      )
    }
    return filtered
  }, [artworks, selectedChildId, ageRangeFilter])

  // Create timeline data
  const timelineData = useMemo(() => {
    return createTimelineData(filteredArtworks, selectedChild)
  }, [filteredArtworks, selectedChild])

  // Get age ranges for filter
  const ageRanges = useMemo(() => {
    return getAgeRanges(artworks)
  }, [artworks])

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/timeline?${params.toString()}`)
  }

  // Group artworks by age (rounded to nearest 3 months for cleaner grouping)
  const groupedArtworks = useMemo(() => {
    const groups = new Map<number, ArtworkWithChild[]>()
    
    timelineData.timelineArtworks.forEach(({ artwork, ageMonths }) => {
      // Round to nearest 3 months for grouping
      const groupAge = Math.floor(ageMonths / 3) * 3
      if (!groups.has(groupAge)) {
        groups.set(groupAge, [])
      }
      groups.get(groupAge)!.push(artwork)
    })
    
    return Array.from(groups.entries())
      .map(([age, arts]) => ({
        ageMonths: age,
        ageLabel: formatAgeMonths(age),
        artworks: arts.sort((a, b) => {
          const aAge = a.child_age_months || 0
          const bAge = b.child_age_months || 0
          return aAge - bAge
        }),
      }))
      .sort((a, b) => a.ageMonths - b.ageMonths)
  }, [timelineData.timelineArtworks])

  // Stats
  const stats = useMemo(() => {
    if (timelineData.timelineArtworks.length === 0) return null
    
    const ageSpan = timelineData.maxAge - timelineData.minAge
    const ageSpanYears = (ageSpan / 12).toFixed(1)
    const totalArtworks = timelineData.timelineArtworks.length
    const avgPerMonth = (totalArtworks / Math.max(1, ageSpan)).toFixed(1)
    
    return {
      ageSpan: ageSpanYears,
      totalArtworks,
      avgPerMonth,
      milestones: timelineData.milestones.length,
    }
  }, [timelineData])

  if (timelineData.timelineArtworks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No artwork found
        </h3>
        <p className="text-muted-foreground mb-6">
          {selectedChildId && selectedChildId !== 'all'
            ? 'Try selecting a different child or age range.'
            : 'Upload artwork to see the timeline.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Child Filter */}
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

          {/* Age Range Filter */}
          {ageRanges.length > 0 && (
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Age Range
              </label>
              <Select
                value={selectedAgeRange || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    updateParams('ageRange', '')
                  } else {
                    const range = ageRanges.find(r => r.label === value)
                    if (range) {
                      updateParams('ageRange', `${range.minMonths}-${range.maxMonths}`)
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((range) => (
                    <SelectItem key={range.label} value={range.label}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Time Span</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.ageSpan} years</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Total Artworks</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalArtworks}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Per Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgPerMonth}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Milestones</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.milestones}</p>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          {selectedChild ? `${selectedChild.name}'s` : 'Art'} Growth Timeline
        </h2>

        {/* Visual Timeline */}
        <div className="relative mb-8">
          {/* Timeline Line */}
          <div className="absolute left-0 right-0 top-8 h-1 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 dark:from-pink-800 dark:via-purple-800 dark:to-blue-800 rounded-full" />
          
          {/* Milestones */}
          {timelineData.milestones.map((milestone) => {
            const position = ((milestone.ageMonths - timelineData.minAge) / 
              (timelineData.maxAge - timelineData.minAge)) * 100
            
            return (
              <div
                key={`${milestone.type}-${milestone.ageMonths}`}
                className="absolute top-4 transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className={cn(
                  'w-3 h-3 rounded-full border-2 border-background',
                  milestone.type === 'birthday' 
                    ? 'bg-pink-500 dark:bg-pink-400' 
                    : 'bg-purple-400 dark:bg-purple-500'
                )} />
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap mt-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {milestone.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Artwork Groups by Age */}
        <div className="space-y-8">
          {groupedArtworks.map((group) => (
            <div key={group.ageMonths} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {group.ageLabel}
                  </h3>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {group.artworks.length} artwork{group.artworks.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.artworks.map((artwork) => (
                  <Link
                    key={artwork.id}
                    href={`/dashboard/artwork/${artwork.id}`}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-all group-hover:shadow-lg">
                      <Image
                        src={artwork.thumbnail_url || artwork.image_url}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                      {artwork.is_favorite && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-pink-500 text-white text-xs">
                            ❤️
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-white text-xs font-medium truncate">
                            {artwork.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

