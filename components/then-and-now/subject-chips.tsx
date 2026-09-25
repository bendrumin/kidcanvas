import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface SubjectChipsProps {
  childId: string
  childName: string
  subjects: string[]
  /** The subject already on screen, drawn as selected. */
  current?: string
}

/**
 * Entry points into "Then and now", picked from what the family actually
 * wrote. Server-rendered links, so there is nothing to hydrate.
 */
export function SubjectChips({ childId, childName, subjects, current }: SubjectChipsProps) {
  if (subjects.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
        <Sparkles className="w-4 h-4 text-crayon-purple" aria-hidden />
        {childName} then and now:
      </span>
      {subjects.map((subject) => {
        const selected = current?.toLowerCase() === subject.toLowerCase()
        return (
          <Link
            key={subject}
            href={`/dashboard/then-and-now?child=${childId}&q=${encodeURIComponent(subject)}`}
            aria-current={selected ? 'page' : undefined}
            className={
              selected
                ? 'rounded-full px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground'
                : 'rounded-full px-3 py-1.5 text-sm font-medium bg-muted text-foreground hover:bg-primary/10 transition-colors'
            }
          >
            {subject}
          </Link>
        )
      })}
    </div>
  )
}
