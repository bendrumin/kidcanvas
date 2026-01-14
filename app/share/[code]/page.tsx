import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Heart, Download, Users } from 'lucide-react'
import { Logo } from '@/components/logo'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'

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
            <Logo size="sm" showText={false} className="opacity-50" />
          </div>
          <h1 className="text-fluid-2xl font-display font-bold mb-2">Link Expired</h1>
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

  // Check if this is a gallery share (type is 'collection' and resource_id matches family_id)
  const isGalleryShare = shareLink.type === 'collection' && shareLink.resource_id === shareLink.family_id
  
  if (isGalleryShare) {
    // Get family info
    const { data: family } = await (supabase
      .from('families') as any)
      .select('*')
      .eq('id', shareLink.family_id)
      .single()

    if (!family) {
      notFound()
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    // If logged in, check if already a member
    if (user) {
      const { data: membership } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single()

      if (membership) {
        redirect('/dashboard')
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-background dark:via-background dark:to-background p-4">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-crayon-green/20 dark:bg-crayon-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-crayon-blue/20 dark:bg-crayon-blue/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="lg" />
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-blue to-crayon-purple flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-fluid-2xl font-display">You're Invited!</CardTitle>
              <CardDescription className="text-base">
                You've been invited to view the
              </CardDescription>
              <div className="mt-2 px-4 py-3 bg-gradient-to-r from-crayon-pink/10 to-crayon-purple/10 rounded-xl">
                <p className="text-xl font-display font-bold text-foreground">
                  {family.name}
                </p>
                <p className="text-sm text-muted-foreground">Family Gallery</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-1">View their collection of</p>
                <p className="text-lg font-semibold">Children's Artwork 🎨</p>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <Link href={`/signup?redirect=/share/${code}`} className="block">
                    <Button className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
                      Create Account to View Gallery
                    </Button>
                  </Link>
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link href={`/login?redirect=/share/${code}`} className="text-primary font-semibold hover:underline">
                      Sign in
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link href={`/invite?family=${family.id}`} className="block">
                    <Button className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
                      Join Family to View Gallery
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full">
                      Go to My Gallery
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get artwork (original behavior)
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
          <Logo size="md" />
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
              <h1 className="text-fluid-3xl font-display font-bold text-foreground mb-2">
                {artwork.title}
              </h1>
              
              {artwork.child && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white font-bold text-lg">
                    {artwork.child.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">by {artwork.child.name}</p>
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

