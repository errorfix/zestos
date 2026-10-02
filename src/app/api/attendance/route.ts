import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug, COMMITTEE_METAS } from '@/lib/committeeConstants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function resolveCommitteeScope(session: { roleId: string }, requestedParam?: string | null): {
  slug: string;
  name: string;
  isUniversalViewer: boolean;
  canEdit: boolean;
} {
  const isCSIT = session.roleId === 'SUPER_ADMIN';
  const isControls = session.roleId === 'MANAGEMENT';
  const isAttendanceComm = session.roleId === 'ATTENDANCE_COMMITTEE';
  const hasAssessmentAccess = isCSIT || isControls;

  const isUniversalViewer = isCSIT || isControls || isAttendanceComm;
  const canEdit = hasAssessmentAccess || isAttendanceComm;

  if (isUniversalViewer && requestedParam) {
    const match = getCommitteeBySlug(requestedParam) || getCommitteeById(requestedParam);
    if (match) {
      return { slug: match.slug, name: match.name, isUniversalViewer, canEdit: true };
    }
  }

  if (isUniversalViewer && !requestedParam) {
    return { slug: 'all', name: 'Master Campus View', isUniversalViewer, canEdit: false };
  }

  const comm = getCommitteeById(session.roleId);
  const slug = comm ? comm.slug : 'general';
  const name = comm ? comm.name : 'Committee Desk';
  return { slug, name, isUniversalViewer: false, canEdit: true };
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
    const requestedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const exportCsv = searchParams.get('export') === 'csv';

    const scope = resolveCommitteeScope(session, requestedCommittee);
    const committeeId = scope.slug;

    // Check operator identity or administrative oversight for marking status
    const operator = getOperatorFromRequest(request);
    const hasAssessmentAccess = session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT';
    const isFaculty = operator?.operatorType === 'FACULTY' || hasAssessmentAccess;

    // CSV Export Flow
    if (exportCsv) {
      const records = await prisma.committeeAttendance.findMany({
        where: committeeId === 'all' ? { date: requestedDate } : { committeeId, date: requestedDate },
        orderBy: [{ committeeId: 'asc' }, { rollNumber: 'asc' }],
      });

      const header = 'Committee,Date,Roll Number,Attendance Status,Marked By Faculty,Faculty ID,Recorded At\n';
      const rows = records.map((r) =>
        `"${r.committeeId}","${r.date}","${r.rollNumber}","${r.isPresent ? 'PRESENT' : 'ABSENT'}","${r.facultyName || 'N/A'}","${r.facultyRollNo || 'N/A'}","${r.createdAt.toISOString()}"`
      ).join('\n');

      const csvContent = header + rows;
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance_${committeeId}_${requestedDate}.csv"`,
        },
      });
    }

    // 1. Fetch roster members for this committee
    const roster = await prisma.committeeRosterMember.findMany({
      where: committeeId === 'all' ? {} : { committeeId },
      orderBy: { rollNumber: 'asc' },
    });

    // 2. Fetch existing records for this date
    const attendanceRecords = await prisma.committeeAttendance.findMany({
      where: committeeId === 'all' ? { date: requestedDate } : { committeeId, date: requestedDate },
    });

    // 3. Fetch publish status for this date
    const publishInfo = await prisma.committeeAttendancePublish.findFirst({
      where: committeeId === 'all' ? { date: requestedDate } : { committeeId, date: requestedDate },
      orderBy: { publishedAt: 'desc' },
    });

    // 4. Fetch latest published date for this committee
    const latestPublish = await prisma.committeeAttendancePublish.findFirst({
      where: committeeId === 'all' ? {} : { committeeId },
      orderBy: { date: 'desc' },
    });

    // 5. Fetch all published dates list for history
    const publishHistory = await prisma.committeeAttendancePublish.findMany({
      where: committeeId === 'all' ? {} : { committeeId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      committeeId,
      committeeName: scope.name,
      date: requestedDate,
      roster,
      attendanceRecords,
      isPublished: Boolean(publishInfo),
      publishInfo,
      latestPublishedDate: latestPublish?.date || null,
      publishHistory,
      canMark: isFaculty,
      operatorType: operator?.operatorType || 'STUDENT',
      operatorName: operator?.operatorName || null,
      isUniversalViewer: scope.isUniversalViewer,
      committees: COMMITTEE_METAS.map((c) => ({ id: c.id, slug: c.slug, name: c.name, badge: c.badge })),
    });
  } catch (error) {
    console.error('Error loading attendance:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to load attendance' },
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

    const hasAssessmentAccess = session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT';

    const body = await request.json();
    const { action, committee: requestedCommittee, rollNumber, studentName, date, entries } = body;

    const scope = resolveCommitteeScope(session, requestedCommittee);
    const committeeId = scope.slug;

    // ─── ACTION 1: ADD ROLL NUMBER TO ROSTER ─────────────────────────────────
    if (action === 'ADD_ROLL_NUMBER') {
      if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
        return NextResponse.json(
          { success: false, error: 'Student Roll Number is required (max 20 characters).' },
          { status: 400 }
        );
      }

      const cleanRollNo = rollNumber.trim().toUpperCase().substring(0, 20);

      const created = await prisma.committeeRosterMember.upsert({
        where: {
          committeeId_rollNumber: {
            committeeId,
            rollNumber: cleanRollNo,
          },
        },
        create: {
          committeeId,
          rollNumber: cleanRollNo,
          studentName: studentName?.trim() || null,
        },
        update: {
          studentName: studentName?.trim() || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Roll number ${cleanRollNo} added to roster.`,
        member: created,
      });
    }

    // ─── ACTION 2: PUSH ATTENDANCE DATA (FACULTY OR ASSESSMENT HUB ONLY) ─────
    if (action === 'PUSH_ATTENDANCE') {
      const operator = getOperatorFromRequest(request);

      const isFaculty = operator?.operatorType === 'FACULTY' || hasAssessmentAccess;
      if (!isFaculty) {
        return NextResponse.json(
          {
            success: false,
            error: 'Permission Denied: Only Faculty Staff In-Charge or Internal Assessment Authority can officially push and seal attendance records.',
          },
          { status: 403 }
        );
      }

      if (!date || typeof date !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Attendance date (YYYY-MM-DD) is required.' },
          { status: 400 }
        );
      }

      if (!Array.isArray(entries) || entries.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Attendance entries list cannot be empty.' },
          { status: 400 }
        );
      }

      // Check if this date was already published
      const existingPublish = await prisma.committeeAttendancePublish.findUnique({
        where: {
          committeeId_date: {
            committeeId,
            date,
          },
        },
      });

      if (existingPublish && !hasAssessmentAccess) {
        return NextResponse.json(
          {
            success: false,
            error: `Attendance for date ${date} has already been published on ${new Date(existingPublish.publishedAt).toLocaleDateString('en-IN')}. Cannot re-push attendance for previously finalized dates.`,
          },
          { status: 400 }
        );
      }

      let totalPresent = 0;
      let totalAbsent = 0;

      const actorName = operator?.operatorName || (session.roleId === 'MANAGEMENT' ? 'Higher Authority Management' : session.roleId === 'SUPER_ADMIN' ? 'CS&IT Administration' : 'Faculty Desk');
      const actorRollNo = operator?.operatorRollNo || (session.roleId === 'MANAGEMENT' ? 'MANAGEMENT-DESK' : session.roleId === 'SUPER_ADMIN' ? 'SUPERADMIN' : 'FACULTY');

      // Upsert each attendance entry in transaction
      await prisma.$transaction(
        entries.map((item: { rollNumber: string; isPresent: boolean }) => {
          if (item.isPresent) totalPresent++;
          else totalAbsent++;

          return prisma.committeeAttendance.upsert({
            where: {
              committeeId_date_rollNumber: {
                committeeId,
                date,
                rollNumber: item.rollNumber.trim().toUpperCase(),
              },
            },
            create: {
              committeeId,
              date,
              rollNumber: item.rollNumber.trim().toUpperCase(),
              isPresent: Boolean(item.isPresent),
              facultyName: actorName,
              facultyRollNo: actorRollNo,
            },
            update: {
              isPresent: Boolean(item.isPresent),
              facultyName: actorName,
              facultyRollNo: actorRollNo,
            },
          });
        })
      );

      // Upsert publication tracking record
      const publishRecord = await prisma.committeeAttendancePublish.upsert({
        where: {
          committeeId_date: {
            committeeId,
            date,
          },
        },
        create: {
          committeeId,
          date,
          facultyName: actorName,
          facultyRollNo: actorRollNo,
          totalPresent,
          totalAbsent,
        },
        update: {
          publishedAt: new Date(),
          facultyName: actorName,
          facultyRollNo: actorRollNo,
          totalPresent,
          totalAbsent,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Attendance for ${date} successfully published and sealed. Total Present: ${totalPresent}, Total Absent: ${totalAbsent}.`,
        publishRecord,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to submit attendance' },
      { status: 500 }
    );
  }
}
