'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Palette, Mail, Lock, User, Users, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    familyName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Create the family
        const { error: familyError } = await supabase.rpc('create_family_for_user', {
          family_name: formData.familyName || `${formData.fullName.split(' ')[0]}'s Family`,
        })

        if (familyError) {
          console.error('Failed to create family:', familyError)
          // Don't throw - user is created, family can be created later
        }
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      })

      router.push('/login')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-crayon-purple/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-crayon-blue/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-crayon-green/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
              <Palette className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
              KidCanvas
            </span>
          </Link>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display">Create Your Gallery</CardTitle>
            <CardDescription>Start preserving your children's artwork today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
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
                    placeholder="sarah@family.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="familyName"
                    type="text"
                    placeholder="The Johnson Family"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional — we'll create one based on your name</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your gallery...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Have an invite code?</p>
              <Link href="/invite">
                <Button variant="outline" size="sm">
                  Join an existing family
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

