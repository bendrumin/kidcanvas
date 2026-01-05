'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UsageWarningProps {
  current: number
  limit: number
  type: 'artwork' | 'children' | 'family'
}

export function UsageWarning({ current, limit, type }: UsageWarningProps) {
  // Only show warning if approaching limit (80% or more)
  const percentage = (current / limit) * 100
  if (percentage < 80) return null

  const isAtLimit = current >= limit
  const isNearLimit = percentage >= 90

  const messages = {
    artwork: {
      title: isAtLimit ? 'Artwork Limit Reached' : isNearLimit ? 'Almost at Artwork Limit' : 'Approaching Artwork Limit',
      description: isAtLimit
        ? `You've uploaded ${current} of ${limit} artworks. Upgrade to upload more!`
        : isNearLimit
        ? `You've uploaded ${current} of ${limit} artworks. Upgrade soon to keep uploading!`
        : `You've uploaded ${current} of ${limit} artworks. Consider upgrading for unlimited storage.`,
    },
    children: {
      title: isAtLimit ? 'Children Limit Reached' : isNearLimit ? 'Almost at Children Limit' : 'Approaching Children Limit',
      description: isAtLimit
        ? `You've added ${current} of ${limit} children. Upgrade to add more!`
        : isNearLimit
        ? `You've added ${current} of ${limit} children. Upgrade soon to add more!`
        : `You've added ${current} of ${limit} children. Consider upgrading for unlimited children.`,
    },
    family: {
      title: isAtLimit ? 'Family Limit Reached' : isNearLimit ? 'Almost at Family Limit' : 'Approaching Family Limit',
      description: isAtLimit
        ? `You've created ${current} of ${limit} family. Upgrade to Pro to create more!`
        : isNearLimit
        ? `You've created ${current} of ${limit} family. Upgrade to Pro soon!`
        : `You've created ${current} of ${limit} family. Upgrade to Pro for multiple families.`,
    },
  }

  const message = messages[type]

  return (
    <Alert 
      variant={isAtLimit ? 'destructive' : 'default'}
      className={cn(
        isAtLimit 
          ? 'border-destructive bg-destructive/5' 
          : isNearLimit 
          ? 'border-yellow-500/50 bg-yellow-500/5' 
          : 'border-primary/20 bg-primary/5'
      )}
    >
      <AlertTriangle className={cn(
        'h-4 w-4',
        isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-700 dark:text-yellow-500' : 'text-primary'
      )} />
      <AlertTitle className="font-semibold">{message.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message.description}</p>
        <Button asChild size="sm" className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
          <Link href="/dashboard/billing">
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

