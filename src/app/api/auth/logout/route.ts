import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  // Use the Host header to build the public redirect URL.
  // req.url contains the internal Docker/Node loopback (http://localhost:3000/...)
  // which causes post-logout redirects to land on localhost instead of the real domain.
  const host = req.headers.get('host') || 'lingayaszest.tech';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const loginUrl = `${proto}://${host}/login`;

  const response = NextResponse.redirect(loginUrl);

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
