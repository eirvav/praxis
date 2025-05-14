import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - Praxis',
  description: 'Create your Praxis account',
}

export default function SignUpLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
} 