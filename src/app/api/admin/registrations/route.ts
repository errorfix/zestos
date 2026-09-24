import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, getEvents, updateRegistrationParticipantData, createAuditLog } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { getAllowedCategoriesForCommittee, canCommitteeEditParticipants } from '@/lib/committeeFlags';

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

    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    // Dynamic committee flags enforcement
    const committeeParam = searchParams.get('committee');
    let effectiveCommitteeId = committeeParam;

    if (!effectiveCommitteeId) {
      if (session && session.roleId !== 'SUPER_ADMIN' && session.roleId !== 'MANAGEMENT') {
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

    const canEditParticipants = session ? canCommitteeEditParticipants(session.roleId) : false;

    return NextResponse.json({
      success: true,
      registrations,
      canEditParticipants,
      userRole: session?.roleId || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch registrations' },
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
        { success: false, error: 'Unauthorized: Session required to edit participant records.' },
        { status: 401 }
      );
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Management panel is strictly read-only.' },
        { status: 403 }
      );
    }

    // Check panel permission flag
    const hasEditPermission = canCommitteeEditParticipants(session.roleId);
    if (!hasEditPermission) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: ${session.roleLabel || session.roleId} does not have participant edit permissions enabled. Ask Super Admin to enable the edit flag.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      registrationId,
      leadName,
      leadEmail,
      leadPhone,
      college,
      status,
      dayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: 'registrationId is required.' },
        { status: 400 }
      );
    }

    const updated = await updateRegistrationParticipantData(registrationId, {
      leadName,
      leadEmail,
      leadPhone,
      college,
      status,
      dayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Registration "${registrationId}" not found.` },
        { status: 404 }
      );
    }

    // Record Immutable Audit Log
    const operator = getOperatorFromRequest(request);
    await createAuditLog({
      targetId: registrationId,
      action: 'UPDATE_PARTICIPANT_DATA',
      targetType: 'REGISTRATION',
      operatorName: operator?.operatorName || 'Desk Operator',
      operatorRollNo: operator?.operatorRollNo || 'COMMITTEE_DESK',
      operatorType: operator?.operatorType || 'STUDENT',
      committeeRoleId: session.roleId,
      changes: {
        leadName,
        leadEmail,
        leadPhone,
        college,
        status,
        dayOption,
        trackUploadUrl,
        trackNotes,
        teamMembersCount: teamMembers ? teamMembers.length : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Participant record updated successfully.',
      registration: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update participant record' },
      { status: 500 }
    );
  }
}
