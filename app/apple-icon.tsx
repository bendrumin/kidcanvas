import { ImageResponse } from 'next/og'

// Removed edge runtime - Node.js runtime is more efficient for image generation
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '40px',
        }}
      >
        <span style={{ fontSize: '90px' }}>🎨</span>
      </div>
    ),
    {
      ...size,
    }
  )
}

