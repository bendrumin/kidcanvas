import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { SkipLink } from '@/components/ui/skip-link'
import { Analytics } from '@vercel/analytics/react'

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
  description: 'Capture and share the stories behind your children\'s artwork. Remember what they said, share the moment with family, and keep those memories alive. Free for 50 artworks.',
  keywords: ['kids artwork', 'children art', 'family gallery', 'artwork stories', 'kids art stories', 'family sharing', 'children drawings', 'artwork memories', 'family moments', 'artwork social'],
  authors: [{ name: 'KidCanvas' }],
  creator: 'KidCanvas',
  openGraph: {
    title: 'KidCanvas - Capture the Stories Behind Your Kids\' Art',
    description: 'Capture and share the stories behind your children\'s artwork. Remember what they said, share the moment with family. Free for 50 artworks.',
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
