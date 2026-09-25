'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface SettingsActionsProps {
  action: 'upgrade' | 'delete'
  planId?: string
  userId?: string
}

export function SettingsActions({ action, planId, userId }: SettingsActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  if (action === 'upgrade') {
    return (
      <Button 
        className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
        onClick={() => router.push('/dashboard/billing')}
      >
        Upgrade for $4.99/mo
      </Button>
    )
  }

  if (action === 'delete') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all associated data including artworks, families, and subscriptions
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                setIsLoading(true)
                try {
                  const response = await fetch('/api/account/delete', { method: 'POST' })
                  const body = await response.json().catch(() => ({}))
                  if (!response.ok) throw new Error(body.error || 'Deletion failed')

                  // The auth row is gone, so a server sign-out would fail.
                  await supabase.auth.signOut().catch(() => {})
                  toast({ title: 'Your account has been deleted.' })
                  window.location.assign('/')
                } catch (error) {
                  toast({
                    title: "Couldn't delete the account",
                    description:
                      error instanceof Error
                        ? error.message
                        : 'Email support@kidcanvas.app and we will do it by hand.',
                    variant: 'destructive',
                  })
                  setIsLoading(false)
                }
              }}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}
