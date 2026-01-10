import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { SkipLink } from '@/components/ui/skip-link'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  metadataBase: new URL('https://kidcanvas.app'),
  title: {
    default: 'KidCanvas - Preserve Your Children\'s Artwork',
    template: '%s | KidCanvas',
  },
  description: 'Scan, organize, and share your kids\' artwork with family. Every scribble tells a story. Free for 50 artworks.',
  keywords: ['kids artwork', 'children art', 'family gallery', 'artwork scanner', 'digital keepsakes', 'kids art storage', 'family photos', 'preserve memories', 'children drawings'],
  authors: [{ name: 'KidCanvas' }],
  creator: 'KidCanvas',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  openGraph: {
    title: 'KidCanvas - Every Scribble Tells a Story',
    description: 'Preserve your children\'s precious artwork forever. Scan, organize, and share with family. Free for 50 artworks.',
    url: 'https://kidcanvas.app',
    siteName: 'KidCanvas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KidCanvas - Preserve Your Children\'s Artwork',
    description: 'Scan, organize, and share your kids\' artwork with family. Every scribble tells a story.',
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
    canonical: 'https://kidcanvas.app',
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
    <html lang="en" suppressHydrationWarning itemScope itemType="https://schema.org/WebSite">
      <body className="min-h-screen antialiased">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DCH53W5VJT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DCH53W5VJT');
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
