'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, User } from 'lucide-react'

interface AcceptInviteFormProps {
  inviteCode: string
  isLoggedIn: boolean
  defaultNickname: string | null
  defaultEmail?: string | null
}

export function AcceptInviteForm({ inviteCode, isLoggedIn, defaultNickname, defaultEmail }: AcceptInviteFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: defaultEmail || '',
    password: '',
    fullName: '',
    nickname: defaultNickname || '',
  })

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isLoggedIn) {
        // Sign up the user first
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/verify-email?invite=${inviteCode}&redirect=/invite/${inviteCode}`,
          },
        })

        if (signUpError) throw signUpError

        // Check if user has a session (auto-confirm enabled)
        if (!authData.session) {
          // Email confirmation required
          toast({
            title: 'Check your email!',
            description: 'Please confirm your email address, then return to this page to complete joining the family.',
          })
          setIsLoading(false)
          return
        }
      }

      // Accept the invite (user is now authenticated)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: inviteError } = await (supabase as any).rpc('accept_family_invite', {
        invite_code: inviteCode,
        member_nickname: formData.nickname || null,
      })

      if (inviteError) throw inviteError

      toast({
        title: 'Welcome to the family!',
        description: 'You now have access to the family gallery.',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join family'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoggedIn) {
    return (
      <form onSubmit={handleAccept} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">Your Nickname (optional)</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="nickname"
              placeholder="Grandma Sue"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            How should the family know you?
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-crayon-green to-crayon-blue hover:opacity-90" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Family'
          )}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleAccept} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Your Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="fullName"
            placeholder="Sarah Johnson"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="sarah@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10"
            required
            disabled={!!defaultEmail}
          />
        </div>
        {defaultEmail && (
          <p className="text-xs text-muted-foreground">
            Email address was provided with your invite
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="pl-10"
            minLength={8}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">At least 8 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="nickname"
            placeholder="Grandma Sue"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-crayon-green to-crayon-blue hover:opacity-90" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account & Join'
        )}
      </Button>
    </form>
  )
}

