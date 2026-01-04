import type { ArtworkWithChild, Child } from '@/lib/supabase/types'

export interface TimelineMilestone {
  ageMonths: number
  ageLabel: string
  type: 'birthday' | 'half-birthday' | 'school-start' | 'year-marker'
  label: string
}

export interface TimelineArtwork {
  artwork: ArtworkWithChild
  ageMonths: number
  ageLabel: string
  position: number // Position on timeline (0-100)
}

export interface AgeRange {
  minMonths: number
  maxMonths: number
  label: string
}

/**
 * Calculate milestones for a child based on their birth date and artwork dates
 */
export function calculateMilestones(
  child: Child,
  artworks: ArtworkWithChild[]
): TimelineMilestone[] {
  if (!child.birth_date || artworks.length === 0) return []

  const birthDate = new Date(child.birth_date)
  const milestones: TimelineMilestone[] = []
  
  // Get min and max age from artworks
  const ages = artworks
    .map(a => a.child_age_months)
    .filter((age): age is number => age !== null)
  
  if (ages.length === 0) return []

  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)

  // Add year markers (1, 2, 3, etc.)
  for (let year = 1; year <= Math.ceil(maxAge / 12); year++) {
    const ageMonths = year * 12
    if (ageMonths >= minAge && ageMonths <= maxAge + 6) {
      milestones.push({
        ageMonths,
        ageLabel: formatAgeMonths(ageMonths),
        type: 'birthday',
        label: `${year} Year${year !== 1 ? 's' : ''} Old`,
      })
    }
  }

  // Add half-birthday markers (1.5, 2.5, etc.) if they're in range
  for (let year = 1; year <= Math.ceil(maxAge / 12); year++) {
    const ageMonths = year * 12 - 6
    if (ageMonths >= minAge && ageMonths <= maxAge && ageMonths > 0) {
      milestones.push({
        ageMonths,
        ageLabel: formatAgeMonths(ageMonths),
        type: 'half-birthday',
        label: `${year - 0.5} Years Old`,
      })
    }
  }

  // Sort by age
  return milestones.sort((a, b) => a.ageMonths - b.ageMonths)
}

/**
 * Format age in months to a readable string
 */
export function formatAgeMonths(months: number): string {
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  return `${years}y ${remainingMonths}m`
}

/**
 * Calculate position on timeline (0-100) based on age range
 */
export function calculateTimelinePosition(
  ageMonths: number | null,
  minAge: number,
  maxAge: number
): number {
  if (ageMonths === null) return 50
  if (minAge === maxAge) return 50
  return ((ageMonths - minAge) / (maxAge - minAge)) * 100
}

/**
 * Group artworks by age ranges
 */
export function groupArtworksByAgeRange(
  artworks: ArtworkWithChild[],
  rangeSize: number = 6 // 6 months per range
): Map<number, ArtworkWithChild[]> {
  const groups = new Map<number, ArtworkWithChild[]>()
  
  artworks.forEach(artwork => {
    if (artwork.child_age_months === null) return
    
    // Round down to nearest range size
    const rangeStart = Math.floor(artwork.child_age_months / rangeSize) * rangeSize
    const rangeEnd = rangeStart + rangeSize
    
    if (!groups.has(rangeStart)) {
      groups.set(rangeStart, [])
    }
    groups.get(rangeStart)!.push(artwork)
  })
  
  return groups
}

/**
 * Get age ranges for filtering
 */
export function getAgeRanges(artworks: ArtworkWithChild[]): AgeRange[] {
  const ages = artworks
    .map(a => a.child_age_months)
    .filter((age): age is number => age !== null)
  
  if (ages.length === 0) return []

  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)

  const ranges: AgeRange[] = []
  
  // Create ranges: 0-2, 2-4, 4-6, etc. (years)
  for (let year = 0; year <= Math.ceil(maxAge / 12); year++) {
    const minMonths = year * 12
    const maxMonths = (year + 2) * 12
    
    if (maxMonths >= minAge && minMonths <= maxAge) {
      ranges.push({
        minMonths: Math.max(minMonths, minAge),
        maxMonths: Math.min(maxMonths, maxAge),
        label: year === 0 
          ? '0-2 years' 
          : `${year}-${year + 2} years`,
      })
    }
  }
  
  // Also add "All ages" at the beginning
  ranges.unshift({
    minMonths: minAge,
    maxMonths: maxAge,
    label: 'All ages',
  })

  return ranges
}

/**
 * Filter artworks by age range
 */
export function filterArtworksByAgeRange(
  artworks: ArtworkWithChild[],
  minMonths?: number,
  maxMonths?: number
): ArtworkWithChild[] {
  return artworks.filter(artwork => {
    if (artwork.child_age_months === null) return false
    if (minMonths !== undefined && artwork.child_age_months < minMonths) return false
    if (maxMonths !== undefined && artwork.child_age_months > maxMonths) return false
    return true
  })
}

/**
 * Create timeline data structure for rendering
 */
export function createTimelineData(
  artworks: ArtworkWithChild[],
  child?: Child
): {
  timelineArtworks: TimelineArtwork[]
  milestones: TimelineMilestone[]
  minAge: number
  maxAge: number
} {
  // Filter artworks with valid age data
  const validArtworks = artworks.filter(a => a.child_age_months !== null)
  
  if (validArtworks.length === 0) {
    return {
      timelineArtworks: [],
      milestones: [],
      minAge: 0,
      maxAge: 0,
    }
  }

  const ages = validArtworks.map(a => a.child_age_months! as number)
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)

  // Create timeline artworks with positions
  const timelineArtworks: TimelineArtwork[] = validArtworks.map(artwork => ({
    artwork,
    ageMonths: artwork.child_age_months!,
    ageLabel: formatAgeMonths(artwork.child_age_months!),
    position: calculateTimelinePosition(artwork.child_age_months!, minAge, maxAge),
  }))

  // Sort by age
  timelineArtworks.sort((a, b) => a.ageMonths - b.ageMonths)

  // Calculate milestones if child data is available
  const milestones = child ? calculateMilestones(child, validArtworks) : []

  return {
    timelineArtworks,
    milestones,
    minAge,
    maxAge,
  }
}

