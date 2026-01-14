import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GalleryGrid } from '@/components/gallery/gallery-grid'
import { Heart } from 'lucide-react'
import type { FamilyMember, ArtworkWithChild } from '@/lib/supabase/types'

export default async function FavoritesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single() as { data: Pick<FamilyMember, 'family_id'> | null }

  if (!membership) {
    redirect('/dashboard')
  }

  // Fetch favorite artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
    .eq('is_favorite', true)
    .order('created_date', { ascending: false }) as { data: ArtworkWithChild[] | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-fluid-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Heart className="w-8 h-8 text-crayon-red fill-crayon-red" />
          Favorites
        </h1>
        <p className="text-muted-foreground mt-1">
          {artworks?.length || 0} favorite artwork{artworks?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {artworks && artworks.length > 0 ? (
        <GalleryGrid artworks={artworks} />
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-crayon-red/20 to-crayon-pink/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-crayon-red" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Heart your favorite artworks to see them here. Perfect for showing off to grandparents!
          </p>
        </div>
      )}
    </div>
  )
}

