import type { PlanId } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyAppleJws } from '@/lib/app-store/jws'

/**
 * StoreKit 2 transaction as Apple signs it (JWSTransactionDecodedPayload).
 * Only the fields we read; dates are milliseconds since the epoch.
 */
export interface AppStoreTransaction {
  transactionId: string
  originalTransactionId: string
  bundleId: string
  productId: string
  type: string
  environment: string
  signedDate: number
  purchaseDate?: number
  expiresDate?: number
  revocationDate?: number
  revocationReason?: number
  appAccountToken?: string
  isUpgraded?: boolean
  inAppOwnershipType?: string
}

/** JWSRenewalInfoDecodedPayload, the fields we read. */
export interface AppStoreRenewalInfo {
  originalTransactionId: string
  autoRenewStatus?: number
  gracePeriodExpiresDate?: number
  signedDate: number
}

export type AppStoreStatus =
  | 'active'
  | 'grace_period'
  | 'billing_retry'
  | 'expired'
  | 'revoked'
  | 'refunded'

/**
 * Bundle id every signed payload must carry. A JWS for another app is still a
 * perfectly valid Apple signature, so without this any app's receipt would
 * unlock KidCanvas.
 */
export const APP_STORE_BUNDLE_ID = process.env.APP_STORE_BUNDLE_ID || 'Siegel.KidCanvas'

/**
 * Product id to plan. Anything not listed grants nothing: an unknown product
 * is refused rather than guessed at, the same fail-closed rule the Stripe
 * webhook follows for missing metadata. Keep in sync with
 * ios/KidCanvasApp/Managers/StoreManager.swift and ios/KidCanvas.storekit.
 */
const PRODUCT_PLANS: Record<string, Exclude<PlanId, 'free'>> = {
  'kidcanvas.family.monthly': 'family',
  'kidcanvas.family.yearly': 'family',
  'kidcanvas.pro.monthly': 'pro',
  'kidcanvas.pro.yearly': 'pro',
}

export function planForProduct(productId: string): Exclude<PlanId, 'free'> | null {
  return PRODUCT_PLANS[productId] ?? null
}

export class EntitlementError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'EntitlementError'
  }
}

/** Verifies a signed transaction and checks it is a KidCanvas subscription. */
export function decodeTransaction(signedTransaction: string): AppStoreTransaction {
  const tx = verifyAppleJws<AppStoreTransaction>(signedTransaction)
  if (tx.bundleId !== APP_STORE_BUNDLE_ID) {
    throw new EntitlementError('Transaction is for a different app', 400)
  }
  if (tx.type !== 'Auto-Renewable Subscription') {
    throw new EntitlementError('Not a subscription transaction', 400)
  }
  if (!planForProduct(tx.productId)) {
    throw new EntitlementError('Unknown product', 400)
  }
  if (tx.environment !== 'Production' && tx.environment !== 'Sandbox') {
    // 'Xcode' transactions are signed by a local StoreKit test certificate and
    // never reach here, since that chain fails verification. Anything else is
    // unexpected.
    throw new EntitlementError('Unsupported environment', 400)
  }
  return tx
}

export function decodeRenewalInfo(signedRenewalInfo: string): AppStoreRenewalInfo {
  return verifyAppleJws<AppStoreRenewalInfo>(signedRenewalInfo)
}

/**
 * Status from the transaction alone, for the app's verify call, which has no
 * renewal info. A notification passes the status Apple states instead.
 */
export function statusFromTransaction(tx: AppStoreTransaction, now = Date.now()): AppStoreStatus {
  if (tx.revocationDate) return 'refunded'
  if (tx.expiresDate && tx.expiresDate > now) return 'active'
  return 'expired'
}

export interface ApplyInput {
  userId: string
  tx: AppStoreTransaction
  status: AppStoreStatus
  signedAt: number
  renewal?: AppStoreRenewalInfo | null
}

export type ApplyOutcome = 'applied' | 'stale' | 'conflict' | 'ignored'

/**
 * Writes one verified transaction through apply_app_store_transaction(), which
 * does the ownership check and the out-of-order guard atomically in Postgres.
 */
export async function applyTransaction(input: ApplyInput): Promise<ApplyOutcome> {
  const { userId, tx, status, signedAt, renewal } = input

  // When someone upgrades, Apple marks the old product's transaction
  // isUpgraded and issues a new one under the same original id. Applying the
  // old one would move the row back to the cheaper plan.
  if (tx.isUpgraded) return 'ignored'

  const planId = planForProduct(tx.productId)
  if (!planId) return 'ignored'

  const supabase = await createServiceClient()
  const toIso = (ms?: number) => (ms ? new Date(ms).toISOString() : null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('apply_app_store_transaction', {
    p_user_id: userId,
    p_original_transaction_id: tx.originalTransactionId,
    p_latest_transaction_id: tx.transactionId,
    p_product_id: tx.productId,
    p_plan_id: planId,
    p_status: status,
    p_expires_at: toIso(tx.expiresDate),
    p_grace_period_expires_at: toIso(renewal?.gracePeriodExpiresDate),
    p_revoked_at: toIso(tx.revocationDate),
    p_auto_renew: renewal?.autoRenewStatus === undefined ? null : renewal.autoRenewStatus === 1,
    p_environment: tx.environment,
    p_signed_at: new Date(signedAt).toISOString(),
  })

  if (error) {
    throw new Error(`apply_app_store_transaction failed: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data
  return (row?.outcome as ApplyOutcome) ?? 'stale'
}

/**
 * appAccountToken is set by the app to the Supabase user id at purchase, so it
 * arrives lowercase or uppercase depending on how Swift printed the UUID.
 */
export function sameUserId(a: string | undefined | null, b: string | undefined | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase()
}
