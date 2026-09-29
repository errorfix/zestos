import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
