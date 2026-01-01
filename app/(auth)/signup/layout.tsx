import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free KidCanvas account and start preserving your children\'s artwork today. Free for up to 100 artworks.',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

