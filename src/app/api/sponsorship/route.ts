import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import {
  getSponsorshipDeals,
  createSponsorshipDeal,
  DealStatus,
  SponsorshipKind,
} from '@/lib/sponsorship';

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
    const status = (searchParams.get('status') as DealStatus) || undefined;
    const kind = (searchParams.get('kind') as SponsorshipKind) || undefined;
    const search = searchParams.get('search') || undefined;

    const deals = await getSponsorshipDeals({ status, kind, search });

    return NextResponse.json({
      success: true,
      deals,
      count: deals.length,
    });
  } catch (error) {
    console.error('[API Sponsorship GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch sponsorship deals' },
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

    // Only SPONSORSHIP_COMMITTEE and SUPER_ADMIN can create deals
    if (session.roleId !== 'SPONSORSHIP_COMMITTEE' && session.roleId !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Sponsorship Committee or Super Admin can create deals.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      brandSector,
      contactPerson,
      contactEmail,
      contactPhone,
      sponsorshipKind,
      dealStatus,
      deliverablesSummary,
      mouDocumentUrl,
      operatorName: bodyOpName,
      operatorRollNo: bodyOpRoll,
      operatorType: bodyOpType,
      remarks,
    } = body;

    if (!companyName || !brandSector || !contactPerson || !sponsorshipKind || !deliverablesSummary) {
      return NextResponse.json(
        { success: false, error: 'Missing required sponsorship deal parameters.' },
        { status: 400 }
      );
    }

    const reqOp = getOperatorFromRequest(request);
    const operatorName = bodyOpName?.trim() || reqOp?.operatorName || session.roleLabel || 'Sponsorship Coordinator';
    const operatorRollNo = bodyOpRoll?.trim() || reqOp?.operatorRollNo || session.roleId;
    const operatorType = bodyOpType || reqOp?.operatorType || 'STUDENT';

    const newDeal = await createSponsorshipDeal(
      {
        companyName,
        brandSector,
        contactPerson,
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
        sponsorshipKind,
        dealStatus,
        deliverablesSummary,
        mouDocumentUrl,
        operatorName,
        operatorRollNo,
        operatorType,
        remarks,
      },
      session.roleId
    );

    return NextResponse.json({
      success: true,
      deal: newDeal,
      message: 'Sponsorship outreach recorded successfully',
    });
  } catch (error) {
    console.error('[API Sponsorship POST] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create sponsorship deal' },
      { status: 500 }
    );
  }
}
