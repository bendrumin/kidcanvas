import type { ArtworkWithChild, Child } from '@/lib/supabase/types'

/**
 * "Then and now": the same subject drawn by the same child across the years.
 *
 * Matching is deliberately dumb and local. No AI and no schema change: we
 * compare words in the title and the story after folding case, accents and
 * simple plurals, so "Dinosaurs" in a title finds "dinosaur" in a story.
 *
 * The iOS app has the same rules in ThenAndNow.swift. Keep the two in step,
 * or a subject chip on one platform will disagree with the other.
 */

/**
 * Words that say nothing about what was drawn. Mostly English filler, plus the
 * words parents use to describe the act of drawing itself, which would
 * otherwise top every child's list ("drew", "picture", "said").
 */
const STOPWORDS = new Set([
  'a', 'about', 'after', 'again', 'all', 'also', 'always', 'am', 'an', 'and',
  'any', 'are', 'around', 'as', 'at', 'back', 'be', 'because', 'been', 'before',
  'being', 'big', 'but', 'by', 'can', 'could', 'day', 'did', 'didnt', 'do',
  'does', 'doing', 'dont', 'down', 'each', 'even', 'ever', 'every', 'for',
  'from', 'get', 'gets', 'getting', 'go', 'goes', 'going', 'gonna', 'got',
  'had', 'has', 'have', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i',
  'if', 'im', 'in', 'into', 'is', 'isnt', 'it', 'its', 'just', 'know', 'let',
  'lets', 'like', 'likes', 'little', 'lot', 'lots', 'make', 'makes', 'many',
  'me', 'more', 'most', 'much', 'my', 'new', 'no', 'not', 'now', 'of', 'off',
  'oh', 'ok', 'okay', 'old', 'on', 'one', 'only', 'or', 'other', 'our', 'out',
  'over', 'own', 'really', 'right', 'said', 'say', 'says', 'see', 'she', 'so',
  'some', 'still', 'such', 'than', 'that', 'thats', 'the', 'their', 'them',
  'then', 'there', 'these', 'they', 'thing', 'things', 'think', 'this',
  'those', 'through', 'to', 'too', 'two', 'up', 'us', 'very', 'want', 'wanted',
  'wants', 'was', 'way', 'we', 'well', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'why', 'will', 'with', 'would', 'yeah', 'yes',
  'you', 'your',
  // How parents talk about the artwork rather than what is in it.
  'art', 'artwork', 'color', 'colored', 'coloring', 'colors', 'draw',
  'drawing', 'drawings', 'drawn', 'drew', 'favorite', 'made', 'paint',
  'painted', 'painting', 'picture', 'pictures', 'school', 'today', 'told',
  'untitled',
])

/** Lowercase, strip accents and apostrophes, so "Mom's café" reads "moms cafe". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
}

/**
 * Reduce a folded word to a shared key for its singular and plural. Only the
 * regular English endings: enough for dinosaur/dinosaurs, butterfly/butterflies
 * and box/boxes, without an algorithm nobody on the team can predict.
 */
export function stem(word: string): string {
  if (word.length <= 3) return word
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y'
  if (/(ss|ch|sh|x|z)es$/.test(word)) return word.slice(0, -2)
  if (/(ss|us|is)$/.test(word)) return word
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

function words(text: string): string[] {
  return fold(text).split(/[^a-z0-9]+/).filter(Boolean)
}

/**
 * True when every word of the term appears, in order, in the title or story.
 * Word-level rather than substring so "cat" does not match "caterpillar".
 */
export function matchesSubject(
  artwork: Pick<ArtworkWithChild, 'title' | 'story'>,
  term: string
): boolean {
  const needle = words(term).map(stem)
  if (needle.length === 0) return false
  return [artwork.title, artwork.story ?? ''].some((field) => {
    const hay = words(field).map(stem)
    for (let i = 0; i + needle.length <= hay.length; i++) {
      if (needle.every((w, j) => hay[i + j] === w)) return true
    }
    return false
  })
}

/** Oldest first, because the point is to watch the drawings grow up. */
export function thenAndNow(
  artworks: ArtworkWithChild[],
  childId: string,
  term: string
): ArtworkWithChild[] {
  return artworks
    .filter((a) => a.child_id === childId && matchesSubject(a, term))
    .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())
}

