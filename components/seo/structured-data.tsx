'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  type: 'Organization' | 'SoftwareApplication' | 'WebSite'
  data: Record<string, any>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [type, data])

  return null
}

// Organization schema for homepage
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'KidCanvas',
        url: 'https://kidcanvas.app',
        logo: 'https://kidcanvas.app/logo.png',
        description: 'Digitally preserve your children\'s artwork. Scan, organize, and share with family.',
        sameAs: [
          // Add social media links when available
        ],
      }}
    />
  )
}

// SoftwareApplication schema
export function SoftwareApplicationSchema() {
  return (
    <StructuredData
      type="SoftwareApplication"
      data={{
        name: 'KidCanvas',
        applicationCategory: 'FamilyApplication',
        operatingSystem: 'Web, iOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          ratingCount: '1',
        },
      }}
    />
  )
}

// WebSite schema with search action
export function WebSiteSchema() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: 'KidCanvas',
        url: 'https://kidcanvas.app',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://kidcanvas.app/dashboard?search={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  )
}

