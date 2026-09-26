import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfProtection } from '@/lib/csrf-protection'

/**
 * Delete the signed-in user's account for real.
 *
 * The settings button used to open a dialog promising permanent deletion and
 * then fire a "Coming soon!" toast, which is a broken promise to the person
 * clicking it and a false entry in the Play Data Safety form. iOS has always
 * called the same `delete_my_account` function this route calls.
 *
 * Storage first, because that function deletes the auth row and this session
 * dies with it. Files go only for families the user OWNS: a grandparent
 * leaving someone else's family must not take that family's artwork along,
 * which is the same rule delete_my_account applies to the rows.
 */
export async function POST(request: NextRequest) {
  const csrf = verifyCsrfProtection(request)
  if (!csrf.success) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  try {
    const { data: owned } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')

    for (const row of (owned ?? []) as { family_id: string }[]) {
      const { data: files } = await supabase.storage.from('artworks').list(row.family_id)
      if (files?.length) {
        await supabase.storage
          .from('artworks')
          .remove(files.map((f) => `${row.family_id}/${f.name}`))
      }
    }

    // Everything else cascades from the families this user owns.
    const { error } = await supabase.rpc('delete_my_account' as never)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion failed:', error)
    return NextResponse.json(
      { error: 'Could not delete the account. Email support@kidcanvas.app and we will do it by hand.' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
