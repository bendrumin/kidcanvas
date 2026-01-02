'use client'

interface ArtworkCounterProps {
  count: number
}

export function ArtworkCounter({ count }: ArtworkCounterProps) {
  return (
    <p className="text-muted-foreground mt-1">
      {count} artwork{count !== 1 ? 's' : ''} in your collection
    </p>
  )
}

