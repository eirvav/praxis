import { type Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Authentication - Praxis',
  description: 'Authentication pages for Praxis',
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex relative">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center sm:p-8 lg:p-12">
        <div className="w-full max-w-[420px] px-4 sm:px-0">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="Praxis Logo" width={27} height={28} />
            <span className="text-xl font-semibold text-indigo-600">Praxis</span>
          </Link>
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
            <div className="relative w-[600px] h-[600px] flex items-center justify-center">
              <Image
                src="/praxisavatar.png"
                alt="Praxis Avatar"
                width={600}
                height={600}
                className="object-contain"
              />
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