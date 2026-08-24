'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArtworkScribble } from '@/components/artwork-scribble'
import { Logo } from '@/components/logo'
import { PLANS, INCLUDED_IN_ALL_PLANS } from '@/lib/stripe'
import { OrganizationSchema, SoftwareApplicationSchema, WebSiteSchema } from '@/components/seo/structured-data'
import {
  ArrowRight,
  Check,
  Shield,
  Lock,
  Heart,
  X,
  Smartphone,
  Sparkles,
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
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
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
            Every masterpiece has a story
          </p>

          <h1 className="text-fluid-4xl font-bold text-foreground mb-6 leading-tight">
            Remember what they said,<br />not just what they drew
          </h1>
          <p className="sr-only">
            KidCanvas is a private family gallery for children's artwork. Scan a drawing, write down what your child said about it, and share both with family who can react and comment. Free for your first 50 artworks.
          </p>

          <p className="text-base sm:text-lg text-muted-foreground mb-3 max-w-2xl mx-auto">
            <span className="font-semibold text-foreground">Instagram for kids&apos; art</span>
            {' '}&mdash; invite-only, and the story comes first.
          </p>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Scan the drawing, write down what they said about it, and share both with
            the family who actually wants to hear it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8 text-lg">
                Start free — up to 50 artworks
                <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span>Invite-only family gallery</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span>Stories, not just storage</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-green-700 dark:text-green-400 font-medium">
            Your kids' artwork is never used for AI training
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            <Smartphone className="w-4 h-4 inline-block align-text-bottom mr-1.5" aria-hidden="true" />
            iOS app for iPhone and iPad &mdash;{' '}
            <a
              href="https://testflight.apple.com/join/7nT5CzWQ"
              className="text-[#E91E63] hover:underline"
              rel="noopener"
            >
              join the beta on TestFlight
            </a>
            .
          </p>
        </div>
      </section>

      {/* The Problem - Relatable Story */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-sm border border-amber-100 dark:border-border">
            <div className="flex items-start gap-4 mb-6">
              <span className="flex-shrink-0 mt-1">
                <ArtworkScribble variant="palette" size={56} />
              </span>
              <p className="text-lg text-foreground leading-relaxed">
                Your kid brings home artwork and says <span className="font-semibold italic">"It's a rainbow dinosaur that eats sunshine!"</span>
              </p>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              You think you'll remember. But by next week, <span className="font-semibold text-foreground">the story is forgotten</span>.
              The artwork becomes just another drawing in a pile.
            </p>

            <div className="flex items-start gap-4 pt-6 border-t border-amber-100 dark:border-border">
              <span className="flex-shrink-0 mt-1">
                <ArtworkScribble variant="camera" size={56} />
              </span>
              <p className="text-lg text-foreground leading-relaxed">
                <span className="font-semibold text-[#E91E63]">KidCanvas captures both.</span>
                {" "}The artwork AND the story. Share the moment with grandma. She sees what your child said, not just the drawing.
                Years later, you remember why it mattered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Comparison Section - NEW */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-4">
            Instagram for Kids' Art (But Actually Better)
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm max-w-2xl mx-auto">
            You know Instagram? It made photos social. But for kids' artwork? You need something different.
          </p>
          
          <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border p-6 sm:p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">📱</span> Instagram
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Public feeds, algorithm-driven</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Photos are everything, captions optional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Ads, influencers, noise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Optimized for engagement, not meaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Lost in thousands of random photos</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">🎨</span> KidCanvas
                </h3>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold">Private to your family only</span> — no strangers, no algorithm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold">The story travels with the artwork</span> &mdash; not an afterthought in a caption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold">No ads, ever</span> — just your family, just your memories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold">Built for preserving memories</span> — not maximizing engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span><span className="font-semibold">Purpose-built for artwork</span> — never gets lost in photo clutter</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-amber-100 dark:border-border">
              <p className="text-center text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">The key difference?</span> On Instagram, photos are everything. On KidCanvas, <span className="font-semibold text-foreground">stories are everything.</span>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Because the artwork is just paper. The <span className="font-semibold text-foreground">story</span> is what makes it precious.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Demo - Show, Don't Tell */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-transparent to-amber-50/50 dark:to-transparent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-8">
            Stories, moments, and artwork together
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
          <p className="text-lg font-semibold text-foreground mb-2">
            Built by one parent, with a fridge that ran out of room
          </p>
          <p className="text-sm text-muted-foreground">
            KidCanvas is new and in open beta. There are no reviews to show you yet
            &mdash; so the free tier is 50 artworks with no card, and you can delete
            your account and everything in it whenever you like.
          </p>
        </div>
      </section>

      {/* Who It's For - Personal */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-8">
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
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-2">
            Simple pricing
          </h2>
          <p className="text-center text-muted-foreground mb-2">
            Start capturing stories for free. Upgrade anytime if you want unlimited.
          </p>
          <p className="text-center text-sm text-green-600 dark:text-green-400 mb-8 font-medium">
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" aria-hidden="true" /> No credit card required</span> • <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" aria-hidden="true" /> Cancel anytime</span> • <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" aria-hidden="true" /> Up to 50 artworks, free forever</span>
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
              <p className="text-fluid-2xl font-bold text-foreground mt-1">$0</p>
              <p className="text-muted-foreground text-sm mb-4">Forever</p>
              <ul className="space-y-2 text-sm">
                {[...PLANS.free.features, ...INCLUDED_IN_ALL_PLANS.slice(0, 4)].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Family */}
            <div className="p-6 rounded-xl border-2 border-[#E91E63] bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
              <p className="font-bold text-foreground text-lg">Family</p>
              <p className="text-fluid-2xl font-bold text-foreground mt-1">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-muted-foreground text-sm mb-4">or $49.99/year <span className="text-green-600 dark:text-green-400">(save 17%)</span></p>
              <ul className="space-y-2 text-sm">
                {[...PLANS.family.features, ...INCLUDED_IN_ALL_PLANS.slice(0, 5)].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
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
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-4">
            How KidCanvas compares to other solutions
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm max-w-2xl mx-auto">
            See why families choose KidCanvas over Instagram, artwork storage apps, cloud storage, and photo apps
          </p>

          {/* Key Differentiator Callout */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 border-2 border-pink-300 dark:border-pink-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  The KidCanvas Difference: Stories, Not Just Storage
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Other apps treat kids' art like files in a folder. <span className="font-semibold text-foreground">We treat them like memories.</span> Every artwork gets a story, and every family member can react to it.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-pink-200 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full font-medium">
                    📖 A story on every artwork
                  </span>
                  <span className="text-xs bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-medium">
                    ❤️ Family reactions
                  </span>
                  <span className="text-xs bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-medium">
                    📖 Print-ready art books
                  </span>
                  <span className="text-xs bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full font-medium">
                    ⏰ Story nudges
                  </span>
                  <span className="text-xs bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full font-medium">
                    📱 Instagram-style feed
                  </span>
                </div>
              </div>
            </div>
          </div>
          
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
                // PRICING & VALUE
                {
                  feature: 'Free tier',
                  kidcanvas: 'Up to 50 artworks + stories, free forever',
                  others: ['No free tier', '10 artworks free', 'Free storage, no features'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, true],
                  category: 'pricing',
                },
                {
                  feature: 'Monthly pricing',
                  kidcanvas: '$4.99/mo (50% cheaper)',
                  others: ['$9.99/mo', '$7.99/mo', '$2-10/mo (general storage)'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                  category: 'pricing',
                },
                {
                  feature: 'No credit card to start',
                  kidcanvas: 'Start completely free, no card',
                  others: ['Payment required', 'Free trial, then pay', 'Free with limits'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, true],
                  category: 'pricing',
                },
                {
                  feature: 'Keep data after canceling',
                  kidcanvas: 'Yes - up to 50 artworks forever + all stories',
                  others: ['Lose everything', 'Lose everything', 'Keep files, lose context'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'pricing',
                },

                // STORYTELLING FEATURES (UNIQUE DIFFERENTIATORS)
                {
                  feature: '📖 Story capture',
                  kidcanvas: 'Every artwork has a story - capture what they said',
                  others: ['Not available', 'Not available', 'Manual notes only (rarely used)'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'storytelling',
                  highlight: true,
                },
                {
                  feature: '⏰ Story nudges',
                  kidcanvas: 'A nudge when it has been a week, and before each birthday (iOS)',
                  others: ['Not available', 'Not available', 'No reminders'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'storytelling',
                  highlight: true,
                },
                {
                  feature: '📱 Instagram-style feed (stories-first)',
                  kidcanvas: 'Feed shows stories prominently - see the moment, not just image',
                  others: ['Grid view only', 'Grid view only', 'Folder structure'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'storytelling',
                  highlight: true,
                },

                // FAMILY ENGAGEMENT
                {
                  feature: '❤️ Family reactions (5 types)',
                  kidcanvas: 'React with Love, Amazing, Artistic, Proud, Star',
                  others: ['Not available', 'Not available', 'No reactions'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'engagement',
                  highlight: true,
                },
                {
                  feature: '💬 Family comments',
                  kidcanvas: 'Family can comment and celebrate together',
                  others: ['Not available', 'Not available', 'No social features'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'engagement',
                  highlight: true,
                },
                {
                  feature: '🔗 Share with story context',
                  kidcanvas: 'Share the artwork together with its story',
                  others: ['Share image only', 'Share image only', 'Share file (no context)'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'engagement',
                },
                {
                  feature: '👨‍👩‍👧 Family roles & permissions',
                  kidcanvas: 'Owner, Parent, Member, Viewer roles',
                  others: ['Basic sharing', 'Basic sharing', 'No roles'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'engagement',
                },

                // ORGANIZATION & SEARCH
                {
                  feature: '🏷️ Child tagging',
                  kidcanvas: 'Tag by child, filter by artist, see growth',
                  others: ['Yes', 'Yes', 'Manual folders only'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'organization',
                },
                {
                  feature: '🔍 Search by story content',
                  kidcanvas: 'Search the story text, tags, and child name',
                  others: ['Basic search', 'Basic search', 'File name only'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'organization',
                },
                {
                  feature: '📅 Timeline & growth view',
                  kidcanvas: 'See artwork evolution and development',
                  others: ['No timeline', 'Basic timeline', 'No timeline'],
                  kidcanvasCheck: true,
                  othersCheck: [false, true, false],
                  category: 'organization',
                },
                {
                  feature: '📁 Collections & albums',
                  kidcanvas: 'Organize by theme, event, or milestone',
                  others: ['Limited albums', 'Limited albums', 'Folders only'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'organization',
                },

                // PRIVACY & TRUST
                {
                  feature: '🔒 Privacy & AI training',
                  kidcanvas: 'Your data NEVER used for AI training (guaranteed)',
                  others: ['Unclear policy', 'Unclear policy', 'May train AI models on your data'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'privacy',
                },
                {
                  feature: '🚫 Ad-free experience',
                  kidcanvas: 'Zero ads, ever. Period.',
                  others: ['No ads', 'No ads', 'Ads for upsells + partner offers'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'privacy',
                },
                {
                  feature: '💾 Data ownership',
                  kidcanvas: 'Delete your account and everything in it, anytime',
                  others: ['Export available', 'Limited export', 'Export available'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                  category: 'privacy',
                },

                // PLATFORM & ACCESS
                {
                  feature: '💻 Web + Mobile apps',
                  kidcanvas: 'Full-featured web app + iOS (iPhone & iPad)',
                  others: ['Web + Mobile', 'Mobile-first (limited web)', 'Web + Mobile'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, true],
                  category: 'platform',
                },
                {
                  feature: '🌐 No-signup sharing',
                  kidcanvas: 'Share links work without account (grandparents!)',
                  others: ['Requires account', 'Requires app download', 'Requires account'],
                  kidcanvasCheck: true,
                  othersCheck: [false, false, false],
                  category: 'platform',
                },

                // FUTURE FEATURES
                {
                  feature: '📖 Print photo books',
                  kidcanvas: 'Print-ready PDF art books, with the stories included',
                  others: ['Yes ($30-50 per book)', 'Yes ($40-60 per book)', 'No'],
                  kidcanvasCheck: true,
                  othersCheck: [true, true, false],
                  category: 'future',
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-5 gap-4 p-4 transition-colors ${
                    row.highlight
                      ? 'bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20 border-l-4 border-l-pink-500'
                      : 'hover:bg-gray-50/50 dark:hover:bg-secondary/50'
                  }`}
                >
                  <div className={`font-medium text-sm flex items-center ${row.highlight ? 'text-pink-700 dark:text-pink-400' : 'text-foreground'}`}>
                    {row.feature}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {row.kidcanvasCheck ? (
                      <Check className={`w-4 h-4 flex-shrink-0 ${row.highlight ? 'text-pink-600 dark:text-pink-400' : 'text-green-600 dark:text-green-400'}`} aria-hidden="true" />
                    ) : (
                      <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className={`${row.kidcanvasCheck ? 'text-foreground' : 'text-muted-foreground'} ${row.highlight ? 'font-semibold' : ''}`}>
                      {row.kidcanvas}
                    </span>
                  </div>
                  {row.others.map((other, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {row.othersCheck[idx] ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
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
Up to 50 artworks with stories, free forever • Family reactions & comments • Your data stays private
              </p>
              <Link href="/signup">
                <Button className="bg-[#E91E63] hover:bg-[#C2185B]">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
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
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">50% cheaper</p>
                    <p className="text-muted-foreground">$4.99/mo vs $9.99/mo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Up to 50 artworks, free forever</p>
                    <p className="text-muted-foreground">Artkive requires payment upfront</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Capture stories, not just photos</p>
                    <p className="text-muted-foreground">Remember what your child said, share the moment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Family reactions & comments</p>
                    <p className="text-muted-foreground">Grandparents can react and engage, not just view</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Print-ready art books</p>
                    <p className="text-muted-foreground">Turn a year of artwork and stories into a PDF</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Story nudges</p>
                    <p className="text-muted-foreground">The iOS app taps you on the shoulder when it&apos;s been a week &mdash; and before each birthday. Scheduled on your phone; nothing leaves it.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Capture stories, not just store photos</p>
                    <p className="text-muted-foreground">Remember the context, share the moment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Family engagement built-in</p>
                    <p className="text-muted-foreground">Reactions and comments, included on every plan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Search what they said</p>
                    <p className="text-muted-foreground">Find an artwork by the story, not just the title</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Easy sharing for grandparents</p>
                    <p className="text-muted-foreground">Just send a link - no account needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">Leave whenever you want</p>
                    <p className="text-muted-foreground">Delete your account and every artwork in one tap</p>
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
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 sm:px-6 bg-white dark:bg-card border-y border-amber-100 dark:border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-fluid-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes! The free plan includes 50 artworks, 1 child, and all core features. No credit card required. You only pay if you need more artworks or multiple children."
              },
              {
                q: "What happens to my photos?",
                a: "Your artwork is stored in our cloud so every device in the family can see it. We never share it with anyone and it is never used for AI training. You can delete any artwork, or your whole account and everything in it, whenever you like."
              },
              {
                q: "Can grandparents see the stories too?",
                a: "Yes! Share a simple link with family members. They can see the artwork, read the story, and even react or comment - all without creating an account. Perfect for long-distance grandparents."
              },
              {
                q: "What if I forget to add a story?",
                a: "Nothing stops you uploading without one, and you can add it later by opening the artwork. On iPhone the app asks while you are still there, with prompts if you are not sure what to ask - which is usually the moment you actually remember what they said."
              },
              {
                q: "What if I want to cancel?",
                a: "Cancel anytime, no questions asked. Your free plan continues with 50 artworks and everything you have already added stays put."
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
          <h2 className="text-fluid-3xl font-bold text-foreground mb-4">
            Start capturing the stories, not just the art
          </h2>
          <p className="text-muted-foreground mb-6">
            Remember what your child said. Share the moment with family. Keep those memories alive. Takes 2 minutes to set up. Free for up to 50 artworks. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-[#E91E63] hover:bg-[#C2185B] px-8 text-lg">
              Start capturing stories — it’s free!
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
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
