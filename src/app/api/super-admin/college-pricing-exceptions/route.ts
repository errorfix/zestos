import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, requireRole } from '@/lib/auth';
import {
  getCollegePricingExceptions,
  setCollegePricingException,
  bulkSetCollegePricingExceptions,
  PricingExceptionMode,
} from '@/lib/collegePricingExceptions';
import { createAuditLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !requireRole(session, 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required.' }, { status: 403 });
    }

    const exceptions = getCollegePricingExceptions();
    return NextResponse.json({ success: true, exceptions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch pricing exceptions' },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  eventId: z.string().optional(),
  mode: z.enum(['DEFAULT', 'ADDITIVE', 'REPLACEMENT']).optional(),
  bulk: z.record(z.string(), z.enum(['DEFAULT', 'ADDITIVE', 'REPLACEMENT'])).optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !requireRole(session, 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required.' }, { status: 403 });
    }

    const json = await req.json();
    const parsed = updateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
    }

    let updatedExceptions;

    if (parsed.data.bulk) {
      updatedExceptions = bulkSetCollegePricingExceptions(parsed.data.bulk);
    } else if (parsed.data.eventId && parsed.data.mode) {
      updatedExceptions = setCollegePricingException(parsed.data.eventId, parsed.data.mode);
    } else {
      return NextResponse.json({ success: false, error: 'Missing eventId/mode or bulk object' }, { status: 400 });
    }

    await createAuditLog({
      targetId: parsed.data.eventId || 'BULK_PRICING_EXCEPTIONS',
      action: 'UPDATE_COLLEGE_PRICING_EXCEPTION',
      targetType: 'EVENT',
      operatorName: session.roleLabel,
      operatorRollNo: 'SUPER_ADMIN',
      operatorType: 'FACULTY',
      committeeRoleId: session.roleId,
      changes: parsed.data,
    });

    return NextResponse.json({
      success: true,
      exceptions: updatedExceptions,
      message: 'College pricing exceptions updated successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update pricing exceptions' },
      { status: 500 }
    );
  }
}
