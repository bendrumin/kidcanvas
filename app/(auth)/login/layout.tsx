import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your KidCanvas family gallery to see new artwork, the stories behind it, and what your family had to say.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

