'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArtworkLightbox } from './artwork-lightbox'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface GalleryGridProps {
  artworks: ArtworkWithChild[]
}

export function GalleryGrid({ artworks }: GalleryGridProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkWithChild | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const openLightbox = (artwork: ArtworkWithChild, index: number) => {
    setSelectedArtwork(artwork)
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedArtwork(null)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (selectedIndex + 1) % artworks.length 
      : (selectedIndex - 1 + artworks.length) % artworks.length
    setSelectedIndex(newIndex)
    setSelectedArtwork(artworks[newIndex])
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {artworks.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group relative"
            >
              <div 
                className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-xl"
                onClick={() => openLightbox(artwork, index)}
              >
                {/* Image */}
                <Image
                  src={artwork.thumbnail_url || artwork.image_url}
                  alt={artwork.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Favorite Badge */}
                {artwork.is_favorite && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                    <Heart className="w-4 h-4 text-crayon-red fill-crayon-red" />
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {artwork.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="purple" className="text-xs">
                      {artwork.child?.name}
                    </Badge>
                    {artwork.child && artwork.child_age_months && (
                      <span className="text-white/80 text-xs">
                        {calculateAge(artwork.child.birth_date, artwork.created_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Info (visible on mobile) */}
              <div className="mt-3 lg:hidden">
                <h3 className="font-semibold truncate">{artwork.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{artwork.child?.name}</span>
                  <span>·</span>
                  <span>{formatDate(artwork.created_date)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <ArtworkLightbox
        artwork={selectedArtwork}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        hasNext={selectedIndex < artworks.length - 1}
        hasPrev={selectedIndex > 0}
      />
    </>
  )
}

