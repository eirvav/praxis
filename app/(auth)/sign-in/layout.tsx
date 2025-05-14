import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Praxis',
  description: 'Sign in to Praxis',
}

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
} 