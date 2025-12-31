'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Download, 
  Share2, 
  Edit,
  Calendar,
  User,
  Tag
} from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import Link from 'next/link'

interface ArtworkLightboxProps {
  artwork: ArtworkWithChild | null
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  hasNext: boolean
  hasPrev: boolean
}

export function ArtworkLightbox({ 
  artwork, 
  onClose, 
  onNavigate,
  hasNext,
  hasPrev 
}: ArtworkLightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!artwork) return
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (hasPrev) onNavigate('prev')
        break
      case 'ArrowRight':
        if (hasNext) onNavigate('next')
        break
    }
  }, [artwork, onClose, onNavigate, hasNext, hasPrev])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (artwork) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [artwork])

  if (!artwork) return null

  const allTags = [...(artwork.tags || []), ...(artwork.ai_tags || [])]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/10 z-50"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Navigation */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-50"
            onClick={(e) => { e.stopPropagation(); onNavigate('prev') }}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-50"
            onClick={(e) => { e.stopPropagation(); onNavigate('next') }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex flex-col lg:flex-row max-w-6xl max-h-[90vh] w-full mx-4 bg-white rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image */}
          <div className="relative flex-1 min-h-[300px] lg:min-h-[500px] bg-gray-100">
            <Image
              src={artwork.image_url}
              alt={artwork.title}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>

          {/* Info Panel */}
          <div className="w-full lg:w-80 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title & Actions */}
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">
                  {artwork.title}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    Favorite
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/artwork/${artwork.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white font-bold">
                  {artwork.child?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-semibold">{artwork.child?.name}</p>
                  {artwork.child && artwork.child_age_months && (
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(artwork.child.birth_date, artwork.created_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Created: {formatDate(artwork.created_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Uploaded: {formatDate(artwork.uploaded_at)}</span>
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Description */}
              {artwork.ai_description && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-crayon-blue/10 to-crayon-green/10">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    ✨ AI Description
                  </p>
                  <p className="text-sm">{artwork.ai_description}</p>
                </div>
              )}

              {/* Download Button */}
              <Button className="w-full" variant="outline" asChild>
                <a href={artwork.image_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

