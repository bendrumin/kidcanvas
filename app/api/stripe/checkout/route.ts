import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { Subscription } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout: Starting...')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Checkout: Auth error:', authError)
      return NextResponse.json({ error: 'Auth error: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      console.log('Checkout: No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Checkout: User:', user.id)

    const body = await request.json()
    const { priceId, planId, interval } = body

    console.log('Checkout: Request body:', { priceId, planId, interval })

    if (!priceId || !planId) {
      return NextResponse.json({ error: 'Missing price or plan ID' }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    console.log('Checkout: Checking for existing subscription...')
    const { data: subscription, error: subError } = await (supabase
      .from('subscriptions') as any)
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      console.error('Checkout: Subscription query error:', subError)
    }

    console.log('Checkout: Existing subscription:', subscription)

    let customerId = subscription?.stripe_customer_id

    // Create a new customer if needed
    if (!customerId) {
      console.log('Checkout: Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
      console.log('Checkout: Created customer:', customerId)

      // Create or update subscription record
      console.log('Checkout: Upserting subscription record...')
      const { error: upsertError } = await (supabase
        .from('subscriptions') as any)
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan_id: 'free',
          status: 'active',
        }, {
          onConflict: 'user_id',
        })

      if (upsertError) {
        console.error('Checkout: Upsert error:', upsertError)
        // Continue anyway - we have the customer ID
      }
    }

    // Create checkout session
    console.log('Checkout: Creating checkout session...')
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
          interval: interval,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    console.log('Checkout: Session created:', session.id)
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    console.error('Checkout error message:', error.message)
    console.error('Checkout error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    )
  }
}

