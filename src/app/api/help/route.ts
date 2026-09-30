import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { getCommitteeById } from '@/lib/committeeConstants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isCSIT = session.roleId === 'SUPER_ADMIN';
    const isControls = session.roleId === 'MANAGEMENT';
    const isResolver = isCSIT || isControls;

    const comm = getCommitteeById(session.roleId);
    const committeeId = comm ? comm.slug : session.roleId.toLowerCase();

    // CS&IT and Controls see ALL tickets (both solved and unsolved)
    if (isResolver) {
      const tickets = await prisma.supportTicket.findMany({
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });

      return NextResponse.json({
        success: true,
        isResolver: true,
        tickets,
      });
    }

    // Normal committee sees ONLY its own UNSOLVED issues (solved get removed)
    const tickets = await prisma.supportTicket.findMany({
      where: {
        committeeId,
        status: 'UNSOLVED',
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      isResolver: false,
      committeeId,
      committeeName: comm?.name || session.roleId,
      tickets,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch help requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { concern } = body;

    if (!concern || typeof concern !== 'string' || !concern.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please describe your concern or issue in detail.' },
        { status: 400 }
      );
    }

    const comm = getCommitteeById(session.roleId);
    const committeeId = comm ? comm.slug : session.roleId.toLowerCase();
    const committeeName = comm ? comm.name : session.roleId;

    const operator = getOperatorFromRequest(request);

    const ticket = await prisma.supportTicket.create({
      data: {
        committeeId,
        committeeName,
        concern: concern.trim(),
        status: 'UNSOLVED',
        operatorName: operator?.operatorName || 'Desk Operator',
        operatorRollNo: operator?.operatorRollNo || 'OP',
        operatorType: operator?.operatorType || 'STUDENT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your help request has been dispatched to CS&IT and Management Control.',
      ticket,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to submit help request' },
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isCSIT = session.roleId === 'SUPER_ADMIN';
    const isControls = session.roleId === 'MANAGEMENT';

    if (!isCSIT && !isControls) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only CS&IT and Controls can change issue status.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !['UNSOLVED', 'SOLVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'ticketId and valid status (UNSOLVED or SOLVED) required.' },
        { status: 400 }
      );
    }

    const operator = getOperatorFromRequest(request);
    const resolverLabel = `${isCSIT ? 'CS&IT' : 'Controls'} (${operator?.operatorName || session.roleId})`;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        resolvedBy: status === 'SOLVED' ? resolverLabel : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Issue marked as ${status}.`,
      ticket: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update issue status' },
      { status: 500 }
    );
  }
}
