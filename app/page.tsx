import Link from 'next/link'
import { Shantell_Sans, Atkinson_Hyperlegible } from 'next/font/google'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { AppStoreButton } from '@/components/app-store-button'
import { PLANS, PRICES, INCLUDED_IN_ALL_PLANS } from '@/lib/stripe'
import { APP_STORE_URL } from '@/lib/app-links'
import { OrganizationSchema, SoftwareApplicationSchema, WebSiteSchema, FAQSchema } from '@/components/seo/structured-data'
import s from './landing.module.css'

// Scoped to the landing page. The app itself keeps Nunito/Fredoka; the site
// uses a marker-handwriting face for headlines and the kids' words and a highly legible sans for
// everything else, because a lot of the people reading this are grandparents.
const shantell = Shantell_Sans({ weight: ['500', '700'], subsets: ['latin'], variable: '--font-shantell', display: 'swap' })
const atkinson = Atkinson_Hyperlegible({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-atkinson', display: 'swap' })

const FAQS = [
  {
    q: 'Is it really free?',
    a: 'Yes. Your first 50 artworks are free for good, with stories, reactions, comments, collections, and sharing. Paid plans raise the limits. No credit card required.',
  },
  {
    q: 'Do I need the iPhone app?',
    a: `No. The web app works on phones, tablets, and computers. The iPhone and iPad app is on the App Store at ${APP_STORE_URL}, and scanning is easier there: it finds the page, crops it, and squares it up for you.`,
  },
  {
    q: 'Is KidCanvas the same as CanvasKids or Kid Canvas Art Studio?',
    a: "No. They are separate apps from different developers with similar names. KidCanvas (one word, by Benjamin Siegel) is for parents: scan your child's artwork, write down what they said about it, and share both in a private family feed where grandparents react and comment. We never run AI on your children's artwork. On the App Store, look for KidCanvas in the Lifestyle category.",
  },
  {
    q: 'Can grandparents see the stories too?',
    a: 'Yes. Invite them with a short code and they see every new piece with its story, and can react or comment. You can also send a single artwork as a link that opens without an account.',
  },
  {
    q: 'What if I forget to write the story?',
    a: 'Save the artwork anyway and add the story later from the artwork page. On iPhone the app asks while you are still there, with prompts if you are not sure what to ask. That is usually when you remember what they said.',
  },
  {
    q: 'What happens to my photos?',
    a: 'Your artwork is stored in our cloud so every device in the family can see it. We never share it, and it is never used for AI training. You can delete any artwork, or your whole account and everything in it, whenever you like.',
  },
  {
    q: 'What if I cancel?',
    a: 'You drop back to the free plan. Everything you already saved stays put.',
  },
]

export default function LandingPage() {
  return (
    <>
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <WebSiteSchema />
      <FAQSchema faqs={FAQS} />

      <div className={`${s.page} ${shantell.variable} ${atkinson.variable}`}>
        <header className={s.wrap}>
          <nav className={s.nav} aria-label="Main navigation">
            <Logo size="sm" />
            <div className={s.navLinks}>
              <ThemeToggle />
              <Link href="/login" className={s.navLink}>Sign in</Link>
              <Link href="/signup" className={s.navLink}>Get started</Link>
            </div>
          </nav>
        </header>

        <main id="main-content">
          <section className={`${s.wrap} ${s.hero}`}>
            <div>
              <h1 className={`${s.serif} ${s.h1}`}>Their art, in their words.</h1>
              <p className={s.lede}>
                Scan the drawing, write down what your kid said about it, and share
                both with the family. Grandparents can react and reply.
              </p>
              <div className={s.ctaRow}>
                <AppStoreButton />
                <Link href="/signup" className={s.textLink}>Start on the web</Link>
              </div>
              <p className={s.fine}>Free for your first 50 artworks. No credit card.</p>
            </div>

            <figure className={s.board} aria-label="Example: a child's drawing with the story written beside it">
              <div className={s.drawing}>
                <span className={`${s.tape} ${s.tapeLeft}`} aria-hidden="true" />
                <span className={`${s.tape} ${s.tapeRight}`} aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/artwork-scribbles/dinosaur.svg" alt="A crayon drawing of a green dinosaur" width={400} height={300} />
              </div>
              <figcaption className={s.card}>
                <p className={s.quote}>&ldquo;It&rsquo;s a rainbow dinosaur that eats sunshine. Only in the morning.&rdquo;</p>
                <p className={s.attribution}>Emma, 5 years 2 months</p>
                <p className={s.reply}><b>Grandma:</b> What does he eat at night?</p>
              </figcaption>
            </figure>
          </section>

          <section className={s.section}>
            <div className={s.wrap}>
              <h2 className={`${s.serif} ${s.h2}`}>Do it while they&rsquo;re still telling you about it</h2>
              <p className={s.intro}>
                The drawing lasts on the fridge. What they said about it is gone by next week.
              </p>
              <ol className={s.steps}>
                <li className={s.step}>
                  <h3 className={s.h3}>Scan it</h3>
                  <p>The camera finds the page, crops it, and squares it up. Or pick a photo you already took.</p>
                </li>
                <li className={s.step}>
                  <h3 className={s.h3}>Write down what they said</h3>
                  <p>A sentence is plenty. If you are stuck, the app suggests what to ask. Skip it and come back later if you need to.</p>
                </li>
                <li className={s.step}>
                  <h3 className={s.h3}>Share it</h3>
                  <p>It lands in your family&rsquo;s feed with the story attached, dated, with your kid&rsquo;s age worked out for you.</p>
                </li>
              </ol>
            </div>
          </section>

          <section className={s.section}>
            <div className={`${s.wrap} ${s.split}`}>
              <div>
                <h2 className={`${s.serif} ${s.h2}`}>A feed for the people who actually want to see it</h2>
                <p className={s.intro}>
                  Grandma doesn&rsquo;t need another group text. She needs the drawing and the sentence that goes with it.
                </p>
                <ul className={s.list}>
                  <li>
                    <b>Family sees each piece as it&rsquo;s saved</b>
                    <span>Grandparents and co-parents get the artwork and the story together.</span>
                  </li>
                  <li>
                    <b>They react and comment</b>
                    <span>So a drawing starts a conversation instead of sitting in a folder.</span>
                  </li>
                  <li>
                    <b>Kids never need accounts</b>
                    <span>You make a simple artist profile for each child. A name is enough.</span>
                  </li>
                  <li>
                    <b>Invite only</b>
                    <span>Family joins with a short code. There is no public feed and no strangers.</span>
                  </li>
                </ul>
              </div>
              <div className={s.phone}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/screens/feed.jpg"
                  alt="The KidCanvas family feed on iPhone, showing a rainbow and butterfly drawing with the story underneath"
                  width={720}
                  height={1530}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          <section className={s.section}>
            <div className={s.wrap}>
              <h2 className={`${s.serif} ${s.h2}`}>What KidCanvas isn&rsquo;t</h2>
              <p className={s.intro}>A few things people assume, and a name mix-up worth clearing up.</p>
              <dl className={s.nots}>
                <div>
                  <dt>A filing cabinet</dt>
                  <dd>
                    Archive apps scan, sort, and store. KidCanvas keeps what your kid said, and searches it.
                    Type &ldquo;dinosaur&rdquo; a year from now and find the drawing by the story.
                  </dd>
                </div>
                <div>
                  <dt>Public</dt>
                  <dd>Nobody sees your family&rsquo;s gallery unless you invite them. No ads, no trackers in the app.</dd>
                </div>
                <div>
                  <dt>An AI product</dt>
                  <dd>Nothing runs AI on your children&rsquo;s artwork, and it is never used for training.</dd>
                </div>
                <div>
                  <dt>CanvasKids, or Kid Canvas Art Studio</dt>
                  <dd>
                    Those are different apps from different developers. On the App Store, look for
                    KidCanvas, one word, in Lifestyle, or use the{' '}
                    <a href={APP_STORE_URL} className={s.textLink} rel="noopener">direct link</a>.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={s.section}>
            <div className={s.wrap}>
              <h2 className={`${s.serif} ${s.h2}`}>Pricing</h2>
              <p className={s.intro}>Every plan gets every feature. The paid plan removes the limits.</p>
              <div className={s.plans}>
                <div className={s.plan}>
                  <p className={s.planName}>{PLANS.free.name}</p>
                  <p className={s.price}>$0</p>
                  <p className={s.planNote}>Free for good, no card needed.</p>
                  <ul className={s.planList}>
                    {[...PLANS.free.features, ...INCLUDED_IN_ALL_PLANS.slice(0, 3)].map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className={`${s.plan} ${s.planFeatured}`}>
                  <p className={s.planName}>{PLANS.family.name}</p>
                  <p className={s.price}>
                    ${PRICES.family.month}<small> /month</small>
                  </p>
                  <p className={s.planNote}>or ${PRICES.family.year} a year, about two months free.</p>
                  <ul className={s.planList}>
                    {[...PLANS.family.features, ...INCLUDED_IN_ALL_PLANS.slice(0, 3)].map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className={s.section}>
            <div className={`${s.wrap} ${s.faq}`}>
              <h2 className={`${s.serif} ${s.h2}`}>Questions</h2>
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className={s.closing}>
            <div className={s.wrap}>
              <h2 className={`${s.serif} ${s.h2}`}>Built by a parent whose fridge ran out of room</h2>
              <p className={s.intro}>
                KidCanvas is new, so there are no reviews to show you yet. Try it with the next drawing
                that comes home. The first 50 are free, and you can delete everything whenever you like.
              </p>
              <div className={s.ctaRow}>
                <AppStoreButton />
                <Link href="/signup" className={s.primary}>Start free on the web</Link>
              </div>
            </div>
          </section>
        </main>

        <footer className={s.footer}>
          <div className={`${s.wrap} ${s.footerRow}`}>
            <Logo size="xs" />
            <nav aria-label="Footer navigation">
              <a href={APP_STORE_URL} rel="noopener">iPhone app</a>
              <Link href="/support">Support</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
            <p>&copy; {new Date().getFullYear()} KidCanvas</p>
          </div>
        </footer>
      </div>
    </>
  )
}
