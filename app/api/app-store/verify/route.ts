import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { JwsVerificationError } from '@/lib/app-store/jws'
import {
  EntitlementError,
  applyTransaction,
  decodeTransaction,
  sameUserId,
  statusFromTransaction,
} from '@/lib/app-store/entitlements'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

/**
 * POST /api/app-store/verify
 *
 * The iOS app sends every StoreKit 2 transaction it sees here (purchase,
 * restore, and each Transaction.updates delivery) as the signed JWS StoreKit
 * hands it. We verify Apple's signature ourselves and record the entitlement
 * against the signed-in user, so the web recognizes an App Store subscriber.
 *
 * Body: { "signedTransaction": "<JWS>" }
 * Auth: Authorization: Bearer <Supabase access token>. Bearer only: purchases
 * happen in the app, and not accepting cookies means there is no CSRF surface.
 *
 * Returns the resolved plan (same shape as get_user_plan) so the app can update
 * its limits without a second round-trip.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.slice('Bearer '.length)
  )
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Signature checks are cheap but not free; a client looping on this should
  // not be able to monopolize the function.
  const rateLimit = checkRateLimit(getClientIdentifier(request, user.id), 'general')
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: { signedTransaction?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.signedTransaction !== 'string') {
    return NextResponse.json({ error: 'signedTransaction is required' }, { status: 400 })
  }

  try {
    const tx = decodeTransaction(body.signedTransaction)

    // The app sets appAccountToken to the Supabase user id at purchase. If it
    // names someone else, this Apple ID's subscription belongs to a different
    // KidCanvas account, and restoring it here would let one purchase unlock
    // any number of accounts. A missing token (an offer code redeemed in the
    // App Store, say) falls through to the signed-in user.
    if (tx.appAccountToken && !sameUserId(tx.appAccountToken, user.id)) {
      return NextResponse.json(
        { error: 'This subscription belongs to a different KidCanvas account', code: 'owned_elsewhere' },
        { status: 409 }
      )
    }

    const outcome = await applyTransaction({
      userId: user.id,
      tx,
      status: statusFromTransaction(tx),
      signedAt: tx.signedDate,
    })

    if (outcome === 'conflict') {
      return NextResponse.json(
        { error: 'This subscription belongs to a different KidCanvas account', code: 'owned_elsewhere' },
        { status: 409 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan } = await (supabase as any)
      .rpc('get_user_plan', { target_user_id: user.id })
      .maybeSingle()

    return NextResponse.json({ outcome, plan })
  } catch (error) {
    if (error instanceof JwsVerificationError) {
      console.warn('App Store verify: rejected JWS for user', user.id, error.message)
      return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 400 })
    }
    if (error instanceof EntitlementError) {
      console.warn('App Store verify: rejected transaction for user', user.id, error.message)
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('App Store verify error:', error)
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 })
  }
}

// Route segment config. node:crypto X509Certificate needs the Node runtime.
export const runtime = 'nodejs'
export const maxDuration = 10
