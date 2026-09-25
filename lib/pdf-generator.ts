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
          
          if (artwork.story) {
            pdf.setFontSize(8)
            pdf.setTextColor(100, 100, 100)
            const descLines = pdf.splitTextToSize(artwork.story, contentWidth)
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

// ---------------------------------------------------------------------------
// Quote book
//
// The art book leads with the picture and tucks the story underneath in 8pt
// grey. The quote book is the other way round: the child's words are the page,
// and the drawing sits under them. It is meant to be printed and given away, so
// it only includes artworks that actually have a story. A page with a drawing
// and no words belongs in the art book.
// ---------------------------------------------------------------------------

export type QuoteBookPaper = 'letter' | 'a4'

export interface QuoteBookRange {
  /** Inclusive, as `YYYY-MM-DD`. Omit for "from the beginning". */
  from?: string
  /** Inclusive, as `YYYY-MM-DD`. Omit for "up to today". */
  to?: string
}

export interface QuoteBookOptions {
  childName: string
  /** Printed under the title: "2026", "2024 to 2026", or a date span. */
  periodLabel: string
  paper: QuoteBookPaper
}

/**
 * created_date is a Postgres DATE. `new Date('2026-01-01')` reads it as UTC
 * midnight, which is still New Year's Eve anywhere west of London, so a story
 * from January 1 would print as December 31 and file under the wrong year.
 * Build the date from its parts instead so it stays the calendar day it was.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatDateOnly(value: string): string {
  return parseDateOnly(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * "18 months old" reads better than "1 year, 6 months" for a toddler, and
 * "Age 4" reads better than "4y 3m" on a printed page. The iOS book uses the
 * same rule so the two never disagree about how old someone was.
 */
export function formatBookAge(months: number | null | undefined): string | null {
  if (months === null || months === undefined || months < 0) return null
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} old`
  return `Age ${Math.floor(months / 12)}`
}

/**
 * child_age_months is filled by a trigger, but only when the child had a birth
 * date at the time the artwork was saved. Fall back to working it out here so
 * a birthday added later still shows up in the book.
 */
function ageMonthsFor(artwork: ArtworkWithChild): number | null {
  if (artwork.child_age_months !== null && artwork.child_age_months !== undefined) {
    return artwork.child_age_months
  }
  const birth = artwork.child?.birth_date
  if (!birth) return null
  const b = parseDateOnly(birth)
  const c = parseDateOnly(artwork.created_date)
  let months = (c.getFullYear() - b.getFullYear()) * 12 + (c.getMonth() - b.getMonth())
  if (c.getDate() < b.getDate()) months -= 1
  return months >= 0 ? months : null
}

/**
 * The artworks that belong in a quote book, oldest first so the book reads
 * forward through the year. Comparing `YYYY-MM-DD` strings directly avoids the
 * timezone problem parseDateOnly describes.
 */
export function selectQuoteBookArtworks(
  artworks: ArtworkWithChild[],
  range: QuoteBookRange
): ArtworkWithChild[] {
  return artworks
    .filter((a) => (a.story ?? '').trim().length > 0)
    .filter((a) => {
      const day = a.created_date.slice(0, 10)
      if (range.from && day < range.from) return false
      if (range.to && day > range.to) return false
      return true
    })
    .sort((a, b) => a.created_date.localeCompare(b.created_date))
}

/**
 * Draw the scan onto a white canvas before handing it to jsPDF. Transparent
 * PNGs otherwise come out with a black background once encoded as JPEG, and a
 * 12-megapixel phone scan embedded at full size makes a 40-page book too big to
 * email to a grandparent. 2000px on the long edge is plenty for a printed page.
 */
async function loadImageForPrint(url: string): Promise<{ data: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = url
  })
  const scale = Math.min(1, 2000 / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return { data: canvas.toDataURL('image/jpeg', 0.88), width, height }
}

export function quoteBookFileName(childName: string, periodLabel: string): string {
  const slug = `the things ${childName} said ${periodLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug}.pdf`
}

export async function generateQuoteBookPDF(
  artworks: ArtworkWithChild[],
  options: QuoteBookOptions
): Promise<void> {
  if (artworks.length === 0) {
    // The dialog never lets this happen, but an error beats an empty book.
    throw new Error(`${options.childName} has no stories in this book yet.`)
  }

  const pdf = new jsPDF('portrait', 'mm', options.paper)
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 22
  const contentWidth = pageWidth - margin * 2

  const pink: [number, number, number] = [233, 30, 99]
  const ink: [number, number, number] = [38, 34, 32]
  const muted: [number, number, number] = [120, 112, 106]
  const cream: [number, number, number] = [253, 250, 245]

  const fillPaper = () => {
    pdf.setFillColor(...cream)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  // Cover. Cream rather than the art book's solid pink: this one is going on
  // a grandparent's shelf, and a page of solid ink is what home printers do worst.
  fillPaper()
  pdf.setDrawColor(...pink)
  pdf.setLineWidth(0.8)
  pdf.line(pageWidth / 2 - 15, pageHeight / 2 - 38, pageWidth / 2 + 15, pageHeight / 2 - 38)

  pdf.setTextColor(...ink)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(34)
  const titleLines: string[] = pdf.splitTextToSize(`The things ${options.childName} said`, contentWidth)
  const titleTop = pageHeight / 2 - 18
  pdf.text(titleLines, pageWidth / 2, titleTop, { align: 'center' })

  pdf.setTextColor(...pink)
  pdf.setFont('times', 'italic')
  pdf.setFontSize(22)
  pdf.text(options.periodLabel, pageWidth / 2, titleTop + titleLines.length * 14 + 2, {
    align: 'center',
  })

  pdf.setTextColor(...muted)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(
    `${artworks.length} ${artworks.length === 1 ? 'story' : 'stories'}, in ${options.childName}'s words`,
    pageWidth / 2,
    pageHeight - 40,
    { align: 'center' }
  )
  pdf.setFontSize(8)
  pdf.text('Made with KidCanvas', pageWidth / 2, pageHeight - 30, { align: 'center' })

  // Quote size steps down with length so a one-liner fills the top of the page
  // and a long retelling still fits. The drawing gets whatever is left.
  const quoteSizes = [30, 26, 22, 19, 16, 14, 12]
  const maxQuoteHeight = (pageHeight - margin * 2) * 0.55
  const captionHeight = 22
  // jsPDF font sizes are points; this converts to the mm the page is laid out in.
  const ptToMm = 0.3528
  const leading = 1.3

  for (let i = 0; i < artworks.length; i++) {
    const artwork = artworks[i]
    pdf.addPage()
    fillPaper()

    const quote = `“${(artwork.story ?? '').trim()}”`
    pdf.setFont('times', 'italic')
    let size = quoteSizes[quoteSizes.length - 1]
    let lines: string[] = []
    for (const candidate of quoteSizes) {
      pdf.setFontSize(candidate)
      lines = pdf.splitTextToSize(quote, contentWidth)
      size = candidate
      if (lines.length * candidate * ptToMm * leading <= maxQuoteHeight) break
    }
    pdf.setFontSize(size)
    pdf.setTextColor(...ink)
    const lineHeight = size * ptToMm * leading
    const quoteTop = margin + size * ptToMm
    pdf.text(lines, margin, quoteTop, { lineHeightFactor: leading })
    const quoteBottom = quoteTop + (lines.length - 1) * lineHeight

    // The drawing, centred in the space between the quote and the caption.
    const imageTop = quoteBottom + 12
    const imageBoxHeight = pageHeight - margin - captionHeight - imageTop
    if (imageBoxHeight > 30) {
      try {
        const img = await loadImageForPrint(artwork.image_url)
        const ratio = img.width / img.height
        let w = contentWidth
        let h = w / ratio
        if (h > imageBoxHeight) {
          h = imageBoxHeight
          w = h * ratio
        }
        pdf.addImage(img.data, 'JPEG', (pageWidth - w) / 2, imageTop + (imageBoxHeight - h) / 2, w, h)
      } catch (error) {
        // A missing scan should not cost the family the words, which are the
        // point of this book. Print the page without the drawing.
        console.error(`Failed to load image for ${artwork.title}:`, error)
      }
    }

    // Caption: title, then date and age.
    const captionTop = pageHeight - margin - captionHeight + 10
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(...ink)
    pdf.text(pdf.splitTextToSize(artwork.title, contentWidth)[0], margin, captionTop)

    const meta = [formatDateOnly(artwork.created_date), formatBookAge(ageMonthsFor(artwork))]
      .filter(Boolean)
      .join('  ·  ')
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...muted)
    pdf.text(meta, margin, captionTop + 6)

    pdf.setFontSize(8)
    pdf.text(String(i + 1), pageWidth - margin, pageHeight - margin / 2, { align: 'right' })
  }

  pdf.save(quoteBookFileName(options.childName, options.periodLabel))
}

