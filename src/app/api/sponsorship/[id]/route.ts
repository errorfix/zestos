import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import {
  getSponsorshipDealById,
  updateSponsorshipDeal,
  deleteSponsorshipDeal,
} from '@/lib/sponsorship';

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

    if (session.roleId !== 'SPONSORSHIP_COMMITTEE' && session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges.' },
        { status: 403 }
      );
    }

    const existing = await getSponsorshipDealById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Sponsorship deal not found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const reqOp = getOperatorFromRequest(request);

    // If Super Admin notes / verification are being modified
    if ((body.superAdminNotes !== undefined || body.superAdminVerified !== undefined) && session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admin can verify sponsorship deals.' },
        { status: 403 }
      );
    }

    const updated = await updateSponsorshipDeal(
      id,
      body,
      {
        operatorName: reqOp?.operatorName || session.roleLabel || 'Operator',
        operatorRollNo: reqOp?.operatorRollNo || session.roleId,
        operatorType: reqOp?.operatorType || 'STUDENT',
        committeeRoleId: session.roleId,
      }
    );

    return NextResponse.json({
      success: true,
      deal: updated,
      message: 'Sponsorship deal updated successfully',
    });
  } catch (error) {
    console.error('[API Sponsorship PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update sponsorship deal' },
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

    if (session.roleId !== 'SPONSORSHIP_COMMITTEE' && session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges.' },
        { status: 403 }
      );
    }

    const reqOp = getOperatorFromRequest(request);

    const deleted = await deleteSponsorshipDeal(id, {
      operatorName: reqOp?.operatorName || session.roleLabel || 'Operator',
      operatorRollNo: reqOp?.operatorRollNo || session.roleId,
      operatorType: reqOp?.operatorType || 'STUDENT',
      committeeRoleId: session.roleId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sponsorship deal deleted successfully',
    });
  } catch (error) {
    console.error('[API Sponsorship DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
