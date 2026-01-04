import jsPDF from 'jspdf'
import type { ArtworkWithChild } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { formatAgeMonths } from '@/lib/timeline-utils'

export interface ArtBookOptions {
  title: string
  subtitle?: string
  childName?: string
  dateRange?: string
  layout: 'one-per-page' | 'grid' | 'timeline'
  includeMetadata: boolean
  includeCover: boolean
}

export async function generateArtBookPDF(
  artworks: ArtworkWithChild[],
  options: ArtBookOptions
): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  let currentPage = 1

  // Helper to add a new page
  const addPage = () => {
    pdf.addPage()
    currentPage++
  }

  // Helper to load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  // Cover page
  if (options.includeCover && artworks.length > 0) {
    pdf.setFillColor(233, 30, 99) // KidCanvas pink
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(32)
    pdf.setFont('helvetica', 'bold')
    pdf.text(options.title, pageWidth / 2, pageHeight / 2 - 20, {
      align: 'center',
    })

    if (options.subtitle) {
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'normal')
      pdf.text(options.subtitle, pageWidth / 2, pageHeight / 2 + 10, {
        align: 'center',
      })
    }

    if (options.childName) {
      pdf.setFontSize(16)
      pdf.text(`by ${options.childName}`, pageWidth / 2, pageHeight / 2 + 30, {
        align: 'center',
      })
    }

    if (options.dateRange) {
      pdf.setFontSize(12)
      pdf.text(options.dateRange, pageWidth / 2, pageHeight / 2 + 45, {
        align: 'center',
      })
    }

    pdf.setFontSize(12)
    pdf.text(
      `${artworks.length} Artwork${artworks.length !== 1 ? 's' : ''}`,
      pageWidth / 2,
      pageHeight - 40,
      { align: 'center' }
    )

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.text('Created with KidCanvas', pageWidth / 2, pageHeight - 25, {
      align: 'center',
    })

    addPage()
  }

  // Generate pages based on layout
  if (options.layout === 'one-per-page') {
    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]
      
      try {
        // Load image
        const img = await loadImage(artwork.image_url)
        
        // Calculate dimensions to fit page
        const maxWidth = contentWidth
        const maxHeight = pageHeight - (options.includeMetadata ? 60 : 40)
        
        let imgWidth = img.width
        let imgHeight = img.height
        const aspectRatio = imgWidth / imgHeight
        
        if (imgWidth > maxWidth || imgHeight > maxHeight) {
          if (aspectRatio > maxWidth / maxHeight) {
            imgWidth = maxWidth
            imgHeight = maxWidth / aspectRatio
          } else {
            imgHeight = maxHeight
            imgWidth = maxHeight * aspectRatio
          }
        }

        const x = (pageWidth - imgWidth) / 2
        const y = margin + 10

        // Add image
        pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight)

        // Add metadata
        if (options.includeMetadata) {
          pdf.setFontSize(10)
          pdf.setTextColor(0, 0, 0)
          pdf.setFont('helvetica', 'bold')
          
          const metadataY = y + imgHeight + 15
          pdf.text(artwork.title, margin, metadataY)
          
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(9)
          
          let metadataLines = []
          if (artwork.child?.name) {
            metadataLines.push(`by ${artwork.child.name}`)
          }
          if (artwork.created_date) {
            metadataLines.push(formatDate(artwork.created_date))
          }
          if (artwork.child_age_months !== null) {
            metadataLines.push(formatAgeMonths(artwork.child_age_months))
          }
          
          pdf.text(metadataLines.join(' • '), margin, metadataY + 7)
          
          if (artwork.ai_description) {
            pdf.setFontSize(8)
            pdf.setTextColor(100, 100, 100)
            const descLines = pdf.splitTextToSize(artwork.ai_description, contentWidth)
            pdf.text(descLines, margin, metadataY + 16)
          }
        }

        if (i < artworks.length - 1) {
          addPage()
        }
      } catch (error) {
        console.error(`Failed to load image for ${artwork.title}:`, error)
        // Continue with next artwork
      }
    }
  } else if (options.layout === 'grid') {
    const cols = 2
    const rows = 2
    const gridWidth = (contentWidth - 10) / cols
    const gridHeight = (pageHeight - margin * 2 - 40) / rows

    let gridIndex = 0

    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]
      const col = gridIndex % cols
      const row = Math.floor(gridIndex / cols)

      try {
        const img = await loadImage(artwork.thumbnail_url || artwork.image_url)
        
        const x = margin + col * (gridWidth + 10)
        const y = margin + row * (gridHeight + 10) + 20

        // Calculate size to fit grid cell
        const aspectRatio = img.width / img.height
        let imgWidth = gridWidth
        let imgHeight = gridWidth / aspectRatio
        
        if (imgHeight > gridHeight - 15) {
          imgHeight = gridHeight - 15
          imgWidth = imgHeight * aspectRatio
        }

        const imgX = x + (gridWidth - imgWidth) / 2
        const imgY = y

        pdf.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight)

        // Add title below image
        if (options.includeMetadata) {
          pdf.setFontSize(8)
          pdf.setTextColor(0, 0, 0)
          const titleLines = pdf.splitTextToSize(artwork.title, gridWidth - 5)
          pdf.text(titleLines, x, y + imgHeight + 5)
        }

        gridIndex++

        if (gridIndex >= cols * rows) {
          gridIndex = 0
          if (i < artworks.length - 1) {
            addPage()
          }
        }
      } catch (error) {
        console.error(`Failed to load image for ${artwork.title}:`, error)
      }
    }
  }

  // Save PDF
  pdf.save(`${options.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-artbook.pdf`)
}

