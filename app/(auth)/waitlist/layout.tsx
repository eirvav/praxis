import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waitlist - Praxis',
  description: 'Join the Praxis waitlist',
}

export default function WaitlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
} 