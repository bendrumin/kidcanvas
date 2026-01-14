import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserManagementTable } from '@/components/admin/user-management-table'

export const metadata = {
  title: 'Admin - User Management',
  description: 'Manage users and families',
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/admin')
  }

  // Check if user is admin (your email)
  const ADMIN_EMAIL = 'bsiegel13@gmail.com'
  if (user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // Use service client for admin operations
  const serviceClient = await createServiceClient()

  // Fetch all users with their family info
  const { data: users, error } = await serviceClient
    .from('family_members')
    .select(`
      user_id,
      family_id,
      role,
      families (
        name
      )
    `)

  if (error) {
    console.error('Error fetching users:', error)
  }

  // Get auth users to combine data (requires service role)
  const { data: authUsers } = await serviceClient.auth.admin.listUsers()

  // Combine the data
  const usersWithDetails = authUsers?.users.map(authUser => {
    const familyMembership: any = users?.find((u: any) => u.user_id === authUser.id)
    return {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      email_confirmed_at: authUser.email_confirmed_at ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      family_name: familyMembership?.families?.name || 'No family',
      family_id: familyMembership?.family_id,
      role: familyMembership?.role || 'none',
    }
  }) || []

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-fluid-3xl font-display font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users and perform deep deletes
        </p>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ <strong>Deep Delete</strong> removes the user and ALL associated data: families, artworks, invites, etc.
          </p>
        </div>
      </div>

      <UserManagementTable users={usersWithDetails} adminEmail={ADMIN_EMAIL} />
    </div>
  )
}
