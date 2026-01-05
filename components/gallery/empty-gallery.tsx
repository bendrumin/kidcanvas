'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Palette, Upload, Sparkles, ArrowRight } from 'lucide-react'
import { useMobile } from '@/lib/use-mobile'

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export function EmptyGallery() {
  const { shouldReduceMotion } = useMobile()
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.6 }}
    >
      <motion.div 
        className="relative mb-8"
        variants={shouldReduceMotion ? {} : floatingAnimation}
        initial="initial"
        animate={shouldReduceMotion ? "initial" : "animate"}
      >
        {/* Main icon */}
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-crayon-yellow/30 via-crayon-orange/20 to-crayon-pink/30 flex items-center justify-center shadow-lg shadow-orange-100">
          <Palette className="w-16 h-16 text-crayon-orange" />
        </div>
        
        {/* Floating sparkle */}
        <motion.div 
          className="absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shadow-lg"
          animate={shouldReduceMotion ? {} : { 
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0]
          }}
          transition={shouldReduceMotion ? {} : { duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>

        {/* Decorative dots */}
        <motion.div 
          className="absolute -bottom-2 -left-4 w-8 h-8 rounded-full bg-crayon-blue/30"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
          transition={shouldReduceMotion ? {} : { duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div 
          className="absolute top-1/2 -right-6 w-5 h-5 rounded-full bg-crayon-green/40"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1] }}
          transition={shouldReduceMotion ? {} : { duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      <motion.h2
        className="text-3xl font-display font-bold text-foreground mb-3"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2 }}
      >
        Your Gallery Awaits! ✨
      </motion.h2>
      
      <motion.p 
        className="text-muted-foreground max-w-md mb-8 text-lg"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.3 }}
      >
        Start building your family's art collection. Upload your children's masterpieces 
        and watch your gallery come to life.
      </motion.p>

      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.4 }}
      >
        <Link href="/dashboard/upload">
          <Button size="lg" className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 shadow-lg shadow-pink-200/50 group">
            <Upload className="w-5 h-5 mr-2" />
            Upload First Artwork
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <Link href="/dashboard/children">
          <Button size="lg" variant="outline" className="border-2">
            Add Your Children First
          </Button>
        </Link>
      </motion.div>

      {/* Placeholder art grid */}
      <motion.div 
        className="mt-16 grid grid-cols-4 gap-4 max-w-lg"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? {} : { opacity: 1 }}
        transition={shouldReduceMotion ? {} : { delay: 0.6 }}
      >
        {['🎨', '🖍️', '✏️', '🖌️'].map((emoji, i) => (
          <motion.div 
            key={i}
            className="relative"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8, rotate: (i - 1.5) * 3 }}
            animate={shouldReduceMotion ? {} : { opacity: 0.6, scale: 1, rotate: (i - 1.5) * 3 }}
            transition={shouldReduceMotion ? {} : { delay: 0.7 + i * 0.1 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, opacity: 0.8, rotate: 0 }}
          >
            {/* Tape */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-yellow-200/70 rounded-sm transform -rotate-2 z-10" />
            
            <div className="bg-white p-2 rounded-sm shadow-md">
              <div className="aspect-square rounded-sm bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
                {emoji}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
