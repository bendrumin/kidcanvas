import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Camera, 
  Users, 
  Heart, 
  Shield, 
  Palette,
  ArrowRight,
  Check
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
                KidCanvas
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 mb-8 border shadow-sm">
              <Sparkles className="w-4 h-4 text-crayon-yellow" />
              <span className="text-sm font-medium">Every scribble tells a story</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-gray-900 mb-6 leading-tight">
              Preserve Your Children's{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-crayon-pink via-crayon-purple to-crayon-blue bg-clip-text text-transparent">
                  Masterpieces
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 3 100 3 150 6C200 9 250 5 298 8" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="#E91E63"/>
                      <stop offset="50%" stopColor="#9B59B6"/>
                      <stop offset="100%" stopColor="#3498DB"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Scan, organize, and share your kids' artwork with the whole family. 
              From finger paintings to first portraits — keep every precious creation safe forever.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 text-lg px-8">
                  Start Your Gallery
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto border-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { color: 'from-crayon-red to-crayon-orange', rotate: '-3deg' },
                  { color: 'from-crayon-yellow to-crayon-green', rotate: '2deg' },
                  { color: 'from-crayon-blue to-crayon-purple', rotate: '-2deg' },
                  { color: 'from-crayon-pink to-crayon-red', rotate: '3deg' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-gradient-to-br p-1 shadow-lg hover:scale-105 transition-transform duration-300"
                    style={{ transform: `rotate(${item.rotate})`, background: `linear-gradient(135deg, ${item.color.split(' ')[0].replace('from-', 'var(--tw-gradient-from)')}, ${item.color.split(' ')[1].replace('to-', 'var(--tw-gradient-to)')})` }}
                  >
                    <div className={`w-full h-full rounded-xl bg-gradient-to-br ${item.color} opacity-20`} />
                  </div>
                ))}
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-crayon-yellow to-crayon-orange rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Heart className="w-10 h-10 text-white" fill="white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Everything You Need to Preserve Memories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple tools designed for busy parents and loving grandparents
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                color: 'from-crayon-blue to-crayon-purple',
                title: 'Smart Scanning',
                description: 'Use our iOS app with VisionKit to automatically detect edges, correct perspective, and remove glare. Stack scanning made fast.'
              },
              {
                icon: Users,
                color: 'from-crayon-green to-crayon-blue',
                title: 'Family Sharing',
                description: 'Invite grandparents, aunts, uncles — everyone can view and contribute. Role-based permissions keep you in control.'
              },
              {
                icon: Sparkles,
                color: 'from-crayon-orange to-crayon-pink',
                title: 'AI Auto-Tagging',
                description: 'Our AI automatically describes and tags artwork. "Colorful butterfly drawing with rainbow" — searchable and organized.'
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border-2 hover:border-primary/20 transition-all hover:shadow-lg">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to preserve artwork forever
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Scan or Upload', desc: 'Use the iOS app to scan artwork or drag & drop photos on the web.' },
              { step: '2', title: 'Add Details', desc: 'Tag the artist, add a title, and let AI suggest descriptions.' },
              { step: '3', title: 'Share & Enjoy', desc: 'Family members can browse, favorite, and download anytime.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple text-white text-2xl font-display font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl border-2 bg-white">
              <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-display font-bold mb-6">
                $0<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 family', '2 children profiles', '100 artworks', 'Basic gallery', 'Web upload'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-crayon-green" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
            
            {/* Family Plan */}
            <div className="p-8 rounded-3xl border-2 border-primary bg-gradient-to-br from-pink-50 to-purple-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-crayon-pink to-crayon-purple text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">Family</h3>
              <p className="text-gray-600 mb-6">For growing families</p>
              <div className="text-4xl font-display font-bold mb-6">
                $5.99<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited children', 'Unlimited artworks', 'AI auto-tagging', 'Collections', 'Public gallery links', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-crayon-green" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90" size="lg">
                  Start 14-Day Trial
                </Button>
              </Link>
              <p className="text-center text-sm text-gray-500 mt-4">
                or $49/year (save 32%)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: 'Your Data is Safe', desc: 'End-to-end encryption and secure cloud storage' },
              { icon: Heart, title: 'Export Anytime', desc: 'Download your originals whenever you want — no lock-in' },
              { icon: Users, title: 'Family First', desc: 'Designed by parents, for parents and grandparents' },
            ].map((item, i) => (
              <div key={i}>
                <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crayon-pink via-crayon-purple to-crayon-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Start Preserving Memories Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of families keeping their children's creativity safe forever
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8">
              Create Your Free Gallery
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">KidCanvas</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} KidCanvas. Made with ❤️ for families.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

