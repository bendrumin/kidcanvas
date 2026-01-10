'use client'

import { FeedCardEnhanced } from './feed-card-enhanced'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface FeedViewEnhancedProps {
  artworks: ArtworkWithChild[]
  reactionCounts: Map<string, Record<string, number>>
  commentCounts: Map<string, number>
  latestComments: Map<string, Array<{ id: string; text: string; user_nickname?: string; created_at?: string }>>
  currentUserId: string
}

export function FeedViewEnhanced({
  artworks,
  reactionCounts,
  commentCounts,
  latestComments,
  currentUserId
}: FeedViewEnhancedProps) {
  return (
    <div className="space-y-6">
      {artworks.map((artwork) => (
        <FeedCardEnhanced
          key={artwork.id}
          artwork={artwork}
          reactionCounts={reactionCounts.get(artwork.id) || {}}
          commentCount={commentCounts.get(artwork.id) || 0}
          latestComments={latestComments.get(artwork.id) || []}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}
