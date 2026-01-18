'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
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
  action: 'upgrade' | 'export' | 'delete'
  planId?: string
  userId?: string
}

export function SettingsActions({ action, planId, userId }: SettingsActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  if (action === 'upgrade') {
    return (
      <Button 
        className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
        onClick={() => router.push('/dashboard/billing')}
      >
        Upgrade — $4.99/mo
      </Button>
    )
  }

  if (action === 'export') {
    return (
      <Button 
        variant="outline"
        onClick={async () => {
          setIsLoading(true)
          toast({
            title: 'Coming soon!',
            description: 'Data export feature is in development. We\'ll notify you when it\'s ready.',
          })
          setIsLoading(false)
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </>
        )}
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
                  // TODO: Implement delete account API endpoint
                  toast({
                    title: 'Coming soon!',
                    description: 'Account deletion is in development. Please contact support if you need immediate deletion.',
                    variant: 'destructive',
                  })
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to delete account. Please try again later.',
                    variant: 'destructive',
                  })
                } finally {
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
