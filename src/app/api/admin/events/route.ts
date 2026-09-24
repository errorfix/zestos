import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

/**
 * Read-only event listing for the R&I Committee.
 * Event creation/editing is restricted to Super Admin via /api/super-admin/events.
 */
export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

