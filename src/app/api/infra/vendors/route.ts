import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAuthorized(roleId: string) {
  return roleId === 'SUPER_ADMIN' || roleId === 'INFRA_COMMITTEE' || roleId === 'MANAGEMENT';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !isAuthorized(session.roleId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vendors = await prisma.infraVendor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !isAuthorized(session.roleId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json({ success: false, error: 'Management panel is read-only.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, purpose, remarks, contactPhone, amountRupees, status } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Vendor agency/name is required.' }, { status: 400 });
    }

    if (!purpose || typeof purpose !== 'string' || !purpose.trim()) {
      return NextResponse.json({ success: false, error: 'Vendor purpose / deliverables required.' }, { status: 400 });
    }

    const operator = getOperatorFromRequest(request);

    const vendor = await prisma.infraVendor.create({
      data: {
        name: name.trim(),
        purpose: purpose.trim(),
        remarks: remarks?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        amountPaise: amountRupees ? Math.round(Number(amountRupees) * 100) : null,
        status: status || 'ACTIVE',
        operatorName: operator?.operatorName || 'Infra Desk',
        operatorRollNo: operator?.operatorRollNo || 'INFRA',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor record registered successfully.',
      vendor,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !isAuthorized(session.roleId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json({ success: false, error: 'Management panel is read-only.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, purpose, remarks, contactPhone, amountRupees, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 400 });
    }

    const updated = await prisma.infraVendor.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        purpose: purpose?.trim() || undefined,
        remarks: remarks !== undefined ? remarks?.trim() : undefined,
        contactPhone: contactPhone !== undefined ? contactPhone?.trim() : undefined,
        amountPaise: amountRupees !== undefined ? (amountRupees ? Math.round(Number(amountRupees) * 100) : null) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor record updated.',
      vendor: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session || !isAuthorized(session.roleId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json({ success: false, error: 'Management panel is read-only.' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 400 });
    }

    await prisma.infraVendor.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Vendor record deleted.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
