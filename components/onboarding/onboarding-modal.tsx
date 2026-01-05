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
import { Baby, Upload, Sparkles, ArrowRight, Loader2, Check } from 'lucide-react'
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
  const [step, setStep] = useState(1)
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

      setStep(2)
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
    
    if (step === 2) {
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

        {step === 2 && (
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

            <div className="py-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-crayon-orange/20 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5 text-crayon-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Ready to upload?</h4>
                    <p className="text-sm text-muted-foreground">
                      Scan or upload your first artwork to start building your gallery!
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

