'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, Heart, Sparkles, X, Upload } from 'lucide-react'
import Link from 'next/link'

interface MemoryPrompt {
  id: string
  type: 'milestone' | 'seasonal' | 'reminder' | 'anniversary'
  title: string
  description: string
  icon: typeof Bell
  actionText: string
  actionHref: string
  canDismiss: boolean
}

interface MemoryPromptsProps {
  childrenData?: Array<{
    id: string
    name: string
    birthday?: string
  }>
  lastUploadDate?: string
  isPremium?: boolean
}

export function MemoryPrompts({
  childrenData = [],
  lastUploadDate,
  isPremium = false
}: MemoryPromptsProps) {
  const [prompts, setPrompts] = useState<MemoryPrompt[]>([])
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const generatedPrompts: MemoryPrompt[] = []
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDate = today.getDate()

    // Time-based reminder (if no recent upload)
    if (lastUploadDate) {
      const daysSinceUpload = Math.floor(
        (today.getTime() - new Date(lastUploadDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceUpload >= 7) {
        generatedPrompts.push({
          id: 'upload-reminder',
          type: 'reminder',
          title: 'Time to capture some memories!',
          description: `It's been ${daysSinceUpload} days since your last upload. Has your little artist created something new?`,
          icon: Upload,
          actionText: 'Upload Artwork',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        })
      }
    }

    // Birthday milestones
    childrenData.forEach(child => {
      if (child.birthday) {
        const birthDate = new Date(child.birthday)
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())

        // If birthday already passed this year, check next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1)
        }

        const daysUntilBirthday = Math.floor(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Birthday prompt 30 days before
        if (daysUntilBirthday <= 30 && daysUntilBirthday > 0) {
          generatedPrompts.push({
            id: `birthday-${child.id}`,
            type: 'milestone',
            title: `${child.name}'s birthday is coming up!`,
            description: `Only ${daysUntilBirthday} days until ${child.name} turns ${today.getFullYear() - birthDate.getFullYear()}. Capture their current artwork to remember this special time!`,
            icon: Calendar,
            actionText: 'Upload Artwork',
            actionHref: '/dashboard/upload',
            canDismiss: true,
          })
        }
      }
    })

    // Seasonal prompts
    const seasonalPrompts: Array<{ months: number[], prompt: MemoryPrompt }> = [
      {
        months: [11, 0, 1], // Dec, Jan, Feb
        prompt: {
          id: 'winter-art',
          type: 'seasonal',
          title: 'Winter wonderland artwork',
          description: 'Capture your child\'s winter-themed creations - snowmen, holidays, and cozy indoor projects!',
          icon: Sparkles,
          actionText: 'Upload Winter Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
      {
        months: [2, 3, 4], // Mar, Apr, May
        prompt: {
          id: 'spring-art',
          type: 'seasonal',
          title: 'Spring has sprung!',
          description: 'Document their spring-inspired artwork - flowers blooming, rain showers, and bright colors!',
          icon: Sparkles,
          actionText: 'Upload Spring Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
      {
        months: [5, 6, 7], // Jun, Jul, Aug
        prompt: {
          id: 'summer-art',
          type: 'seasonal',
          title: 'Summer creativity',
          description: 'Preserve their summer memories - beach scenes, outdoor adventures, and sunny days!',
          icon: Sparkles,
          actionText: 'Upload Summer Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
      {
        months: [8, 9, 10], // Sep, Oct, Nov
        prompt: {
          id: 'fall-art',
          type: 'seasonal',
          title: 'Fall into creativity',
          description: 'Save their autumn artwork - colorful leaves, harvest themes, and back-to-school projects!',
          icon: Sparkles,
          actionText: 'Upload Fall Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
    ]

    const currentSeasonalPrompt = seasonalPrompts.find(s =>
      s.months.includes(currentMonth)
    )
    if (currentSeasonalPrompt) {
      generatedPrompts.push(currentSeasonalPrompt.prompt)
    }

    // Holiday-specific prompts
    const holidayPrompts: Array<{ month: number, dates: number[], prompt: MemoryPrompt }> = [
      {
        month: 9, // October
        dates: Array.from({length: 31}, (_, i) => i + 1), // All of October
        prompt: {
          id: 'halloween',
          type: 'seasonal',
          title: 'Halloween creativity!',
          description: 'Don\'t forget to capture their spooky and fun Halloween artwork before the season ends!',
          icon: Sparkles,
          actionText: 'Upload Halloween Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
      {
        month: 11, // December
        dates: Array.from({length: 25}, (_, i) => i + 1), // First 25 days of December
        prompt: {
          id: 'winter-holidays',
          type: 'seasonal',
          title: 'Holiday season magic',
          description: 'Capture their festive artwork and holiday crafts to remember this special time of year!',
          icon: Heart,
          actionText: 'Upload Holiday Art',
          actionHref: '/dashboard/upload',
          canDismiss: true,
        }
      },
    ]

    const currentHolidayPrompt = holidayPrompts.find(h =>
      h.month === currentMonth && h.dates.includes(currentDate)
    )
    if (currentHolidayPrompt) {
      generatedPrompts.push(currentHolidayPrompt.prompt)
    }

    // Anniversary prompts (uploaded art from 1 year ago)
    // This would require checking artwork dates from the database
    // For now, we'll leave this as a placeholder for future implementation

    setPrompts(generatedPrompts)
  }, [childrenData, lastUploadDate])

  const handleDismiss = (promptId: string) => {
    setDismissedPrompts(prev => {
      const newSet = new Set(prev)
      newSet.add(promptId)
      return newSet
    })
  }

  const visiblePrompts = prompts.filter(p => !dismissedPrompts.has(p.id))

  if (visiblePrompts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {!isPremium && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span>Memory Prompts</span>
          <Badge variant="secondary" className="bg-gradient-to-r from-crayon-pink to-crayon-purple text-white text-xs">
            Premium Feature
          </Badge>
        </div>
      )}

      {visiblePrompts.map((prompt) => {
        const Icon = prompt.icon

        return (
          <Card
            key={prompt.id}
            className={`relative border-l-4 ${
              prompt.type === 'milestone'
                ? 'border-l-purple-500'
                : prompt.type === 'seasonal'
                ? 'border-l-pink-500'
                : 'border-l-blue-500'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    prompt.type === 'milestone'
                      ? 'bg-purple-100 dark:bg-purple-900/20'
                      : prompt.type === 'seasonal'
                      ? 'bg-pink-100 dark:bg-pink-900/20'
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      prompt.type === 'milestone'
                        ? 'text-purple-600 dark:text-purple-400'
                        : prompt.type === 'seasonal'
                        ? 'text-pink-600 dark:text-pink-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{prompt.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {prompt.description}
                    </CardDescription>
                  </div>
                </div>

                {prompt.canDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-2"
                    onClick={() => handleDismiss(prompt.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Button
                asChild
                size="sm"
                className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
              >
                <Link href={prompt.actionHref}>
                  {prompt.actionText}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
