import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'month',
    features: [
      'Up to 50 artworks',
      '1 family',
      '3 children profiles',
      'Basic gallery view',
      'Public sharing links',
    ],
    limitations: [
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
    description: 'Everything your family needs',
    price: 4.99,
    interval: 'month',
    features: [
      'Unlimited artworks',
      '1 family',
      'Unlimited children',
      'AI auto-tagging',
      'Collections & albums',
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
    price: 9.99,
    interval: 'month',
    features: [
      'Everything in Family',
      'Multiple families',
      'Bulk upload',
      'Advanced analytics',
      'API access',
      'White-label sharing',
      'Dedicated support',
    ],
    limitations: [],
    icon: Zap,
    popular: false,
  },
]

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // In a real app, you'd fetch the user's current subscription from Stripe
  const currentPlan = 'free' // Placeholder

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>You're currently on the Free plan</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              Free
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Artworks Used</p>
              <p className="text-2xl font-bold">12 / 50</p>
            </div>
            <div>
              <p className="text-muted-foreground">Children</p>
              <p className="text-2xl font-bold">2 / 3</p>
            </div>
            <div>
              <p className="text-muted-foreground">Storage</p>
              <p className="text-2xl font-bold">124 MB</p>
            </div>
            <div>
              <p className="text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">5 uploads</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === currentPlan
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-crayon-pink to-crayon-purple">
                    Most Popular
                  </Badge>
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
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
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
                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No billing history yet</p>
            <p className="text-sm">Upgrade to a paid plan to see your invoices here</p>
          </div>
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
        </CardContent>
      </Card>
    </div>
  )
}

