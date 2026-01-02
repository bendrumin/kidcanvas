'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArtworkScribble } from '@/components/artwork-scribble'
import { Logo } from '@/components/logo'
import { 
  ArrowRight,
  Check,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-background overflow-hidden">
      {/* Simple Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF5]/90 dark:bg-background/90 backdrop-blur-sm border-b border-amber-100 dark:border-border"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-[#E91E63] hover:bg-[#C2185B]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Simple, Personal */}
      <section className="pt-24 pb-12 px-4 sm:px-6" id="main-content">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#E91E63] font-medium mb-4 text-sm uppercase tracking-wide">
            For parents drowning in artwork
          </p>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            Stop throwing away your kids' masterpieces
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Upload photos of artwork. Tag the artist. Share with grandparents. 
            Find "that rainbow drawing from last summer" in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8">
                Start free — 100 artworks included
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            📱 iOS app coming soon to the App Store
          </p>
        </div>
      </section>

      {/* The Problem - Relatable Story */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-sm border border-amber-100 dark:border-border">
            <p className="text-lg text-foreground leading-relaxed flex items-start gap-4">
              <span className="flex-shrink-0 mt-1">
                <ArtworkScribble variant="palette" size={56} />
              </span>
              <span>Your kid comes home with a painting. 
              It goes on the fridge. Then another. And another.</span>
            </p>
            <p className="text-lg text-foreground leading-relaxed mt-4">
              Soon you have a <span className="font-semibold">pile</span>. 
              You feel <span className="font-semibold">guilty</span> throwing any away. 
              The good ones get <span className="font-semibold">damaged</span> in a drawer.
            </p>
            <p className="text-lg text-foreground leading-relaxed mt-4 flex items-start gap-4">
              <span className="flex-shrink-0 mt-1">
                <ArtworkScribble variant="camera" size={56} />
              </span>
              <span><span className="font-semibold">KidCanvas fixes this.</span> 
              {" "}Snap a photo, tag the artist, done. Grandma can see it instantly. 
              You can find it years later.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Simple Demo - Show, Don't Tell */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-transparent to-amber-50/50 dark:to-transparent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Here's what your gallery looks like
          </h2>
          
          {/* Fake Gallery Preview */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-foreground">The Johnson Family</p>
                <p className="text-sm text-muted-foreground">47 artworks</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full">Emma, 5</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Lucas, 7</span>
              </div>
            </div>
            
            {/* Artwork Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { bg: 'from-pink-200 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40', variant: 'flower' as const, title: 'Spring Flowers', artist: 'Emma' },
                { bg: 'from-blue-200 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40', variant: 'rocket' as const, title: 'Space Ship', artist: 'Lucas' },
                { bg: 'from-green-200 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40', variant: 'dinosaur' as const, title: 'Dinosaur', artist: 'Lucas' },
                { bg: 'from-purple-200 to-violet-200 dark:from-purple-900/40 dark:to-violet-900/40', variant: 'rainbow' as const, title: 'Rainbow Sky', artist: 'Emma' },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className={`aspect-square rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center mb-2 p-2`}>
                    <ArtworkScribble variant={item.variant} size={72} />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.artist}</p>
                </div>
              ))}
            </div>
            
            {/* Search demo */}
            <div className="mt-6 pt-6 border-t border-amber-100 dark:border-border">
              <p className="text-sm text-muted-foreground mb-2">Try searching:</p>
              <div className="flex flex-wrap gap-2">
                {['rainbow', 'Emma 2024', 'dinosaur', 'birthday'].map((term) => (
                  <span key={term} className="text-xs bg-gray-100 dark:bg-secondary px-3 py-1.5 rounded-full text-foreground">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For - Personal */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Built for real families
          </h2>
          
          <div className="space-y-4">
            {[
              { 
                variant: 'family' as const,
                title: 'Busy parents',
                desc: 'Upload from your phone in 30 seconds. No filing, no organizing, no guilt.'
              },
              { 
                variant: 'grandma' as const,
                title: 'Long-distance grandparents',
                desc: 'See every new creation the moment it\'s uploaded. No texting needed.'
              },
              { 
                variant: 'multi-kid' as const,
                title: 'Multi-kid households',
                desc: 'Tag each artist. Filter by child. Never mix up whose is whose.'
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex gap-4 p-4 bg-white dark:bg-card rounded-xl border border-amber-100 dark:border-border"
              >
                <span className="flex-shrink-0">
                  <ArtworkScribble variant={item.variant} size={64} />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Clean */}
      <section className="py-12 px-4 sm:px-6 bg-white dark:bg-card border-y border-amber-100 dark:border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            Simple pricing
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Free for most families. Upgrade if you need more.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="p-6 rounded-xl border-2 border-gray-200 dark:border-border bg-gray-50 dark:bg-secondary">
              <p className="font-bold text-foreground text-lg">Free</p>
              <p className="text-3xl font-bold text-foreground mt-1">$0</p>
              <p className="text-muted-foreground text-sm mb-4">Forever</p>
              <ul className="space-y-2 text-sm">
                {['100 artworks', '2 children', '1 family', 'Web upload'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Family */}
            <div className="p-6 rounded-xl border-2 border-[#E91E63] bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
              <p className="font-bold text-foreground text-lg">Family</p>
              <p className="text-3xl font-bold text-foreground mt-1">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-muted-foreground text-sm mb-4">or $49/year</p>
              <ul className="space-y-2 text-sm">
                {['Unlimited artworks', 'Unlimited children', 'AI auto-tagging', 'Share with anyone', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Personal */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <ArtworkScribble variant="palette" size={96} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Stop losing artwork to the recycling bin
          </h2>
          <p className="text-muted-foreground mb-6">
            Takes 2 minutes to set up. Free for up to 100 artworks.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8">
              Create your family gallery
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 px-4 sm:px-6 border-t border-amber-100 dark:border-border" role="contentinfo">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="xs" />
          <nav className="flex items-center gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/support" className="hover:text-foreground">Support</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} KidCanvas
          </p>
        </div>
      </footer>
    </div>
  )
}
