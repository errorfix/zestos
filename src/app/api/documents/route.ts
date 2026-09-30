import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug } from '@/lib/committeeConstants';
import {
  listCommitteeDocuments,
  saveCommitteeDocument,
  deleteCommitteeDocument,
} from '@/lib/documents';

export const dynamic = 'force-dynamic';

function resolveAuthorizedSlug(session: { roleId: string }, requestedSlug?: string | null): string | null {
  // Super Admin (CS&IT) and Management have universal viewing
  if (session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT') {
    if (requestedSlug) {
      const match = getCommitteeBySlug(requestedSlug) || getCommitteeById(requestedSlug);
      return match ? match.slug : requestedSlug.toLowerCase();
    }
    return 'super-admin';
  }

  // Regular committee is strictly locked to its own slug
  const comm = getCommitteeById(session.roleId);
  return comm ? comm.slug : null;
}

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
    const slug = resolveAuthorizedSlug(session, requestedCommittee);

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Invalid committee scope' }, { status: 403 });
    }

    const documents = listCommitteeDocuments(slug);
    const commMeta = getCommitteeBySlug(slug);

    return NextResponse.json({
      success: true,
      committeeSlug: slug,
      committeeName: commMeta?.name || slug,
      documents,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to list documents' },
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

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json({ success: false, error: 'Management panel is read-only.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedCommittee = formData.get('committee') as string | null;
    const replaceFileName = formData.get('replaceFileName') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const slug = resolveAuthorizedSlug(session, requestedCommittee);
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Unauthorized committee folder' }, { status: 403 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If replacing, remove previous file if names differ
    if (replaceFileName && replaceFileName !== file.name) {
      deleteCommitteeDocument(slug, replaceFileName);
    }

    const savedDoc = await saveCommitteeDocument(slug, file.name, buffer);

    return NextResponse.json({
      success: true,
      message: 'Document stored successfully',
      document: savedDoc,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json({ success: false, error: 'Management panel is read-only.' }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, committee: requestedCommittee } = body;

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 });
    }

    const slug = resolveAuthorizedSlug(session, requestedCommittee);
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Unauthorized committee folder' }, { status: 403 });
    }

    const deleted = deleteCommitteeDocument(slug, fileName);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'File not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `File ${fileName} deleted successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
