import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateAdminCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email and password.' },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;

    const isValid = validateAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator email or password.' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(email, rememberMe);
    const maxAge = rememberMe ? 7 * 24 * 3600 : 24 * 3600;

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        email: email.trim().toLowerCase(),
        role: 'ADMIN',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
