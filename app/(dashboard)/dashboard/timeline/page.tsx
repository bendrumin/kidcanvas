import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimelineView } from '@/components/timeline/timeline-view'
import { TimelineSkeleton } from '@/components/timeline/timeline-skeleton'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { Palette } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Art Growth Timeline',
  description: 'See how your children\'s artwork evolves over time with our visual timeline.',
}

interface TimelinePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  // Get filter params
  const childFilter = typeof params.child === 'string' ? params.child : undefined
  const ageRange = typeof params.ageRange === 'string' ? params.ageRange : undefined

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family and role
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: { family_id: string; role: string } | null }

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

  // Build artwork query
  let artworkQuery = supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
    .order('created_date', { ascending: true }) // Chronological order for timeline
  
  // Apply child filter
  if (childFilter && childFilter !== 'all') {
    artworkQuery = artworkQuery.eq('child_id', childFilter)
  }

  // Parallelize artwork and children queries (both only depend on family_id)
  const [artworksResult, childrenResult] = await Promise.all([
    artworkQuery,
    supabase
      .from('children')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('name'),
  ])
  
  const { data: artworks } = artworksResult as { data: ArtworkWithChild[] | null }
  const { data: children } = childrenResult as { data: Child[] | null }

  // Get selected child for timeline calculations
  const selectedChild = childFilter && childFilter !== 'all'
    ? children?.find(c => c.id === childFilter)
    : undefined

  // Filter artworks to only those with valid age data
  const validArtworks = (artworks || []).filter(
    a => a.child_age_months !== null && a.child_age_months !== undefined
  )

  if (validArtworks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Art Growth Timeline
        </h1>
        <p className="text-muted-foreground mb-8">
          See how your children's artwork evolves over time
        </p>
        <div className="bg-white dark:bg-card rounded-2xl border border-amber-100 dark:border-border p-12 text-center">
          <div className="flex justify-center mb-4">
            <Palette className="w-16 h-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No artwork with age data yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Upload artwork and make sure each child has a birth date set to see the timeline.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Art Growth Timeline
        </h1>
        <p className="text-muted-foreground">
          Watch your children's artistic journey unfold over time
        </p>
      </div>

      <Suspense fallback={<TimelineSkeleton />}>
        <TimelineView
          artworks={validArtworks}
          children={children || []}
          selectedChildId={childFilter || undefined}
          selectedAgeRange={ageRange}
        />
      </Suspense>
    </div>
  )
}

