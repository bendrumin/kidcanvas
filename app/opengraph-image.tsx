import { ImageResponse } from 'next/og'

// Removed edge runtime - Node.js runtime is more efficient for image generation
export const alt = 'KidCanvas - Preserve Your Children\'s Artwork'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 50%, #FFE4E6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #E91E63 0%, #9B59B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(233, 30, 99, 0.3)',
            }}
          >
            <span style={{ fontSize: '40px' }}>🎨</span>
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #E91E63 0%, #9B59B6 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            KidCanvas
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Preserve Your Children's Artwork
        </div>

        <div
          style={{
            fontSize: '28px',
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          Scan, organize, and share with family • Free for 100 artworks
        </div>

        {/* Decorative elements */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            fontSize: '50px',
          }}
        >
          <span>🖍️</span>
          <span>✨</span>
          <span>👨‍👩‍👧‍👦</span>
          <span>📸</span>
          <span>💝</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

