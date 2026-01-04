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
    description: 'Perfect for getting started',
    features: [
      'Up to 100 artworks',
      '1 family',
      '3 children profiles',
      'Basic gallery view',
      'Public sharing links',
    ],
    limits: {
      artworks: 100,
      families: 1,
      children: 3,
    },
  },
  family: {
    name: 'Family',
    description: 'Everything your family needs',
    features: [
      'Unlimited artworks',
      '1 family',
      'Unlimited children',
      'AI auto-tagging',
      'Collections & albums',
      'Print-ready art books (PDF)',
      'QR code sharing',
      'Priority support',
      'No watermarks',
    ],
    limits: {
      artworks: -1, // unlimited
      families: 1,
      children: -1, // unlimited
    },
  },
  pro: {
    name: 'Pro',
    description: 'For extended families & schools',
    features: [
      'Everything in Family',
      'Multiple families',
      'Bulk upload',
      'Advanced analytics & insights',
      'Art growth timeline',
      'API access',
      'White-label sharing',
      'Dedicated support',
    ],
    limits: {
      artworks: -1,
      families: -1,
      children: -1,
    },
  },
}

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

