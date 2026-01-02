'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
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
  Trash2,
  Calendar,
  User,
  Tag,
  Loader2
} from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ArtworkLightboxProps {
  artwork: ArtworkWithChild | null
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  hasNext: boolean
  hasPrev: boolean
  canEdit?: boolean
  onDelete?: () => void
}

export function ArtworkLightbox({ 
  artwork, 
  onClose, 
  onNavigate,
  hasNext,
  hasPrev,
  canEdit = false,
  onDelete
}: ArtworkLightboxProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

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
      // Focus the close button when dialog opens
      closeButtonRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [artwork])

  const handleDelete = async () => {
    if (!artwork) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artwork.id)

      if (error) throw error

      toast({ title: 'Artwork deleted' })
      setShowDeleteConfirm(false)
      onClose()
      if (onDelete) {
        onDelete()
      } else {
        // Fallback: reload the page
        window.location.reload()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
      setIsDeleting(false)
    }
  }

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="artwork-dialog-title"
        aria-describedby="artwork-dialog-description"
        ref={dialogRef}
      >
        {/* Close Button */}
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/10 z-50 focus:ring-2 focus:ring-white"
          onClick={onClose}
          aria-label="Close artwork viewer"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </Button>

        {/* Navigation */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-50 focus:ring-2 focus:ring-white"
            onClick={(e) => { e.stopPropagation(); onNavigate('prev') }}
            aria-label="View previous artwork"
          >
            <ChevronLeft className="w-8 h-8" aria-hidden="true" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-50 focus:ring-2 focus:ring-white"
            onClick={(e) => { e.stopPropagation(); onNavigate('next') }}
            aria-label="View next artwork"
          >
            <ChevronRight className="w-8 h-8" aria-hidden="true" />
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
          <figure className="relative flex-1 min-h-[300px] lg:min-h-[500px] bg-gray-100 dark:bg-gray-900">
            <Image
              src={artwork.image_url}
              alt={`${artwork.title} by ${artwork.child?.name || 'Unknown artist'}${artwork.ai_description ? `. ${artwork.ai_description}` : ''}`}
              fill
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
            <figcaption className="sr-only">
              Artwork: {artwork.title} by {artwork.child?.name || 'Unknown artist'}
              {artwork.created_date && `, created ${new Date(artwork.created_date).toLocaleDateString()}`}
            </figcaption>
          </figure>

          {/* Info Panel */}
          <div className="w-full lg:w-80 p-6 overflow-y-auto" role="region" aria-label="Artwork details">
            <div className="space-y-6">
              {/* Title & Actions */}
              <div>
                <h2 id="artwork-dialog-title" className="text-2xl font-display font-bold mb-2">
                  {artwork.title}
                </h2>
                <p id="artwork-dialog-description" className="sr-only">
                  Artwork by {artwork.child?.name}, created on {formatDate(artwork.created_date)}
                </p>
                <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Artwork actions">
                  <Button variant="outline" size="sm" aria-label="Add to favorites">
                    <Heart className="w-4 h-4 mr-1" aria-hidden="true" />
                    Favorite
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Share artwork">
                    <Share2 className="w-4 h-4 mr-1" aria-hidden="true" />
                    Share
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/artwork/${artwork.id}`} aria-label="Edit artwork details">
                          <Edit className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete artwork"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10">
                <div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white font-bold"
                  aria-hidden="true"
                >
                  {artwork.child?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-semibold">{artwork.child?.name}</p>
                  {artwork.child && artwork.child_age_months && (
                    <p className="text-sm text-muted-foreground">
                      Age: {calculateAge(artwork.child.birth_date, artwork.created_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <dl className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">Created date</dt>
                  <dd>Created: {formatDate(artwork.created_date)}</dd>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">Upload date</dt>
                  <dd>Uploaded: {formatDate(artwork.uploaded_at)}</dd>
                </div>
              </dl>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium" id="tags-heading">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="list" aria-labelledby="tags-heading">
                    {allTags.map((tag, i) => (
                      <Badge key={i} variant="secondary" role="listitem">
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
                    <span aria-hidden="true">✨</span> AI Description
                  </p>
                  <p className="text-sm">{artwork.ai_description}</p>
                </div>
              )}

              {/* Download Button */}
              <Button className="w-full" variant="outline" asChild>
                <a 
                  href={artwork.image_url} 
                  download 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Download original image of ${artwork.title}`}
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download Original
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="z-[100]">
          <DialogHeader>
            <DialogTitle>Delete Artwork?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{artwork.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}
