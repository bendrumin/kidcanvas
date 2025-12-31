import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SkipLink } from '@/components/ui/skip-link'

export const metadata: Metadata = {
  title: 'KidCanvas - Preserve Your Children\'s Artwork',
  description: 'Scan, organize, and share your kids\' artwork with family. Every scribble tells a story.',
  keywords: ['kids artwork', 'children art', 'family gallery', 'artwork scanner', 'digital keepsakes'],
  openGraph: {
    title: 'KidCanvas - Every Scribble Tells a Story',
    description: 'Preserve your children\'s precious artwork forever. Scan, organize, and share with family.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SkipLink />
        {children}
        <Toaster />
      </body>
    </html>
  )
}

