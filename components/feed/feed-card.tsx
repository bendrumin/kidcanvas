'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { Heart, Sparkles, Palette, HandHeart, Star, MessageCircle, Camera } from 'lucide-react'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface FeedCardProps {
  artwork: ArtworkWithChild
  reactionCounts: Record<string, number>
  commentCount: number
  currentUserId: string
}

const REACTION_EMOJIS: Record<string, { icon: typeof Heart; color: string }> = {
  '❤️': { icon: Heart, color: 'text-pink-500' },
  '😍': { icon: Sparkles, color: 'text-purple-500' },
  '🎨': { icon: Palette, color: 'text-blue-500' },
  '👏': { icon: HandHeart, color: 'text-orange-500' },
  '🌟': { icon: Star, color: 'text-yellow-500' },
}

export function FeedCard({ artwork, reactionCounts, commentCount, currentUserId }: FeedCardProps) {
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)
  const storyText = artwork.story || artwork.ai_description || artwork.title || 'No story available'

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header: Child name and date */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {artwork.child?.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <Link 
              href={`/dashboard/artwork/${artwork.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {artwork.child?.name || 'Unknown Artist'}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDate(artwork.created_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Story text - prominently displayed */}
      <div className="px-4 pb-3">
        <p className="text-foreground leading-relaxed text-base">
          {storyText}
        </p>
      </div>

      {/* Main artwork image */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-900">
        {artwork.image_url ? (
          <Image
            src={artwork.image_url}
            alt={storyText}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Moment photo - if available */}
      {artwork.moment_photo_url && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Moment Photo</span>
          </div>
          <div className="relative w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
            <Image
              src={artwork.moment_photo_url}
              alt="Moment photo"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 300px, 400px"
            />
          </div>
        </div>
      )}

      {/* Reactions and comments bar */}
      <div className="px-4 pt-3 pb-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          {/* Reaction counts */}
          <div className="flex items-center gap-4 flex-wrap">
            {totalReactions > 0 ? (
              <div className="flex items-center gap-2">
                {Object.entries(reactionCounts).map(([emoji, count]) => {
                  if (count === 0) return null
                  const config = REACTION_EMOJIS[emoji]
                  const Icon = config?.icon || Heart
                  return (
                    <div key={emoji} className="flex items-center gap-1">
                      <Icon className={cn("w-5 h-5", config?.color || 'text-muted-foreground')} />
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No reactions yet</span>
            )}
          </div>

          {/* Comment count */}
          <div className="flex items-center gap-1">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{commentCount}</span>
          </div>
        </div>

        {/* View full story link */}
        <Link
          href={`/dashboard/artwork/${artwork.id}`}
          className="text-sm text-primary hover:underline font-medium"
        >
          View full story &rarr;
        </Link>
      </div>
    </article>
  )
}
