import { NextResponse } from 'next/server';
import { getAdminMetrics } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getAdminMetrics();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
