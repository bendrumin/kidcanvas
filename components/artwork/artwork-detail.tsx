'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate, calculateAge } from '@/lib/utils'
import { 
  ArrowLeft, 
  Heart, 
  Download, 
  Share2, 
  Edit, 
  Trash2,
  Loader2,
  Calendar,
  User,
  Tag,
  Sparkles,
  Save,
  X,
  QrCode
} from 'lucide-react'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { QRCodeDialog } from './qr-code-dialog'

interface ArtworkDetailProps {
  artwork: ArtworkWithChild
  children: Child[]
  canEdit: boolean
}

export function ArtworkDetail({ artwork, children, canEdit }: ArtworkDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(artwork.is_favorite)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  
  const [editForm, setEditForm] = useState({
    title: artwork.title,
    childId: artwork.child_id,
    createdDate: artwork.created_date,
    tags: artwork.tags?.join(', ') || '',
  })

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artwork.id }),
      })
      
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      
      setShareUrl(data.url)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.url)
      toast({
        title: 'Share link copied!',
        duration: 2000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create share link'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSharing(false)
    }
  }

  const handleFavorite = async () => {
    const newValue = !isFavorite
    setIsFavorite(newValue)
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('artworks') as any)
        .update({ is_favorite: newValue })
        .eq('id', artwork.id)

      if (error) throw error

      // Visual feedback (heart icon fills/unfills) is enough
    } catch (error) {
      setIsFavorite(!newValue) // Revert
      const errorMessage = error instanceof Error ? error.message : 'Failed to update'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('artworks') as any)
        .update({
          title: editForm.title,
          child_id: editForm.childId,
          created_date: editForm.createdDate,
          tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        })
        .eq('id', artwork.id)

      if (error) throw error

      toast({ title: 'Artwork updated!' })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artwork.id)

      if (error) throw error

      toast({ title: 'Artwork deleted' })
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
      setIsLoading(false)
    }
  }

  const allTags = [...(artwork.tags || []), ...(artwork.ai_tags || [])]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Gallery
        </Button>
        
        {canEdit && !isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleting(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {isEditing && (
          <div className="flex gap-2 relative z-50">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="relative z-50">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="relative z-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Image */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={artwork.image_url}
                alt={`${artwork.title} by ${artwork.child?.name || 'Unknown artist'}${artwork.ai_description ? ` - ${artwork.ai_description}` : ''}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button 
              variant={isFavorite ? 'default' : 'outline'}
              onClick={handleFavorite}
              className={isFavorite ? 'bg-crayon-red hover:bg-crayon-red/90' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            <Button variant="outline" asChild>
              <a href={artwork.image_url} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
            <Button variant="outline" onClick={handleShare} disabled={isSharing}>
              {isSharing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              {shareUrl ? 'Link Copied!' : 'Share'}
            </Button>
            {shareUrl && (
              <Button 
                variant="outline" 
                onClick={() => setShowQRCode(true)}
                title="Generate QR code"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Title & Artist */}
          <Card>
            <CardHeader className="pb-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Artist</Label>
                    <Select
                      value={editForm.childId}
                      onValueChange={(value) => setEditForm({ ...editForm, childId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Created Date</Label>
                    <Input
                      type="date"
                      value={editForm.createdDate}
                      onChange={(e) => setEditForm({ ...editForm, createdDate: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{artwork.title}</CardTitle>
                  <Link 
                    href={`/dashboard?child=${artwork.child_id}`}
                    className="flex items-center gap-3 mt-4 p-3 -mx-3 rounded-xl bg-gradient-to-r from-crayon-purple/10 to-crayon-pink/10 hover:from-crayon-purple/20 hover:to-crayon-pink/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center text-white font-bold">
                      {artwork.child?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{artwork.child?.name}</p>
                      {artwork.child && artwork.child_age_months !== null && (
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(artwork.child.birth_date, artwork.created_date)}
                        </p>
                      )}
                    </div>
                  </Link>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(artwork.created_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">{formatDate(artwork.uploaded_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="rainbow, butterfly, colorful"
                  />
                  <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* User Tags */}
                  {artwork.tags && artwork.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Your tags</p>
                      <div className="flex flex-wrap gap-2">
                        {artwork.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Tags */}
                  {artwork.ai_tags && artwork.ai_tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-crayon-blue" />
                        AI detected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {artwork.ai_tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-gradient-to-r from-crayon-blue/20 to-crayon-green/20 border-crayon-blue/30"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!artwork.tags?.length && !artwork.ai_tags?.length && (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Description */}
          {artwork.ai_description && (
            <Card className="bg-gradient-to-br from-crayon-blue/5 to-crayon-green/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-crayon-blue" />
                  AI Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{artwork.ai_description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Artwork?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{artwork.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      {shareUrl && (
        <QRCodeDialog
          open={showQRCode}
          onOpenChange={setShowQRCode}
          shareUrl={shareUrl}
          artworkTitle={artwork.title}
          childName={artwork.child?.name}
        />
      )}
    </div>
  )
}

