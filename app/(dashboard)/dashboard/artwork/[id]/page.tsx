import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArtworkDetail } from '@/components/artwork/artwork-detail'
import type { FamilyMember, ArtworkWithChild, Child } from '@/lib/supabase/types'

interface ArtworkPageProps {
  params: Promise<{ id: string }>
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family and role
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: Pick<FamilyMember, 'family_id' | 'role'> | null }

  if (!membership) {
    redirect('/dashboard')
  }

  // Get artwork with child info
  const { data: artwork, error } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('id', id)
    .eq('family_id', membership.family_id)
    .single() as { data: ArtworkWithChild | null, error: unknown }

  if (error || !artwork) {
    notFound()
  }

  // Get all children for reassigning
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('name') as { data: Child[] | null }

  const canEdit = membership.role === 'owner' || membership.role === 'parent'

  return (
    <ArtworkDetail 
      artwork={artwork} 
      children={children || []}
      canEdit={canEdit}
    />
  )
}

