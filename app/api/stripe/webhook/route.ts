import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          await handleSubscriptionChange(supabase, subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user from customer ID
        const { data: existingSub } = await (supabase
          .from('subscriptions') as any)
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existingSub) {
          await (supabase
            .from('subscriptions') as any)
            .update({
              plan_id: 'free',
              status: 'canceled',
              stripe_subscription_id: null,
              billing_interval: null,
              current_period_start: null,
              current_period_end: null,
              cancel_at_period_end: false,
            })
            .eq('user_id', existingSub.user_id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          await handleSubscriptionChange(supabase, subscription)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { customer?: string }
        const customerId = invoice.customer as string

        await (supabase
          .from('subscriptions') as any)
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const planId = subscription.metadata.plan_id || 'family'
  const interval = subscription.items.data[0]?.plan?.interval || 'month'

  // Get user from metadata or customer ID
  let userId = subscription.metadata.supabase_user_id

  if (!userId) {
    const { data: existingSub } = await (supabase
      .from('subscriptions') as any)
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    userId = existingSub?.user_id
  }

  if (!userId) {
    console.error('No user ID found for subscription:', subscription.id)
    return
  }

  const status = mapStripeStatus(subscription.status)

  const sub = subscription as any
  await (supabase
    .from('subscriptions') as any)
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: status === 'active' || status === 'trialing' ? planId : 'free',
      status: status,
      billing_interval: interval,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    }, {
      onConflict: 'user_id',
    })
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'canceled':
      return 'canceled'
    case 'past_due':
      return 'past_due'
    case 'trialing':
      return 'trialing'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'active'
  }
}

// Route segment config
export const maxDuration = 10 // 10 seconds max for webhook processing

