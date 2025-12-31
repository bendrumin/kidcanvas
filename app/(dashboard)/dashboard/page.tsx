import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { GalleryGrid } from '@/components/gallery/gallery-grid'
import { GalleryFilters } from '@/components/gallery/gallery-filters'
import { EmptyGallery } from '@/components/gallery/empty-gallery'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single()

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

  // Fetch artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
    .order('created_date', { ascending: false })

  // Fetch children for filters
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('name')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Gallery</h1>
          <p className="text-muted-foreground mt-1">
            {artworks?.length || 0} artwork{artworks?.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
            <Plus className="w-5 h-5 mr-2" />
            Add Artwork
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded-xl" />}>
        <GalleryFilters children={children || []} />
      </Suspense>

      {/* Gallery */}
      {artworks && artworks.length > 0 ? (
        <GalleryGrid artworks={artworks} />
      ) : (
        <EmptyGallery />
      )}
    </div>
  )
}

