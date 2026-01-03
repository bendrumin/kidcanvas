'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { ArtworkCounter } from './artwork-counter'
import { cn } from '@/lib/utils'

interface GalleryHeaderProps {
  initialCount: number
  canEdit?: boolean
}

export function GalleryHeader({ initialCount, canEdit = true }: GalleryHeaderProps) {
  // Use initialCount directly - this will be correct on server render
  const [count, setCount] = useState(initialCount)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Listen for custom events to update count (only on client)
  useEffect(() => {
    const handleDeleted = () => {
      setCount((prev) => Math.max(0, prev - 1))
    }
    const handleAdded = () => {
      setCount((prev) => prev + 1)
    }
    const handleCountChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>
      if (customEvent.detail?.count !== undefined) {
        setCount(customEvent.detail.count)
      }
    }

    window.addEventListener('artwork-deleted', handleDeleted)
    window.addEventListener('artwork-added', handleAdded)
    window.addEventListener('artwork-count-changed', handleCountChanged)

    return () => {
      window.removeEventListener('artwork-deleted', handleDeleted)
      window.removeEventListener('artwork-added', handleAdded)
      window.removeEventListener('artwork-count-changed', handleCountChanged)
    }
  }, [])

  // Sync with initialCount when it changes (e.g., after page refresh or navigation)
  useEffect(() => {
    if (initialCount >= 0) {
      setCount(initialCount)
    }
  }, [initialCount])

  // Toggle selection mode and notify gallery
  const toggleSelectionMode = () => {
    const newMode = !isSelectionMode
    setIsSelectionMode(newMode)
    window.dispatchEvent(new CustomEvent('selection-mode-changed', { 
      detail: { enabled: newMode } 
    }))
    // Clear selection when exiting selection mode
    if (!newMode) {
      window.dispatchEvent(new CustomEvent('clear-selection'))
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Gallery</h1>
        <ArtworkCounter count={count} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && (
          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            onClick={toggleSelectionMode}
            className={cn(
              isSelectionMode ? 'bg-primary' : '',
              'text-xs sm:text-sm'
            )}
            size="sm"
          >
            {isSelectionMode ? (
              <>
                <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Selection Mode</span>
                <span className="sm:hidden">Selecting</span>
              </>
            ) : (
              <>
                <Square className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                Select
              </>
            )}
          </Button>
        )}
        <Link href="/dashboard/upload" className="flex-1 sm:flex-initial">
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 text-xs sm:text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Artwork</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

