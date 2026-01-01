import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Palette, Calendar, Heart, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SharePageProps {
  params: Promise<{ code: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Get share link
  const { data: shareLink } = await (supabase
    .from('share_links') as any)
    .select('*')
    .eq('code', code)
    .single()

  if (!shareLink) {
    notFound()
  }

  // Check expiration
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground mb-6">
            This share link has expired. Ask the owner to share it again.
          </p>
          <Link href="/">
            <Button>Go to KidCanvas</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Get artwork
  const { data: artwork } = await (supabase
    .from('artworks') as any)
    .select('*, child:children(name, birth_date)')
    .eq('id', shareLink.resource_id)
    .single()

  if (!artwork) {
    notFound()
  }

  const allTags = [...(artwork.tags || []), ...(artwork.ai_tags || [])]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
              KidCanvas
            </span>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Your Gallery</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Artwork Image */}
          <div className="relative">
            {/* Decorative tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-sm z-10 shadow-sm transform -rotate-1" />
            
            <Card className="overflow-hidden shadow-xl bg-white p-3">
              <div className="relative aspect-square bg-gray-50 rounded">
                <Image
                  src={artwork.image_url}
                  alt={artwork.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Card>
          </div>

          {/* Artwork Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                {artwork.title}
              </h1>
              
              {artwork.child && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white font-bold text-lg">
                    {artwork.child.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">by {artwork.child.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Little Artist ✨
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-crayon-blue" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(artwork.created_date)}</p>
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {artwork.ai_description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">About this artwork</p>
                    <p className="text-sm">{artwork.ai_description}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <a href={artwork.image_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button 
                variant="outline"
                className="text-crayon-red border-crayon-red/30 hover:bg-crayon-red/10"
              >
                <Heart className="w-4 h-4 mr-2" />
                Love it!
              </Button>
            </div>

            {/* CTA */}
            <Card className="p-6 bg-gradient-to-br from-crayon-pink/10 to-crayon-purple/10 border-crayon-purple/20">
              <h3 className="font-display font-bold text-lg mb-2">
                Preserve Your Kids' Artwork Too! 🎨
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a free gallery to scan, organize, and share your children's masterpieces.
              </p>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
                  Start Your Free Gallery
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>Shared with ❤️ via <Link href="/" className="font-semibold text-primary">KidCanvas</Link></p>
      </footer>
    </div>
  )
}

