'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
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
  Sparkles
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { Child } from '@/lib/supabase/types'

interface UploadFormProps {
  familyId: string
  children: Child[]
  userId: string
}

interface FilePreview {
  file: File
  preview: string
  title: string
  childId: string
  createdDate: string
}

export function UploadForm({ familyId, children, userId }: UploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      childId: children[0]?.id || '',
      createdDate: new Date().toISOString().split('T')[0],
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [children])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const updateFile = (index: number, updates: Partial<FilePreview>) => {
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], ...updates }
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      for (const fileData of files) {
        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('familyId', familyId)
        formData.append('childId', fileData.childId)
        formData.append('title', fileData.title)
        formData.append('createdDate', fileData.createdDate)
        formData.append('userId', userId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Upload failed')
        }
      }

      toast({
        title: 'Success!',
        description: `${files.length} artwork${files.length > 1 ? 's' : ''} uploaded successfully.`,
      })

      // Cleanup
      files.forEach(f => URL.revokeObjectURL(f.preview))
      setFiles([])
      
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload'
      toast({
        title: 'Upload failed',
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

  return (
    <div className="space-y-8">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center transition-all
            ${isDragActive 
              ? 'bg-gradient-to-br from-crayon-pink to-crayon-purple' 
              : 'bg-gradient-to-br from-gray-100 to-gray-50'
            }
          `}>
            <ImagePlus className={`w-10 h-10 ${isDragActive ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {isDragActive ? 'Drop your artwork here!' : 'Drag & drop artwork here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • JPEG, PNG, GIF, HEIC up to 20MB
            </p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold">
              {files.length} artwork{files.length > 1 ? 's' : ''} ready to upload
            </h3>
            <Button variant="outline" size="sm" onClick={() => setFiles([])}>
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {files.map((file, index) => (
              <Card key={index} className="p-4">
                <div className="flex gap-4">
                  {/* Preview */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={file.preview}
                      alt={file.title}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`title-${index}`}>Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={file.title}
                        onChange={(e) => updateFile(index, { title: e.target.value })}
                        placeholder="Artwork title"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`child-${index}`}>Artist</Label>
                      <Select
                        value={file.childId}
                        onValueChange={(value) => updateFile(index, { childId: value })}
                      >
                        <SelectTrigger id={`child-${index}`}>
                          <SelectValue placeholder="Select child" />
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

                    <div className="space-y-1.5">
                      <Label htmlFor={`date-${index}`}>Created Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={file.createdDate}
                          onChange={(e) => updateFile(index, { createdDate: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {file.file.name} • {formatFileSize(file.file.size)}
                </p>
              </Card>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || files.some(f => !f.childId)}
              className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} Artwork{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

