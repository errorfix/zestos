import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import {
  getDailyTrackingById,
  updateDailyTrackingItem,
  deleteDailyTrackingItem,
} from '@/lib/dailyTracking';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const existing = await getDailyTrackingById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tracking item not found.' },
        { status: 404 }
      );
    }

    // Permission check
    const isSuperAdmin = session.roleId === 'SUPER_ADMIN';
    if (!isSuperAdmin && session.roleId !== existing.committeeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to modify this tracking item.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reqOp = getOperatorFromRequest(request);

    // If Super Admin remark is being added
    const isUpdatingSuperAdminRemarks = body.superAdminRemarks !== undefined || body.superAdminReviewed !== undefined;
    if (isUpdatingSuperAdminRemarks && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admin can modify remarks or review status.' },
        { status: 403 }
      );
    }

    const updated = await updateDailyTrackingItem(
      id,
      {
        head: body.head,
        subhead: body.subhead,
        title: body.title,
        workDescription: body.workDescription,
        status: body.status,
        progressPercentage: body.progressPercentage !== undefined ? Number(body.progressPercentage) : undefined,
        blockers: body.blockers,
        attachmentsUrl: body.attachmentsUrl,
        superAdminRemarks: body.superAdminRemarks,
        superAdminReviewed: body.superAdminReviewed,
      },
      {
        operatorName: reqOp?.operatorName || session.roleLabel || 'Operator',
        operatorRollNo: reqOp?.operatorRollNo || session.roleId,
        operatorType: reqOp?.operatorType || 'STUDENT',
        committeeRoleId: session.roleId,
      }
    );

    return NextResponse.json({
      success: true,
      item: updated,
      message: 'Tracking item updated successfully',
    });
  } catch (error) {
    console.error('[API DailyTracking PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update tracking item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const existing = await getDailyTrackingById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tracking item not found.' },
        { status: 404 }
      );
    }

    const isSuperAdmin = session.roleId === 'SUPER_ADMIN';
    if (!isSuperAdmin && session.roleId !== existing.committeeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to delete this tracking item.' },
        { status: 403 }
      );
    }

    const reqOp = getOperatorFromRequest(request);

    await deleteDailyTrackingItem(id, {
      operatorName: reqOp?.operatorName || session.roleLabel || 'Operator',
      operatorRollNo: reqOp?.operatorRollNo || session.roleId,
      operatorType: reqOp?.operatorType || 'STUDENT',
      committeeRoleId: session.roleId,
    });

    return NextResponse.json({
      success: true,
      message: 'Tracking item deleted successfully',
    });
  } catch (error) {
    console.error('[API DailyTracking DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete tracking item' },
      { status: 500 }
    );
  }
}
