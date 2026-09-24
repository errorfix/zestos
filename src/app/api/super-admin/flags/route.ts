import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/db';
import {
  getCommitteeFlags,
  setCommitteeFlag,
  setAllCommitteeFlags,
  resetCommitteeFlagsToDefault,
  getCommitteeEditFlags,
  setCommitteeEditFlag,
  COMMITTEE_METAS,
  ALL_EVENT_CATEGORIES,
  EventCategoryKey,
} from '@/lib/committeeFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super Admin access required.' },
        { status: 403 }
      );
    }

    const flags = getCommitteeFlags();
    const editFlags = getCommitteeEditFlags();

    return NextResponse.json({
      success: true,
      flags,
      editFlags,
      committees: COMMITTEE_METAS,
      categories: ALL_EVENT_CATEGORIES,
    });
  } catch (error) {
    console.error('[API Flags] Error fetching flags:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch committee flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const operator = getOperatorFromRequest(request);

    // Reset action
    if (body.action === 'RESET_DEFAULTS') {
      const resetFlags = resetCommitteeFlagsToDefault();
      await createAuditLog({
        targetId: 'ALL_COMMITTEE_FLAGS',
        action: 'RESET_COMMITTEE_FLAGS',
        targetType: 'COMMITTEE_FLAG',
        operatorName: operator?.operatorName || 'Super Admin Desk',
        operatorRollNo: operator?.operatorRollNo || 'SUPER_ADMIN',
        operatorType: operator?.operatorType || 'STUDENT',
        committeeRoleId: 'SUPER_ADMIN',
        changes: { action: 'RESET_DEFAULTS' },
      });
      return NextResponse.json({
        success: true,
        message: 'Committee flags reset to defaults',
        flags: resetFlags,
      });
    }

    // Bulk set action
    if (body.flags && typeof body.flags === 'object') {
      const updated = setAllCommitteeFlags(body.flags);
      await createAuditLog({
        targetId: 'ALL_COMMITTEE_FLAGS',
        action: 'BULK_UPDATE_FLAGS',
        targetType: 'COMMITTEE_FLAG',
        operatorName: operator?.operatorName || 'Super Admin Desk',
        operatorRollNo: operator?.operatorRollNo || 'SUPER_ADMIN',
        operatorType: operator?.operatorType || 'STUDENT',
        committeeRoleId: 'SUPER_ADMIN',
        changes: body.flags,
      });
      return NextResponse.json({
        success: true,
        message: 'Committee flags updated successfully',
        flags: updated,
      });
    }

    // Toggle participant edit permission flag
    if (body.action === 'TOGGLE_EDIT_FLAG') {
      const { committeeId, enabled } = body;
      if (!committeeId || typeof enabled !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'committeeId and enabled boolean are required.' },
          { status: 400 }
        );
      }
      const updatedEdits = setCommitteeEditFlag(committeeId, enabled);
      await createAuditLog({
        targetId: `${committeeId}_EDIT_PERMISSION`,
        action: 'TOGGLE_PARTICIPANT_EDIT_FLAG',
        targetType: 'COMMITTEE_FLAG',
        operatorName: operator?.operatorName || 'Super Admin Desk',
        operatorRollNo: operator?.operatorRollNo || 'SUPER_ADMIN',
        operatorType: operator?.operatorType || 'STUDENT',
        committeeRoleId: 'SUPER_ADMIN',
        changes: {
          committeeId,
          canEditParticipants: enabled,
        },
      });
      return NextResponse.json({
        success: true,
        message: `Participant edit permission for ${committeeId} set to ${enabled ? 'ENABLED' : 'DISABLED'}`,
        editFlags: updatedEdits,
      });
    }

    // Single flag toggle action
    const { committeeId, category, enabled } = body;
    if (!committeeId || !category || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: committeeId, category and enabled boolean required' },
        { status: 400 }
      );
    }

    if (!ALL_EVENT_CATEGORIES.includes(category as EventCategoryKey)) {
      return NextResponse.json(
        { success: false, error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    const updated = setCommitteeFlag(committeeId, category as EventCategoryKey, enabled);

    await createAuditLog({
      targetId: `${committeeId}_${category}`,
      action: 'TOGGLE_COMMITTEE_FLAG',
      targetType: 'COMMITTEE_FLAG',
      operatorName: operator?.operatorName || 'Super Admin Desk',
      operatorRollNo: operator?.operatorRollNo || 'SUPER_ADMIN',
      operatorType: operator?.operatorType || 'STUDENT',
      committeeRoleId: 'SUPER_ADMIN',
      changes: {
        committeeId,
        category,
        enabled,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${category} for ${committeeId} to ${enabled ? 'ENABLED' : 'DISABLED'}`,
      flags: updated,
    });
  } catch (error) {
    console.error('[API Flags] Error modifying flags:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update committee flags' },
      { status: 500 }
    );
  }
}
