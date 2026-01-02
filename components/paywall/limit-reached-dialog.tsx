'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

interface LimitReachedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitType: 'artwork' | 'children' | 'family'
  current: number
  limit: number
}

export function LimitReachedDialog({
  open,
  onOpenChange,
  limitType,
  current,
  limit,
}: LimitReachedDialogProps) {
  const messages = {
    artwork: {
      title: 'Artwork Limit Reached',
      description: `You've uploaded ${current} artworks on the free plan. Upgrade to Family or Pro to upload unlimited artwork!`,
      feature: 'Unlimited Artworks',
    },
    children: {
      title: 'Children Limit Reached',
      description: `You've added ${current} children on the free plan. Upgrade to Family or Pro to add unlimited children!`,
      feature: 'Unlimited Children',
    },
    family: {
      title: 'Family Limit Reached',
      description: `You've created ${current} family on the free plan. Upgrade to Pro to create multiple families!`,
      feature: 'Multiple Families',
    },
  }

  const message = messages[limitType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">{message.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {message.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10 rounded-xl p-4 border border-crayon-purple/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{message.feature}</p>
                <p className="text-sm text-muted-foreground">Available in Family & Pro plans</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
          >
            <Link href="/dashboard/billing">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

