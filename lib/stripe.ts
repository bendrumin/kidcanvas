import Stripe from 'stripe'

// Lazy initialize to avoid build errors when env vars aren't set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility
export const stripe = {
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

// Price IDs from Stripe Dashboard
export const PRICE_IDS = {
  family_monthly: process.env.STRIPE_FAMILY_PRICE_ID!,
  family_yearly: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID!,
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID!,
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
} as const

export type PlanId = 'free' | 'family' | 'pro'
export type BillingInterval = 'month' | 'year'

/**
 * Plans differ by LIMITS ONLY.
 *
 * lib/subscription.ts enforces exactly three things -- artwork count, child
 * count and family count -- and nothing in the app gates a feature on tier. So
 * these lists describe the caps, and INCLUDED_IN_ALL_PLANS describes what every
 * account gets. Do not add a feature here unless something actually checks the
 * tier before allowing it.
 */
export const PLANS: Record<PlanId, {
  name: string
  description: string
  features: string[]
  limits: {
    artworks: number
    families: number
    children: number
  }
}> = {
  free: {
    name: 'Free',
    description: 'Enough to see if it sticks',
    features: [
      '50 artworks',
      '1 child profile',
      '1 family',
    ],
    limits: {
      artworks: 50,
      families: 1,
      children: 1,
    },
  },
  family: {
    name: 'Family',
    description: 'For one household, without limits',
    features: [
      'Unlimited artworks',
      'Unlimited child profiles',
      '1 family',
    ],
    limits: {
      artworks: -1, // unlimited
      families: 1,
      children: -1, // unlimited
    },
  },
  pro: {
    name: 'Pro',
    description: 'For families spread across households',
    features: [
      'Unlimited artworks',
      'Unlimited child profiles',
      'Unlimited families, so grandparents and caregivers get their own',
    ],
    limits: {
      artworks: -1,
      families: -1,
      children: -1,
    },
  },
}

/**
 * Every account gets all of these, on every plan. Each one is a feature that
 * actually ships in the web app today -- verified, not aspirational.
 *
 * Deliberately absent: AI auto-tagging (the AI route was deleted), voice notes
 * (removed; there is no voice-notes bucket), video capture (never existed),
 * API access and white-label sharing (never built), and story templates (they
 * exist on iOS only -- the web selector was removed as dead code).
 */
export const INCLUDED_IN_ALL_PLANS: string[] = [
  'A story on every artwork, in their words',
  'Family reactions and comments',
  'Collections and albums',
  'Memory timeline view',
  'Print-ready art books (PDF)',
  'QR codes and public share links',
  'Bulk upload',
  'Insights on your dashboard',
]

export const PRICES = {
  family: {
    month: 4.99,
    year: 49.99, // ~17% discount
  },
  pro: {
    month: 9.99,
    year: 99.99, // ~17% discount
  },
}

