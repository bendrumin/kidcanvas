import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeedViewEnhanced } from '@/components/feed/feed-view-enhanced'
import { FeedSkeleton } from '@/components/feed/feed-skeleton'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import type { FamilyMember, ArtworkWithChild } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Feed',
  description: 'View your family\'s artwork stories in an Instagram-style feed. See reactions, comments, and moment photos.',
}

export default async function FeedPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: Pick<FamilyMember, 'family_id' | 'role'> | null }

  if (!membership) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold mb-4">No Family Found</h2>
        <p className="text-muted-foreground mb-6">
          It looks like you're not part of a family yet.
        </p>
      </div>
    )
  }

  // Fetch artworks with story, moment photo, child info, ordered by newest
  // Filter to only show artworks with stories (not null and not empty)
  const { data: allArtworks } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
    .order('created_date', { ascending: false })

  // Filter artworks that have stories (non-null and non-empty)
  // Type assertion to include story and moment_photo_url fields
  const artworks = (allArtworks as (ArtworkWithChild & { story?: string | null; moment_photo_url?: string | null })[])?.filter(artwork => 
    artwork.story && typeof artwork.story === 'string' && artwork.story.trim().length > 0
  ) || []

  // Fetch reaction counts, comment counts, and latest comments for all artworks in parallel
  const reactionCountsMap = new Map<string, Record<string, number>>()
  const commentCountsMap = new Map<string, number>()
  const latestCommentsMap = new Map<string, Array<{ id: string; text: string; user_nickname?: string; created_at?: string }>>()

  if (artworks && artworks.length > 0) {
    const artworkIds = artworks.map(a => a.id as string)

    // Fetch all reactions
    const { data: allReactions } = await supabase
      .from('artwork_reactions')
      .select('artwork_id, emoji_type')
      .in('artwork_id', artworkIds)

    // Fetch all comments with user info (latest 3 per artwork)
    const { data: allComments } = await supabase
      .from('artwork_comments')
      .select('id, artwork_id, text, user_id, created_at')
      .in('artwork_id', artworkIds)
      .order('created_at', { ascending: false })

    // Get family member info for comment authors
    const commentUserIds = allComments ? Array.from(new Set(allComments.map((c: any) => c.user_id))) : []
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('user_id, nickname')
      .in('user_id', commentUserIds)

    const nicknameMap = new Map(familyMembers?.map((fm: any) => [fm.user_id, fm.nickname]) || [])

    // Aggregate reactions by artwork
    allReactions?.forEach((reaction: { artwork_id: string; emoji_type: string }) => {
      const current = reactionCountsMap.get(reaction.artwork_id) || {}
      current[reaction.emoji_type] = (current[reaction.emoji_type] || 0) + 1
      reactionCountsMap.set(reaction.artwork_id, current)
    })

    // Group comments by artwork and count
    allComments?.forEach((comment: any) => {
      // Count
      commentCountsMap.set(comment.artwork_id, (commentCountsMap.get(comment.artwork_id) || 0) + 1)

      // Store latest comments (max 3 per artwork)
      const existing = latestCommentsMap.get(comment.artwork_id) || []
      if (existing.length < 3) {
        existing.push({
          id: comment.id,
          text: comment.text,
          user_nickname: nicknameMap.get(comment.user_id) || 'Family Member',
          created_at: comment.created_at
        })
        latestCommentsMap.set(comment.artwork_id, existing)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Family Feed
        </h1>
        <p className="text-muted-foreground">
          Stories, moments, and artwork from your family
        </p>
      </div>

      <Suspense fallback={<FeedSkeleton count={5} />}>
        {artworks && artworks.length > 0 ? (
          <FeedViewEnhanced
            artworks={artworks}
            reactionCounts={reactionCountsMap}
            commentCounts={commentCountsMap}
            latestComments={latestCommentsMap}
            currentUserId={user.id}
          />
        ) : (
          <div className="text-center py-20 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                Your Story Feed Awaits!
              </h3>
              <p className="text-muted-foreground mb-6">
                Stories will appear here once you upload artwork. Capture what your child said, share moments with family, and watch memories come alive.
              </p>
              <Link href="/dashboard/upload">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Story
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}
