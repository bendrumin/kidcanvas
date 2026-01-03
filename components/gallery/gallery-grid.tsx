'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArtworkLightbox } from './artwork-lightbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink, Check, Trash2, X } from 'lucide-react'
import { formatDate, calculateAge, cn } from '@/lib/utils'
import { useMobile } from '@/lib/use-mobile'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import Link from 'next/link'

interface GalleryGridProps {
  artworks: ArtworkWithChild[]
  onCountChange?: (count: number) => void
  canEdit?: boolean
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

export function GalleryGrid({ artworks, onCountChange, canEdit = false }: GalleryGridProps) {
  const { shouldReduceMotion } = useMobile()
  const { toast } = useToast()
  const supabase = createClient()
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkWithChild | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Update count when artworks change
  // Use a ref to prevent calling onCountChange on initial mount if count is already correct
  const prevLengthRef = useRef(artworks.length)
  const isMountedRef = useRef(false)
  
  useEffect(() => {
    isMountedRef.current = true
  }, [])
  
  useEffect(() => {
    // Only call onCountChange if the length actually changed and component is mounted
    // This prevents unnecessary updates that could cause flicker or hydration issues
    if (isMountedRef.current && onCountChange && artworks.length !== prevLengthRef.current) {
      onCountChange(artworks.length)
      prevLengthRef.current = artworks.length
    }
  }, [artworks.length, onCountChange])

  // Listen for selection mode changes (only if canEdit)
  useEffect(() => {
    if (!canEdit) return

    const handleSelectionModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>
      setIsSelectionMode(customEvent.detail?.enabled ?? false)
      if (!customEvent.detail?.enabled) {
        setSelectedIds(new Set())
      }
    }

    const handleClearSelection = () => {
      setSelectedIds(new Set())
    }

    window.addEventListener('selection-mode-changed', handleSelectionModeChange)
    window.addEventListener('clear-selection', handleClearSelection)

    return () => {
      window.removeEventListener('selection-mode-changed', handleSelectionModeChange)
      window.removeEventListener('clear-selection', handleClearSelection)
    }
  }, [canEdit])

  // Toggle artwork selection
  const toggleSelection = (artworkId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(artworkId)) {
        newSet.delete(artworkId)
      } else {
        newSet.add(artworkId)
      }
      return newSet
    })
  }

  // Select all visible artworks
  const selectAll = () => {
    setSelectedIds(new Set(artworks.map(a => a.id)))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    setIsDeleting(true)
    const idsToDelete = Array.from(selectedIds)
    
    try {
      // Delete all selected artworks
      const deletePromises = idsToDelete.map(id =>
        supabase.from('artworks').delete().eq('id', id)
      )

      const results = await Promise.all(deletePromises)
      
      // Check for errors
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} artwork(s)`)
      }

      // Success
      toast({
        title: 'Artworks deleted',
        description: `Successfully deleted ${idsToDelete.length} artwork${idsToDelete.length > 1 ? 's' : ''}`,
      })

      // Clear selection and exit selection mode
      setSelectedIds(new Set())
      setIsSelectionMode(false)
      setShowBulkDeleteDialog(false)
      window.dispatchEvent(new CustomEvent('selection-mode-changed', { 
        detail: { enabled: false } 
      }))

      // Dispatch events for count updates
      for (let i = 0; i < idsToDelete.length; i++) {
        window.dispatchEvent(new CustomEvent('artwork-deleted'))
      }

      // Refresh the page to update the gallery
      window.location.reload()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete artworks'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

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

  const handleDelete = () => {
    closeLightbox()
    // Dispatch event to update counter
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('artwork-deleted'))
    }
    // Update count immediately
    if (onCountChange) {
      onCountChange(artworks.length - 1)
    }
    // Refresh the page to update the gallery
    window.location.reload()
  }

  return (
    <>
      {/* Bulk selection toolbar */}
      {isSelectionMode && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4 mb-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size} of {artworks.length} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectedIds.size === artworks.length ? deselectAll : selectAll}
                >
                  {selectedIds.size === artworks.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedIds.size})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds(new Set())
                  window.dispatchEvent(new CustomEvent('selection-mode-changed', { 
                    detail: { enabled: false } 
                  }))
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20, rotate: rotation }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, rotate: rotation }}
                exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                transition={shouldReduceMotion ? {} : { 
                  delay: index * 0.05, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={shouldReduceMotion ? {} : { 
                  scale: 1.03, 
                  rotate: 0,
                  zIndex: 10,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                {/* Paper card with shadow */}
                <div 
                  className={cn(
                    "relative bg-white rounded-sm shadow-md active:shadow-lg overflow-visible focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
                    isSelectionMode 
                      ? "cursor-default" 
                      : "cursor-pointer",
                    shouldReduceMotion 
                      ? "transition-shadow duration-150" 
                      : "hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0",
                    isSelectionMode && selectedIds.has(artwork.id) && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(artwork.id)
                    } else {
                      openLightbox(artwork, index)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (isSelectionMode) {
                        toggleSelection(artwork.id)
                      } else {
                        openLightbox(artwork, index)
                      }
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={isSelectionMode 
                    ? `${selectedIds.has(artwork.id) ? 'Deselect' : 'Select'} ${artwork.title}`
                    : `View ${artwork.title} by ${artwork.child?.name || 'Unknown'}`
                  }
                >
                  {/* Selection checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-30">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedIds.has(artwork.id)
                            ? "bg-primary border-primary"
                            : "bg-white border-gray-300"
                        )}
                      >
                        {selectedIds.has(artwork.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  )}
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
                        alt={`${artwork.title} by ${artwork.child?.name || 'Unknown artist'}`}
                        fill
                        className={cn(
                          "object-cover",
                          shouldReduceMotion 
                            ? "" 
                            : "transition-transform duration-500 group-hover:scale-105"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading={index < 8 ? "eager" : "lazy"}
                      />

                      {/* Hover overlay (only show when not in selection mode) */}
                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 transform group-hover:scale-110 group-active:scale-95">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                              <ExternalLink className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </div>
                      )}
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
        canEdit={canEdit}
        onDelete={handleDelete}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Artwork{selectedIds.size > 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} artwork{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Artwork${selectedIds.size > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
