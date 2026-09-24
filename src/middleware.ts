import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { updateSession } from '@/utils/supabase/middleware';

// Routes requiring any authenticated committee/admin session
const PROTECTED_PREFIXES = ['/admin', '/onspot', '/super-admin', '/informalz', '/stage', '/committee', '/management'];
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/onspot', '/api/checkin', '/api/super-admin', '/api/informalz', '/api/stage', '/api/committee'];

// Routes restricted to SUPER_ADMIN role only
const SUPER_ADMIN_PREFIXES = ['/super-admin'];
const SUPER_ADMIN_API_PREFIXES = ['/api/super-admin'];

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
  const isApi = pathname.startsWith('/api/');

  if (isProtectedPage || isProtectedApi) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    // Not authenticated at all → return JSON 401 for APIs, or redirect to login for pages
    if (!session) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Session authentication required.' },
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
        if (isApi) {
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
    // Gate security can ONLY access /checkin and /api/checkin
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

      if (!isApi && pathname !== '/checkin' && !pathname.startsWith('/checkin/')) {
        return NextResponse.redirect(new URL('/checkin', request.url));
      }
    }

    // 4. Page-Level Committee Workspace Boundary Enforcement:
    // CRITICAL: This MUST ONLY run on PAGE requests (!isApi). NEVER redirect API requests to HTML URLs!
    if (!isApi && session.roleId !== 'SUPER_ADMIN' && session.roleId !== 'GATE_SECURITY') {
      const userRole = getRoleById(session.roleId);
      const userDashboard = userRole?.dashboard || '/admin';

      // Check-in terminal is universally accessible for credentialed committee members
      const isCheckin = pathname === '/checkin' || pathname.startsWith('/checkin/');

      if (!isCheckin) {
        if (pathname === '/management' || pathname.startsWith('/management/')) {
          if (session.roleId !== 'MANAGEMENT') {
            return NextResponse.redirect(new URL(userDashboard, request.url));
          }
        } else if (session.roleId === 'MANAGEMENT') {
          // Higher authority is locked to /management observatory page
          return NextResponse.redirect(new URL('/management', request.url));
        } else if (pathname.startsWith('/committee/')) {
          if (!pathname.startsWith(userDashboard)) {
            return NextResponse.redirect(new URL(userDashboard, request.url));
          }
        } else if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/onspot' || pathname.startsWith('/onspot/')) {
          if (session.roleId !== 'REGISTRATION_COMMITTEE') {
            return NextResponse.redirect(new URL(userDashboard, request.url));
          }
        } else if (pathname === '/informalz' || pathname.startsWith('/informalz/')) {
          if (session.roleId !== 'INFORMALZ_COMMITTEE') {
            return NextResponse.redirect(new URL(userDashboard, request.url));
          }
        } else if (pathname === '/stage' || pathname.startsWith('/stage/')) {
          if (session.roleId !== 'STAGE_COMMITTEE') {
            return NextResponse.redirect(new URL(userDashboard, request.url));
          }
        }
      }
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

