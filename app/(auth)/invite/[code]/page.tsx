import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteForm } from '@/components/family/accept-invite-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import type { FamilyInviteWithFamily } from '@/lib/supabase/types'

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params
  const supabase = await createClient()
  
  // Fetch the invite
  const { data: invite } = await supabase
    .from('family_invites')
    .select('*, families(*)')
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single() as { data: FamilyInviteWithFamily | null }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-background dark:via-background dark:to-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-red/20 to-crayon-orange/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-crayon-red" />
            </div>
            <CardTitle>Invalid or Expired Invite</CardTitle>
            <CardDescription>
              This invite link is no longer valid. It may have expired or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create your own family instead →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, check if already a member
  if (user) {
    const { data: membership } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', invite.family_id)
      .eq('user_id', user.id)
      .single()

    if (membership) {
      redirect('/dashboard')
    }

    // If user is logged in but not a member, they might have just confirmed their email
    // Try to auto-accept the invite
    try {
      const { error: acceptError } = await supabase.rpc('accept_family_invite', {
        invite_code: code,
        member_nickname: invite.nickname || null,
      } as never)

      if (!acceptError) {
        // Successfully accepted, redirect to dashboard
        redirect('/dashboard')
      }
      // If there's an error, continue to show the form
    } catch {
      // If auto-accept fails, continue to show the form
    }
  }

  const family = invite.families

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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-blue to-crayon-purple flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-display">You're Invited!</CardTitle>
            <CardDescription className="text-base">
              You've been invited to join the
            </CardDescription>
            <div className="mt-2 px-4 py-3 bg-gradient-to-r from-crayon-pink/10 to-crayon-purple/10 rounded-xl">
              <p className="text-xl font-display font-bold text-foreground">
                {family?.name}
              </p>
              <p className="text-sm text-muted-foreground">Family Gallery</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10 rounded-xl text-center">
              <p className="text-sm text-muted-foreground mb-1">You'll be joining as</p>
              <p className="text-lg font-semibold capitalize">{invite.role}</p>
              {invite.nickname && (
                <p className="text-sm text-muted-foreground mt-1">
                  Known as "{invite.nickname}"
                </p>
              )}
            </div>

            <AcceptInviteForm 
              inviteCode={code} 
              isLoggedIn={!!user}
              defaultNickname={invite.nickname}
              defaultEmail={invite.invited_email}
            />

            {!user && (
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href={`/login?redirect=/invite/${code}`} className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

