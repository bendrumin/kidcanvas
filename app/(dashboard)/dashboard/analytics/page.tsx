import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { AnalyticsSkeleton } from '@/components/analytics/analytics-skeleton'
import { UpgradePrompt } from '@/components/paywall/upgrade-prompt'
import { getUserSubscriptionLimits } from '@/lib/subscription'
import { Suspense } from 'react'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Art Analytics',
  description: 'Insights and statistics about your family\'s artwork collection.',
}

interface AnalyticsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const childFilter = typeof params.child === 'string' ? params.child : undefined

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: { family_id: string; role: string } | null }

  if (!membership) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold mb-4">No Family Found</h2>
      </div>
    )
  }

  // Fetch artworks
  let artworkQuery = supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
  
  if (childFilter && childFilter !== 'all') {
    artworkQuery = artworkQuery.eq('child_id', childFilter)
  }

  const { data: artworks } = await artworkQuery as { data: ArtworkWithChild[] | null }

  // Fetch children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('name') as { data: Child[] | null }

  // Check subscription for advanced analytics
  const limits = await getUserSubscriptionLimits(user.id)
  const hasAdvancedAnalytics = limits.planId === 'pro'

  if (!artworks || artworks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Art Analytics
        </h1>
        <p className="text-muted-foreground mb-8">
          Insights and statistics about your artwork collection
        </p>
        <div className="bg-white dark:bg-card rounded-2xl border border-amber-100 dark:border-border p-12 text-center">
          <div className="flex justify-center mb-4">
            <BarChart3 className="w-16 h-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No artwork yet
          </h3>
          <p className="text-muted-foreground">
            Upload some artwork to see analytics and insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Art Analytics
        </h1>
        <p className="text-muted-foreground">
          Insights and statistics about your artwork collection
        </p>
      </div>

      {!hasAdvancedAnalytics ? (
        <UpgradePrompt
          feature="Advanced Analytics"
          plan="pro"
          description="Unlock detailed charts, insights, and analytics to understand your children's artistic journey."
          currentPlan={limits.planId}
        />
      ) : (
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDashboard
            artworks={artworks}
            children={children || []}
            selectedChildId={childFilter || undefined}
          />
        </Suspense>
      )}
    </div>
  )
}

