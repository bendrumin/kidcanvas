'use client'

import { useState } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Search, SlidersHorizontal, X, Menu, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Child } from '@/lib/supabase/types'

interface GalleryFiltersProps {
  children: Child[]
}

export function GalleryFilters({ children }: GalleryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
    setIsSheetOpen(false)
  }

  const hasFilters = currentChild !== 'all' || currentSearch || showFavorites

  // Filter controls component (reusable for both mobile and desktop)
  const FilterControls = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-4">
      {/* Child Filter */}
      <div className="space-y-2">
        <label htmlFor="child-filter" className="text-sm font-medium">Filter by Child</label>
        <Select
          value={currentChild}
          onValueChange={(value) => {
            updateParams('child', value)
            onClose?.()
          }}
        >
          <SelectTrigger id="child-filter" className="w-full">
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

      {/* Sort */}
      <div className="space-y-2">
        <label htmlFor="sort-filter" className="text-sm font-medium">Sort By</label>
        <Select
          value={currentSort}
          onValueChange={(value) => {
            updateParams('sort', value)
            onClose?.()
          }}
        >
          <SelectTrigger id="sort-filter" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">By title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Favorites Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Show Only</label>
        <Button
          variant={showFavorites ? 'default' : 'outline'}
          className={cn(
            'w-full justify-start',
            showFavorites && 'bg-crayon-red hover:bg-crayon-red/90'
          )}
          onClick={() => {
            updateParams('favorites', showFavorites ? '' : 'true')
            onClose?.()
          }}
        >
          <Heart className={cn('w-4 h-4', showFavorites ? 'fill-current' : 'opacity-60')} />
          <span className="ml-2">Favorites Only</span>
        </Button>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
      {/* Search - Always visible */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by title, tags, or AI description..."
          value={currentSearch}
          onChange={(e) => updateParams('search', e.target.value)}
          className="pl-9 transition-all focus:ring-2 focus:ring-primary text-sm sm:text-base"
          aria-label="Search artwork by title, artist, tags, or AI description"
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

      {/* Mobile: Hamburger Menu */}
      <div className="sm:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Menu className="w-4 h-4 mr-2" />
              Filters
              {hasFilters && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {[
                    currentChild !== 'all' ? 1 : 0,
                    showFavorites ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Filter & Sort</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls onClose={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Inline Filters */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Child Filter */}
        <Select value={currentChild} onValueChange={(value) => updateParams('child', value)}>
          <SelectTrigger className="w-[160px]">
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
          className={cn(
            showFavorites && 'bg-crayon-red hover:bg-crayon-red/90 shadow-md hover:shadow-lg transition-all'
          )}
        >
          <Heart className={cn('w-4 h-4', showFavorites ? 'fill-current' : 'opacity-60')} />
          <span className="ml-1.5">Favorites</span>
        </Button>

        {/* Clear Filters */}
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

