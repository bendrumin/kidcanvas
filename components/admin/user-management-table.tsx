'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface User {
  id: string
  email: string | undefined
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  family_name: string
  family_id: string | undefined
  role: string
}

interface UserManagementTableProps {
  users: User[]
  adminEmail: string
}

export function UserManagementTable({ users, adminEmail }: UserManagementTableProps) {
  const { toast } = useToast()
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeepDelete = async (user: User) => {
    setIsDeleting(true)

    try {
      const response = await fetch('/api/admin/deep-delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      toast({
        title: 'User deleted',
        description: `Successfully deleted ${user.email} and all associated data.`,
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isAdmin = user.email === adminEmail
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email}
                    {isAdmin && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.family_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.email_confirmed_at ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.last_sign_in_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deep Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <AlertDialogTitle>Deep Delete User</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to <strong>permanently delete</strong>{' '}
                <strong>{userToDelete?.email}</strong>?
              </p>
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-semibold text-destructive mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• User account and authentication</li>
                  <li>• Family memberships</li>
                  <li>• All uploaded artworks</li>
                  <li>• All created invites</li>
                  <li>• Associated families (if only member)</li>
                </ul>
              </div>
              <p className="text-sm font-semibold mt-4">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (userToDelete) handleDeepDelete(userToDelete)
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
