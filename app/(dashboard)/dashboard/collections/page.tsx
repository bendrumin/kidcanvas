import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderHeart, Plus } from 'lucide-react'
import type { FamilyMember, CollectionWithCover } from '@/lib/supabase/types'

export default async function CollectionsPage() {
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

  // Fetch collections
  const { data: collections } = await supabase
    .from('collections')
    .select('*, cover_artwork:artworks(thumbnail_url)')
    .eq('family_id', membership.family_id)
    .order('created_at', { ascending: false }) as { data: CollectionWithCover[] | null }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground mt-1">
            Organize artwork into themed collections
          </p>
        </div>
        <Button className="bg-gradient-to-r from-crayon-orange to-crayon-pink hover:opacity-90">
          <Plus className="w-5 h-5 mr-2" />
          New Collection
        </Button>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
              <div className="aspect-video bg-gradient-to-br from-crayon-purple/20 to-crayon-pink/20 relative">
                {collection.cover_artwork?.thumbnail_url && (
                  <img
                    src={collection.cover_artwork.thumbnail_url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-lg">{collection.name}</h3>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-crayon-orange/20 to-crayon-pink/20 flex items-center justify-center mx-auto mb-4">
            <FolderHeart className="w-10 h-10 text-crayon-orange" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">No collections yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create collections to group artwork by theme, event, or school year
          </p>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Collection
          </Button>
        </Card>
      )}
    </div>
  )
}

