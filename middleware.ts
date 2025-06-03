import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/waitlist(.*)',
  '/api/webhook/clerk(.*)',
  '/mobile-warning(.*)'  // Keep mobile warning in public routes
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

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role as string | undefined;
  
  // Create response object to add Safari-specific headers
  let response = NextResponse.next();
  
  // Add Safari-specific headers to improve compatibility
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Check for mobile devices only if user is authenticated
  if (userId) {
    const userAgent = request.headers.get('user-agent') || ''
    const isMobile = MOBILE_KEYWORDS.some(keyword => userAgent.includes(keyword))
    const path = request.nextUrl.pathname

    // Check if the current path is protected from mobile
    const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
      path.startsWith(protectedPath)
    )

    // If it's a mobile device and trying to access a protected path
    if (isMobile && isProtectedPath) {
      const redirectResponse = NextResponse.redirect(new URL('/mobile-warning', request.url))
      // Add Safari-specific headers to redirect response
      redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return redirectResponse
    }

    // If it's a mobile device trying to access the dashboard root
    if (isMobile && path === '/') {
      const redirectResponse = NextResponse.redirect(new URL('/mobile-warning', request.url))
      redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return redirectResponse
    }
  }

  // Handle admin routes
  if (isAdminRoute(request) && userRole !== 'admin') {
    const url = new URL('/', request.url)
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return redirectResponse
  }

  // Handle teacher routes
  if (isTeacherRoute(request) && userRole !== 'teacher') {
    // Students trying to access teacher routes should be redirected to student dashboard
    if (userRole === 'student') {
      const url = new URL('/student', request.url)
      const redirectResponse = NextResponse.redirect(url)
      redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return redirectResponse
    }
    // Others are redirected to the home page
    const url = new URL('/', request.url)
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return redirectResponse
  }
  
  // Handle student player routes - ensure only students can access
  if (isStudentPlayerRoute(request)) {
    // Ensure the user is authenticated first
    await auth.protect();
    
    // If not a student, redirect based on role
    if (userRole !== 'student') {
      if (userRole === 'teacher') {
        const url = new URL('/teacher', request.url)
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return redirectResponse
      } else if (userRole === 'admin') {
        const url = new URL('/admin', request.url)
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return redirectResponse
      } else {
        // No recognized role, redirect to home
        const url = new URL('/', request.url)
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return redirectResponse
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
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return redirectResponse
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return response;
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}