import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { checkInTicket, createAuditLog } from '@/lib/db';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, hasPermission, getOperatorFromRequest } from '@/lib/auth';

const checkInSchema = z.object({
  ticketCode: z.string().min(1, 'Ticket code is required'),
  signature: z.string().optional(),
  action: z.enum(['LOOKUP', 'CHECK_IN', 'WAITLIST', 'RESET']).default('CHECK_IN'),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionToken);

    if (!session || !hasPermission(session, 'access_checkin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Gate check-in password authentication required.' },
        { status: 401 }
      );
    }

    const json = await req.json();
    const parsed = checkInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid check-in request payload' },
        { status: 400 }
      );
    }

    const { ticketCode, signature, action } = parsed.data;
    const result = await checkInTicket({ ticketCode, signature, action });

    if (result.success && action === 'CHECK_IN') {
      const operator = getOperatorFromRequest(req);
      const attendeeName = 'attendeeName' in result ? result.attendeeName : undefined;
      const eventTitle = 'eventTitle' in result ? result.eventTitle : undefined;

      await createAuditLog({
        targetId: ticketCode,
        action: 'TICKET_CHECKIN',
        targetType: 'TICKET',
        operatorName: operator?.operatorName || 'Gate Security Desk',
        operatorRollNo: operator?.operatorRollNo || 'GATE_SECURITY',
        operatorType: operator?.operatorType || 'STUDENT',
        committeeRoleId: session.roleId,
        changes: {
          ticketCode,
          attendeeName,
          eventTitle,
        },
      });
    }

    const httpStatus = result.success ? 200 : result.status === 'ALREADY_CHECKED_IN' ? 409 : 404;

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Server error during check-in' },
      { status: 500 }
    );
  }
}
