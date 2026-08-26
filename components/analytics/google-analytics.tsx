'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-DCH53W5VJT'

/**
 * Google Analytics, ported from ChoreStar's component.
 *
 * History worth knowing: this tag existed here before and never sent a single
 * event, because the site's Content-Security-Policy blocked googletagmanager --
 * the CSP now allows it (next.config.js). It renders in production only: gtag
 * has no bot filtering, so dev servers and Playwright runs would otherwise
 * count as traffic. The privacy pages disclose GA; keep them in sync if this
 * changes.
 */
export function GoogleAnalytics() {
  const pathname = usePathname()
  const initialMount = useRef(true)

  // Track page views on client-side route changes; gtag's own config call
  // covers the initial load.
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    if (typeof window !== 'undefined' && pathname && (window as any).gtag) {
      ;(window as any).gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
      })
    }
  }, [pathname])

  if (process.env.NODE_ENV !== 'production') return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
