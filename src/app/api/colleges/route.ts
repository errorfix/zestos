import { NextResponse } from 'next/server';
import { getAllCollegesList } from '@/lib/collegeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const colleges = await getAllCollegesList();
    return NextResponse.json({ success: true, colleges });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}
