import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, getEvents, updateRegistrationTrack, getStageMetrics } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const eventIdFilter = searchParams.get('eventId');
    const categoryFilter = searchParams.get('category');
    const trackStatusFilter = searchParams.get('trackStatus'); // 'ALL' | 'ATTACHED' | 'MISSING'
    const statusFilter = searchParams.get('status'); // 'ALL' | 'PAID' | 'PENDING'

    const allEvents = await getEvents();
    const trackEvents = allEvents.filter((e) => e.requiresTrackUpload === true);
    const trackEventIds = new Set(trackEvents.map((e) => e.id));

    const rawRegs = await getAllRegistrations();

    // Filter strictly to track events
    const stageRegs = rawRegs.filter((r) => trackEventIds.has(r.eventId));

    let registrations = stageRegs.map((r) => {
      const matchedEvent = trackEvents.find((e) => e.id === r.eventId) || r.event;
      const hasTrack = !!(r.trackUploadUrl && r.trackUploadUrl.trim() !== '');

      return {
        id: r.id,
        eventId: r.eventId,
        eventTitle: matchedEvent?.title || 'Track Event',
        eventCategory: matchedEvent?.category || 'Stage Event',
        eventType: matchedEvent?.eventType || 'Individual',
        venue: matchedEvent?.venue || "Main Auditorium / Stage",
        date: matchedEvent?.date || "Day 1 / Day 2",
        feeAmount: matchedEvent?.feeAmount || 0,
        dayOption: r.dayOption || null,
        trackUploadUrl: r.trackUploadUrl || null,
        trackNotes: r.trackNotes || null,
        hasTrack,
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

    if (eventIdFilter && eventIdFilter !== 'ALL') {
      registrations = registrations.filter((r) => r.eventId === eventIdFilter);
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      registrations = registrations.filter((r) =>
        r.eventCategory.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (trackStatusFilter === 'ATTACHED') {
      registrations = registrations.filter((r) => r.hasTrack);
    } else if (trackStatusFilter === 'MISSING') {
      registrations = registrations.filter((r) => !r.hasTrack);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      registrations = registrations.filter((r) => r.status === statusFilter);
    }

    if (search) {
      registrations = registrations.filter((r) => {
        return (
          r.leadName.toLowerCase().includes(search) ||
          r.leadEmail.toLowerCase().includes(search) ||
          r.eventTitle.toLowerCase().includes(search) ||
          (r.trackNotes && r.trackNotes.toLowerCase().includes(search)) ||
          (r.trackUploadUrl && r.trackUploadUrl.toLowerCase().includes(search)) ||
          r.tickets.some((t) => t.ticketCode.toLowerCase().includes(search)) ||
          r.teamMembers.some((m) => m.fullName.toLowerCase().includes(search))
        );
      });
    }

    const metrics = await getStageMetrics();

    return NextResponse.json({
      success: true,
      registrations,
      trackEvents,
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch stage tracks' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Committee session required.' },
        { status: 401 }
      );
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Management panel is strictly read-only. Editing is disabled.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationId, trackUploadUrl, trackNotes } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: registrationId' },
        { status: 400 }
      );
    }

    const updated = await updateRegistrationTrack(registrationId, {
      trackUploadUrl,
      trackNotes,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Registration "${registrationId}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stage track and audio cues updated successfully.',
      registration: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update track link' },
      { status: 500 }
    );
  }
}
