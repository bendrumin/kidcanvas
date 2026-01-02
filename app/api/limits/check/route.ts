import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkArtworkLimit, checkChildrenLimit, checkFamilyLimit } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, familyId } = body

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'artwork':
        if (!familyId) {
          return NextResponse.json({ error: 'familyId is required for artwork check' }, { status: 400 })
        }
        result = await checkArtworkLimit(user.id, familyId)
        break
      case 'children':
        if (!familyId) {
          return NextResponse.json({ error: 'familyId is required for children check' }, { status: 400 })
        }
        result = await checkChildrenLimit(user.id, familyId)
        break
      case 'family':
        result = await checkFamilyLimit(user.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Limit check error:', error)
    return NextResponse.json(
      { error: 'Failed to check limit', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

