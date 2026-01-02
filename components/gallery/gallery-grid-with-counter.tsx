'use client'

import { useState } from 'react'
import { GalleryGrid } from './gallery-grid'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface GalleryGridWithCounterProps {
  artworks: ArtworkWithChild[]
  canEdit: boolean
}

export function GalleryGridWithCounter({ artworks, canEdit }: GalleryGridWithCounterProps) {
  const [count, setCount] = useState(artworks.length)

  return (
    <GalleryGrid 
      artworks={artworks} 
      onCountChange={setCount} 
      canEdit={canEdit}
    />
  )
}

