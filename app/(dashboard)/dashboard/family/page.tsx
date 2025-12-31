import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberList } from '@/components/family/member-list'
import { InviteButton } from '@/components/family/invite-button'
import { PendingInvites } from '@/components/family/pending-invites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default async function FamilyPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family and role
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role, families(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  const family = membership.families
  const userRole = membership.role
  const canInvite = userRole === 'owner' || userRole === 'parent'

  // Get all family members
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('joined_at')

  // Get pending invites (for owners/parents)
  const { data: invites } = canInvite ? await supabase
    .from('family_invites')
    .select('*')
    .eq('family_id', membership.family_id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }) : { data: null }

  // Get member emails from auth
  const memberEmails: Record<string, string> = {}
  if (members) {
    // Note: In production, you'd fetch these from your users table or a view
    // For now, we'll use the user_id as a placeholder
    members.forEach(m => {
      memberEmails[m.user_id] = m.user_id === user.id ? user.email || 'You' : 'Family Member'
    })
    memberEmails[user.id] = user.email || 'You'
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Family</h1>
          <p className="text-muted-foreground mt-1">
            Manage your family members and invites
          </p>
        </div>
        {canInvite && (
          <InviteButton familyId={membership.family_id} familyName={family?.name || 'Your Family'} />
        )}
      </div>

      {/* Family Info */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-crayon-blue to-crayon-purple flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <CardTitle>{family?.name}</CardTitle>
            <CardDescription>
              {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Members</h2>
        <MemberList 
          members={members || []} 
          currentUserId={user.id}
          currentUserRole={userRole}
          memberEmails={memberEmails}
          familyId={membership.family_id}
        />
      </div>

      {/* Pending Invites */}
      {canInvite && invites && invites.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Pending Invites</h2>
          <PendingInvites invites={invites} />
        </div>
      )}
    </div>
  )
}

