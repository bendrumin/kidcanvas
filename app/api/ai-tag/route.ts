import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { artworkId, imageUrl } = await request.json()

    if (!artworkId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
    const supabase = await createServiceClient()
    
    const { error } = await supabase
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

