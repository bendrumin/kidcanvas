'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Download, Book } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { generateArtBookPDF, type ArtBookOptions } from '@/lib/pdf-generator'
import type { ArtworkWithChild } from '@/lib/supabase/types'

interface ArtBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artworks: ArtworkWithChild[]
  defaultTitle?: string
  defaultChildName?: string
  planId?: 'free' | 'family' | 'pro'
}

export function ArtBookDialog({
  open,
  onOpenChange,
  artworks,
  defaultTitle = 'My Art Collection',
  defaultChildName,
  planId = 'free',
}: ArtBookDialogProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Check if user has access
  const hasAccess = planId === 'family' || planId === 'pro'
  
  useEffect(() => {
    if (open && !hasAccess) {
      toast({
        title: 'Upgrade Required',
        description: 'Art Books are available in the Family plan. Upgrade to create print-ready PDFs!',
        variant: 'destructive',
      })
      onOpenChange(false)
      // Redirect to billing
      window.location.href = '/dashboard/billing'
    }
  }, [open, hasAccess, onOpenChange, toast])
  
  if (!hasAccess) {
    return null
  }
  const [options, setOptions] = useState<ArtBookOptions>({
    title: defaultTitle,
    subtitle: defaultChildName ? `by ${defaultChildName}` : undefined,
    childName: defaultChildName,
    layout: 'one-per-page',
    includeMetadata: true,
    includeCover: true,
  })

  const handleGenerate = async () => {
    if (!options.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your art book.',
        variant: 'destructive',
      })
      return
    }

    if (artworks.length === 0) {
      toast({
        title: 'No artwork selected',
        description: 'Please select at least one artwork.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    
    try {
      await generateArtBookPDF(artworks, options)
      
      toast({
        title: 'Art book generated!',
        description: 'Your PDF has been downloaded.',
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Create Art Book
          </DialogTitle>
          <DialogDescription>
            Generate a beautiful PDF book from {artworks.length} artwork{artworks.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Book Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                value={options.title}
                onChange={(e) => setOptions({ ...options, title: e.target.value })}
                placeholder="My Art Collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (optional)</Label>
              <Input
                id="subtitle"
                value={options.subtitle || ''}
                onChange={(e) => setOptions({ ...options, subtitle: e.target.value || undefined })}
                placeholder="2024 Collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={options.layout}
                onValueChange={(value: ArtBookOptions['layout']) =>
                  setOptions({ ...options, layout: value })
                }
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-per-page">One per page (best quality)</SelectItem>
                  <SelectItem value="grid">Grid (2x2 per page)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCover"
                checked={options.includeCover}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeCover: checked === true })
                }
              />
              <label
                htmlFor="includeCover"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include cover page
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={options.includeMetadata}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeMetadata: checked === true })
                }
              />
              <label
                htmlFor="includeMetadata"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include artwork titles and dates
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-900 dark:text-amber-200">
            <p className="font-semibold mb-1">💡 Print-ready PDF</p>
            <p className="text-xs">
              The PDF can be printed at home or uploaded to services like Shutterfly, Mixbook, or Printique for professional printing.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || artworks.length === 0}
              className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

