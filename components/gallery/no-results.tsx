'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { useMobile } from '@/lib/use-mobile'

interface NoResultsProps {
  searchQuery?: string
  hasFilters: boolean
  onClearFilters: () => void
}

export function NoResults({ searchQuery, hasFilters, onClearFilters }: NoResultsProps) {
  const { shouldReduceMotion } = useMobile()

  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.6 }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-6"
      >
        <Search className="w-12 h-12 text-muted-foreground" />
      </motion.div>

      <h3 className="text-2xl font-display font-bold text-foreground mb-2">
        Nothing here yet
      </h3>
      
      {searchQuery ? (
        <p className="text-muted-foreground mb-6 max-w-md">
          No artwork matches <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </p>
      ) : hasFilters ? (
        <p className="text-muted-foreground mb-6 max-w-md">
          No artwork matches your filters
        </p>
      ) : (
        <p className="text-muted-foreground mb-6 max-w-md">
          Try a different search or clear your filters
        </p>
      )}

      {hasFilters && (
        <Link href="/dashboard">
          <Button 
            variant="outline"
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </Button>
        </Link>
      )}
    </motion.div>
  )
}

