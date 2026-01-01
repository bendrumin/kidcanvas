import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChildrenList } from '@/components/children/children-list'
import { AddChildButton } from '@/components/children/add-child-button'
import type { FamilyMember, Child } from '@/lib/supabase/types'

type ChildWithCount = Child & { artworks: { count: number }[] }

export default async function ChildrenPage() {
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

  // Get children with artwork counts
  const { data: children } = await supabase
    .from('children')
    .select('*, artworks(count)')
    .eq('family_id', membership.family_id)
    .order('name') as { data: ChildWithCount[] | null }

  const canManage = membership.role === 'owner' || membership.role === 'parent'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Children</h1>
          <p className="text-muted-foreground mt-1">
            Manage your little artists
          </p>
        </div>
        {canManage && (
          <AddChildButton familyId={membership.family_id} />
        )}
      </div>

      <ChildrenList 
        children={children || []} 
        canManage={canManage}
        familyId={membership.family_id}
      />
    </div>
  )
}

