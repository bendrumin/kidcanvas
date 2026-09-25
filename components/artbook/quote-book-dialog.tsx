'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Loader2, Download, Quote } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  formatDateOnly,
  generateQuoteBookPDF,
  selectQuoteBookArtworks,
  type QuoteBookPaper,
  type QuoteBookRange,
} from '@/lib/pdf-generator'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'

interface QuoteBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childrenList: Child[]
}

// 'all', 'custom', or a four-digit year.
type Period = string

/**
 * The quote book is per child and per period, not per selection, so unlike the
 * art book it fetches its own artworks. The gallery page may be filtered or
 * searched, and a book built from whatever happened to be on screen would
 * quietly leave stories out.
 */
export function QuoteBookDialog({ open, onOpenChange, childrenList }: QuoteBookDialogProps) {
  const { toast } = useToast()
  const currentYear = String(new Date().getFullYear())

  const [childId, setChildId] = useState<string>(childrenList[0]?.id ?? '')
  const [period, setPeriod] = useState<Period>(currentYear)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [paper, setPaper] = useState<QuoteBookPaper>('letter')
  const [storied, setStoried] = useState<ArtworkWithChild[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const child = childrenList.find((c) => c.id === childId)

  useEffect(() => {
    if (!open || !childId) return
    let cancelled = false
    setIsLoading(true)
    setLoadError(false)

    const supabase = createClient()
    supabase
      .from('artworks')
      .select('*, child:children(*)')
      .eq('child_id', childId)
      .not('story', 'is', null)
      .order('created_date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Quote book load error:', error)
          setLoadError(true)
          setStoried([])
        } else {
          setStoried((data as ArtworkWithChild[] | null) ?? [])
        }
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, childId])

  // Years that have at least one story, plus this year so the default choice
  // is always in the list even before anything has been written in it.
  const years = useMemo(() => {
    const set = new Set<string>([currentYear])
    for (const a of selectQuoteBookArtworks(storied, {})) set.add(a.created_date.slice(0, 4))
    return Array.from(set).sort().reverse()
  }, [storied, currentYear])

  const range: QuoteBookRange = useMemo(() => {
    if (period === 'all') return {}
    if (period === 'custom') return { from: from || undefined, to: to || undefined }
    return { from: `${period}-01-01`, to: `${period}-12-31` }
  }, [period, from, to])

  const included = useMemo(() => selectQuoteBookArtworks(storied, range), [storied, range])

  const periodLabel = useMemo(() => {
    if (period === 'custom') {
      if (from && to) return `${formatDateOnly(from)} to ${formatDateOnly(to)}`
      if (from) return `Since ${formatDateOnly(from)}`
      if (to) return `Up to ${formatDateOnly(to)}`
      return 'Every story so far'
    }
    if (period === 'all') {
      if (included.length === 0) return 'Every story so far'
      const first = included[0].created_date.slice(0, 4)
      const last = included[included.length - 1].created_date.slice(0, 4)
      return first === last ? first : `${first} to ${last}`
    }
    return period
  }, [period, from, to, included])

  const name = child?.name ?? 'This artist'
  const emptyMessage =
    period === 'all'
      ? `${name} has no stories yet. Add one from any artwork.`
      : period === 'custom'
        ? `${name} has no stories from those dates yet. Add one from any artwork.`
        : `${name} has no stories yet in ${period}. Add one from any artwork.`

  const rangeIsBackwards = period === 'custom' && !!from && !!to && from > to

  const handleGenerate = async () => {
    if (!child || included.length === 0) return
    setIsGenerating(true)
    try {
      await generateQuoteBookPDF(included, { childName: child.name, periodLabel, paper })
      toast({
        title: 'Your quote book is ready',
        description: 'The PDF has been downloaded. It prints well at home or at a photo book service.',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Quote book generation error:', error)
      toast({
        title: 'Hmm, that didn\'t work',
        description: error instanceof Error ? error.message : 'Couldn\'t make the quote book',
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
            <Quote className="w-5 h-5" />
            Make a quote book
          </DialogTitle>
          <DialogDescription>
            One page for each thing {child ? child.name : 'they'} said, with the drawing beside it.
            A lovely gift for grandparents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {childrenList.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="quote-book-child">Artist</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger id="quote-book-child">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quote-book-period">Which stories</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="quote-book-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
                <SelectItem value="all">All years</SelectItem>
                <SelectItem value="custom">Choose dates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quote-book-from">From</Label>
                <Input id="quote-book-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-book-to">To</Label>
                <Input id="quote-book-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quote-book-paper">Paper size</Label>
            <Select value={paper} onValueChange={(value: QuoteBookPaper) => setPaper(value)}>
              <SelectTrigger id="quote-book-paper">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">US Letter</SelectItem>
                <SelectItem value="a4">A4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* What will be in the book, said plainly before anyone waits for a PDF. */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            {isLoading ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Finding {name}&apos;s stories...
              </p>
            ) : loadError ? (
              <p className="text-destructive">Couldn&apos;t load the stories. Close this and try again.</p>
            ) : rangeIsBackwards ? (
              <p className="text-muted-foreground">The start date is after the end date.</p>
            ) : included.length === 0 ? (
              <p className="text-muted-foreground">{emptyMessage}</p>
            ) : (
              <>
                <p className="font-medium">
                  The things {name} said, {periodLabel}
                </p>
                <p className="text-muted-foreground mt-1">
                  {included.length} {included.length === 1 ? 'story' : 'stories'}, one per page.
                  Artwork without a story is left out.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isLoading || included.length === 0 || rangeIsBackwards}
              className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Making the book...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
