import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delete your account',
  description:
    'How to delete your KidCanvas account and everything in it, from the app or by asking us.',
}

/**
 * Google Play requires a page anyone can reach, without installing the app,
 * explaining how to delete an account and what happens to the data. Apple
 * requires deletion to be reachable inside the app, which it is. This is the
 * public half.
 */
export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-background px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/" className="text-sm text-[#E91E63] hover:underline">
            Back to KidCanvas
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Delete your account</h1>
          <p className="mt-2 text-muted-foreground">
            You can delete your KidCanvas account yourself, at any time, without asking us.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">In the iPhone app</h2>
          <p className="text-muted-foreground">
            Open the Profile tab, tap the gear to open Settings, scroll to the bottom, and
            choose Delete Account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">On the web</h2>
          <p className="text-muted-foreground">
            Sign in at kidcanvas.app, open Settings, and choose Delete Account at the
            bottom of the page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">If you cannot sign in</h2>
          <p className="text-muted-foreground">
            Email{' '}
            <a href="mailto:support@kidcanvas.app" className="text-[#E91E63] hover:underline">
              support@kidcanvas.app
            </a>{' '}
            from the address on the account and ask us to delete it. We will confirm when it
            is done, within 30 days and usually the same week.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-amber-100 bg-white p-6 dark:border-border dark:bg-card">
          <h2 className="text-xl font-semibold text-foreground">What gets deleted</h2>
          <p className="text-muted-foreground">
            Deleting your account removes every family you own, and with it every artist
            profile, artwork image, story, collection, comment, reaction, invite and share
            link in those families. It is permanent and there is no undo. Your sign-in
            record is deleted too, not deactivated.
          </p>
          <p className="text-muted-foreground">
            If you joined someone else&apos;s family, your membership is removed but that
            family and its artwork stay, because they are not yours to delete. What you
            contributed there, like a comment, goes with your account.
          </p>
          <p className="text-muted-foreground">
            Backups are kept briefly for disaster recovery and age out on their own. If you
            have a paid plan, cancel it first or it will keep billing; billing records we
            are required to keep for tax purposes are retained.
          </p>
        </section>

        <p className="text-sm text-muted-foreground">
          See also the{' '}
          <Link href="/privacy" className="text-[#E91E63] hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/support" className="text-[#E91E63] hover:underline">
            Support
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
