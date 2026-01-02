import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'
import type { PlanId } from '@/lib/stripe'

export interface SubscriptionLimits {
  planId: PlanId
  status: string
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
  
  // Get subscription using the database function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptionData } = await (supabase as any)
    .rpc('get_user_subscription', { target_user_id: userId })
    .single() as { data: {
      plan_id: PlanId
      status: string
      artwork_limit: number
      family_limit: number
      children_limit: number
    } | null }

  const planId = subscriptionData?.plan_id || 'free'
  const status = subscriptionData?.status || 'active'
  const artworkLimit = subscriptionData?.artwork_limit ?? PLANS.free.limits.artworks
  const familyLimit = subscriptionData?.family_limit ?? PLANS.free.limits.families
  const childrenLimit = subscriptionData?.children_limit ?? PLANS.free.limits.children

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
    status,
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
  
  // Check limit
  const allowed = limits.currentArtworks < limits.artworkLimit
  
  return {
    allowed,
    limit: limits.artworkLimit,
    current: limits.currentArtworks,
    message: allowed 
      ? undefined 
      : `You've reached the limit of ${limits.artworkLimit} artworks on the free plan. Upgrade to upload more!`
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

