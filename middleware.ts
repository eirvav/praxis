import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook/clerk(.*)'
])

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role as string | undefined;

  // Handle admin routes
  if (isAdminRoute(request) && userRole !== 'admin') {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
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
  ],
}