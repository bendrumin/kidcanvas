import Image from 'next/image'
import Link from 'next/link'
import type { ArtworkWithChild, Child } from '@/lib/supabase/types'
import { ageMonthsAt, shortAge } from '@/lib/then-and-now'
import { formatDate } from '@/lib/utils'

interface ThenAndNowTimelineProps {
  artworks: ArtworkWithChild[]
  child: Child
}

/**
 * Oldest on the left, newest on the right, scrolling sideways like the iOS
 * view. A row, not a grid, because the reading order is the point.
 */
export function ThenAndNowTimeline({ artworks, child }: ThenAndNowTimelineProps) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto pb-4">
      <ol className="flex gap-6 snap-x snap-mandatory">
        {artworks.map((artwork, index) => {
          const age = shortAge(ageMonthsAt(artwork, child))
          return (
            <li key={artwork.id} className="snap-start shrink-0 w-56 sm:w-64 flex flex-col">
              <Link href={`/dashboard/artwork/${artwork.id}`} className="group block">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-transparent group-hover:border-primary transition-all">
                  <Image
                    src={artwork.thumbnail_url || artwork.image_url}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
              </Link>

              {/* The connecting line reads as a timeline without a chart library. */}
              <div className="flex items-center gap-2 mt-3" aria-hidden>
                <span className="w-3 h-3 rounded-full bg-crayon-purple shrink-0" />
                {index < artworks.length - 1 && <span className="h-0.5 flex-1 bg-crayon-purple/30 -mr-6" />}
              </div>

              <p className="mt-2 font-display font-bold text-lg text-foreground">
                {age ?? formatDate(artwork.created_date)}
              </p>
              {age && (
                <p className="text-xs text-muted-foreground">{formatDate(artwork.created_date)}</p>
              )}
              <p className="mt-1 text-sm font-medium text-foreground line-clamp-2">{artwork.title}</p>
              {artwork.story?.trim() && (
                <blockquote className="mt-2 text-sm text-muted-foreground italic line-clamp-5">
                  “{artwork.story.trim()}”
                </blockquote>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
