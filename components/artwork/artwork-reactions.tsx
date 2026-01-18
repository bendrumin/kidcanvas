'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Heart, Sparkles, Palette, HandHeart, Star } from 'lucide-react'
import type { ArtworkReaction } from '@/lib/supabase/types'

export type ReactionType = 'love' | 'amazing' | 'artistic' | 'proud' | 'star'

const REACTION_CONFIG: Record<ReactionType, { icon: typeof Heart; label: string; color: string; activeColor: string }> = {
  love: {
    icon: Heart,
    label: 'Love',
    color: 'text-muted-foreground hover:text-pink-500 dark:hover:text-pink-400',
    activeColor: 'text-pink-500 dark:text-pink-400 fill-pink-500 dark:fill-pink-400'
  },
  amazing: {
    icon: Sparkles,
    label: 'Amazing',
    color: 'text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400',
    activeColor: 'text-purple-500 dark:text-purple-400 fill-purple-500 dark:fill-purple-400'
  },
  artistic: {
    icon: Palette,
    label: 'Artistic',
    color: 'text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400',
    activeColor: 'text-blue-500 dark:text-blue-400 fill-blue-500 dark:fill-blue-400'
  },
  proud: {
    icon: HandHeart,
    label: 'Proud',
    color: 'text-muted-foreground hover:text-orange-500 dark:hover:text-orange-400',
    activeColor: 'text-orange-500 dark:text-orange-400 fill-orange-500 dark:fill-orange-400'
  },
  star: {
    icon: Star,
    label: 'Star',
    color: 'text-muted-foreground hover:text-yellow-500 dark:hover:text-yellow-400',
    activeColor: 'text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400'
  }
}

interface ArtworkReactionsProps {
  artworkId: string
  userId: string
}

interface ReactionCount {
  type: ReactionType
  count: number
  hasReacted: boolean
}

export function ArtworkReactions({ artworkId, userId }: ArtworkReactionsProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [reactions, setReactions] = useState<ReactionCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Map emoji types from DB to our ReactionType
  const emojiToType: Record<string, ReactionType> = {
    '❤️': 'love',
    '😍': 'amazing',
    '🎨': 'artistic',
    '👏': 'proud',
    '🌟': 'star'
  }
  
  const typeToEmoji: Record<ReactionType, string> = {
    'love': '❤️',
    'amazing': '😍',
    'artistic': '🎨',
    'proud': '👏',
    'star': '🌟'
  }

  useEffect(() => {
    loadReactions()
  }, [artworkId, userId])

  const loadReactions = async () => {
    try {
      // Get all reactions for this artwork
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allReactions } = await (supabase.from('artwork_reactions') as any)
        .select('*')
        .eq('artwork_id', artworkId)

      // Count by type and check if user has reacted
      const reactionMap = new Map<ReactionType, { count: number; hasReacted: boolean }>()
      
      Object.values(REACTION_CONFIG).forEach((_, index) => {
        const type = Object.keys(REACTION_CONFIG)[index] as ReactionType
        reactionMap.set(type, { count: 0, hasReacted: false })
      })

      allReactions?.forEach((reaction: ArtworkReaction) => {
        const type = emojiToType[reaction.emoji_type] || 'love'
        const current = reactionMap.get(type) || { count: 0, hasReacted: false }
        reactionMap.set(type, {
          count: current.count + 1,
          hasReacted: current.hasReacted || reaction.user_id === userId
        })
      })

      setReactions(
        Array.from(reactionMap.entries()).map(([type, data]) => ({
          type,
          ...data
        }))
      )
    } catch (error) {
      console.error('Error loading reactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (type: ReactionType) => {
    const emoji = typeToEmoji[type]
    const existing = reactions.find(r => r.type === type)
    const hasReacted = existing?.hasReacted || false

    try {
      if (hasReacted) {
        // Remove reaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('artwork_reactions') as any)
          .delete()
          .eq('artwork_id', artworkId)
          .eq('user_id', userId)
          .eq('emoji_type', emoji)

        if (error) throw error
      } else {
        // Add reaction (delete any existing reaction first to ensure uniqueness)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('artwork_reactions') as any)
          .delete()
          .eq('artwork_id', artworkId)
          .eq('user_id', userId)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('artwork_reactions') as any)
          .insert({
            artwork_id: artworkId,
            user_id: userId,
            emoji_type: emoji
          })

        if (error) throw error
      }

      await loadReactions()
    } catch (error) {
      toast({
        title: 'Oops!',
        description: 'Couldn\'t update reaction',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-3">
        {Object.entries(REACTION_CONFIG).map(([type]) => (
          <div key={type} className="w-16 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-3">
      {Object.entries(REACTION_CONFIG).map(([type, config]) => {
        const Icon = config.icon
        const reaction = reactions.find(r => r.type === type as ReactionType)
        const count = reaction?.count || 0
        const hasReacted = reaction?.hasReacted || false
        
        return (
          <button
            key={type}
            onClick={() => handleReaction(type as ReactionType)}
            className={`
              group relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
              transition-all duration-300 ease-out
              ${hasReacted 
                ? `${config.activeColor} bg-gradient-to-br from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 shadow-md border-2 ${config.activeColor.includes('pink') ? 'border-pink-300 dark:border-pink-700' : config.activeColor.includes('purple') ? 'border-purple-300 dark:border-purple-700' : config.activeColor.includes('blue') ? 'border-blue-300 dark:border-blue-700' : config.activeColor.includes('orange') ? 'border-orange-300 dark:border-orange-700' : 'border-yellow-300 dark:border-yellow-700'}` 
                : `${config.color} bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/70 border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md`
              }
              transform hover:scale-110 active:scale-95
              backdrop-blur-sm
            `}
            title={config.label}
          >
            <Icon 
              className={`w-6 h-6 transition-all duration-300 ${hasReacted ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110 group-hover:drop-shadow-sm'}`}
              strokeWidth={hasReacted ? 2.5 : 2}
            />
            {count > 0 && (
              <span className={`
                text-xs font-bold min-w-[1rem] text-center leading-none
                ${hasReacted ? config.activeColor.split(' ')[0] : 'text-muted-foreground'}
                transition-colors duration-300
              `}>
                {count}
              </span>
            )}
            {!count && (
              <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {config.label}
              </span>
            )}
            {hasReacted && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-current rounded-full opacity-70 animate-pulse" />
            )}
          </button>
        )
      })}
    </div>
  )
}

