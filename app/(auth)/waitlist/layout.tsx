import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waitlist - praXis',
  description: 'Join the praXis waitlist',
}

export default function WaitlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            praXis
          </h1>
          <p className="text-sm text-gray-600">
            Learning Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  )
} 