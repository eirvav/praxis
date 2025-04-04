import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'praXis Student Dashboard',
  description: 'Created By Eirik Pagani Vavik',
}

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </ClerkProvider>
  )
}