import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug } from '@/lib/committeeConstants';
import { getCommitteeStorageDir, getMimeType } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedCommittee = searchParams.get('committee');
    const fileName = searchParams.get('file');
    const folder = searchParams.get('folder');
    const isDownload = searchParams.get('download') === 'true';

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'File name required' }, { status: 400 });
    }

    // Resolve authorized slug
    let slug = requestedCommittee;
    if (session.roleId !== 'SUPER_ADMIN' && session.roleId !== 'MANAGEMENT') {
      const comm = getCommitteeById(session.roleId);
      slug = comm ? comm.slug : null;
    }

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Unauthorized committee scope' }, { status: 403 });
    }

    const dir = getCommitteeStorageDir(slug, folder || undefined);
    const cleanFileName = path.basename(fileName);
    const filePath = path.join(dir, cleanFileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(cleanFileName);
    const mime = getMimeType(ext);

    const headers = new Headers();
    headers.set('Content-Type', mime);
    headers.set('Content-Length', fileBuffer.length.toString());

    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="${cleanFileName}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${cleanFileName}"`);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to serve file' },
      { status: 500 }
    );
  }
}
