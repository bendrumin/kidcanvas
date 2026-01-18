'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react'
import type { ArtworkComment } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'

interface ArtworkCommentsProps {
  artworkId: string
  userId: string
  userEmail?: string
}

interface CommentWithUser extends ArtworkComment {
  user: {
    email: string
    avatar_url?: string
    full_name?: string
  }
}

export function ArtworkComments({ artworkId, userId, userEmail }: ArtworkCommentsProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadComments()
    
    // Subscribe to new comments (disabled for now - can re-enable once realtime is configured)
    // const channel = supabase
    //   .channel(`artwork-comments-${artworkId}`)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'artwork_comments',
    //       filter: `artwork_id=eq.${artworkId}`
    //     },
    //     () => {
    //       loadComments()
    //     }
    //   )
    //   .subscribe()

    // return () => {
    //   supabase.removeChannel(channel)
    // }
  }, [artworkId])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const loadComments = async () => {
    try {
      // Get artwork to find family_id
      const { data: artworkData } = await supabase
        .from('artworks')
        .select('family_id')
        .eq('id', artworkId)
        .single() as { data: { family_id: string } | null }

      if (!artworkData) {
        setComments([])
        setIsLoading(false)
        return
      }

      // Get comments - using type assertion for new table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: commentsData, error: commentsError } = await (supabase.from('artwork_comments') as any)
        .select('*')
        .eq('artwork_id', artworkId)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      if (!commentsData || commentsData.length === 0) {
        setComments([])
        setIsLoading(false)
        return
      }

      // Get unique user IDs
      const userIds = Array.from(new Set<string>(commentsData.map((c: ArtworkComment) => c.user_id)))
      
      // Get family member info for this family
      const { data: familyMembers } = await supabase
        .from('family_members')
        .select('user_id, nickname')
        .eq('family_id', artworkData.family_id)
        .in('user_id', userIds) as { data: Array<{ user_id: string; nickname: string | null }> | null }

      // Create a map of user_id to display name
      const userMap = new Map<string, string>()
      
      for (const member of familyMembers || []) {
        userMap.set(member.user_id, member.nickname || 'Family Member')
      }

      // Get current user info
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const currentUserEmail = currentUser?.email || ''

      // Transform comments with user info
      const commentsWithUser = commentsData.map((comment: ArtworkComment) => {
        const displayName = userMap.get(comment.user_id) || 'Family Member'
        const email = comment.user_id === userId && currentUserEmail 
          ? currentUserEmail 
          : displayName.toLowerCase().replace(/\s+/g, '') + '@family'

        return {
          ...comment,
          user: {
            email: email,
            full_name: displayName,
            avatar_url: undefined
          }
        }
      })

      setComments(commentsWithUser)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast({
        title: 'Oops!',
        description: 'Couldn\'t load comments',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || newComment.trim().length > 500) {
      toast({
        title: 'Invalid comment',
        description: 'Comments need to be between 1 and 500 characters',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('artwork_comments') as any)
        .insert({
          artwork_id: artworkId,
          user_id: userId,
          text: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await loadComments()
    } catch (error) {
      toast({
        title: 'Oops!',
        description: 'Couldn\'t post comment',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('artwork_comments') as any)
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId)

      if (error) throw error

      await loadComments()
      toast({
        title: 'Comment deleted',
        duration: 2000
      })
    } catch (error) {
      toast({
        title: 'Oops!',
        description: 'Couldn\'t delete comment',
        variant: 'destructive'
      })
    }
  }

  const getUserInitials = (email: string, fullName?: string) => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comments</span>
        </div>
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center gap-2 text-foreground mb-6">
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold text-lg">Family Comments</span>
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground ml-1">({comments.length})</span>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwnComment = comment.user_id === userId
            const initials = getUserInitials(comment.user.email, comment.user.full_name)
            
            return (
              <div 
                key={comment.id} 
                className={`
                  flex gap-3 group
                  ${isOwnComment ? 'flex-row-reverse' : ''}
                `}
              >
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm
                  ${isOwnComment 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white' 
                    : 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white'
                  }
                  shadow-sm
                `}>
                  {comment.user.avatar_url ? (
                    <img 
                      src={comment.user.avatar_url} 
                      alt={comment.user.full_name || comment.user.email}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Comment Content */}
                <div className={`
                  flex-1 space-y-1
                  ${isOwnComment ? 'items-end' : 'items-start'}
                `}>
                  <div className={`
                    inline-block px-4 py-2.5 rounded-2xl max-w-[85%]
                    ${isOwnComment 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-sm' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    }
                    shadow-sm
                  `}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  </div>
                  
                  <div className={`
                    flex items-center gap-2 text-xs text-muted-foreground px-1
                    ${isOwnComment ? 'justify-end' : 'justify-start'}
                  `}>
                    <span>{comment.user.full_name || comment.user.email.split('@')[0]}</span>
                    <span>•</span>
                    <span>{formatDate(comment.created_at)}</span>
                    {isOwnComment && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity ml-2 p-1 hover:text-red-500"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="resize-none min-h-[80px] border-gray-200 dark:border-gray-700 focus:border-pink-400 focus:ring-pink-400"
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="h-[80px] px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
            {newComment.length > 0 && (
              <span className="text-xs text-muted-foreground text-center">
                {newComment.length}/500
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

