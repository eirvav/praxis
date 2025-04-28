import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/waitlist(.*)',
  '/api/webhook/clerk(.*)'
])

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isTeacherRoute = createRouteMatcher(['/teacher/modules(.*)']);
const isStudentPlayerRoute = createRouteMatcher(['/student/player(.*)']);

// Array of mobile device keywords to check in user agent
const MOBILE_KEYWORDS = [
  'Mobile',
  'Android',
  'iPhone',
  'iPad',
  'Windows Phone',
  'webOS',
  'BlackBerry',
  'iPod'
]

// Array of paths that should be protected from mobile access
const PROTECTED_PATHS = [
  '/teacher',
  '/student'
]

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = MOBILE_KEYWORDS.some(keyword => userAgent.includes(keyword))
  const path = request.nextUrl.pathname

  // Check if the current path is protected
  const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
    path.startsWith(protectedPath)
  )

  // If it's a mobile device and trying to access a protected path
  if (isMobile && isProtectedPath) {
    return NextResponse.redirect(new URL('/mobile-warning', request.url))
  }

  // If it's a mobile device trying to access the dashboard root
  if (isMobile && path === '/') {
    return NextResponse.redirect(new URL('/mobile-warning', request.url))
  }

  return NextResponse.next()
}

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role as string | undefined;

  // Handle admin routes
  if (isAdminRoute(request) && userRole !== 'admin') {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  // Handle teacher routes
  if (isTeacherRoute(request) && userRole !== 'teacher') {
    // Students trying to access teacher routes should be redirected to student dashboard
    if (userRole === 'student') {
      const url = new URL('/student', request.url)
      return NextResponse.redirect(url)
    }
    // Others are redirected to the home page
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }
  
  // Handle student player routes - ensure only students can access
  if (isStudentPlayerRoute(request)) {
    // Ensure the user is authenticated first
    await auth.protect();
    
    // If not a student, redirect based on role
    if (userRole !== 'student') {
      if (userRole === 'teacher') {
        const url = new URL('/teacher', request.url)
        return NextResponse.redirect(url)
      } else if (userRole === 'admin') {
        const url = new URL('/admin', request.url)
        return NextResponse.redirect(url)
      } else {
        // No recognized role, redirect to home
        const url = new URL('/', request.url)
        return NextResponse.redirect(url)
      }
    }
  }

  // If it's the root path and user is authenticated, redirect based on role
  if (request.nextUrl.pathname === '/' && userId) {
    let redirectPath = '/student'; // default path

    if (userRole === 'admin') {
      redirectPath = '/admin';
    } else if (userRole === 'teacher') {
      redirectPath = '/teacher';
    }

    const url = new URL(redirectPath, request.url)
    return NextResponse.redirect(url)
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/((?!api|_next/static|_next/image|favicon.ico|mobile-warning).*)',
  ],
}