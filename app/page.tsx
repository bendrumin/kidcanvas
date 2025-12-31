'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Camera, 
  Users, 
  Heart, 
  Shield, 
  Palette,
  ArrowRight,
  Check,
  Star
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50 overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shadow-lg shadow-pink-200">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
                KidCanvas
              </span>
            </motion.div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 shadow-lg shadow-pink-200/50">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative" 
        id="main-content"
        aria-labelledby="hero-heading"
      >
        {/* Floating decorative elements - hidden from screen readers */}
        <motion.div 
          className="absolute top-40 left-[10%] text-6xl"
          animate={{ 
            y: [0, -15, 0],
            rotate: [-5, 5, -5]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🎨
        </motion.div>
        <motion.div 
          className="absolute top-60 right-[15%] text-5xl"
          animate={{ 
            y: [0, 15, 0],
            rotate: [5, -5, 5]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          ✏️
        </motion.div>
        <motion.div 
          className="absolute bottom-40 left-[20%] text-4xl hidden lg:block"
          animate={{ 
            y: [0, -10, 0],
            x: [0, 5, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🖍️
        </motion.div>
        <motion.div 
          className="absolute top-80 right-[25%] text-4xl hidden lg:block"
          animate={{ 
            y: [0, 10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🌈
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 mb-8 border shadow-lg shadow-orange-100"
            >
              <Sparkles className="w-4 h-4 text-crayon-yellow" />
              <span className="text-sm font-medium">Every scribble tells a story</span>
              <Star className="w-4 h-4 text-crayon-yellow fill-crayon-yellow" />
            </motion.div>
            
            <motion.h1 
              id="hero-heading"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-gray-900 mb-6 leading-tight"
            >
              Preserve Your Children's{' '}
              <span className="relative inline-block">
                <motion.span 
                  className="relative z-10 bg-gradient-to-r from-crayon-pink via-crayon-purple to-crayon-blue bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                >
                  Masterpieces
                </motion.span>
                <motion.svg 
                  className="absolute -bottom-2 left-0 w-full" 
                  viewBox="0 0 300 12" 
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.path 
                    d="M2 8C50 3 100 3 150 6C200 9 250 5 298 8" 
                    stroke="url(#gradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="#E91E63"/>
                      <stop offset="50%" stopColor="#9B59B6"/>
                      <stop offset="100%" stopColor="#3498DB"/>
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
            >
              Scan, organize, and share your kids' artwork with the whole family. 
              From finger paintings to first portraits — keep every precious creation safe forever.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 text-lg px-8 shadow-xl shadow-pink-200/50 group">
                  Start Your Gallery
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 border-2">
                  See How It Works
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Hero Gallery Preview */}
          <motion.div 
            className="mt-16 relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto border-2 relative overflow-hidden">
              {/* Cork board texture effect */}
              <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+')]" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
                {[
                  { emoji: '🌸', color: 'from-pink-100 to-pink-200', rotate: -3, label: 'Emma, 5' },
                  { emoji: '🚀', color: 'from-blue-100 to-blue-200', rotate: 2, label: 'Lucas, 7' },
                  { emoji: '🌈', color: 'from-purple-100 to-purple-200', rotate: -1, label: 'Sofia, 4' },
                  { emoji: '🦋', color: 'from-yellow-100 to-yellow-200', rotate: 3, label: 'Oliver, 6' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8, rotate: item.rotate - 10 }}
                    animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.15 }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                  >
                    {/* Tape decoration */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-sm transform -rotate-2 shadow-sm z-10" />
                    
                    <div className={`bg-white p-2 rounded-sm shadow-lg`}>
                      <div className={`aspect-square rounded-sm bg-gradient-to-br ${item.color} flex items-center justify-center text-5xl`}>
                        {item.emoji}
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2 font-medium">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Floating heart badge */}
              <motion.div 
                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-crayon-red to-crayon-pink rounded-full flex items-center justify-center shadow-lg"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-8 h-8 text-white" fill="white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="features-heading" className="text-4xl font-display font-bold text-gray-900 mb-4">
              Everything You Need to Preserve Memories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple tools designed for busy parents and loving grandparents
            </p>
          </motion.div>
          
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
              <motion.div 
                key={i} 
                className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border-2 hover:border-primary/20 transition-all hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <motion.div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-10 left-10 text-8xl opacity-10">🖌️</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-10">🎨</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to preserve artwork forever
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Scan or Upload', desc: 'Use the iOS app to scan artwork or drag & drop photos on the web.', emoji: '📸' },
              { step: '2', title: 'Add Details', desc: 'Tag the artist, add a title, and let AI suggest descriptions.', emoji: '✨' },
              { step: '3', title: 'Share & Enjoy', desc: 'Family members can browse, favorite, and download anytime.', emoji: '💝' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <motion.div 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple text-white text-3xl font-display font-bold flex items-center justify-center mx-auto mb-6 shadow-xl shadow-pink-200/50"
                  whileHover={{ scale: 1.1 }}
                >
                  {item.emoji}
                </motion.div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                  <span className="text-primary">{item.step}.</span> {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              className="p-8 rounded-3xl border-2 bg-white hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
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
            </motion.div>
            
            {/* Family Plan */}
            <motion.div 
              className="p-8 rounded-3xl border-2 border-primary bg-gradient-to-br from-pink-50 to-purple-50 relative hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-crayon-pink to-crayon-purple text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Most Popular ⭐
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
                <Button className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 shadow-lg" size="lg">
                  Start 14-Day Trial
                </Button>
              </Link>
              <p className="text-center text-sm text-gray-500 mt-4">
                or $49/year (save 32%)
              </p>
            </motion.div>
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
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div whileHover={{ scale: 1.1 }}>
                  <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-display font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crayon-pink via-crayon-purple to-crayon-blue relative overflow-hidden">
        {/* Floating elements */}
        <motion.div 
          className="absolute top-10 left-10 text-6xl opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          ⭐
        </motion.div>
        <motion.div 
          className="absolute bottom-10 right-20 text-5xl opacity-20"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🎨
        </motion.div>
        
        <motion.div 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Start Preserving Memories Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of families keeping their children's creativity safe forever
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 shadow-xl group">
              Create Your Free Gallery
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center" aria-hidden="true">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">KidCanvas</span>
            </div>
            <nav className="flex items-center gap-8 text-sm text-gray-400" aria-label="Footer navigation">
              <Link href="/privacy" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Contact</Link>
            </nav>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} KidCanvas. Made with <span aria-label="love">❤️</span> for families.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
