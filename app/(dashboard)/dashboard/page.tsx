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
        <h2 className="text-2xl font-display font-bold mb-4">No Family Found</h2>
        <p className="text-muted-foreground mb-6">
          It looks like you're not part of a family yet.
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
    // Search in title and AI description using OR
    artworkQuery = artworkQuery.or(`title.ilike.%${searchQuery}%,ai_description.ilike.%${searchQuery}%`)
    
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

  // If searching, also filter by child name, tags, and AI tags (since array searches are complex in Supabase)
  if (searchQuery && artworks) {
    const searchLower = searchQuery.toLowerCase()
    artworks = artworks.filter(artwork => {
      // Check if title matches (already filtered by query, but keep for consistency)
      const titleMatch = artwork.title?.toLowerCase().includes(searchLower)
      // Check if child name matches
      const childNameMatch = artwork.child?.name?.toLowerCase().includes(searchLower)
      // Check if any tag matches (manual tags)
      const tagsMatch = artwork.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
      // Check if any AI tag matches
      const aiTagsMatch = artwork.ai_tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
      // Check if AI description matches (already filtered by query, but keep for consistency)
      const aiDescMatch = artwork.ai_description?.toLowerCase().includes(searchLower)
      
      return titleMatch || childNameMatch || tagsMatch || aiTagsMatch || aiDescMatch
    })
  }

  // Parallelize independent queries: children and subscription limits
  const [childrenResult, limits] = await Promise.all([
    supabase
      .from('children')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('name'),
    getUserSubscriptionLimits(user.id),
  ])
  
  const { data: children } = childrenResult as { data: Child[] | null }

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
      <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded-xl" />}>
        <GalleryFilters children={children || []} />
      </Suspense>

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

