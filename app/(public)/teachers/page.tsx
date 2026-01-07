import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Camera, Users, Share2, TrendingUp, Clock, Heart, Star } from 'lucide-react'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'KidCanvas for Teachers - Free Digital Portfolio System',
  description: 'Finally, a portfolio system that doesn\'t add to your workload. Photograph student artwork, organize automatically, share with parents instantly. Free for teachers.',
}

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 dark:from-background dark:via-background dark:to-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Log In
            </Link>
            <Link href="/signup?type=teacher">
              <Button size="sm" className="bg-gradient-to-r from-crayon-blue to-crayon-purple">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1.5 bg-gradient-to-r from-crayon-blue/10 to-crayon-purple/10 rounded-full border border-crayon-blue/20">
            <span className="text-sm font-medium text-crayon-blue dark:text-crayon-purple">
              Built for Art Teachers
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-crayon-blue via-crayon-purple to-crayon-pink bg-clip-text text-transparent">
            Finally, a Portfolio System That Doesn't Add to Your Workload
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Photograph student artwork in seconds. Organize by student and project automatically.
            Share portfolios with parents instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup?type=teacher">
              <Button size="lg" className="bg-gradient-to-r from-crayon-blue to-crayon-purple hover:opacity-90 text-lg px-8">
                Start Free - Unlimited Students
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            ✓ Free forever • ✓ No credit card required • ✓ 2-minute setup
          </p>

          {/* Social Proof */}
          <div className="mt-12 p-6 bg-white dark:bg-secondary rounded-xl border-2 border-amber-200 dark:border-border shadow-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-base italic text-foreground mb-2">
              "I have 120 students creating 3-4 pieces per week. KidCanvas cut my portfolio management time from 2 hours to 10 minutes."
            </p>
            <p className="text-sm text-muted-foreground">
              — Sarah M., Elementary Art Teacher
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-background dark:to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
              Every Art Teacher's Nightmare
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Bins overflowing with artwork by May",
                "Spending weekends sorting hundreds of pieces",
                "Parents asking 'Can I see what my kid made?'",
                "No record of student growth over the year",
                "Portfolio prep takes weeks before conferences",
                "Running out of storage space mid-year"
              ].map((problem, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-secondary rounded-lg border-2 border-red-200 dark:border-border">
                  <div className="text-2xl">😰</div>
                  <p className="text-foreground font-medium">{problem}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-xl text-muted-foreground mt-8 font-medium">
              Sound familiar?
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-white dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
              How KidCanvas Works for Teachers
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-crayon-green to-crayon-blue flex items-center justify-center">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">1. SNAP</h3>
                <p className="text-muted-foreground">
                  Photograph artwork after class
                  <br />
                  <span className="text-sm">(Takes &lt;10 min for 25 students)</span>
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-crayon-purple to-crayon-pink flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">2. TAG</h3>
                <p className="text-muted-foreground">
                  Auto-organize by student, project, and date
                  <br />
                  <span className="text-sm">(No manual sorting required)</span>
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-crayon-orange to-crayon-red flex items-center justify-center">
                  <Share2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">3. SHARE</h3>
                <p className="text-muted-foreground">
                  Generate parent links or class portfolios in one click
                  <br />
                  <span className="text-sm">(Parents love seeing progress!)</span>
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-secondary dark:to-secondary rounded-xl border-2 border-green-200 dark:border-border text-center">
              <p className="text-lg text-foreground">
                <strong>Built FOR teachers BY a frustrated parent</strong> who talked to dozens of art teachers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-rose-50 dark:from-background dark:to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
              Teacher-Specific Features
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Camera, title: "Bulk Upload", desc: "Photograph 25 artworks in 5 minutes" },
                { icon: Users, title: "Student Profiles", desc: "Each student gets their own portfolio" },
                { icon: TrendingUp, title: "Progress Tracking", desc: "See artistic development over the year" },
                { icon: Share2, title: "Parent Sharing", desc: "Generate secure links for parent conferences" },
                { icon: Users, title: "Project Collections", desc: "Group by unit or theme automatically" },
                { icon: Heart, title: "Class Galleries", desc: "Showcase your whole class's work" },
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-white dark:bg-secondary rounded-xl border-2 border-amber-200 dark:border-border">
                  <feature.icon className="w-8 h-8 text-crayon-purple mb-3" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-white dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
              Pricing Built for Classroom Budgets
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              No per-student fees. No surprise charges. Just simple, transparent pricing.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-secondary dark:to-secondary rounded-2xl border-2 border-green-300 dark:border-border relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                  Perfect for Most Teachers
                </div>
                <h3 className="text-2xl font-bold mb-2">FREE Forever</h3>
                <p className="text-4xl font-bold mb-6">$0</p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Unlimited students",
                    "Unlimited artwork",
                    "All core features",
                    "Parent sharing",
                    "Project collections"
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup?type=teacher">
                  <Button className="w-full bg-gradient-to-r from-crayon-green to-crayon-blue">
                    Start Free
                  </Button>
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="p-8 bg-white dark:bg-secondary rounded-2xl border-2 border-amber-200 dark:border-border">
                <h3 className="text-2xl font-bold mb-2">PREMIUM</h3>
                <p className="text-4xl font-bold mb-2">$9.99<span className="text-lg text-muted-foreground">/month</span></p>
                <p className="text-sm text-muted-foreground mb-6">Per Teacher</p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Everything in Free",
                    "Bulk operations",
                    "Advanced analytics",
                    "White-label sharing",
                    "Priority support",
                    "PDF export for portfolios"
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-crayon-purple flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup?type=teacher">
                  <Button variant="outline" className="w-full">
                    Start Free, Upgrade Later
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 p-6 bg-amber-50 dark:bg-secondary rounded-xl border-2 border-amber-200 dark:border-border text-center">
              <p className="font-bold mb-2">🏫 School District License Available</p>
              <p className="text-muted-foreground mb-3">
                Multiple teachers? Centralized admin? Custom training?
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:support@kidcanvas.app?subject=School District Inquiry">
                  Contact Us for Pricing
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white dark:from-background dark:to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
              Questions from Teachers
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: "Do I need to create accounts for each student?",
                  a: "Nope! You manage everything from your account. Parents get view-only links to see their own child's work."
                },
                {
                  q: "What about student privacy/FERPA compliance?",
                  a: "You control all sharing. Parents only see their own child's artwork. No public galleries unless you explicitly create them. All data is encrypted and private."
                },
                {
                  q: "Can I use this with multiple classes?",
                  a: "Yes! Organize by class period, grade, or however you teach. Create separate collections for each class."
                },
                {
                  q: "Is this replacing Artsonia?",
                  a: "KidCanvas is simpler and free. Artsonia is great but costs schools money and requires more setup. We're the lightweight alternative."
                },
                {
                  q: "Can students log in to see their own work?",
                  a: "Not yet, but we're building it! For now, teachers manage everything and share with parents."
                },
                {
                  q: "How long does it take to photograph a class?",
                  a: "About 5-10 minutes for 25 students. Just snap photos as students finish or during cleanup."
                }
              ].map((faq, i) => (
                <div key={i} className="p-6 bg-white dark:bg-secondary rounded-xl border-2 border-amber-200 dark:border-border">
                  <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-crayon-blue to-crayon-purple text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to Reclaim Your Weekends?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join art teachers who've cut their portfolio management time by 90%.
              <br />
              Free forever. No credit card required. Setup in 2 minutes.
            </p>
            <Link href="/signup?type=teacher">
              <Button size="lg" className="bg-white text-crayon-purple hover:bg-gray-100 text-lg px-8">
                Start Free - Unlimited Students
              </Button>
            </Link>
            <p className="mt-4 text-sm opacity-75">
              Questions? Email us at support@kidcanvas.app
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span>© 2025 KidCanvas. Built for teachers and parents.</span>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-foreground">For Parents</Link>
              <Link href="/teachers" className="hover:text-foreground">For Teachers</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
