'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Share2, CreditCard, Palette, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CURRENT_VERSION = '1.0.0'
const CHANGELOG_KEY = 'kidcanvas_last_seen_version'
const WELCOME_SHOWN_KEY = 'kidcanvas_welcome_shown'

const changelog = [
  {
    version: '1.0.0',
    date: 'January 2025',
    title: "Welcome to KidCanvas! 🎨",
    highlights: [
      {
        icon: Palette,
        title: 'Beautiful Gallery',
        description: 'Your artwork displayed like real pieces pinned to a cork board',
      },
      {
        icon: Share2,
        title: 'Share with Anyone',
        description: 'Generate public links to share artwork with grandparents and friends',
      },
      {
        icon: CreditCard,
        title: 'Family Plans',
        description: 'Upgrade for unlimited artworks, AI tagging, and more',
      },
    ],
  },
]

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenVersion, setHasSeenVersion] = useState(true)

  useEffect(() => {
    const checkShouldShowWelcome = async () => {
      // Check if welcome has been shown before (persists even after logout)
      const welcomeShown = localStorage.getItem(WELCOME_SHOWN_KEY)

      if (welcomeShown === 'true') {
        // User has seen the welcome modal before, don't show again
        return
      }

      // Check if user is authenticated
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // Only show for new users - check if account was created in last 7 days
      const accountCreatedAt = new Date(user.created_at)
      const daysSinceCreation = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceCreation > 7) {
        // Account is older than 7 days, mark as welcome shown and don't display
        localStorage.setItem(WELCOME_SHOWN_KEY, 'true')
        return
      }

      // Small delay so it doesn't pop up immediately
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasSeenVersion(false)
      }, 1500)

      return () => clearTimeout(timer)
    }

    checkShouldShowWelcome()
  }, [])

  const handleClose = () => {
    // Mark welcome as shown permanently
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true')
    localStorage.setItem(CHANGELOG_KEY, CURRENT_VERSION)
    setIsOpen(false)
    setHasSeenVersion(true)
  }

  const currentChangelog = changelog[0]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-crayon-orange" />
            <Badge variant="secondary">v{currentChangelog.version}</Badge>
          </div>
          <DialogTitle className="text-2xl font-display">
            {currentChangelog.title}
          </DialogTitle>
          <DialogDescription>
            {currentChangelog.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentChangelog.highlights.map((highlight, i) => (
            <div 
              key={i} 
              className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-crayon-pink/5 hover:to-crayon-purple/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shrink-0">
                <highlight.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">{highlight.title}</h4>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleClose}
            className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
          >
            Let's Go! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button for manual access
export function WhatsNewButton() {
  const [isOpen, setIsOpen] = useState(false)
  const currentChangelog = changelog[0]

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground"
      >
        <Sparkles className="w-4 h-4 mr-1" />
        What's New
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-crayon-orange" />
              <Badge variant="secondary">v{currentChangelog.version}</Badge>
            </div>
            <DialogTitle className="text-2xl font-display">
              {currentChangelog.title}
            </DialogTitle>
            <DialogDescription>
              {currentChangelog.date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentChangelog.highlights.map((highlight, i) => (
              <div 
                key={i} 
                className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shrink-0">
                  <highlight.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">{highlight.title}</h4>
                  <p className="text-sm text-muted-foreground">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsOpen(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

