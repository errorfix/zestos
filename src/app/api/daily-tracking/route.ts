import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import {
  getDailyTrackingItems,
  createDailyTrackingItem,
  TrackingFilters,
  TrackingStatus,
} from '@/lib/dailyTracking';
import { getCommitteeById, getCommitteeBySlug } from '@/lib/committeeConstants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const committeeId = searchParams.get('committeeId') || undefined;
    const date = searchParams.get('date') || undefined;
    const head = searchParams.get('head') || undefined;
    const subhead = searchParams.get('subhead') || undefined;
    const status = (searchParams.get('status') as TrackingStatus) || undefined;
    const search = searchParams.get('search') || undefined;

    const filters: TrackingFilters = {
      committeeId,
      date,
      head,
      subhead,
      status,
      search,
    };

    const items = await getDailyTrackingItems(filters);

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('[API DailyTracking GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch daily tracking items' },
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      committeeId,
      committeeName,
      date,
      head,
      subhead,
      title,
      workDescription,
      status,
      blockers,
      attachmentsUrl,
      operatorName: bodyOpName,
      operatorRollNo: bodyOpRoll,
      operatorType: bodyOpType,
    } = body;

    if (!committeeId || !head || !subhead || !title || !workDescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: committeeId, head, subhead, title, workDescription are mandatory.',
        },
        { status: 400 }
      );
    }

    // Authorization check: Super Admin & Higher Authority Management can post for any committee; committees can post for their own committee
    const isSuperOrMgmt = session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT';
    const userComm = getCommitteeById(session.roleId);
    const targetComm = getCommitteeById(committeeId) || getCommitteeBySlug(committeeId);

    const isMatch =
      session.roleId === committeeId ||
      userComm?.slug === committeeId ||
      userComm?.id === targetComm?.id;

    if (!isSuperOrMgmt && !isMatch) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only record tracking for your assigned committee.' },
        { status: 403 }
      );
    }

    // Resolve operator
    const reqOp = getOperatorFromRequest(request);
    const operatorName = bodyOpName?.trim() || reqOp?.operatorName || session.roleLabel || 'Committee Lead';
    const operatorRollNo = bodyOpRoll?.trim() || reqOp?.operatorRollNo || session.roleId;
    const operatorType = bodyOpType || reqOp?.operatorType || 'STUDENT';

    const newItem = await createDailyTrackingItem(
      {
        committeeId,
        committeeName,
        date,
        head,
        subhead,
        title,
        workDescription,
        status,
        blockers,
        operatorName,
        operatorRollNo,
        operatorType,
        attachmentsUrl,
      },
      session.roleId
    );

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'Daily tracking logged successfully',
    });
  } catch (error) {
    console.error('[API DailyTracking POST] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create daily tracking item' },
      { status: 500 }
    );
  }
}
