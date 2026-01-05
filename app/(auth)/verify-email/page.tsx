'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirect = searchParams.get('redirect') || '/dashboard'
  const inviteCode = searchParams.get('invite')

  useEffect(() => {
    const verifyEmail = async () => {
      const supabase = createClient()
      
      // Check if there's a code in the URL (from email link or callback)
      const code = searchParams.get('code')
      
      if (code) {
        // Exchange code for session
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            setIsVerifying(false)
            return
          }
          
          // Code exchanged successfully, check if user is verified
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email_confirmed_at) {
            setIsVerified(true)
            setIsVerifying(false)
          } else {
            setError('Email verification failed')
            setIsVerifying(false)
          }
        } catch (err) {
          setError('Failed to verify email')
          setIsVerifying(false)
        }
      } else {
        // No code - check if user is already verified (came from callback)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email_confirmed_at) {
          setIsVerified(true)
          setIsVerifying(false)
        } else {
          // User not verified and no code - might be a stale page
          setIsVerifying(false)
          setError('No verification code found. Please check your email for the confirmation link.')
        }
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleContinue = () => {
    if (inviteCode) {
      router.push(`/invite/${inviteCode}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-background dark:via-background dark:to-background p-4">
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
            {isVerifying ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-blue to-crayon-purple flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <CardTitle className="text-2xl font-display">Verifying Email...</CardTitle>
                <CardDescription className="text-base">
                  Please wait while we verify your email address
                </CardDescription>
              </>
            ) : isVerified ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-green to-crayon-blue flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">Email Verified!</CardTitle>
                <CardDescription className="text-base">
                  Your email address has been successfully verified
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-red/20 to-crayon-orange/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-crayon-red" />
                </div>
                <CardTitle className="text-2xl font-display">Verification Failed</CardTitle>
                <CardDescription className="text-base">
                  {error || 'Unable to verify your email address'}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  This will only take a moment...
                </p>
              </div>
            ) : isVerified ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-crayon-green/10 to-crayon-blue/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {inviteCode
                      ? "You can now complete joining the family!"
                      : "You're all set! Redirecting to your dashboard..."
                    }
                  </p>
                </div>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-crayon-green to-crayon-blue hover:opacity-90"
                >
                  {inviteCode ? 'Continue to Join Family' : 'Continue to Dashboard'}
                </Button>
                {!inviteCode && (
                  <div className="text-center">
                    <Link href="/dashboard" className="text-sm text-primary font-semibold hover:underline">
                      Go to Dashboard →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">
                    Please try clicking the verification link again, or request a new verification email.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/login')}
                    className="flex-1"
                  >
                    Go to Login
                  </Button>
                  <Button 
                    onClick={() => router.push('/signup')}
                    className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
                  >
                    Sign Up Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-background dark:via-background dark:to-background p-4">
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-blue to-crayon-purple flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <CardTitle className="text-2xl font-display">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

