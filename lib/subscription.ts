import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'
import type { PlanId } from '@/lib/stripe'

export type PlanSource = 'stripe' | 'app_store' | 'none'

export interface SubscriptionLimits {
  planId: PlanId
  /** Where the plan comes from. 'none' means free, nothing purchased. */
  source: PlanSource
  status: string
  expiresAt: string | null
  artworkLimit: number
  familyLimit: number
  childrenLimit: number
  currentArtworks: number
  currentFamilies: number
  currentChildren: number
}

export interface LimitCheckResult {
  allowed: boolean
  limit: number
  current: number
  message?: string
}

/**
 * Get user's subscription and current usage
 */
export async function getUserSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
  const supabase = await createClient()

  // get_user_plan (migration 014) resolves the best active entitlement across
  // Stripe and the App Store. The iOS app calls the same function, which is
  // what keeps the two platforms agreeing on limits.
  //
  // This used to call get_user_subscription and read plan_id/artwork_limit off
  // it, but the live function returns only `tier`, so every account resolved
  // to free no matter what it had paid for.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: planData, error: planError } = await (supabase as any)
    .rpc('get_user_plan', { target_user_id: userId })
    .maybeSingle() as {
      data: {
        plan_id: PlanId
        source: PlanSource
        status: string
        expires_at: string | null
        artwork_limit: number
        family_limit: number
        children_limit: number
      } | null
      error: { message: string } | null
    }

  if (planError) {
    // Fall back to free rather than failing the request, so a database that
    // does not have migration 014 yet behaves exactly as it did before.
    console.error('get_user_plan failed, treating as free:', planError.message)
  }

  const planId: PlanId =
    planData?.plan_id && planData.plan_id in PLANS ? planData.plan_id : 'free'
  const source: PlanSource = planData?.source || 'none'
  const status = planData?.status || 'active'
  const expiresAt = planData?.expires_at ?? null
  const artworkLimit = planData?.artwork_limit ?? PLANS[planId].limits.artworks
  const familyLimit = planData?.family_limit ?? PLANS[planId].limits.families
  const childrenLimit = planData?.children_limit ?? PLANS[planId].limits.children

  // Get current usage
  // Get user's families
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId) as { data: { family_id: string }[] | null }
  
  const familyIds = memberships?.map(m => m.family_id) || []
  
  // Get artwork count across all families
  const { count: artworkCount } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .in('family_id', familyIds)
  
  // Get children count across all families
  const { count: childrenCount } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .in('family_id', familyIds)

  return {
    planId,
    source,
    status,
    expiresAt,
    artworkLimit,
    familyLimit,
    childrenLimit,
    currentArtworks: artworkCount || 0,
    currentFamilies: familyIds.length,
    currentChildren: childrenCount || 0,
  }
}

/**
 * Check if user can add more artworks
 */
export async function checkArtworkLimit(userId: string, familyId: string): Promise<LimitCheckResult> {
  const limits = await getUserSubscriptionLimits(userId)

  // Unlimited plan
  if (limits.artworkLimit === -1) {
    return { allowed: true, limit: -1, current: limits.currentArtworks }
  }

  // Get artwork count for this specific family
  const supabase = await createClient()
  const { count } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)

  const currentCount = count || 0
  const allowed = currentCount < limits.artworkLimit

  return {
    allowed,
    limit: limits.artworkLimit,
    current: currentCount,
    message: allowed
      ? undefined
      : `You've reached the limit of ${limits.artworkLimit} artworks on the free plan. Upgrade to add more!`
  }
}

/**
 * Check if user can add more children
 */
export async function checkChildrenLimit(userId: string, familyId: string): Promise<LimitCheckResult> {
  const limits = await getUserSubscriptionLimits(userId)
  
  // Unlimited plan
  if (limits.childrenLimit === -1) {
    return { allowed: true, limit: -1, current: limits.currentChildren }
  }
  
  // Get children count for this specific family
  const supabase = await createClient()
  const { count } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)
  
  const currentCount = count || 0
  const allowed = currentCount < limits.childrenLimit
  
  return {
    allowed,
    limit: limits.childrenLimit,
    current: currentCount,
    message: allowed
      ? undefined
      : `You've reached the limit of ${limits.childrenLimit} children on the free plan. Upgrade to add more!`
  }
}

/**
 * Check if user can create more families
 */
export async function checkFamilyLimit(userId: string): Promise<LimitCheckResult> {
  const limits = await getUserSubscriptionLimits(userId)
  
  // Unlimited plan
  if (limits.familyLimit === -1) {
    return { allowed: true, limit: -1, current: limits.currentFamilies }
  }
  
  const allowed = limits.currentFamilies < limits.familyLimit
  
  return {
    allowed,
    limit: limits.familyLimit,
    current: limits.currentFamilies,
    message: allowed
      ? undefined
      : `You've reached the limit of ${limits.familyLimit} family on the free plan. Upgrade to create more!`
  }
}

