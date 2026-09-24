import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, getEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category')?.toLowerCase();
    const excludeCategoryFilter = searchParams.get('excludeCategory')?.toLowerCase();

    const rawRegs = await getAllRegistrations();
    const events = await getEvents();

    let registrations = rawRegs.map((r) => {
      const matchedEvent = events.find((e) => e.id === r.eventId) || r.event;
      return {
        id: r.id,
        eventId: r.eventId,
        eventTitle: matchedEvent?.title || 'Unknown Event',
        eventCategory: matchedEvent?.category || 'General',
        eventType: matchedEvent?.eventType || 'Individual',
        feeAmount: matchedEvent?.feeAmount || 0,
        dayOption: r.dayOption || null,
        trackUploadUrl: r.trackUploadUrl || null,
        trackNotes: r.trackNotes || null,
        leadName: r.leadName,
        leadEmail: r.leadEmail,
        status: r.status,
        paymentMethod: r.paymentMethod || 'ONLINE_RAZORPAY',
        createdAt: r.createdAt,
        teamMembers: r.teamMembers || [],
        tickets: (r.tickets || []).map((t) => ({
          id: t.id,
          ticketCode: t.ticketCode,
          status: t.status,
          securityHash: t.securityHash,
          fullName: 'fullName' in t && typeof t.fullName === 'string' ? t.fullName : r.leadName,
          checkedInAt: t.checkedInAt || null,
        })),
      };
    });

    if (categoryFilter) {
      registrations = registrations.filter(
        (r) => r.eventCategory.toLowerCase() === categoryFilter
      );
    }

    if (excludeCategoryFilter) {
      registrations = registrations.filter(
        (r) => r.eventCategory.toLowerCase() !== excludeCategoryFilter
      );
    }

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
