'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
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
import {
  Upload,
  X,
  Loader2,
  ImagePlus,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { Child } from '@/lib/supabase/types'
import { LimitReachedDialog } from '@/components/paywall/limit-reached-dialog'
import { useAnalytics, useMultiFileTracking } from '@/hooks/useAnalytics'

// Celebration confetti effect
const celebrate = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#E91E63', '#9B59B6', '#3498DB'] })
  fire(0.2, { spread: 60, colors: ['#F39C12', '#F1C40F', '#2ECC71'] })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#E74C3C', '#3498DB'] })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.1, { spread: 120, startVelocity: 45, colors: ['#9B59B6', '#E91E63'] })
}

interface UploadFormProps {
  familyId: string
  children: Child[]
  userId: string
}

interface FilePreview {
  file: File
  preview: string
  title: string
  description: string
  childId: string
  createdDate: string
  tags: string
}

export function UploadForm({ familyId, children, userId }: UploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ current: number; limit: number } | null>(null)
  const uploadStartTimeRef = useRef<number | null>(null)

  // Analytics hooks
  const { track } = useAnalytics({ userId, familyId })
  const {
    trackFileNavigation,
    trackFileRemoved,
    getFileTimeSpent,
    resetTracking: resetMultiFileTracking
  } = useMultiFileTracking(files.length)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      description: '',
      childId: children[0]?.id || '',
      createdDate: new Date().toISOString().split('T')[0],
      tags: '',
    }))
    setFiles(newFiles)
    setCurrentFileIndex(0)
    setShowModal(true)

    // Track upload started
    uploadStartTimeRef.current = Date.now()
    track('upload_started', {
      fileCount: newFiles.length,
      userId,
      familyId,
    })
  }, [children, track, userId, familyId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  const removeFile = (index: number) => {
    // Track file removal
    const timeSpentMs = getFileTimeSpent(index)
    trackFileRemoved(index, files.length - 1, {
      userId,
      familyId,
      timeSpentMs,
    })

    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
    if (files.length <= 1) {
      setShowModal(false)
    } else if (currentFileIndex >= files.length - 1) {
      setCurrentFileIndex(Math.max(0, currentFileIndex - 1))
    }
  }

  const updateFile = (index: number, updates: Partial<FilePreview>) => {
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], ...updates }
      return newFiles
    })
  }

  const handleCancel = () => {
    // Track upload abandoned
    const uploadDurationMs = uploadStartTimeRef.current
      ? Date.now() - uploadStartTimeRef.current
      : undefined

    track('upload_abandoned', {
      fileCount: files.length,
      currentFileIndex,
      uploadDurationMs,
      userId,
      familyId,
    })

    files.forEach(f => {
      URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setShowModal(false)
    uploadStartTimeRef.current = null
    resetMultiFileTracking()
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const uploadAttemptStart = Date.now()

    try {
      for (const fileData of files) {
        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('familyId', familyId)
        formData.append('childId', fileData.childId)
        formData.append('title', fileData.title || 'Untitled Artwork')
        formData.append('createdDate', fileData.createdDate)
        formData.append('userId', userId)
        if (fileData.description && fileData.description.trim()) {
          formData.append('description', fileData.description)
        }
        if (fileData.tags && fileData.tags.trim()) {
          formData.append('tags', fileData.tags)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()

          // Check if it's a limit error
          if (errorData.limitReached) {
            // Track limit reached
            track('upload_validation_blocked', {
              validationError: 'limit_reached',
              fileCount: files.length,
              currentLimit: errorData.limit,
              currentUsage: errorData.current,
              userId,
              familyId,
            })

            setLimitInfo({ current: errorData.current, limit: errorData.limit })
            setShowLimitDialog(true)
            setIsUploading(false)
            return
          }

          const errorMessage = errorData.details || errorData.error || 'Upload failed'

          // Track validation error
          track('upload_validation_blocked', {
            validationError: errorMessage,
            fileCount: files.length,
            userId,
            familyId,
          })

          throw new Error(errorMessage)
        }

        await response.json()
      }

      // Track successful upload
      const uploadDurationMs = uploadStartTimeRef.current
        ? Date.now() - uploadStartTimeRef.current
        : undefined
      const apiDurationMs = Date.now() - uploadAttemptStart

      // Calculate aggregate stats for all uploaded files
      const filesWithTags = files.filter(f => f.tags?.trim()).length
      const filesWithDescription = files.filter(f => f.description?.trim()).length

      track('upload_completed', {
        fileCount: files.length,
        uploadDurationMs,
        apiDurationMs,
        filesWithTags,
        filesWithDescription,
        userId,
        familyId,
      })

      // Celebrate with confetti!
      setShowModal(false)
      celebrate()

      toast({
        title: 'Success!',
        description: `${files.length} artwork${files.length > 1 ? 's' : ''} uploaded successfully!`,
        duration: 3000,
      })

      // Dispatch event to update gallery counter
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('artwork-added'))
      }

      // Cleanup
      files.forEach(f => {
        URL.revokeObjectURL(f.preview)
      })
      setFiles([])
      uploadStartTimeRef.current = null
      resetMultiFileTracking()

      // Small delay to let confetti be seen
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload didn\'t work'
      toast({
        title: 'Oops! Upload didn\'t work',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (children.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crayon-yellow/30 to-crayon-orange/30 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-crayon-orange" />
        </div>
        <h3 className="text-xl font-display font-bold mb-2">Add a child first</h3>
        <p className="text-muted-foreground mb-4">
          Before uploading artwork, you need to add at least one child to your family.
        </p>
        <Button onClick={() => router.push('/dashboard/children')}>
          Add Your First Child
        </Button>
      </Card>
    )
  }

  const currentFile = files[currentFileIndex]

  return (
    <>
      <div className="space-y-8" role="form" aria-label="Upload artwork form">
        {/* Status announcer for screen readers */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {isUploading 
            ? `Uploading ${files.length} artwork${files.length > 1 ? 's' : ''}...` 
            : files.length > 0 
            ? `${files.length} artwork${files.length > 1 ? 's' : ''} ready to upload` 
            : 'No files selected'}
        </div>

        {/* Upload Options */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
            ${isDragActive
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
          `}
          aria-label="Upload artwork. Drag and drop files here or click to browse."
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center transition-all
              ${isDragActive
                ? 'bg-gradient-to-br from-crayon-pink to-crayon-purple'
                : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900'
              }
            `} aria-hidden="true">
              <ImagePlus className={`w-8 h-8 ${isDragActive ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-semibold">
                {isDragActive ? 'Drop here!' : 'Upload Artwork'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop, click to browse, or use your camera
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Artwork Details Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {files.length === 1 ? 'Add Artwork Details' : `Artwork ${currentFileIndex + 1} of ${files.length}`}
            </DialogTitle>
          </DialogHeader>

          {currentFile && (
            <div className="flex flex-col gap-4 sm:gap-6 pb-4">
              {/* Image Preview - Top */}
              <div className="w-full">
                <div className="relative aspect-[4/3] w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={currentFile.preview}
                    alt={`Preview of ${currentFile.title}`}
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={() => removeFile(currentFileIndex)}
                    className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors touch-manipulation"
                    aria-label="Remove this artwork"
                    type="button"
                  >
                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {currentFile.file.name} • {formatFileSize(currentFile.file.size)}
                </p>

                {/* Navigation for multiple files */}
                {files.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                      onClick={() => {
                        const newIndex = Math.max(0, currentFileIndex - 1)
                        setCurrentFileIndex(newIndex)
                        trackFileNavigation(newIndex, {
                          userId,
                          familyId,
                          direction: 'previous',
                        })
                      }}
                      disabled={currentFileIndex === 0}
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground min-w-[60px] text-center">
                      {currentFileIndex + 1} / {files.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                      onClick={() => {
                        const newIndex = Math.min(files.length - 1, currentFileIndex + 1)
                        setCurrentFileIndex(newIndex)
                        trackFileNavigation(newIndex, {
                          userId,
                          familyId,
                          direction: 'next',
                        })
                      }}
                      disabled={currentFileIndex === files.length - 1}
                    >
                      <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Form Fields - Below Image */}
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist *</Label>
                  <Select
                    value={currentFile.childId}
                    onValueChange={(value) => updateFile(currentFileIndex, { childId: value })}
                  >
                    <SelectTrigger id="artist">
                      <SelectValue placeholder="Who made this?" />
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
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={currentFile.title}
                    onChange={(e) => updateFile(currentFileIndex, { title: e.target.value })}
                    placeholder="My Rainbow Painting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={currentFile.description}
                    onChange={(e) => updateFile(currentFileIndex, { description: e.target.value })}
                    placeholder="Add any notes about this artwork..."
                    className="min-h-[80px] sm:min-h-[100px] resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    value={currentFile.tags}
                    onChange={(e) => updateFile(currentFileIndex, { tags: e.target.value })}
                    placeholder="rainbow, butterfly, colorful"
                  />
                  <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date Created</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={currentFile.createdDate}
                      onChange={(e) => updateFile(currentFileIndex, { createdDate: e.target.value })}
                      className="pl-9 appearance-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUploading}
                    className="flex-1 h-11 touch-manipulation"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || files.some(f => !f.childId)}
                    className="flex-1 h-11 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90 touch-manipulation"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {files.length === 1 ? 'Save' : `Save All (${files.length})`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {limitInfo && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType="artwork"
          current={limitInfo.current}
          limit={limitInfo.limit}
        />
      )}
    </>
  )
}
