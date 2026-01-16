'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
import { Download, Copy, Check, Lightbulb } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  artworkTitle: string
  childName?: string
}

export function QRCodeDialog({
  open,
  onOpenChange,
  shareUrl,
  artworkTitle,
  childName,
}: QRCodeDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    try {
      // Create a canvas to render the QR code
      const svg = document.getElementById('qr-code-svg') as SVGSVGElement | null
      if (!svg) {
        toast({
          title: 'Oops!',
          description: 'QR code not found',
          variant: 'destructive',
        })
        return
      }

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      
      // Set canvas size (QR code is 200px + margin)
      canvas.width = 224
      canvas.height = 224

      img.onload = () => {
        // Draw white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw the QR code
        ctx.drawImage(img, 12, 12, 200, 200)

        // Download the canvas as PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            toast({
              title: 'Oops!',
              description: 'Couldn\'t generate image',
              variant: 'destructive',
            })
            return
          }
          
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `kidcanvas-qr-${artworkTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          toast({
            title: 'QR code downloaded!',
            description: 'You can now print or share the QR code.',
          })
        }, 'image/png')
      }

      img.onerror = () => {
        toast({
          title: 'Oops!',
          description: 'Couldn\'t generate QR code',
          variant: 'destructive',
        })
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch (error) {
      toast({
        title: 'Oops!',
        description: 'Couldn\'t download QR code',
        variant: 'destructive',
      })
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: 'Link copied!',
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Couldn\'t copy',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for Sharing</DialogTitle>
          <DialogDescription>
            Scan this QR code to view {childName ? `${childName}'s` : 'this'} artwork instantly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-amber-100">
            <QRCodeSVG
              id="qr-code-svg"
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#1f2937"
              bgColor="#ffffff"
            />
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Done
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> <strong>Ways to use this QR code:</strong>
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Print it and display with the artwork</li>
              <li>Share with grandparents to scan and view</li>
              <li>Include in photo albums or scrapbooks</li>
              <li>Email or text the image to family members</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

