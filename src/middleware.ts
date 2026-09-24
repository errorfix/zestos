import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { updateSession } from '@/utils/supabase/middleware';

// Routes requiring any authenticated committee/admin session
const PROTECTED_PREFIXES = ['/admin', '/onspot', '/checkin', '/super-admin', '/informalz'];
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/onspot', '/api/checkin', '/api/super-admin', '/api/informalz'];

// Routes restricted to SUPER_ADMIN role only
const SUPER_ADMIN_PREFIXES = ['/super-admin'];
const SUPER_ADMIN_API_PREFIXES = ['/api/super-admin'];

// Committee-specific route boundaries
const INFORMALZ_PREFIXES = ['/informalz'];
const RI_PREFIXES = ['/admin', '/onspot'];

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path requires authentication
  const isProtectedPage = matchesAny(pathname, PROTECTED_PREFIXES);
  const isProtectedApi = matchesAny(pathname, PROTECTED_API_PREFIXES);

  if (isProtectedPage || isProtectedApi) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    // Not authenticated at all → redirect to login or 401
    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role-based access: Super Admin restricted routes
    const isSuperAdminPage = matchesAny(pathname, SUPER_ADMIN_PREFIXES);
    const isSuperAdminApi = matchesAny(pathname, SUPER_ADMIN_API_PREFIXES);

    if (isSuperAdminPage || isSuperAdminApi) {
      if (session.roleId !== 'SUPER_ADMIN') {
        if (isSuperAdminApi) {
          return NextResponse.json(
            { success: false, error: 'Forbidden. Super Admin access required.' },
            { status: 403 }
          );
        }

        const role = getRoleById(session.roleId);
        const redirectTo = role?.dashboard || '/admin';
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    // 3. Committee isolation:
    // Informalz committee cannot access R&I specific panels (/admin, /onspot)
    if (session.roleId === 'INFORMALZ_COMMITTEE' && matchesAny(pathname, RI_PREFIXES)) {
      return NextResponse.redirect(new URL('/informalz', request.url));
    }

    // R&I committee cannot access Informalz panel (/informalz)
    if (session.roleId === 'REGISTRATION_COMMITTEE' && matchesAny(pathname, INFORMALZ_PREFIXES)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // If visiting /login while already authenticated, redirect to their dashboard
  if (pathname === '/login') {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);
    if (session) {
      const role = getRoleById(session.roleId);
      const nextUrl =
        request.nextUrl.searchParams.get('next') || role?.dashboard || '/admin';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }
  }

  // 3. Delegate session refresh to Supabase
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

