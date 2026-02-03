'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { Ticket, ArrowRight } from 'lucide-react'

export default function InvitePage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.trim()) {
      router.push(`/invite/${inviteCode.trim()}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-background dark:via-background dark:to-background p-4 sm:p-6 lg:p-8">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-crayon-green/20 dark:bg-crayon-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-crayon-blue/20 dark:bg-crayon-blue/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-purple to-crayon-pink flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-fluid-2xl font-display">Join a Family</CardTitle>
            <CardDescription className="text-base">
              Enter the invite code you received to join an existing family gallery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The invite code was shared with you by a family member
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-crayon-purple to-crayon-pink hover:opacity-90"
                disabled={!inviteCode.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center space-y-4">
              <p className="text-sm text-muted-foreground">Don't have an invite code?</p>
              <div className="flex gap-3">
                <Link href="/signup" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Create a Family
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
