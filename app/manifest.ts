import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KidCanvas',
    short_name: 'KidCanvas',
    description: 'Preserve your children\'s artwork forever. Scan, organize, and share with family.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FEF3C7',
    theme_color: '#E91E63',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

