/**
 * Server-rendered JSON-LD.
 *
 * The previous version injected these with useEffect, so the structured data
 * only existed client-side after hydration -- a crawler fetching the HTML saw
 * none of it, which is why Google had nothing to read. These render inline in
 * the server HTML.
 *
 * Also removed while rewriting: a fabricated aggregateRating (5 stars from 1
 * rating) -- invented review markup is a Google structured-data policy
 * violation, not just bad taste; a logo URL that 404ed; and a SearchAction
 * pointing into the auth-walled dashboard, where a search box result would
 * strand anyone who used it.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...data }),
      }}
    />
  )
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@type': 'Organization',
        name: 'KidCanvas',
        url: 'https://kidcanvas.app',
        logo: 'https://kidcanvas.app/logo.png',
        description:
          "A private family gallery for children's artwork and the stories behind it.",
      }}
    />
  )
}

export function SoftwareApplicationSchema() {
  return (
    <JsonLd
      data={{
        '@type': 'SoftwareApplication',
        name: 'KidCanvas',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'iOS, Web',
        url: 'https://kidcanvas.app',
        description:
          "Scan children's artwork, write down the story in their words, and share both with family who can react and comment.",
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }}
    />
  )
}

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        '@type': 'WebSite',
        name: 'KidCanvas',
        url: 'https://kidcanvas.app',
      }}
    />
  )
}
