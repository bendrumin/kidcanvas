'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  QrCode,
  BookOpen,
  Camera
} from 'lucide-react'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { QRCodeDialog } from './qr-code-dialog'
import { ArtworkReactions } from './artwork-reactions'
import { ArtworkComments } from './artwork-comments'
import { VoicePlayer } from './voice-player'

interface ArtworkDetailProps {
  artwork: ArtworkWithChild
  children: Child[]
  canEdit: boolean
}

export function ArtworkDetail({ artwork, children, canEdit }: ArtworkDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(artwork.is_favorite)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiDescription, setAiDescription] = useState(artwork.ai_description)
  const [aiTags, setAiTags] = useState(artwork.ai_tags)
  
  const [editForm, setEditForm] = useState({
    title: artwork.title,
    story: artwork.story || '',
    childId: artwork.child_id,
    createdDate: artwork.created_date,
    tags: artwork.tags?.join(', ') || '',
  })

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
      }
    }
    getUser()
  }, [supabase])

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
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t create share link'
      toast({ title: 'Oops!', description: errorMessage, variant: 'destructive' })
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
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t update favorite'
      toast({ title: 'Oops!', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('artworks') as any)
        .update({
          title: editForm.title,
          story: editForm.story,
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
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t save changes'
      toast({ title: 'Oops!', description: errorMessage, variant: 'destructive' })
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
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t delete artwork'
      toast({ title: 'Oops!', description: errorMessage, variant: 'destructive' })
      setIsLoading(false)
    }
  }

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true)

    try {
      const response = await fetch('/api/ai-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artwork.id, imageUrl: artwork.image_url }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Couldn\'t generate AI tags')
      }

      setAiDescription(data.description)
      setAiTags(data.tags)

      toast({
        title: 'AI analysis complete!',
        description: 'AI tags and description added!',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t generate AI tags'
      toast({
        title: 'Oops!',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }


  const allTags = [...(artwork.tags || []), ...(aiTags || [])]

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
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !editForm.story || editForm.story.trim().length < 20}
              className="relative z-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Story Section - Prominently Displayed */}
      {artwork.story ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-blue-50/40 dark:from-pink-950/20 dark:via-purple-950/10 dark:to-blue-950/10 p-8 md:p-10 shadow-xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-300/20 to-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  The Story
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {artwork.child?.name} • {formatDate(artwork.created_date)}
                </p>
              </div>
            </div>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-foreground leading-relaxed text-lg whitespace-pre-wrap font-medium">
                {artwork.story}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/30 dark:from-amber-950/15 dark:via-orange-950/10 dark:to-yellow-950/10 p-8 md:p-10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Add a Story
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This artwork doesn't have a story yet. Stories help preserve the meaningful moments around each piece—what your child said, how they felt, when and where they made it.
              </p>
              {canEdit && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add Story
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Story Player */}
      {artwork.voice_note_url && (
        <VoicePlayer
          voiceUrl={artwork.voice_note_url}
          duration={artwork.voice_duration_seconds ?? undefined}
        />
      )}

      {/* Moment Photo or Artwork Image */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Moment Photo (if available) */}
          {artwork.moment_photo_url && (
            <div className="relative group overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <Image
                  src={artwork.moment_photo_url}
                  alt={`${artwork.child?.name} with their artwork`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Camera className="w-4 h-4" />
                    <span>The moment</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Artwork Image */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 shadow-xl p-4 md:p-6">
            <div className="relative aspect-[4/3] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800">
              <Image
                src={artwork.image_url}
                alt={`${artwork.title} by ${artwork.child?.name || 'Unknown artist'}`}
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </div>

          {/* Reactions */}
          {userId && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-4">
              <ArtworkReactions artworkId={artwork.id} userId={userId} />
            </div>
          )}

          {/* Comments */}
          {userId && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
              <ArtworkComments artworkId={artwork.id} userId={userId} userEmail={userEmail} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={isFavorite ? 'default' : 'outline'}
              onClick={handleFavorite}
              className={`${isFavorite ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 shadow-lg' : 'border-gray-300 dark:border-gray-700'} transition-all`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            <Button variant="outline" asChild className="border-gray-300 dark:border-gray-700">
              <a href={artwork.image_url} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
            <Button variant="outline" onClick={handleShare} disabled={isSharing} className="border-gray-300 dark:border-gray-700">
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
                className="border-gray-300 dark:border-gray-700"
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
                    <Label htmlFor="edit-story" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Story *
                    </Label>
                    <Textarea
                      id="edit-story"
                      value={editForm.story}
                      onChange={(e) => setEditForm({ ...editForm, story: e.target.value })}
                      className="min-h-[120px]"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {editForm.story.length} characters (minimum 20 required)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Title (optional)</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Short title for searching"
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
                  <CardTitle className="text-xl mb-2">{artwork.title}</CardTitle>
                  <Link 
                    href={`/dashboard?child=${artwork.child_id}`}
                    className="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-100/80 via-purple-100/60 to-blue-100/40 dark:from-pink-950/30 dark:via-purple-950/20 dark:to-blue-950/20 hover:shadow-md transition-all border border-pink-200/50 dark:border-pink-900/30"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {artwork.child?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-base">{artwork.child?.name}</p>
                      {artwork.child && artwork.child_age_months !== null && (
                        <p className="text-sm text-muted-foreground font-medium">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
                {canEdit && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-crayon-blue/10 to-crayon-green/10 hover:from-crayon-blue/20 hover:to-crayon-green/20"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-2 text-crayon-blue" />
                    )}
                    {aiTags && aiTags.length > 0 ? 'Refresh AI' : 'Generate AI'}
                  </Button>
                )}
              </div>
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
                  {aiTags && aiTags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-crayon-blue" />
                        AI detected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiTags.map((tag, i) => (
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

                  {!artwork.tags?.length && !aiTags?.length && (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Description */}
          {aiDescription && (
            <Card className="bg-gradient-to-br from-crayon-blue/5 to-crayon-green/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-crayon-blue" />
                  AI Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aiDescription}</p>
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

