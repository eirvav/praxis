import { type Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sign Up - praXis',
  description: 'Create your praXis account',
}

export default function SignUpLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-40 right-10 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-indigo-100/[0.05] bg-[size:20px_20px]" style={{ maskImage: 'radial-gradient(circle, white, transparent 80%)' }}></div>
      </div>
      
      {/* Content */}
      <div className="max-w-md w-full space-y-8 p-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 z-10 relative">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.svg" alt="praXis Logo" width={36} height={36} className="animate-pulse animation-delay-200" />
            <div className="relative inline-block">
              <h1 className="text-5xl font-bold tracking-tight text-indigo-600 mb-2">
                praXis
              </h1>
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-indigo-400"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-indigo-300"></div>
            </div>
          </div>
          <p className="text-sm text-indigo-800 font-medium mt-2">
            Learning Management System
          </p>
        </div>
        {children}
      </div>
      
      {/* Additional flair */}
      <div className="absolute bottom-4 text-indigo-400/30 text-xs font-medium">© praXis {new Date().getFullYear()}</div>
    </div>
  )
} 