/**
 * The child's most frequent subjects, as entry points into the view.
 *
 * Counted once per artwork, not once per mention: a single story that says
 * "rainbow" six times is still one rainbow. A subject needs two artworks to
 * qualify, since one match is only the empty state.
 */
export function suggestSubjects(
  artworks: Pick<ArtworkWithChild, 'title' | 'story'>[],
  child: Pick<Child, 'name'> | null | undefined,
  limit = 5
): string[] {
  // A child's own name is in half their stories and is never the subject.
  const nameKeys = new Set(words(child?.name ?? '').map(stem))
  const counts = new Map<string, number>()
  const surfaces = new Map<string, Map<string, number>>()

  for (const artwork of artworks) {
    const seen = new Set<string>()
    for (const word of words(`${artwork.title} ${artwork.story ?? ''}`)) {
      if (word.length < 3 || /\d/.test(word) || STOPWORDS.has(word)) continue
      const key = stem(word)
      if (STOPWORDS.has(key) || nameKeys.has(key)) continue
      const forms = surfaces.get(key) ?? new Map<string, number>()
      forms.set(word, (forms.get(word) ?? 0) + 1)
      surfaces.set(key, forms)
      if (!seen.has(key)) {
        seen.add(key)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => displayForm(key, surfaces.get(key)!))
}

/**
 * Show the word the way the family wrote it. The singular wins when it was
 * ever written, so the chip reads "dinosaur", not "dinosaurs".
 */
function displayForm(key: string, forms: Map<string, number>): string {
  if (forms.has(key)) return key
  return Array.from(forms.entries()).sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]
}

/** "dinosaur" to "dinosaurs", for headings. Only the last word is changed. */
export function pluralize(term: string): string {
  const trimmed = term.trim()
  if (!trimmed) return trimmed
  const lower = trimmed.toLowerCase()
  if (stem(lower) !== lower) return trimmed // already plural
  if (/[^aeiou]y$/.test(lower)) return trimmed.slice(0, -1) + 'ies'
  if (/(s|x|z|ch|sh)$/.test(lower)) return trimmed + 'es'
  return trimmed + 's'
}

/** "dinosaurs" to "dinosaur", for "Only one dinosaur so far." */
export function singularize(term: string): string {
  const parts = term.trim().split(/\s+/)
  const last = parts.pop() ?? ''
  const lower = last.toLowerCase()
  const key = stem(lower)
  // Slice the original rather than returning the key, to keep the family's
  // capitalisation. "ies" to "y" is the one ending slicing cannot express.
  const singular = lower.endsWith('ies') && key.endsWith('y')
    ? last.slice(0, -3) + 'y'
    : last.slice(0, key.length)
  return [...parts, singular].join(' ')
}

/**
 * Age at the time of the drawing. The upload flow stores child_age_months, but
 * artwork saved before a birth date was entered has none, so fall back to the
 * birth date and the artwork's own date.
 */
export function ageMonthsAt(artwork: ArtworkWithChild, child?: Child | null): number | null {
  if (artwork.child_age_months !== null && artwork.child_age_months !== undefined) {
    return artwork.child_age_months
  }
  const birth = child?.birth_date ?? artwork.child?.birth_date
  if (!birth) return null
  const b = new Date(birth)
  const d = new Date(artwork.created_date)
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return null
  let months = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth())
  if (d.getDate() < b.getDate()) months -= 1
  return months >= 0 ? months : null
}

/** "Age 3" past two, "18 months" before it, which is how parents say it. */
export function shortAge(months: number | null): string | null {
  if (months === null) return null
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`
  return `Age ${Math.floor(months / 12)}`
}
