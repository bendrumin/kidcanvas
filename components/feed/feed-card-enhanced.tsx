'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { Heart, Sparkles, Palette, HandHeart, Star, MessageCircle, Camera, Send, Loader2 } from 'lucide-react'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface FeedCardEnhancedProps {
  artwork: ArtworkWithChild
  reactionCounts: Record<string, number>
  commentCount: number
  currentUserId: string
  latestComments?: Array<{
    id: string
    text: string
    user_nickname?: string
    created_at?: string
  }>
}

const REACTION_TYPES = [
  { emoji: '❤️', type: 'heart', icon: Heart, color: 'text-pink-500', hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-950/20' },
  { emoji: '✨', type: 'sparkles', icon: Sparkles, color: 'text-purple-500', hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-950/20' },
  { emoji: '🎨', type: 'palette', icon: Palette, color: 'text-blue-500', hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-950/20' },
  { emoji: '👏', type: 'hand_heart', icon: HandHeart, color: 'text-orange-500', hoverColor: 'hover:bg-orange-50 dark:hover:bg-orange-950/20' },
  { emoji: '⭐', type: 'star', icon: Star, color: 'text-yellow-500', hoverColor: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20' },
]

export function FeedCardEnhanced({
  artwork,
  reactionCounts: initialReactionCounts,
  commentCount: initialCommentCount,
  currentUserId,
  latestComments = []
}: FeedCardEnhancedProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isLoadingReaction, setIsLoadingReaction] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comments, setComments] = useState(latestComments)

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)
  const storyText = artwork.story || artwork.ai_description || artwork.title || 'No story available'

  useEffect(() => {
    loadUserReaction()
  }, [artwork.id, currentUserId])

  const loadUserReaction = async () => {
    try {
      const { data } = await supabase
        .from('artwork_reactions')
        .select('emoji_type')
        .eq('artwork_id', artwork.id)
        .eq('user_id', currentUserId)
        .maybeSingle() as { data: { emoji_type: string } | null }

      if (data) {
        setUserReaction(data.emoji_type)
      }
    } catch (error) {
      console.error('Error loading user reaction:', error)
    }
  }

  const handleReaction = async (emojiType: string) => {
    if (isLoadingReaction) return
    setIsLoadingReaction(true)

    try {
      // If user already has this reaction, remove it
      if (userReaction === emojiType) {
        await supabase
          .from('artwork_reactions')
          .delete()
          .eq('artwork_id', artwork.id)
          .eq('user_id', currentUserId)
          .eq('emoji_type', emojiType)

        setUserReaction(null)
        setReactionCounts(prev => ({
          ...prev,
          [emojiType]: Math.max(0, (prev[emojiType] || 0) - 1)
        }))
      } else {
        // Remove old reaction if exists
        if (userReaction) {
          await supabase
            .from('artwork_reactions')
            .delete()
            .eq('artwork_id', artwork.id)
            .eq('user_id', currentUserId)

          setReactionCounts(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
          }))
        }

        // Add new reaction
        await (supabase
          .from('artwork_reactions') as any)
          .insert({
            artwork_id: artwork.id,
            user_id: currentUserId,
            emoji_type: emojiType,
          })

        setUserReaction(emojiType)
        setReactionCounts(prev => ({
          ...prev,
          [emojiType]: (prev[emojiType] || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingReaction(false)
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return
    if (newComment.trim().length > 500) {
      toast({
        title: 'Comment too long',
        description: 'Comments must be 500 characters or less',
        variant: 'destructive'
      })
      return
    }

    setIsSubmittingComment(true)

    try {
      const { data, error } = await (supabase
        .from('artwork_comments') as any)
        .insert({
          artwork_id: artwork.id,
          user_id: currentUserId,
          text: newComment.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Add to local comments list
      setComments(prev => [...prev, {
        id: data.id,
        text: data.text,
        user_nickname: 'You',
        created_at: data.created_at
      }])
      setCommentCount(prev => prev + 1)
      setNewComment('')
      setShowCommentInput(false)

      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added',
      })
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

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

      {/* Interactive Reactions Row */}
      <div className="px-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap pb-3">
          {REACTION_TYPES.map(({ emoji, type, icon: Icon, color, hoverColor }) => {
            const count = reactionCounts[type] || 0
            const isActive = userReaction === type
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={isLoadingReaction}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
                  isActive
                    ? "border-current bg-gray-50 dark:bg-gray-800 scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:scale-105",
                  hoverColor
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? color : "text-gray-400")} />
                {count > 0 && (
                  <span className={cn("text-sm font-medium", isActive ? color : "text-muted-foreground")}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Total reactions and comment count summary */}
        <div className="flex items-center justify-between pb-2 text-sm text-muted-foreground">
          <span>
            {totalReactions > 0 ? `${totalReactions} reaction${totalReactions === 1 ? '' : 's'}` : 'No reactions yet'}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {commentCount} comment{commentCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
        {/* Latest comments preview */}
        {comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {comments.slice(-2).map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-foreground">{comment.user_nickname || 'Anonymous'}</span>
                {' '}
                <span className="text-muted-foreground">{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* View all comments link */}
        {commentCount > 2 && (
          <Link
            href={`/dashboard/artwork/${artwork.id}`}
            className="text-sm text-muted-foreground hover:text-primary mb-3 block"
          >
            View all {commentCount} comments
          </Link>
        )}

        {/* Quick comment input */}
        {!showCommentInput ? (
          <button
            onClick={() => setShowCommentInput(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            Add a comment...
          </button>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] text-sm resize-none"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handlePostComment()
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmittingComment || newComment.trim().length > 500}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setShowCommentInput(false)
                  setNewComment('')
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {newComment.length > 0 && (
          <p className={cn(
            "text-xs mt-1",
            newComment.length > 500 ? "text-red-500" : "text-muted-foreground"
          )}>
            {newComment.length}/500
          </p>
        )}

        {/* View full story link */}
        <Link
          href={`/dashboard/artwork/${artwork.id}`}
          className="text-sm text-primary hover:underline font-medium block mt-3"
        >
          View full story &rarr;
        </Link>
      </div>
    </article>
  )
}
