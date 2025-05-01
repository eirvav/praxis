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
  return (
    <div className="min-h-screen flex relative">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center sm:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>

      {/* Right side - Illustration (hidden on mobile) */}
      <div className="hidden lg:block w-1/2 bg-gradient-to-br from-indigo-400 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Clouds */}
          <div className="absolute top-20 right-20 w-32 h-16 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 left-20 w-40 h-20 bg-white/20 rounded-full blur-2xl"></div>
          
          {/* Main Illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[420px] h-[420px]">
            </div>
          </div>
        </div>
      </div>

      {/* Trademark at bottom */}
      <div className="absolute bottom-4 left-0 w-full lg:w-1/2 text-center text-sm text-gray-500">
        Praxis™
      </div>
    </div>
  )
} 