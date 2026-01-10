'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FeedCard } from './feed-card'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface FeedViewProps {
  artworks: ArtworkWithChild[]
  reactionCounts: Map<string, Record<string, number>>
  commentCounts: Map<string, number>
  currentUserId: string
}

export function FeedView({ artworks, reactionCounts, commentCounts, currentUserId }: FeedViewProps) {
  return (
    <div className="space-y-6">
      {artworks.map((artwork) => (
        <FeedCard
          key={artwork.id}
          artwork={artwork}
          reactionCounts={reactionCounts.get(artwork.id) || {}}
          commentCount={commentCounts.get(artwork.id) || 0}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}
