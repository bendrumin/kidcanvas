import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { JwsVerificationError, verifyAppleJws } from '@/lib/app-store/jws'
import {
  APP_STORE_BUNDLE_ID,
  EntitlementError,
  applyTransaction,
  decodeRenewalInfo,
  decodeTransaction,
  statusFromTransaction,
  type AppStoreRenewalInfo,
  type AppStoreStatus,
} from '@/lib/app-store/entitlements'

/**
 * POST /api/app-store/notifications
 *
 * App Store Server Notifications V2. Apple posts { signedPayload } for
 * renewals, expirations, billing problems, refunds and revocations. The outer
 * payload and the transaction and renewal info inside it are each separately
 * signed, and each is verified against the Apple root before anything is read.
 *
 * Idempotent: Apple retries until it gets a 200, and apply_app_store_transaction
 * ignores any payload older than the newest one already applied, so a retry or
 * an out-of-order delivery changes nothing.
 *
 * Response codes are chosen for Apple's retry logic: 400 for payloads that will
 * never verify (retrying is pointless), 500 only for our own failures (retry
 * is wanted), and 200 for anything we understood, including types we ignore.
 */

interface NotificationPayload {
  notificationType: string
  subtype?: string
  notificationUUID: string
  signedDate: number
  data?: {
    bundleId?: string
    environment?: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
    /** 1 active, 2 expired, 3 billing retry, 4 grace period, 5 revoked. */
    status?: number
  }
}

const STATUS_CODES: Record<number, AppStoreStatus> = {
  1: 'active',
  2: 'expired',
  3: 'billing_retry',
  4: 'grace_period',
  5: 'revoked',
}

export async function POST(request: NextRequest) {
  let signedPayload: unknown
  try {
    signedPayload = (await request.json())?.signedPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof signedPayload !== 'string') {
    return NextResponse.json({ error: 'signedPayload is required' }, { status: 400 })
  }

  let notification: NotificationPayload
  try {
    notification = verifyAppleJws<NotificationPayload>(signedPayload)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.warn('App Store notification: rejected signature:', reason)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { notificationType, subtype, notificationUUID, data } = notification
  const logTag = `[${notificationType}${subtype ? `/${subtype}` : ''} ${notificationUUID}]`

  if (data?.bundleId !== APP_STORE_BUNDLE_ID) {
    console.warn('App Store notification: wrong bundle', logTag, data?.bundleId)
    return NextResponse.json({ error: 'Wrong bundle' }, { status: 400 })
  }

  // TEST comes from "Request a Test Notification" in App Store Connect and
  // carries no transaction. Answering 200 is the whole test.
  if (notificationType === 'TEST' || !data.signedTransactionInfo) {
    console.log('App Store notification: nothing to apply', logTag)
    return NextResponse.json({ received: true })
  }

  try {
    const tx = decodeTransaction(data.signedTransactionInfo)
    let renewal: AppStoreRenewalInfo | null = null
    if (data.signedRenewalInfo) {
      renewal = decodeRenewalInfo(data.signedRenewalInfo)
    }

    // Prefer the status Apple states; fall back to reading the transaction.
    let status: AppStoreStatus =
      (data.status && STATUS_CODES[data.status]) || statusFromTransaction(tx)
    if (notificationType === 'REFUND' || (tx.revocationDate && notificationType !== 'REVOKE')) {
      status = 'refunded'
    } else if (notificationType === 'REVOKE') {
      // Family Sharing access withdrawn. Not a refund, but access ends.
      status = 'revoked'
    }

    const userId = await resolveUserId(tx.originalTransactionId, tx.appAccountToken)
    if (!userId) {
      // No row yet and no appAccountToken: a purchase made outside the app
      // (an offer code, say) by someone who has not opened it since. Nothing to
      // attach it to; the app's verify call will record it when they do.
      console.log('App Store notification: no matching user', logTag)
      return NextResponse.json({ received: true })
    }

    const outcome = await applyTransaction({
      userId,
      tx,
      status,
      // The notification's own signing time orders events. It is always at
      // least as new as the transaction info inside it.
      signedAt: Math.max(notification.signedDate, tx.signedDate),
      renewal,
    })

    console.log('App Store notification:', logTag, outcome)
    return NextResponse.json({ received: true, outcome })
  } catch (error) {
    if (error instanceof JwsVerificationError || error instanceof EntitlementError) {
      console.warn('App Store notification: rejected', logTag, error.message)
      return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
    }
    if (error instanceof Error && /foreign key/i.test(error.message)) {
      // appAccountToken named a user that does not exist (deleted account, or
      // a token that was never a user id). Retrying will not change that.
      console.warn('App Store notification: token is not a user', logTag)
      return NextResponse.json({ received: true, outcome: 'ignored' })
    }
    console.error('App Store notification error', logTag, error)
    return NextResponse.json({ error: 'Failed to process notification' }, { status: 500 })
  }
}

/**
 * The user a subscription belongs to: whoever already holds the row, and only
 * for a subscription we have never seen, the appAccountToken the app set at
 * purchase.
 */
async function resolveUserId(
  originalTransactionId: string,
  appAccountToken: string | undefined
): Promise<string | null> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error } = await (supabase as any)
    .from('app_store_subscriptions')
    .select('user_id')
    .eq('original_transaction_id', originalTransactionId)
    .maybeSingle()

  if (error) throw new Error(`app_store_subscriptions lookup failed: ${error.message}`)
  if (existing?.user_id) return existing.user_id as string

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return appAccountToken && uuid.test(appAccountToken) ? appAccountToken.toLowerCase() : null
}

// Route segment config. node:crypto X509Certificate needs the Node runtime.
export const runtime = 'nodejs'
export const maxDuration = 10
