'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArtworkLightbox } from './artwork-lightbox'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink } from 'lucide-react'
import { formatDate, calculateAge, cn } from '@/lib/utils'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import Link from 'next/link'

interface GalleryGridProps {
  artworks: ArtworkWithChild[]
}

// Decorative tape colors for variety
const tapeColors = [
  'from-yellow-200/90 to-yellow-300/90',
  'from-pink-200/90 to-pink-300/90',
  'from-blue-200/90 to-blue-300/90',
  'from-green-200/90 to-green-300/90',
  'from-purple-200/90 to-purple-300/90',
  'from-orange-200/90 to-orange-300/90',
]

// Subtle rotation for organic feel
const rotations = [-2, 1, -1, 2, 0, -1.5, 1.5, -0.5]

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
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        role="list"
        aria-label="Artwork gallery"
      >
        <AnimatePresence mode="popLayout">
          {artworks.map((artwork, index) => {
            const tapeColor = tapeColors[index % tapeColors.length]
            const rotation = rotations[index % rotations.length]
            
            return (
              <motion.div
                key={artwork.id}
                layout
                initial={{ opacity: 0, y: 20, rotate: rotation }}
                animate={{ opacity: 1, y: 0, rotate: rotation }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  delay: index * 0.05, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.03, 
                  rotate: 0,
                  zIndex: 10,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                {/* Paper card with shadow */}
                <div 
                  className="relative bg-white rounded-sm shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-visible focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  onClick={() => openLightbox(artwork, index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openLightbox(artwork, index)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${artwork.title} by ${artwork.child?.name || 'Unknown'}`}
                >
                  {/* Decorative tape at top */}
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm",
                    "bg-gradient-to-r shadow-sm z-10",
                    "transform -rotate-1",
                    tapeColor
                  )} 
                  style={{ 
                    clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
                  }}
                  />
                  
                  {/* Image container with paper padding */}
                  <div className="p-3 pb-0">
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image
                        src={artwork.thumbnail_url || artwork.image_url}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <ExternalLink className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info section styled like caption */}
                  <div className="p-3 pt-2">
                    <h3 className="font-display font-semibold text-gray-900 truncate text-lg">
                      {artwork.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">
                            {artwork.child?.name?.[0]}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {artwork.child?.name}
                        </span>
                      </div>
                      {artwork.child && artwork.child_age_months && (
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                          {calculateAge(artwork.child.birth_date, artwork.created_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Favorite heart */}
                  {artwork.is_favorite && (
                    <div className="absolute top-1 right-1 z-20" aria-label="Favorited">
                      <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center animate-pulse">
                        <Heart className="w-4 h-4 text-crayon-red fill-crayon-red" aria-hidden="true" />
                        <span className="sr-only">Favorited</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle paper texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] pointer-events-none rounded-sm" />
              </motion.div>
            )
          })}
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
