'use client'

import { GalleryGrid } from './gallery-grid'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface GalleryGridWithCounterProps {
  artworks: ArtworkWithChild[]
  canEdit: boolean
  planId?: 'free' | 'family' | 'pro'
}

export function GalleryGridWithCounter({ artworks, canEdit, planId = 'free' }: GalleryGridWithCounterProps) {
  // Update header counter when artworks change
  const handleCountChange = (count: number) => {
    // Dispatch event to update the header counter
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('artwork-count-changed', { detail: { count } }))
    }
  }

  return (
    <GalleryGrid 
      artworks={artworks} 
      onCountChange={handleCountChange} 
      canEdit={canEdit}
      planId={planId}
    />
  )
}

