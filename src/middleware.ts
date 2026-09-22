import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { updateSession } from '@/utils/supabase/middleware';

// Routes requiring committee administrator authentication
const PROTECTED_PREFIXES = ['/admin', '/onspot', '/checkin'];
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/onspot', '/api/checkin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path requires admin / committee authentication
  const isProtectedPage = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage || isProtectedApi) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized committee access. Please sign in.' },
          { status: 401 }
        );
      }

      // Redirect unauthenticated page requests to login with return path
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If visiting /login while already authenticated, redirect to /admin
  if (pathname === '/login') {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);
    if (session) {
      const nextUrl = request.nextUrl.searchParams.get('next') || '/admin';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }
  }

  // 2. Delegate session refresh to Supabase
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, static public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
