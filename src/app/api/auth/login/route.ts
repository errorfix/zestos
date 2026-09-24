import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';

const loginSchema = z.object({
  roleId: z.string().min(1, 'Role selection is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please select a role and enter the password.' },
        { status: 400 }
      );
    }

    const { roleId, password, rememberMe } = parsed.data;

    const result = validateCredentials(roleId, password);
    if (!result.valid || !result.role) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Access denied.' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(result.role.id, rememberMe);
    const maxAge = rememberMe ? 7 * 24 * 3600 : 24 * 3600;

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        roleId: result.role.id,
        roleLabel: result.role.label,
        dashboard: result.role.dashboard,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || 'lingayaszest.tech',  // ← Add this
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

