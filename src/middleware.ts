import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { updateSession } from '@/utils/supabase/middleware';

// Routes requiring any authenticated committee/admin session
const PROTECTED_PREFIXES = ['/admin', '/onspot', '/super-admin', '/informalz', '/stage'];
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/onspot', '/api/checkin', '/api/super-admin', '/api/informalz', '/api/stage'];

// Routes restricted to SUPER_ADMIN role only
const SUPER_ADMIN_PREFIXES = ['/super-admin'];
const SUPER_ADMIN_API_PREFIXES = ['/api/super-admin'];

// Committee-specific route boundaries
const INFORMALZ_PREFIXES = ['/informalz'];
const RI_PREFIXES = ['/admin', '/onspot'];
const STAGE_PREFIXES = ['/stage'];
const CHECKIN_PREFIXES = ['/checkin'];

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
          { success: false, error: 'Unauthorized: Gate check-in password authentication required.' },
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

    // 3. Gate Security isolation:
    // Gate security cannot access R&I, Stage, Informalz, or Super Admin panels / APIs
    if (session.roleId === 'GATE_SECURITY') {
      const isForbiddenApi = matchesAny(pathname, [
        '/api/admin',
        '/api/onspot',
        '/api/super-admin',
        '/api/stage',
        '/api/informalz',
      ]);
      if (isForbiddenApi) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Gate Security credentials cannot access administrative data.' },
          { status: 403 }
        );
      }

      if (
        matchesAny(pathname, RI_PREFIXES) ||
        matchesAny(pathname, STAGE_PREFIXES) ||
        matchesAny(pathname, INFORMALZ_PREFIXES) ||
        matchesAny(pathname, SUPER_ADMIN_PREFIXES)
      ) {
        return NextResponse.redirect(new URL('/checkin', request.url));
      }
    }

    // 4. Committee isolation:
    // Informalz committee cannot access R&I or Stage panels
    if (session.roleId === 'INFORMALZ_COMMITTEE' && (matchesAny(pathname, RI_PREFIXES) || matchesAny(pathname, STAGE_PREFIXES))) {
      return NextResponse.redirect(new URL('/informalz', request.url));
    }

    // R&I committee cannot access Informalz or Stage panels
    if (session.roleId === 'REGISTRATION_COMMITTEE' && (matchesAny(pathname, INFORMALZ_PREFIXES) || matchesAny(pathname, STAGE_PREFIXES))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Stage committee cannot access R&I or Informalz panels
    if (session.roleId === 'STAGE_COMMITTEE' && (matchesAny(pathname, RI_PREFIXES) || matchesAny(pathname, INFORMALZ_PREFIXES))) {
      return NextResponse.redirect(new URL('/stage', request.url));
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

