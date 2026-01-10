import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCsrfProtection } from '@/lib/csrf-protection'

export async function POST(request: Request) {
  try {
    // SECURITY: CSRF protection
    const csrfCheck = verifyCsrfProtection(request)
    if (!csrfCheck.success) {
      console.warn('CSRF check failed on admin endpoint:', csrfCheck.error)
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // SECURITY: Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('Admin endpoint accessed without authentication')
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable not configured')
      return NextResponse.json(
        { error: 'Server configuration error: ADMIN_EMAIL not set' },
        { status: 500 }
      )
    }

    if (user.email !== adminEmail) {
      console.warn(`Unauthorized admin access attempt by: ${user.email}`)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // SECURITY: Rate limiting for admin operations
    const identifier = getClientIdentifier(request, user.id)
    const rateLimit = checkRateLimit(identifier, 'general')

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: 'Too many admin requests. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        }
      )
    }

    // SECURITY: Audit logging
    console.log(`Admin action initiated by ${user.email} at ${new Date().toISOString()}`)

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Use service client for admin operations
    const serviceClient = await createServiceClient()

    // Get user's family info before deletion
    const { data: familyMemberships } = await serviceClient
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)

    const familyIds = familyMemberships?.map((fm: any) => fm.family_id) || []

    // Start deep deletion process
    // Order matters for foreign key constraints!

    // 1. Get artwork IDs for this user
    const { data: artworks } = await serviceClient
      .from('artworks')
      .select('id')
      .eq('uploaded_by', userId)

    const artworkIds = artworks?.map((a: any) => a.id) || []

    // 2. Delete shared artwork links
    if (artworkIds.length > 0) {
      await serviceClient
        .from('share_links')
        .delete()
        .eq('type', 'artwork')
        .in('resource_id', artworkIds)
    }

    // 3. Delete artworks uploaded by this user
    await serviceClient
      .from('artworks')
      .delete()
      .eq('uploaded_by', userId)

    // 4. Delete family invites created by this user (FIX: correct field name)
    await serviceClient
      .from('family_invites')
      .delete()
      .eq('created_by', userId)

    // 5. Delete family memberships
    await serviceClient
      .from('family_members')
      .delete()
      .eq('user_id', userId)

    // 6. Delete subscriptions
    await serviceClient
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    // 7. Delete families if this was the only member
    for (const familyId of familyIds) {
      const { data: remainingMembers } = await serviceClient
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)

      if (!remainingMembers || remainingMembers.length === 0) {
        // Delete children in this family
        await serviceClient
          .from('children')
          .delete()
          .eq('family_id', familyId)

        // Delete the family
        await serviceClient
          .from('families')
          .delete()
          .eq('id', familyId)
      }
    }

    // 8. Finally, delete the auth user (using admin API)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    // SECURITY: Audit log successful deletion
    console.log(`Admin ${user.email} successfully deleted user ${userId} and ${familyIds.length} families at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted successfully',
      deletedFamilies: familyIds.length
    })

  } catch (error) {
    console.error('Deep delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// Route segment config
export const maxDuration = 30 // 30 seconds max for deep delete operations
