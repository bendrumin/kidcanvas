import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Crown, Zap } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  plan?: 'family' | 'pro'
  description?: string
  currentPlan?: 'free' | 'family' | 'pro'
}

const planInfo = {
  family: {
    name: 'Family Plan',
    price: '$4.99/mo',
    icon: Crown,
    gradient: 'from-crayon-pink to-crayon-purple',
  },
  pro: {
    name: 'Pro Plan',
    price: '$9.99/mo',
    icon: Zap,
    gradient: 'from-crayon-blue to-crayon-purple',
  },
}

export function UpgradePrompt({ 
  feature, 
  plan = 'family',
  description,
  currentPlan = 'free',
}: UpgradePromptProps) {
  const info = planInfo[plan]
  const Icon = info.icon

  // If user already has the required plan or higher, don't show
  if (
    (plan === 'family' && (currentPlan === 'family' || currentPlan === 'pro')) ||
    (plan === 'pro' && currentPlan === 'pro')
  ) {
    return null
  }

  return (
    <Card className="p-8 md:p-12 text-center">
      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${info.gradient}/20 flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-10 h-10 ${plan === 'family' ? 'text-crayon-purple' : 'text-crayon-blue'}`} />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">
        {feature} Available in {info.name}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description || `Upgrade to ${info.name} to unlock ${feature.toLowerCase()}.`}
      </p>
      <Button asChild className={`bg-gradient-to-r ${info.gradient} hover:opacity-90`}>
        <Link href="/dashboard/billing">
          <Sparkles className="w-5 h-5 mr-2" />
          View Plans
        </Link>
      </Button>
    </Card>
  )
}

