import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to KidCanvas to access your family\'s artwork gallery.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

