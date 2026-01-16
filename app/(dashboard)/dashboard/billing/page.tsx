import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Crown, Zap, AlertCircle } from 'lucide-react'
import { BillingActions } from '@/components/billing/billing-actions'
import { cookies } from 'next/headers'

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: { month: 0, year: 0 },
    features: [
      '50 artworks with stories',
      '1 family',
      '1 child profile',
      'Basic story capture',
      'Family reactions & comments',
      'Basic moment photos',
      'Public sharing links',
    ],
    limitations: [
      'No story templates',
      'No AI tagging',
      'No collections',
      'Standard support',
    ],
    icon: Sparkles,
    popular: false,
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Unlimited memories & storytelling',
    price: { month: 4.99, year: 49.99 },
    priceId: {
      month: process.env.STRIPE_FAMILY_PRICE_ID,
      year: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID,
    },
    features: [
      'Unlimited artworks with stories',
      'Unlimited children',
      'Unlimited moment photos',
      'Story templates & prompts',
      'Memory timeline view',
      'Family reactions & comments',
      'AI auto-tagging',
      'Collections & albums',
      'Print-ready art books (PDF)',
      'QR code sharing',
      'Priority support',
      'No watermarks',
    ],
    limitations: [],
    icon: Crown,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For extended families & schools',
    price: { month: 9.99, year: 99.99 },
    priceId: {
      month: process.env.STRIPE_PRO_PRICE_ID,
      year: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    features: [
      'Everything in Family',
      'Multiple families (grandparents, classrooms)',
      'Voice note stories',
      'Video moment capture',
      'Advanced story templates',
      'Growth tracking & milestones',
      'Bulk upload & operations',
      'Advanced analytics & insights',
      'Story timeline view',
      'API access',
      'White-label sharing',
      'Dedicated support',
    ],
    limitations: [],
    icon: Zap,
    popular: false,
  },
]

async function getSubscriptionData(userId: string, supabase: any) {
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get usage stats
  const cookieStore = await cookies()
  const selectedFamilyId = cookieStore.get('selected_family')?.value

  let artworkCount = 0
  let childrenCount = 0

  if (selectedFamilyId) {
    const [artworksResult, childrenResult] = await Promise.all([
      supabase.from('artworks').select('id', { count: 'exact' }).eq('family_id', selectedFamilyId),
      supabase.from('children').select('id', { count: 'exact' }).eq('family_id', selectedFamilyId),
    ])
    artworkCount = artworksResult.count || 0
    childrenCount = childrenResult.count || 0
  }

  // Get family count
  const { count: familyCount } = await supabase
    .from('family_members')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)

  return {
    subscription: subscription || { plan_id: 'free', status: 'active' },
    usage: {
      artworks: artworkCount,
      children: childrenCount,
      families: familyCount || 0,
    },
  }
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { subscription, usage } = await getSubscriptionData(user.id, supabase)
  const currentPlan = subscription.plan_id || 'free'
  const isActive = subscription.status === 'active' || subscription.status === 'trialing'

  // Plan limits based on current plan
  const planLimits: Record<string, { artworks: number; children: number; families: number }> = {
    free: { artworks: 50, children: 1, families: 1 },
    family: { artworks: -1, children: -1, families: 1 },
    pro: { artworks: -1, children: -1, families: -1 },
  }
  const limits = planLimits[currentPlan] || planLimits.free

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-fluid-3xl font-display font-bold text-foreground">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Success/Cancel Messages */}
      <Suspense fallback={null}>
        <BillingMessages />
      </Suspense>

      {/* Current Plan */}
      <Card className={`border-2 ${subscription.status === 'past_due' ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>
                You're currently on the {plans.find(p => p.id === currentPlan)?.name || 'Free'} plan
                {subscription.cancel_at_period_end && ' (cancels at period end)'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {subscription.status === 'past_due' && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Payment Failed
                </Badge>
              )}
              <Badge variant="secondary" className="text-lg px-4 py-1 capitalize">
                {plans.find(p => p.id === currentPlan)?.name || 'Free'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Artworks Used</p>
              <p className="text-fluid-2xl font-bold">
                {usage.artworks} {limits.artworks > 0 ? `/ ${limits.artworks}` : ''}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Children</p>
              <p className="text-fluid-2xl font-bold">
                {usage.children} {limits.children > 0 ? `/ ${limits.children}` : ''}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Families</p>
              <p className="text-fluid-2xl font-bold">
                {usage.families} {limits.families > 0 ? `/ ${limits.families}` : ''}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Next Billing</p>
              <p className="text-fluid-2xl font-bold">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
          
          {/* Manage Subscription Button */}
          {subscription.stripe_customer_id && (
            <div className="mt-6 pt-4 border-t">
              <BillingActions 
                hasSubscription={!!subscription.stripe_subscription_id}
                currentPlan={currentPlan}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.id === currentPlan
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-crayon-pink to-crayon-purple">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Current</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-fluid-3xl font-bold">${plan.price.month}</span>
                    <span className="text-muted-foreground">/month</span>
                    {plan.price.year > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        or ${plan.price.year}/year (save ~17%)
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">—</span>
                          <span className="text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                
                <CardFooter>
                  <BillingActions
                    planId={plan.id}
                    priceId={plan.priceId?.month}
                    yearlyPriceId={plan.priceId?.year}
                    currentPlan={currentPlan}
                    isCurrent={isCurrent}
                    isPopular={plan.popular}
                    hasSubscription={!!subscription.stripe_subscription_id}
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription.stripe_customer_id ? (
            <div className="text-center py-4">
              <BillingActions 
                hasSubscription={!!subscription.stripe_subscription_id}
                currentPlan={currentPlan}
                showPortalOnly
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No billing history yet</p>
              <p className="text-sm">Upgrade to see invoices here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-muted-foreground">
              Your data is always safe. If you exceed the free plan limits, you won't be able to upload new artwork until you upgrade or delete some existing ones.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Do you offer refunds?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 14-day money-back guarantee for all new subscriptions.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Separate client component for handling URL params
function BillingMessages() {
  return null // Will be handled by BillingActions client component
}

