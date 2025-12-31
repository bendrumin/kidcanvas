import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Palette, Download, Calendar, User, Heart } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'

interface SharePageProps {
  params: Promise<{ code: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { code } = await params
  const supabase = await createClient()
  
  // Fetch the share link
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*')
    .eq('code', code)
    .single()

  if (!shareLink) {
    notFound()
  }

  // Check expiry
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-orange/20 to-crayon-red/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏰</span>
            </div>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>
              This share link has expired. Ask the owner for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch the artwork
  const { data: artwork } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('id', shareLink.resource_id)
    .single()

  if (!artwork) {
    notFound()
  }

  const allTags = [...(artwork.tags || []), ...(artwork.ai_tags || [])]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
              KidCanvas
            </span>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="sm">
              Create Your Gallery
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <Image
                src={artwork.image_url}
                alt={artwork.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </Card>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">{artwork.title}</h1>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white text-xl font-bold">
                  {artwork.child?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{artwork.child?.name}</p>
                  {artwork.child && artwork.child_age_months !== null && (
                    <p className="text-muted-foreground">
                      {calculateAge(artwork.child.birth_date, artwork.created_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>Created {formatDate(artwork.created_date)}</span>
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Description */}
            {artwork.ai_description && (
              <Card className="bg-gradient-to-br from-crayon-blue/5 to-crayon-green/5">
                <CardContent className="pt-4">
                  <p className="text-sm">{artwork.ai_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" asChild className="flex-1">
                <a href={artwork.image_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-crayon-pink/10 to-crayon-purple/10 border-primary/20">
              <CardContent className="pt-6 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-display font-bold mb-1">Love this?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your own family gallery to preserve precious artwork
                </p>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

