import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getSponsorshipStats } from '@/lib/sponsorship';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const stats = await getSponsorshipStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[API Sponsorship Stats GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch sponsorship stats' },
      { status: 500 }
    );
  }
}
