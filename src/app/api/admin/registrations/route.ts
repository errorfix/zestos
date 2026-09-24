import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, getEvents } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getAllowedCategoriesForCommittee } from '@/lib/committeeFlags';

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
        leadPhone: 'leadPhone' in r ? r.leadPhone : null,
        college: 'college' in r ? r.college : null,
        photoUrl: 'photoUrl' in r ? r.photoUrl : null,
        payerName: 'payerName' in r ? r.payerName : null,
        razorpayPaymentId: 'razorpayPaymentId' in r ? r.razorpayPaymentId : null,
        razorpayOrderId: 'razorpayOrderId' in r ? r.razorpayOrderId : null,
        amount: 'amount' in r && r.amount ? r.amount : matchedEvent?.feeAmount || 0,
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
          college: 'college' in t && typeof t.college === 'string' ? t.college : ('college' in r ? r.college : null),
          photoUrl: 'photoUrl' in t && typeof t.photoUrl === 'string' ? t.photoUrl : ('photoUrl' in r ? r.photoUrl : null),
          checkedInAt: t.checkedInAt || null,
        })),
      };
    });

    // Dynamic committee flags enforcement
    const committeeParam = searchParams.get('committee');
    let effectiveCommitteeId = committeeParam;

    if (!effectiveCommitteeId) {
      const cookieStore = await cookies();
      const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      const session = await verifyAdminSessionToken(token);
      if (session && session.roleId !== 'SUPER_ADMIN') {
        effectiveCommitteeId = session.roleId;
      }
    }

    if (effectiveCommitteeId) {
      const allowedCategories = getAllowedCategoriesForCommittee(effectiveCommitteeId).map((c) =>
        c.toLowerCase()
      );
      registrations = registrations.filter((r) =>
        allowedCategories.includes(r.eventCategory.toLowerCase())
      );
    }

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
