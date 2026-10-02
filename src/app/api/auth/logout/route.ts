import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, OPERATOR_COOKIE_NAME } from '@/lib/auth';

function getLoginUrl(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto');

  if (host) {
    const isLocal =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.') ||
      host.includes(':');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');
    return `${proto}://${host}/login`;
  }

  return new URL('/login', req.url).toString();
}

function clearAllAuthCookies(response: NextResponse) {
  const isProd = process.env.NODE_ENV === 'production';

  // Clear admin session cookie
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // Clear operator desk session cookie
  response.cookies.set({
    name: OPERATOR_COOKIE_NAME,
    value: '',
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(OPERATOR_COOKIE_NAME);

  const loginUrl = getLoginUrl(req);
  const response = NextResponse.redirect(loginUrl, 303);
  return clearAllAuthCookies(response);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(OPERATOR_COOKIE_NAME);

  const loginUrl = getLoginUrl(req);

  // If a client specifically requested JSON (e.g. programmatic API) and is NOT a browser HTML form navigation
  const accept = req.headers.get('accept') || '';
  const isExplicitJson = accept.includes('application/json') && !accept.includes('text/html');

  if (isExplicitJson) {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirectUrl: loginUrl,
    });
    return clearAllAuthCookies(response);
  }

  // Otherwise redirect the browser to the login page (HTTP 303 See Other)
  const response = NextResponse.redirect(loginUrl, 303);
  return clearAllAuthCookies(response);
}
