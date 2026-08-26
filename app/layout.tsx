import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import './globals.css'

// Self-hosted at build time. These used to be pulled in with an @import in
// globals.css, which the Content-Security-Policy blocked -- so in production the
// typography silently fell back to system-ui on every page. Loading them here
// means no request to Google at runtime, so the CSP stays strict and the fonts
// actually render.
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' })
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap' })
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { SkipLink } from '@/components/ui/skip-link'
import { Analytics } from '@vercel/analytics/next'
import { PageLoadTracker } from '@/components/analytics/page-load-tracker'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E91E63' },
    { media: '(prefers-color-scheme: dark)', color: '#E91E63' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://kidcanvas.app'),
  title: {
    default: 'KidCanvas - Capture the Stories Behind Your Kids\' Art',
    template: '%s | KidCanvas',
  },
  description: 'Capture and share the stories behind your children\'s artwork. Remember what they said, share the moment with family, and keep those memories alive. Free for up to 50 artworks.',
  keywords: ['kids artwork', 'children art', 'family gallery', 'artwork stories', 'kids art stories', 'family sharing', 'children drawings', 'artwork memories', 'family moments', 'artwork social'],
  authors: [{ name: 'KidCanvas' }],
  creator: 'KidCanvas',
  openGraph: {
    title: 'KidCanvas - Capture the Stories Behind Your Kids\' Art',
    description: 'Capture and share the stories behind your children\'s artwork. Remember what they said, share the moment with family. Free for up to 50 artworks.',
    url: 'https://kidcanvas.app',
    siteName: 'KidCanvas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KidCanvas - Capture the Stories Behind Your Kids\' Art',
    description: 'Capture and share the stories behind your children\'s artwork. Remember what they said, share the moment with family.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    // './' resolves against metadataBase per page. The old absolute homepage
    // URL was inherited by every route, telling Google that /support, /privacy
    // and /signup were duplicates of / and should not be indexed.
    canonical: './',
  },
  verification: {
    // Add these when you have them:
    // google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning itemScope itemType="https://schema.org/WebSite" className={`${nunito.variable} ${fredoka.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          <PageLoadTracker />
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
