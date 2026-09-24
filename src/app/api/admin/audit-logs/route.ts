import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Super Admin access required for security audit logs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId') || undefined;
    const operatorRollNo = searchParams.get('operatorRollNo') || undefined;
    const action = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = await getAuditLogs({
      targetId,
      operatorRollNo,
      action,
      limit,
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
