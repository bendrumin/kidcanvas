import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubjectChips } from '@/components/then-and-now/subject-chips'
import { ThenAndNowTimeline } from '@/components/then-and-now/then-and-now-timeline'
import type { ArtworkWithChild, Child, FamilyMember } from '@/lib/supabase/types'
import {
  ageMonthsAt,
  pluralize,
  singularize,
  suggestSubjects,
  thenAndNow,
} from '@/lib/then-and-now'

export const metadata: Metadata = {
  title: 'Then and now',
  description: 'See how your child draws the same thing as they grow.',
}

interface ThenAndNowPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ThenAndNowPage({ searchParams }: ThenAndNowPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const childId = typeof params.child === 'string' ? params.child : undefined
  const term = typeof params.q === 'string' ? params.q.trim().slice(0, 60) : ''

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single() as { data: Pick<FamilyMember, 'family_id' | 'role'> | null }

  if (!membership) {
    redirect('/dashboard')
  }

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('name') as { data: Child[] | null }

  const child = children?.find((c) => c.id === childId)

  // No child picked yet, which is how a family-wide search lands here. The
  // view only makes sense for one child, so ask rather than guess.
  if (!child) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeading title="Then and now" subtitle="See how one child draws the same thing as they grow." />
        {children && children.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {term ? `Whose ${pluralize(term)} would you like to see?` : 'Pick an artist to start.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/then-and-now?child=${c.id}${term ? `&q=${encodeURIComponent(term)}` : ''}`}
                >
                  <Button variant="outline">{c.name}</Button>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Add an artist first, then come back once there is some art.</p>
        )}
      </div>
    )
  }

  // One child's artwork is small enough to match in JS, and doing it here
  // keeps the plural and accent folding identical to the iOS app. An ilike
  // query would miss "dinosaurs" when searching "dinosaur".
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*, child:children(*)')
    .eq('family_id', membership.family_id)
    .eq('child_id', child.id)
    .order('created_date', { ascending: true }) as { data: ArtworkWithChild[] | null }

  const all = artworks || []
  const subjects = suggestSubjects(all, child)
  const matches = term ? thenAndNow(all, child.id, term) : []

  const ages = matches.map((a) => ageMonthsAt(a, child)).filter((m): m is number => m !== null)
  const ageSpan = ages.length >= 2 && Math.floor(ages[0] / 12) !== Math.floor(ages[ages.length - 1] / 12)
    ? `age ${Math.floor(ages[0] / 12)} to ${Math.floor(ages[ages.length - 1] / 12)}`
    : null

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard?child=${child.id}${term ? `&search=${encodeURIComponent(term)}` : ''}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to the gallery
      </Link>

      <PageHeading
        title={term ? `${child.name}'s ${pluralize(term)}` : `${child.name} then and now`}
        subtitle={
          term && matches.length >= 2
            ? `${matches.length} drawings${ageSpan ? `, ${ageSpan}` : ''}, oldest first.`
            : 'The same subject, drawn as they grow.'
        }
      />

      {/* A plain GET form: the page is server-rendered, so there is no client
          state to keep in sync with the URL. */}
      <form action="/dashboard/then-and-now" className="relative max-w-md">
        <input type="hidden" name="child" value={child.id} />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          name="q"
          defaultValue={term}
          placeholder="Try dinosaur, rainbow or mom"
          className="pl-9 text-base"
          aria-label={`Search ${child.name}'s titles and stories`}
        />
      </form>

      <SubjectChips childId={child.id} childName={child.name} subjects={subjects} current={term} />

      {!term ? (
        <EmptyState
          title="Pick a subject"
          body={
            subjects.length > 0
              ? `Choose one of ${child.name}'s favorite subjects above, or search for your own.`
              : `Search for something ${child.name} likes to draw. It works best once a few pieces have a title or a story.`
          }
        />
      ) : matches.length >= 2 ? (
        <ThenAndNowTimeline artworks={matches} child={child} />
      ) : matches.length === 1 ? (
        <EmptyState
          title={`Only one ${singularize(term)} so far.`}
          body="Check back next year."
        />
      ) : (
        <EmptyState
          title={`No ${pluralize(term)} yet.`}
          body={`Nothing in ${child.name}'s titles or stories mentions ${term}.`}
        />
      )}
    </div>
  )
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-fluid-3xl font-display font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-amber-100 dark:border-border p-12 text-center">
      <div className="flex justify-center mb-4">
        <Sparkles className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{body}</p>
    </div>
  )
}
