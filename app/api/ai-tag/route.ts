import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFY AUTHENTICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting for expensive AI operations
    const identifier = getClientIdentifier(request, user.id)
    const rateLimit = checkRateLimit(identifier, 'ai')

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `Too many AI tagging requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      )
    }

    const { artworkId, imageUrl } = await request.json()

    // SECURITY: Validate input
    if (!artworkId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(artworkId)) {
      return NextResponse.json(
        { error: 'Invalid artwork ID format' },
        { status: 400 }
      )
    }

    // SECURITY: Verify image URL is from allowed domain
    try {
      const url = new URL(imageUrl)
      const allowedDomains = ['r2.cloudflarestorage.com', 'r2.dev']
      const isAllowed = allowedDomains.some(domain => url.hostname.endsWith(domain))

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Invalid image URL', details: 'Image must be from allowed storage domain' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      )
    }

    // 2. VERIFY USER HAS ACCESS TO THIS ARTWORK
    const { data: artwork, error: artworkError } = await (supabase
      .from('artworks') as any)
      .select('family_id')
      .eq('id', artworkId)
      .single() as { data: { family_id: string } | null; error: unknown }

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // 3. VERIFY USER IS A MEMBER OF THE ARTWORK'S FAMILY
    const { data: membership, error: membershipError } = await (supabase
      .from('family_members') as any)
      .select('id, role')
      .eq('family_id', artwork.family_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this artwork' },
        { status: 403 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI tagging not configured' },
        { status: 501 }
      )
    }

    // Call Claude API to analyze the artwork
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: `You are analyzing a child's artwork. Provide:
1. A brief, warm description of what you see (1-2 sentences, written as if describing to a parent)
2. 5-10 relevant tags for categorizing this artwork (single words or short phrases)

Respond in JSON format:
{
  "description": "A colorful butterfly...",
  "tags": ["butterfly", "colorful", "nature", ...]
}

Be encouraging and focus on what makes this artwork special. Keep it family-friendly.`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', await response.text())
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis returned' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    const parsed = JSON.parse(content)
    const { description, tags } = parsed

    // Update the artwork in the database
    const supabaseService = await createServiceClient()
    
    const { error } = await supabaseService
      .from('artworks')
      .update({
        ai_description: description,
        ai_tags: tags,
      } as { ai_description: string; ai_tags: string[] })
      .eq('id', artworkId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save AI analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, description, tags })
  } catch (error) {
    console.error('AI tagging error:', error)
    return NextResponse.json(
      { error: 'AI tagging failed' },
      { status: 500 }
    )
  }
}

// Route segment config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30 seconds max for AI analysis

