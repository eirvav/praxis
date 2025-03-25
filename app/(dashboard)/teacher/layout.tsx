import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Created By Eirik Pagani Vavik',
}

export default function TeacherLayout({
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