import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kidcanvas.app'

  // A real date, bumped when page content meaningfully changes. new Date()
  // stamped every request as "modified now", which teaches crawlers that this
  // sitemap's lastmod means nothing and to ignore it.
  const lastContentChange = new Date('2026-08-24')

  return [
    {
      url: baseUrl,
      lastModified: lastContentChange,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: lastContentChange,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: lastContentChange,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: lastContentChange,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: lastContentChange,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: lastContentChange,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}

