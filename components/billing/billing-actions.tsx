'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface BillingActionsProps {
  planId?: string
  priceId?: string
  yearlyPriceId?: string
  currentPlan?: string
  isCurrent?: boolean
  isPopular?: boolean
  hasSubscription?: boolean
  showPortalOnly?: boolean
}

// Wrapper to handle Suspense for useSearchParams
export function BillingActions(props: BillingActionsProps) {
  return (
    <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md" />}>
      <BillingActionsContent {...props} />
    </Suspense>
  )
}

function BillingActionsContent({
  planId,
  priceId,
  yearlyPriceId,
  currentPlan = 'free',
  isCurrent = false,
  isPopular = false,
  hasSubscription = false,
  showPortalOnly = false,
}: BillingActionsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showIntervalDialog, setShowIntervalDialog] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month')

  // Handle success/cancel messages
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Welcome to your new plan!', {
        description: 'Your subscription is now active.',
      })
      // Clean up URL
      router.replace('/dashboard/billing')
    } else if (canceled === 'true') {
      toast.info('Checkout canceled', {
        description: 'No charges were made.',
      })
      router.replace('/dashboard/billing')
    }
  }, [searchParams, router])

  const handleCheckout = async () => {
    if (!priceId) return
    
    setIsLoading(true)
    try {
      const selectedPriceId = selectedInterval === 'year' && yearlyPriceId 
        ? yearlyPriceId 
        : priceId

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPriceId,
          planId,
          interval: selectedInterval,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      toast.error('Failed to start checkout', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
      setShowIntervalDialog(false)
    }
  }

  const handlePortal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error: any) {
      toast.error('Failed to open billing portal', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Portal only mode (for manage subscription button)
  if (showPortalOnly) {
    return (
      <Button
        onClick={handlePortal}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        View Invoices & Manage Billing
        <ExternalLink className="w-3 h-3 ml-1" />
      </Button>
    )
  }

  // Current plan with subscription - show manage button
  if (isCurrent && hasSubscription) {
    return (
      <Button
        onClick={handlePortal}
        disabled={isLoading}
        variant="outline"
        className="w-full gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        Manage Subscription
      </Button>
    )
  }

  // Current plan without subscription (free)
  if (isCurrent) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Current Plan
      </Button>
    )
  }

  // Free plan - downgrade (would go through portal)
  if (planId === 'free') {
    if (hasSubscription) {
      return (
        <Button
          onClick={handlePortal}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Downgrade'
          )}
        </Button>
      )
    }
    return (
      <Button className="w-full" variant="outline" disabled>
        Current Plan
      </Button>
    )
  }

  // Paid plan - show upgrade button
  const isUpgrade = currentPlan === 'free' || 
    (currentPlan === 'family' && planId === 'pro')
  
  return (
    <>
      <Button
        onClick={() => {
          if (yearlyPriceId) {
            setShowIntervalDialog(true)
          } else {
            handleCheckout()
          }
        }}
        disabled={isLoading || !priceId}
        className={`w-full ${isPopular ? 'bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90' : ''}`}
        variant={isPopular ? 'default' : 'outline'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isUpgrade ? (
          'Upgrade'
        ) : (
          'Switch Plan'
        )}
      </Button>

      {/* Billing Interval Dialog */}
      <Dialog open={showIntervalDialog} onOpenChange={setShowIntervalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Billing Interval</DialogTitle>
            <DialogDescription>
              Save money with annual billing
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={selectedInterval}
            onValueChange={(value) => setSelectedInterval(value as 'month' | 'year')}
            className="grid gap-4 py-4"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border hover:border-primary cursor-pointer">
              <RadioGroupItem value="month" id="month" />
              <Label htmlFor="month" className="flex-1 cursor-pointer">
                <div className="font-medium">Monthly</div>
                <div className="text-sm text-muted-foreground">
                  Billed monthly, cancel anytime
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg border border-green-200 bg-green-50 hover:border-green-500 cursor-pointer relative">
              <RadioGroupItem value="year" id="year" />
              <Label htmlFor="year" className="flex-1 cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  Yearly
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                    Save ~17%
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Billed annually, best value
                </div>
              </Label>
            </div>
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntervalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Continue to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

