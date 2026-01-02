'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ArtworkCounter } from './artwork-counter'

interface GalleryHeaderProps {
  initialCount: number
}

export function GalleryHeader({ initialCount }: GalleryHeaderProps) {
  // Use initialCount directly to avoid hydration mismatch
  const [count, setCount] = useState(() => initialCount)
  const isMountedRef = useRef(false)
  const lastInitialCountRef = useRef(initialCount)

  // Listen for custom events to update count (only on client)
  useEffect(() => {
    isMountedRef.current = true
    
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

  // Update count when initialCount changes (only after mount to avoid hydration issues)
  useEffect(() => {
    if (isMountedRef.current && initialCount !== lastInitialCountRef.current && initialCount >= 0) {
      setCount(initialCount)
      lastInitialCountRef.current = initialCount
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

