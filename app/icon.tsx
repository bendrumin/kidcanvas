import { ImageResponse } from 'next/og'

// Removed edge runtime - Node.js runtime is more efficient for image generation
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #E91E63 0%, #9B59B6 100%)',
          borderRadius: '6px',
        }}
      >
        <span style={{ fontSize: '18px' }}>🎨</span>
      </div>
    ),
    {
      ...size,
    }
  )
}

