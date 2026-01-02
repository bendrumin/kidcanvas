'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ArtworkCounter } from './artwork-counter'

interface GalleryHeaderProps {
  initialCount: number
}

export function GalleryHeader({ initialCount }: GalleryHeaderProps) {
  const [count, setCount] = useState(initialCount)

  // Listen for custom events to update count
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

  // Update count when initialCount changes (e.g., from server refresh)
  // Use a ref to track if this is the initial mount to prevent flicker
  const isInitialMount = React.useRef(true)
  const lastInitialCount = React.useRef(initialCount)
  
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, set the count immediately and mark as mounted
      setCount(initialCount)
      lastInitialCount.current = initialCount
      isInitialMount.current = false
    } else if (initialCount !== lastInitialCount.current && initialCount >= 0) {
      // Only update if initialCount actually changed (not just a re-render)
      // This prevents flicker from hydration mismatches
      setCount(initialCount)
      lastInitialCount.current = initialCount
    }
  }, [initialCount])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Gallery</h1>
        <ArtworkCounter count={count} />
      </div>
      <Link href="/dashboard/upload">
        <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
          <Plus className="w-5 h-5 mr-2" />
          Add Artwork
        </Button>
      </Link>
    </div>
  )
}

