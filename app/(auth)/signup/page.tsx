'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/utils'
import { Mail, Lock, User, Users, Loader2, Check, AlertCircle, GraduationCap } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Checkbox } from '@/components/ui/checkbox'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    familyName: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Check URL parameter for teacher signup
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'teacher') {
      setIsTeacher(true)
    }
  }, [searchParams])

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    const validation = validatePassword(password)
    setPasswordErrors(validation.errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password before submitting
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast({
        title: 'Invalid Password',
        description: passwordValidation.errors[0],
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            family_name: formData.familyName || `${formData.fullName.split(' ')[0]}'s ${isTeacher ? 'Classroom' : 'Family'}`,
            user_type: isTeacher ? 'teacher' : 'parent',
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Check if user session exists (auto-confirm is enabled)
        if (authData.session) {
          // User is already logged in, create family immediately
          const familyName = formData.familyName || `${formData.fullName.split(' ')[0]}'s ${isTeacher ? 'Classroom' : 'Family'}`
          const { error: familyError } = await supabase.rpc('create_family_for_user', { family_name: familyName } as never)

          if (familyError) {
            console.error('Failed to create family:', familyError)
            toast({
              title: 'Account Created with Warning',
              description: `Your account was created but there was an issue setting up your ${isTeacher ? 'classroom' : 'family'}. Please contact support.`,
              variant: 'destructive',
            })
            // Still redirect to dashboard - they can create a family there
          } else {
            toast({
              title: 'Welcome to KidCanvas!',
              description: `Your ${isTeacher ? 'portfolio system' : 'gallery'} is ready.`,
            })
          }

          router.push('/dashboard')
          router.refresh()
          return
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
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] dark:bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display">
              {isTeacher ? 'Create Your Portfolio System' : 'Create Your Gallery'}
            </CardTitle>
            <CardDescription>
              {isTeacher
                ? 'Start organizing your students\' artwork today'
                : 'Start preserving your children\'s artwork today'
              }
            </CardDescription>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                <span>unlimited {isTeacher ? 'students' : 'artworks'} free</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                <span>No credit card</span>
              </div>
            </div>
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {formData.password && passwordErrors.length > 0 && (
                  <div className="space-y-1">
                    {passwordErrors.map((error, index) => (
                      <div key={index} className="flex items-start gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
                {formData.password && passwordErrors.length === 0 && (
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Password meets all requirements
                  </p>
                )}
                {!formData.password && (
                  <p className="text-xs text-muted-foreground">
                    Must include uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="familyName">
                  {isTeacher ? 'Classroom Name' : 'Family Name'}
                </Label>
                <div className="relative">
                  {isTeacher ? (
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  )}
                  <Input
                    id="familyName"
                    type="text"
                    placeholder={isTeacher ? "Ms. Smith's 3rd Grade" : "The Johnson Family"}
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional — we'll create one based on your name</p>
              </div>

              {!isTeacher && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <Checkbox
                    id="teacher"
                    checked={isTeacher}
                    onCheckedChange={(checked) => setIsTeacher(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="teacher"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I'm an art teacher
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Get a portfolio system for your classroom instead
                    </p>
                  </div>
                </div>
              )}

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
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-xs text-green-800 dark:text-green-200 text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Your data is secure. Cancel anytime. No hidden fees.
                </p>
              </div>
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] dark:bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}

