import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getAllHeadsAndSubheads, PRESET_HEADS } from '@/lib/dailyTracking';

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

    const headsAndSubheads = await getAllHeadsAndSubheads();

    return NextResponse.json({
      success: true,
      heads: Object.keys(headsAndSubheads),
      headsAndSubheads,
      presetHeads: PRESET_HEADS,
    });
  } catch (error) {
    console.error('[API DailyTracking Heads GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch tracking heads' },
      { status: 500 }
    );
  }
}
