'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Child } from '@/lib/supabase/types'

interface GalleryFiltersProps {
  children: Child[]
}

export function GalleryFilters({ children }: GalleryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentChild = searchParams.get('child') || 'all'
  const currentSort = searchParams.get('sort') || 'newest'
  const currentSearch = searchParams.get('search') || ''
  const showFavorites = searchParams.get('favorites') === 'true'

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/dashboard')
  }

  const hasFilters = currentChild !== 'all' || currentSearch || showFavorites

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search artwork..."
          value={currentSearch}
          onChange={(e) => updateParams('search', e.target.value)}
          className="pl-9 transition-all focus:ring-2 focus:ring-primary"
        />
        {currentSearch && (
          <button
            onClick={() => updateParams('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Child Filter */}
      <Select value={currentChild} onValueChange={(value) => updateParams('child', value)}>
        <SelectTrigger className="w-[180px]">
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

      {/* Sort */}
      <Select value={currentSort} onValueChange={(value) => updateParams('sort', value)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="title">By title</SelectItem>
        </SelectContent>
      </Select>

      {/* Favorites Toggle */}
      <Button
        variant={showFavorites ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateParams('favorites', showFavorites ? '' : 'true')}
        className={showFavorites ? 'bg-crayon-red hover:bg-crayon-red/90 shadow-md hover:shadow-lg transition-all' : 'transition-all'}
      >
        <span className={showFavorites ? '' : 'opacity-60'}>❤️</span> Favorites
      </Button>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

