import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free KidCanvas account and start capturing the stories behind your children\'s artwork today. Free for up to 50 artworks.',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

