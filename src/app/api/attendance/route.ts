import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getOperatorFromRequest } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug, COMMITTEE_METAS } from '@/lib/committeeConstants';
import { getDefaultRosterForCommittee, OFFICIAL_COMMITTEE_VOLUNTEERS } from '@/lib/committeeRosterData';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function resolveCommitteeScope(session: { roleId: string }, requestedParam?: string | null): {
  slug: string;
  name: string;
  isUniversalViewer: boolean;
  canEdit: boolean;
} {
  const isCSIT = session.roleId === 'SUPER_ADMIN';
  const isHAM = session.roleId === 'MANAGEMENT';
  const isAttendanceComm = session.roleId === 'ATTENDANCE_COMMITTEE';

  // CS&IT (Super Admin) and Attendance Committee can edit attendance.
  // Higher Authority Management (HAM) is strictly read-only observatory.
  const canEdit = isCSIT || isAttendanceComm;
  const isUniversalViewer = isCSIT || isHAM || isAttendanceComm;

  if (requestedParam === 'all') {
    return { slug: 'all', name: 'Master Campus View (All Committees)', isUniversalViewer: true, canEdit };
  }

  if (requestedParam) {
    const match = getCommitteeBySlug(requestedParam) || getCommitteeById(requestedParam);
    if (match) {
      return { slug: match.slug, name: match.name, isUniversalViewer: true, canEdit };
    }
  }

  if (isUniversalViewer && !requestedParam) {
    return { slug: 'all', name: 'Master Campus View (All Committees)', isUniversalViewer: true, canEdit };
  }

  const comm = getCommitteeById(session.roleId);
  const slug = comm ? comm.slug : 'general';
  const name = comm ? comm.name : 'Committee Desk';
  return { slug, name, isUniversalViewer: false, canEdit };
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
    const isAllTime = searchParams.get('allTime') === 'true' || searchParams.get('date') === 'all';
    const requestedDate = isAllTime ? 'all' : (searchParams.get('date') || new Date().toISOString().split('T')[0]);
    const exportCsv = searchParams.get('export') === 'csv';

    const scope = resolveCommitteeScope(session, requestedCommittee);
    const committeeId = scope.slug;

    const isCSIT = session.roleId === 'SUPER_ADMIN';
    const isHAM = session.roleId === 'MANAGEMENT';
    const isAttendanceComm = session.roleId === 'ATTENDANCE_COMMITTEE';

    // HAM is strictly READ-ONLY observatory. CSIT and Attendance Committee can edit sealed dates.
    // All other committees can mark, manage roster, and push unsealed dates.
    const operator = getOperatorFromRequest(request);
    const canEdit = isCSIT || isAttendanceComm;
    const canMark = !isHAM;

    const matchedComm = getCommitteeBySlug(committeeId) || getCommitteeById(committeeId);
    const committeeIds = committeeId === 'all' ? [] : (matchedComm ? [matchedComm.slug, matchedComm.id] : [committeeId]);

    const committeeWhere = committeeId === 'all' ? {} : { committeeId: { in: committeeIds } };
    const dateWhere = isAllTime ? {} : { date: requestedDate };

    // CSV Export Flow
    if (exportCsv) {
      const records = await prisma.committeeAttendance.findMany({
        where: {
          ...committeeWhere,
          ...dateWhere,
        },
        orderBy: [{ date: 'desc' }, { committeeId: 'asc' }, { rollNumber: 'asc' }],
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
      where: committeeWhere,
      orderBy: { rollNumber: 'asc' },
    });

    // Merge official default volunteer roster for all committees
    const defaultVolunteers = getDefaultRosterForCommittee(committeeId);
    const knownRolls = new Set(roster.map((r) => `${r.committeeId}_${r.rollNumber}`));
    for (const def of defaultVolunteers) {
      const key = `${def.committeeId}_${def.rollNumber}`;
      if (!knownRolls.has(key)) {
        roster.push(def);
        knownRolls.add(key);
      }
    }

    // 2. Fetch existing records
    const attendanceRecords = await prisma.committeeAttendance.findMany({
      where: {
        ...committeeWhere,
        ...dateWhere,
      },
      orderBy: [{ date: 'desc' }, { committeeId: 'asc' }, { rollNumber: 'asc' }],
    });

    // Synthesize roster entries if attendance records exist for unlisted members
    for (const att of attendanceRecords) {
      const key = `${att.committeeId}_${att.rollNumber}`;
      if (!knownRolls.has(key)) {
        roster.push({
          id: `syn-${att.id}`,
          committeeId: att.committeeId,
          rollNumber: att.rollNumber,
          studentName: null,
          createdAt: att.createdAt,
        });
        knownRolls.add(key);
      }
    }

    // Only real attendance records from the database are returned

    // 3. Fetch publish status
    const publishInfo = isAllTime
      ? null
      : await prisma.committeeAttendancePublish.findFirst({
          where: {
            ...committeeWhere,
            date: requestedDate,
          },
          orderBy: { publishedAt: 'desc' },
        });

    // 4. Fetch latest published date for this committee
    const latestPublish = await prisma.committeeAttendancePublish.findFirst({
      where: committeeWhere,
      orderBy: { date: 'desc' },
    });

    // 5. Fetch all published dates list for history
    const publishHistory = await prisma.committeeAttendancePublish.findMany({
      where: committeeWhere,
      orderBy: { date: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      committeeId,
      committeeName: scope.name,
      date: requestedDate,
      isAllTime,
      roster,
      attendanceRecords,
      isPublished: Boolean(publishInfo),
      publishInfo,
      latestPublishedDate: latestPublish?.date || null,
      publishHistory,
      canMark: !isHAM,
      canEdit: isCSIT || (session.roleId === 'ATTENDANCE_COMMITTEE'),
      isHAM,
      operatorType: operator?.operatorType || (isCSIT || session.roleId === 'ATTENDANCE_COMMITTEE' ? 'FACULTY' : isHAM ? 'FACULTY' : 'STUDENT'),
      operatorName: operator?.operatorName || (isHAM ? 'Higher Authority Management' : isCSIT ? 'CS&IT Administration' : session.roleId === 'ATTENDANCE_COMMITTEE' ? 'Attendance Ops Committee' : null),
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

    // Higher Authority Management is strictly read-only and CANNOT push attendance or alter rosters
    if (session.roleId === 'MANAGEMENT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission Denied: Higher Authority Management has read-only observatory access. Editing attendance is exclusive to CS&IT Administration.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, committee: requestedCommittee, rollNumber, studentName, date, entries } = body;

    const scope = resolveCommitteeScope(session, requestedCommittee);
    const committeeId = scope.slug;
    const operator = getOperatorFromRequest(request);
    const isCSIT = session.roleId === 'SUPER_ADMIN';
    const isAttendanceComm = session.roleId === 'ATTENDANCE_COMMITTEE';
    const canEdit = isCSIT || isAttendanceComm;

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

    // ─── ACTION 1B: REMOVE ROLL NUMBER FROM ROSTER ───────────────────────────
    if (action === 'REMOVE_ROLL_NUMBER') {
      if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
        return NextResponse.json(
          { success: false, error: 'Student Roll Number is required.' },
          { status: 400 }
        );
      }

      const cleanRollNo = rollNumber.trim().toUpperCase();

      // If a specific date is passed and it's sealed, only CS&IT / Attendance Committee can alter it
      if (date && typeof date === 'string') {
        const existingPublish = await prisma.committeeAttendancePublish.findUnique({
          where: {
            committeeId_date: {
              committeeId,
              date,
            },
          },
        });
        if (existingPublish && !canEdit) {
          return NextResponse.json(
            { success: false, error: `Attendance for date ${date} is already sealed. Contact CS&IT to modify.` },
            { status: 403 }
          );
        }
      }

      // 1. Remove from official roster table
      await prisma.committeeRosterMember.deleteMany({
        where: {
          committeeId,
          rollNumber: cleanRollNo,
        },
      });

      // 2. Remove any attendance records for unsealed dates so they don't get re-synthesized
      const sealedPublishes = await prisma.committeeAttendancePublish.findMany({
        where: { committeeId },
        select: { date: true },
      });
      const sealedDates = sealedPublishes.map((p) => p.date);

      if (canEdit) {
        // Super Admin / Attendance Committee can remove attendance records directly
        await prisma.committeeAttendance.deleteMany({
          where: {
            committeeId,
            rollNumber: cleanRollNo,
            ...(date ? { date } : {}),
          },
        });
      } else {
        // Regular committee removes attendance for unsealed dates only
        const whereClause: { committeeId: string; rollNumber: string; date?: any } = {
          committeeId,
          rollNumber: cleanRollNo,
        };
        if (date && !sealedDates.includes(date)) {
          whereClause.date = date;
        } else if (sealedDates.length > 0) {
          whereClause.date = { notIn: sealedDates };
        }
        await prisma.committeeAttendance.deleteMany({
          where: whereClause,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Roll number ${cleanRollNo} removed from roster.`,
      });
    }

    // ─── ACTION 2: PUSH ATTENDANCE DATA ──────────────────────────────────────
    if (action === 'PUSH_ATTENDANCE') {
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

      if (existingPublish && !canEdit) {
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

      const actorName = operator?.operatorName || (session.roleId === 'MANAGEMENT' ? 'Higher Authority Management' : session.roleId === 'SUPER_ADMIN' ? 'CS&IT Administration' : session.roleId === 'ATTENDANCE_COMMITTEE' ? 'Attendance Ops Committee' : 'Faculty Desk');
      const actorRollNo = operator?.operatorRollNo || (session.roleId === 'MANAGEMENT' ? 'MANAGEMENT-DESK' : session.roleId === 'SUPER_ADMIN' ? 'SUPERADMIN' : session.roleId === 'ATTENDANCE_COMMITTEE' ? 'ATTENDANCE-OPS' : 'FACULTY');

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

    // ─── ACTION 3: TOGGLE / UPDATE SINGLE ATTENDANCE RECORD (CS&IT & ATTENDANCE COMM) ──
    if (action === 'TOGGLE_ENTRY' || action === 'UPDATE_ENTRY') {
      if (!canEdit) {
        return NextResponse.json(
          {
            success: false,
            error: 'Permission Denied: Only CS&IT Administration and Attendance Committee can directly manipulate individual attendance entries.',
          },
          { status: 403 }
        );
      }

      const { rollNumber: targetRoll, date: targetDate, isPresent: targetPresent, committee: targetComm } = body;
      if (!targetRoll || !targetDate) {
        return NextResponse.json(
          { success: false, error: 'rollNumber and date are required.' },
          { status: 400 }
        );
      }

      const targetCommitteeId = targetComm || committeeId;
      const cleanRoll = String(targetRoll).trim().toUpperCase();

      const actorName = operator?.operatorName || (isAttendanceComm ? 'Attendance Ops Committee' : 'CS&IT Administration');
      const actorRollNo = operator?.operatorRollNo || (isAttendanceComm ? 'ATTENDANCE-OPS' : 'SUPERADMIN');

      const updated = await prisma.committeeAttendance.upsert({
        where: {
          committeeId_date_rollNumber: {
            committeeId: targetCommitteeId,
            date: targetDate,
            rollNumber: cleanRoll,
          },
        },
        create: {
          committeeId: targetCommitteeId,
          date: targetDate,
          rollNumber: cleanRoll,
          isPresent: Boolean(targetPresent),
          facultyName: actorName,
          facultyRollNo: actorRollNo,
        },
        update: {
          isPresent: Boolean(targetPresent),
          facultyName: actorName,
          facultyRollNo: actorRollNo,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Attendance for ${cleanRoll} on ${targetDate} updated to ${targetPresent ? 'PRESENT' : 'ABSENT'}.`,
        record: updated,
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
