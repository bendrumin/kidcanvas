import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'
import type { FamilyMemberWithFamily } from '@/lib/supabase/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('*, families(*)')
    .eq('user_id', user.id)
    .single() as { data: FamilyMemberWithFamily | null }

  const family = membership?.families ?? null
  const role = membership?.role ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-rose-50/50">
      <DashboardHeader user={user} family={family} role={role} />
      <div className="flex">
        <DashboardNav role={role} />
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

