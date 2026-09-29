import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getGroupedCollegeDelegations } from '@/lib/collegeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session authentication required.' },
        { status: 401 }
      );
    }

    // Allowed roles: SUPER_ADMIN, REGISTRATION_COMMITTEE, MANAGEMENT
    const allowedRoles = ['SUPER_ADMIN', 'REGISTRATION_COMMITTEE', 'MANAGEMENT'];
    if (!allowedRoles.includes(session.roleId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient committee privileges.' },
        { status: 403 }
      );
    }

    const delegations = await getGroupedCollegeDelegations();

    return NextResponse.json({
      success: true,
      delegations,
    });
  } catch (error) {
    console.error('[AdminCollegeRegistrations] Error fetching delegations:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch college delegations' },
      { status: 500 }
    );
  }
}
