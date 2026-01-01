import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | KidCanvas',
  description: 'Get help with KidCanvas. Contact our support team or browse frequently asked questions.',
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

