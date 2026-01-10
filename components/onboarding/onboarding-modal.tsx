'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Baby, Upload, Sparkles, ArrowRight, Loader2, Check, BookOpen, Camera, Heart } from 'lucide-react'
import { LimitReachedDialog } from '@/components/paywall/limit-reached-dialog'

const ONBOARDING_KEY = 'kidcanvas_onboarding_complete'

interface OnboardingModalProps {
  hasChildren: boolean
  hasArtwork: boolean
  familyId: string | null
}

export function OnboardingModal({ hasChildren, hasArtwork, familyId }: OnboardingModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0) // Start at 0 for welcome screen
  const [isLoading, setIsLoading] = useState(false)
  const [childName, setChildName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ current: number; limit: number } | null>(null)

  useEffect(() => {
    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY)
    
    if (!hasCompletedOnboarding && !hasChildren && familyId) {
      // Show onboarding after a brief delay
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasChildren, familyId])

  const handleAddChild = async () => {
    if (!childName.trim() || !birthDate || !familyId) return
    
    setIsLoading(true)
    try {
      // Check limit first
      const limitResponse = await fetch('/api/limits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'children', familyId }),
      })

      const limitCheck = await limitResponse.json()

      if (!limitCheck.allowed) {
        setLimitInfo({ current: limitCheck.current, limit: limitCheck.limit })
        setShowLimitDialog(true)
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      
      const { error } = await (supabase.from('children') as any).insert({
        family_id: familyId,
        name: childName.trim(),
        birth_date: birthDate,
      })

      if (error) throw error

      setStep(3)
      router.refresh()
    } catch (error) {
      console.error('Error adding child:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)

    if (step === 3) {
      router.push('/dashboard/upload')
    }
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        {step === 0 && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-display text-center">
                Welcome to KidCanvas!
              </DialogTitle>
              <DialogDescription className="text-center">
                More than just storage - capture the stories behind every masterpiece
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Tell the Story</h4>
                  <p className="text-xs text-muted-foreground">
                    What did they say? How did they feel? Capture the moment, not just the image.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-pink-50 dark:bg-pink-950/20">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Moment Photos</h4>
                  <p className="text-xs text-muted-foreground">
                    Add photos of your child creating art to remember their joy and pride.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Family Engagement</h4>
                  <p className="text-xs text-muted-foreground">
                    React, comment, and celebrate together as a family.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-display text-center">
                Add Your First Artist!
              </DialogTitle>
              <DialogDescription className="text-center">
                Let's add your child so we can organize their masterpieces
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name</Label>
                <Input
                  id="childName"
                  placeholder="e.g., Emma"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll calculate their age for each artwork
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                Skip for now
              </Button>
              <Button 
                onClick={handleAddChild}
                disabled={!childName.trim() || !birthDate || isLoading}
                className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Add Child
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-crayon-green to-crayon-blue flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-display text-center flex items-center justify-center gap-2">
                Perfect! <Sparkles className="w-6 h-6 text-crayon-pink" />
              </DialogTitle>
              <DialogDescription className="text-center">
                {childName} is ready to become a famous artist!
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Pro Tip: Stories Matter</h4>
                    <p className="text-xs text-muted-foreground">
                      When uploading, tell us what {childName} said about their artwork! Years from now, you'll treasure these moments more than the image alone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-crayon-orange/20 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5 text-crayon-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Ready to upload?</h4>
                    <p className="text-xs text-muted-foreground">
                      Scan or upload your first artwork and capture its story!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleComplete} className="flex-1">
                Later
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Artwork
              </Button>
            </div>
          </>
        )}
      </DialogContent>
      
      {limitInfo && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType="children"
          current={limitInfo.current}
          limit={limitInfo.limit}
        />
      )}
    </Dialog>
  )
}

