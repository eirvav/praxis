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
        <div className="space-y-6 px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </ClerkProvider>
  )
}