import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { GalleryGridWithCounter } from '@/components/gallery/gallery-grid-with-counter'
import { GalleryFilters } from '@/components/gallery/gallery-filters'
import { EmptyGallery } from '@/components/gallery/empty-gallery'
import { GalleryHeader } from '@/components/gallery/gallery-header'
import { GallerySkeleton } from '@/components/gallery/gallery-skeleton'
import { NoResults } from '@/components/gallery/no-results'
import { UsageWarning } from '@/components/gallery/usage-warning'
import { MemoryPrompts } from '@/components/dashboard/memory-prompts'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { FamilyMember, ArtworkWithChild, Child } from '@/lib/supabase/types'
import { getUserSubscriptionLimits } from '@/lib/subscription'
import { SubjectChips } from '@/components/then-and-now/subject-chips'
import { matchesSubject, pluralize, suggestSubjects } from '@/lib/then-and-now'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'View and manage your family\'s artwork collection. Search, filter, and organize your children\'s precious art.',
}

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  // Get filter params
  const childFilter = typeof params.child === 'string' ? params.child : undefined
  const sortParam = typeof params.sort === 'string' ? params.sort : 'newest'
  const searchQuery = typeof params.search === 'string' ? params.search : undefined
  const showFavorites = params.favorites === 'true'
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user's family and role
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: Pick<FamilyMember, 'family_id' | 'role'> | null }

  if (!membership) {
    return (
      <div className="text-center py-20">
        <h2 className="text-fluid-2xl font-display font-bold mb-4">No family yet</h2>
        <p className="text-muted-foreground mb-6">
          Looks like you haven’t joined or created a family yet.
        </p>
        <Link href="/dashboard/family/create">
          <Button>Create Your Family</Button>
        </Link>
      </div>
    )
  }

  // Build artwork query with filters
  let artworkQuery = supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
  
  // Apply child filter
  if (childFilter && childFilter !== 'all') {
    artworkQuery = artworkQuery.eq('child_id', childFilter)
  }
  
  // Apply favorites filter
  if (showFavorites) {
    artworkQuery = artworkQuery.eq('is_favorite', true)
  }
  
  // Apply search filter - search across title, tags, and AI description
  // Note: We'll filter by child name in JavaScript after fetching since it's a joined table
  if (searchQuery) {
    // Search title and the story, which is the text people actually write
    artworkQuery = artworkQuery.or(`title.ilike.%${searchQuery}%,story.ilike.%${searchQuery}%`)
    
    // For tags, we need to check if any tag contains the search term
    // Since Supabase doesn't easily support array contains with ilike, we'll filter in JS
  }
  
  // Apply sort
  if (sortParam === 'oldest') {
    artworkQuery = artworkQuery.order('created_date', { ascending: true })
  } else if (sortParam === 'title') {
    artworkQuery = artworkQuery.order('title', { ascending: true })
  } else {
    artworkQuery = artworkQuery.order('created_date', { ascending: false })
  }
  
  let { data: artworks } = await artworkQuery as { data: ArtworkWithChild[] | null }

  // If searching, also filter by child name and tags (array searches are awkward in Supabase)
  if (searchQuery && artworks) {
    const searchLower = searchQuery.toLowerCase()
    artworks = artworks.filter(artwork => {
      // Check if title matches (already filtered by query, but keep for consistency)
      const titleMatch = artwork.title?.toLowerCase().includes(searchLower)
      // Check if child name matches
      const childNameMatch = artwork.child?.name?.toLowerCase().includes(searchLower)
      // Check if any tag matches (manual tags)
      const tagsMatch = artwork.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
      // Check if the story matches
      const storyMatch = artwork.story?.toLowerCase().includes(searchLower) || false

      return titleMatch || childNameMatch || tagsMatch || storyMatch
    })
  }

  const selectedChildId = childFilter && childFilter !== 'all' ? childFilter : undefined

  // Parallelize independent queries: children, subscription limits, and the
  // selected child's words for subject suggestions. That last one ignores the
  // search and favorites filters on purpose, so the chips describe the child,
  // not whatever happens to be on screen.
  const [childrenResult, limits, subjectSource] = await Promise.all([
    supabase
      .from('children')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('name'),
    getUserSubscriptionLimits(user.id),
    selectedChildId
      ? supabase
          .from('artworks')
          .select('title, story')
          .eq('family_id', membership.family_id)
          .eq('child_id', selectedChildId)
      : Promise.resolve({ data: null }),
  ])
  
  const { data: children } = childrenResult as { data: Child[] | null }
  const selectedChild = children?.find(c => c.id === selectedChildId)
  const subjects = selectedChild
    ? suggestSubjects((subjectSource.data || []) as Pick<ArtworkWithChild, 'title' | 'story'>[], selectedChild)
    : []

  // A search is the natural way into "Then and now". Offer it for each artist
  // whose own titles or stories mention the term: the gallery search also
  // matches artist names and tags, which would offer "Emma's emmas". The view
  // itself explains when one match is not enough.
  const thenAndNowChildren = searchQuery
    ? (children || []).filter(c =>
        (!selectedChildId || c.id === selectedChildId)
          && artworks?.some(a => a.child_id === c.id && matchesSubject(a, searchQuery))
      )
    : []

  // Get last upload date for memory prompts
  const lastUploadDate = artworks && artworks.length > 0
    ? [...artworks].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0].created_date
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <GalleryHeader
        initialCount={artworks?.length || 0}
        canEdit={membership.role === 'owner' || membership.role === 'parent'}
        childrenList={children || []}
        planId={limits.planId}
      />

      {/* Usage Warnings */}
      {limits.artworkLimit !== -1 && (
        <UsageWarning
          current={limits.currentArtworks}
          limit={limits.artworkLimit}
          type="artwork"
        />
      )}

      {/* Memory Prompts */}
      <MemoryPrompts
        childrenData={children?.map(c => ({
          id: c.id,
          name: c.name,
          birthday: c.birth_date
        }))}
        lastUploadDate={lastUploadDate}
        isPremium={limits.planId === 'family' || limits.planId === 'pro'}
      />

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-0 sm:border-0">
        <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded-xl" />}>
          <GalleryFilters children={children || []} />
        </Suspense>
      </div>

      {searchQuery && thenAndNowChildren.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
            <Sparkles className="w-4 h-4 text-crayon-purple" aria-hidden />
            Then and now:
          </span>
          {thenAndNowChildren.map(c => (
            <Link
              key={c.id}
              href={`/dashboard/then-and-now?child=${c.id}&q=${encodeURIComponent(searchQuery)}`}
              className="rounded-full px-3 py-1.5 text-sm font-medium bg-muted text-foreground hover:bg-primary/10 transition-colors"
            >
              {`${c.name}'s ${pluralize(searchQuery)}`}
            </Link>
          ))}
        </div>
      )}

      {!searchQuery && selectedChild && (
        <SubjectChips childId={selectedChild.id} childName={selectedChild.name} subjects={subjects} />
      )}

      {/* Gallery */}
      <Suspense fallback={<GallerySkeleton count={8} />}>
        {artworks && artworks.length > 0 ? (
          <GalleryGridWithCounter 
            artworks={artworks} 
            canEdit={membership.role === 'owner' || membership.role === 'parent'}
            planId={limits.planId}
          />
        ) : searchQuery || (childFilter && childFilter !== 'all') || showFavorites ? (
          <NoResults 
            searchQuery={searchQuery}
            hasFilters={!!(searchQuery || (childFilter && childFilter !== 'all') || showFavorites)}
            onClearFilters={() => {}}
          />
        ) : (
          <EmptyGallery />
        )}
      </Suspense>
    </div>
  )
}

