import { NextResponse } from 'next/server';
import { getVisibleRoles } from '@/lib/auth';

/**
 * Returns the list of visible roles for the login dropdown.
 * Hidden roles (like SUPER_ADMIN) are excluded.
 */
export async function GET() {
  const roles = getVisibleRoles();
  return NextResponse.json({ roles });
}
