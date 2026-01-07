'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArtworkScribble } from '@/components/artwork-scribble'
import { Logo } from '@/components/logo'
import { OrganizationSchema, SoftwareApplicationSchema, WebSiteSchema } from '@/components/seo/structured-data'
import {
  ArrowRight,
  Check,
  Shield,
  Lock,
  Heart,
  Star,
  X,
  Smartphone,
} from 'lucide-react'

// Note: Metadata cannot be exported from 'use client' files
// The parent layout.tsx already has comprehensive metadata
// This component focuses on structured data (JSON-LD) instead

export default function LandingPage() {
  return (
    <>
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <WebSiteSchema />
      <div className="min-h-screen bg-[#FFFBF5] dark:bg-background overflow-hidden">
      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-card border-t border-amber-100 dark:border-border shadow-lg sm:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/signup" className="block w-full">
            <Button size="lg" className="w-full bg-[#E91E63] hover:bg-[#C2185B]">
              Start Free — No Credit Card
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
      
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
              <Link href="/teachers" className="hidden sm:block">
                <Button variant="ghost" size="sm">For Teachers</Button>
              </Link>
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
          <p className="sr-only">
            KidCanvas helps you digitally preserve your children's artwork. Upload photos, tag the artist, and share with family. Free with unlimited artworks.
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Upload photos of artwork. Tag the artist. Share with grandparents. 
            Find "that rainbow drawing from last summer" in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8 text-lg">
                Start free — Unlimited artworks
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Private & secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-600" />
              <span>You own your data</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-green-700 dark:text-green-400 font-medium">
            Your kids' artwork is never used for AI training
          </p>
          
          <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4" /> iOS app (iPhone & iPad) available via request — <Link href="/support" className="text-[#E91E63] hover:underline">use our contact form</Link> to request a TestFlight invite
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
                { bg: 'from-blue-200 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40', variant: 'rocketship' as const, title: 'Space Ship', artist: 'Lucas' },
                { bg: 'from-green-200 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40', variant: 'dinosaur' as const, title: 'Dinosaur', artist: 'Lucas' },
                { bg: 'from-purple-200 to-violet-200 dark:from-purple-900/40 dark:to-violet-900/40', variant: 'rainbow' as const, title: 'Rainbow Sky', artist: 'Emma' },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className={`aspect-square rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center mb-2 p-4`} aria-hidden="true">
                    <ArtworkScribble variant={item.variant} size={180} />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">by {item.artist}</p>
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

      {/* Social Proof */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-transparent to-amber-50/50 dark:to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 border-2 border-white dark:border-background" />
              ))}
            </div>
            <div className="text-left ml-2">
              <p className="font-semibold text-foreground">Trusted by families</p>
              <p className="text-sm text-muted-foreground">Preserving memories daily</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">5.0 from early users</span>
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
          <p className="text-center text-muted-foreground mb-2">
            Free for most families. Upgrade if you need more.
          </p>
          <p className="text-center text-sm text-green-600 dark:text-green-400 mb-8 font-medium">
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> No credit card required</span> • <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Cancel anytime</span> • <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Unlimited artworks free forever</span>
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="p-6 rounded-xl border-2 border-gray-200 dark:border-border bg-gray-50 dark:bg-secondary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <p className="font-bold text-foreground text-lg">Free</p>
              <p className="text-3xl font-bold text-foreground mt-1">$0</p>
              <p className="text-muted-foreground text-sm mb-4">Forever</p>
              <ul className="space-y-2 text-sm">
                {['Unlimited artworks', '3 children', '1 family', 'Basic gallery view', 'Public sharing links'].map((f) => (
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
              <p className="text-muted-foreground text-sm mb-4">or $49/year <span className="text-green-600 dark:text-green-400">(save 17%)</span></p>
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

      {/* Comparison Section */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-4">
            How KidCanvas compares to other solutions
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm max-w-2xl mx-auto">
            See why families choose KidCanvas over artwork storage apps, cloud storage, and photo apps
          </p>
          
          {/* Desktop Comparison Table */}
          <div className="hidden lg:block bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-amber-100 dark:border-border bg-gray-50 dark:bg-secondary">
              <div className="font-semibold text-foreground">Feature</div>
              <div className="font-semibold text-foreground text-center">KidCanvas</div>
              <div className="font-semibold text-foreground text-center text-sm">Artkive</div>
              <div className="font-semibold text-foreground text-center text-sm">Keepy</div>
              <div className="font-semibold text-foreground text-center text-sm">Google Photos / Dropbox</div>
            </div>
            
            {/* Comparison Rows */}
            <div className="divide-y divide-amber-100 dark:divide-border">
              {[
                {
                  feature: 'Free tier',
                  kidcanvas: 'Unlimited artworks free forever',
                  others: ['No free tier', 'Limited free', 'Free storage, but...'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, true],
                },
                {
                  feature: 'Monthly pricing',
                  kidcanvas: '$4.99/mo',
                  others: ['$9.99/mo', '$7.99/mo', '$2-10/mo (general storage)'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                },
                {
                  feature: 'Built for artwork',
                  kidcanvas: 'Purpose-built for kids\' art',
                  others: ['Yes', 'Yes', 'No - generic storage'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'Child tagging',
                  kidcanvas: 'Tag by child, see growth over time',
                  others: ['Yes', 'Yes', 'Manual tagging only'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'AI auto-tagging',
                  kidcanvas: 'Smart AI describes artwork automatically',
                  others: ['Not available', 'Not available', 'Generic photo tags only'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                },
                {
                  feature: 'Privacy & data usage',
                  kidcanvas: 'Your data stays private - never used for AI training',
                  others: ['Unclear policy', 'Unclear policy', 'May be used for ML'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'Ad-free experience',
                  kidcanvas: 'Zero ads, ever',
                  others: ['No ads', 'No ads', 'Ads for premium features'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'Family sharing',
                  kidcanvas: 'Simple link sharing - no account needed',
                  others: ['Limited sharing', 'Yes', 'Complex folder permissions'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                },
                {
                  feature: 'Web + Mobile',
                  kidcanvas: 'Full-featured web + iOS app',
                  others: ['Web + Mobile', 'Mobile-first', 'Web + Mobile'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                },
                {
                  feature: 'No credit card to start',
                  kidcanvas: 'Start completely free',
                  others: ['Payment required', 'Trial then pay', 'Free with limits'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, true],
                },
                {
                  feature: 'Keep free tier after canceling',
                  kidcanvas: 'Yes - Unlimited artworks forever',
                  others: ['No', 'No', 'Yes, but limited'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, true],
                },
                {
                  feature: 'Search by artwork content',
                  kidcanvas: 'Search by child, tags, description',
                  others: ['Basic search', 'Basic search', 'File name only'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'Export your data',
                  kidcanvas: 'Download all artwork anytime',
                  others: ['Limited export', 'Limited export', 'Yes'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                },
                {
                  feature: 'Create photo books',
                  kidcanvas: 'Coming soon - print books',
                  others: ['Yes (extra cost)', 'Yes (extra cost)', 'No'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                },
                {
                  feature: 'Timeline view',
                  kidcanvas: 'See artwork growth over time',
                  others: ['No', 'Limited', 'No'],
                  kidcanvasCheck: true,
                  othersCheck: [false, true, false],
                },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-secondary/50 transition-colors">
                  <div className="font-medium text-foreground text-sm flex items-center">{row.feature}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {row.kidcanvasCheck ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className={row.kidcanvasCheck ? 'text-foreground' : 'text-muted-foreground'}>
                      {row.kidcanvas}
                    </span>
                  </div>
                  {row.others.map((other, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {row.othersCheck[idx] ? (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className={row.othersCheck[idx] ? 'text-foreground' : 'text-muted-foreground'}>
                        {other}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border-t border-amber-100 dark:border-border text-center">
              <p className="text-sm font-semibold text-foreground mb-1">
                Why pay more for less?
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Unlimited artworks free forever • AI tagging • Timeline view • Your data stays private
              </p>
              <Link href="/signup">
                <Button className="bg-[#E91E63] hover:bg-[#C2185B]">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="lg:hidden space-y-6">
            <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-100 dark:border-border">
                <h3 className="text-lg font-bold text-foreground">KidCanvas vs. Artkive</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">50% cheaper</p>
                    <p className="text-muted-foreground">$4.99/mo vs $9.99/mo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Unlimited artworks free forever</p>
                    <p className="text-muted-foreground">Artkive requires payment upfront</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Smart AI auto-tagging</p>
                    <p className="text-muted-foreground">Recognizes animals, rainbows, people, colors & more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Timeline view of growth</p>
                    <p className="text-muted-foreground">See each child's artistic journey</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Your data stays private</p>
                    <p className="text-muted-foreground">Never used for AI training</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-100 dark:border-border">
                <h3 className="text-lg font-bold text-foreground">KidCanvas vs. Generic Storage</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Built specifically for artwork</p>
                    <p className="text-muted-foreground">Not just another photo folder</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Tag by child, track growth</p>
                    <p className="text-muted-foreground">See each kid's artistic journey</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">AI understands artwork</p>
                    <p className="text-muted-foreground">Auto-tags and describes drawings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Easy sharing for grandparents</p>
                    <p className="text-muted-foreground">Just send a link - no account needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Export all your data anytime</p>
                    <p className="text-muted-foreground">Download everything - you own it</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-2xl border border-amber-100 dark:border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Try KidCanvas free — no credit card required
              </p>
              <Link href="/signup">
                <Button className="bg-[#E91E63] hover:bg-[#C2185B] w-full">
                  Start Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 sm:px-6 bg-white dark:bg-card border-y border-amber-100 dark:border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes! The free plan includes unlimited artworks, 3 children, and all core features. No credit card required. You only pay if you need unlimited storage."
              },
              {
                q: "What happens to my photos?",
                a: "Your artwork photos are stored securely in the cloud. You own your data and can export everything anytime. We never share your photos with anyone."
              },
              {
                q: "Can grandparents access it?",
                a: "Yes! Share a simple link with family members. They can view the gallery without creating an account. Perfect for long-distance grandparents."
              },
              {
                q: "What if I want to cancel?",
                a: "Cancel anytime, no questions asked. Your free plan continues with unlimited artworks. You can export all your data before canceling."
              },
              {
                q: "Do I need the iOS app?",
                a: "No! The web app works perfectly on phones, tablets, and computers. The iOS app (iPhone & iPad) is available via request — use our contact form (in Support) to request a TestFlight invite for easier uploading."
              },
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-secondary rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Personal */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-transparent">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <ArtworkScribble variant="palette" size={96} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Stop losing artwork to the recycling bin
          </h2>
          <p className="text-muted-foreground mb-6">
            Takes 2 minutes to set up. Free with unlimited artworks. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8 text-lg">
              Create your family gallery — It's free!
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            Join families already preserving their kids' masterpieces
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 px-4 sm:px-6 border-t border-amber-100 dark:border-border pb-20 sm:pb-8" role="contentinfo">
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
    </>
  )
}
