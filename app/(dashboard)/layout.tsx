import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'
import { WhatsNewModal } from '@/components/changelog/whats-new-modal'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { getUserSubscriptionLimits } from '@/lib/subscription'
import type { FamilyMemberWithFamily, Family } from '@/lib/supabase/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get ALL families the user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('*, families(*)')
    .eq('user_id', user.id) as { data: FamilyMemberWithFamily[] | null }

  const families: Family[] = memberships?.map(m => m.families).filter(Boolean) as Family[] ?? []
  
  // Get selected family from cookie, or use first family
  const selectedFamilyId = cookieStore.get('selected_family')?.value
  
  // Find the current family and membership
  let currentMembership = memberships?.find(m => m.family_id === selectedFamilyId)
  
  // If no valid selection, use first family
  if (!currentMembership && memberships && memberships.length > 0) {
    currentMembership = memberships[0]
  }
  
  const family = currentMembership?.families ?? null
  const role = currentMembership?.role ?? null
  const familyId = family?.id ?? null

  // Check if user has children (for onboarding)
  let hasChildren = false
  let hasArtwork = false
  
  // Get subscription limits for sidebar counter
  const limits = await getUserSubscriptionLimits(user.id)
  
  if (familyId) {
    const [childrenResult, artworkResult] = await Promise.all([
      supabase.from('children').select('id').eq('family_id', familyId).limit(1),
      supabase.from('artworks').select('id').eq('family_id', familyId).limit(1),
    ])
    hasChildren = (childrenResult.data?.length ?? 0) > 0
    hasArtwork = (artworkResult.data?.length ?? 0) > 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-rose-50/50 dark:from-background dark:via-background dark:to-background">
      <DashboardHeader 
        user={user} 
        family={family} 
        families={families}
        role={role} 
      />
      <div className="flex">
        <DashboardNav
          role={role}
          currentArtworks={limits.currentArtworks}
          artworkLimit={limits.artworkLimit}
          planId={limits.planId}
          userEmail={user.email ?? null}
        />
        <main 
          id="main-content" 
          className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64 mt-16"
          role="main"
          aria-label="Main content"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <WhatsNewModal />
      <OnboardingModal 
        hasChildren={hasChildren} 
        hasArtwork={hasArtwork} 
        familyId={familyId}
      />
    </div>
  )
}
