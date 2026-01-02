'use client'

import { useState, useEffect } from 'react'
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

    window.addEventListener('artwork-deleted', handleDeleted)
    window.addEventListener('artwork-added', handleAdded)

    return () => {
      window.removeEventListener('artwork-deleted', handleDeleted)
      window.removeEventListener('artwork-added', handleAdded)
    }
  }, [])

  // Update count when initialCount changes (e.g., from server refresh)
  useEffect(() => {
    setCount(initialCount)
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

