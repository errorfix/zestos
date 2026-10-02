import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug } from '@/lib/committeeConstants';
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
    const isGrievance = session.roleId === 'GRIEVANCES_COMMITTEE';
    const isHAM = session.roleId === 'MANAGEMENT';
    const isResolver = isCSIT || isGrievance || isHAM;

    const comm = getCommitteeById(session.roleId);
    const committeeId = comm ? comm.slug : session.roleId.toLowerCase();

    // Grievance Committee, HAM, and CS&IT see ALL complaints (both solved and unsolved)
    if (isResolver) {
      const complaints = await prisma.complaint.findMany({
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });

      return NextResponse.json({
        success: true,
        isResolver: true,
        committeeId,
        committeeName: comm?.name || (isHAM ? 'Higher Authority Management' : isCSIT ? 'CS&IT Administration' : 'Grievance Committee'),
        complaints,
      });
    }

    // Normal committee sees ONLY its own UNSOLVED complaints (solved get removed)
    const complaints = await prisma.complaint.findMany({
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
      complaints,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch complaints' },
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
    const { topic, explanation, committee: requestedCommittee } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: 'Complaint topic (sentence) is required.' },
        { status: 400 }
      );
    }

    if (!explanation || typeof explanation !== 'string' || !explanation.trim()) {
      return NextResponse.json(
        { success: false, error: 'Complaint explanation (paragraph) is required.' },
        { status: 400 }
      );
    }

    const matchedComm = requestedCommittee && requestedCommittee !== 'all'
      ? (getCommitteeBySlug(requestedCommittee) || getCommitteeById(requestedCommittee))
      : getCommitteeById(session.roleId);
    const committeeId = matchedComm ? matchedComm.slug : session.roleId.toLowerCase();
    const committeeName = matchedComm ? matchedComm.name : session.roleId;

    const operator = getOperatorFromRequest(request);

    const complaint = await prisma.complaint.create({
      data: {
        committeeId,
        committeeName,
        topic: topic.trim(),
        explanation: explanation.trim(),
        status: 'UNSOLVED',
        operatorName: operator?.operatorName || (session.roleId === 'MANAGEMENT' ? 'Higher Authority Management' : session.roleId === 'SUPER_ADMIN' ? 'CS&IT Administration' : 'Desk Operator'),
        operatorRollNo: operator?.operatorRollNo || (session.roleId === 'MANAGEMENT' ? 'MANAGEMENT' : session.roleId === 'SUPER_ADMIN' ? 'CSIT' : 'OP'),
        operatorType: operator?.operatorType || 'STUDENT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your official complaint has been logged and forwarded to Grievance Redressal & CS&IT.',
      complaint,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to submit complaint' },
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
    const isGrievance = session.roleId === 'GRIEVANCES_COMMITTEE';

    if (!isCSIT && !isGrievance) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Grievances Committee and CS&IT can change complaint resolution status.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { complaintId, status } = body;

    if (!complaintId || !['UNSOLVED', 'SOLVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'complaintId and valid status (UNSOLVED or SOLVED) required.' },
        { status: 400 }
      );
    }

    const operator = getOperatorFromRequest(request);
    const resolverLabel = `${isGrievance ? 'Grievance Committee' : 'CS&IT'} (${operator?.operatorName || session.roleId})`;

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        resolvedBy: status === 'SOLVED' ? resolverLabel : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Complaint marked as ${status}.`,
      complaint: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update complaint' },
      { status: 500 }
    );
  }
}
