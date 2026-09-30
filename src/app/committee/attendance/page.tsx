import React from 'react';
import Navbar from '@/components/Navbar';
import AttendanceSheet from '@/components/AttendanceSheet';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug, COMMITTEE_METAS } from '@/lib/committeeConstants';
import Link from 'next/link';
import { ArrowLeft, CheckSquare, ShieldCheck, Download } from 'lucide-react';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: 'Committee Attendance Stream • FestOS v2.0',
    description: 'Faculty-verified student roll call and attendance tracking',
  };
}

interface PageProps {
  searchParams: Promise<{ committee?: string; date?: string }>;
}

export default async function CommitteeAttendancePage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/attendance');
  }

  const { committee: requestedSlug, date } = await searchParams;

  const isCSIT = session.roleId === 'SUPER_ADMIN';
  const isControls = session.roleId === 'MANAGEMENT';
  const isAttendanceComm = session.roleId === 'ATTENDANCE_COMMITTEE';
  const isUniversalViewer = isCSIT || isControls || isAttendanceComm;

  let activeSlug = 'admin';
  let activeName = 'Registration Committee';

  if (isUniversalViewer) {
    if (requestedSlug) {
      const match = getCommitteeBySlug(requestedSlug) || getCommitteeById(requestedSlug);
      if (match) {
        activeSlug = match.slug;
        activeName = match.name;
      } else {
        activeSlug = requestedSlug.toLowerCase();
        activeName = requestedSlug;
      }
    } else {
      activeSlug = 'dance';
      activeName = 'Cultural Dance Committee';
    }
  } else {
    // Normal committee locked to own
    const comm = getCommitteeById(session.roleId);
    if (comm) {
      activeSlug = comm.slug;
      activeName = comm.name;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Header & Return Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={isCSIT ? '/super-admin' : isControls ? '/management' : isAttendanceComm ? '/committee/attendance-ops' : `/committee/${activeSlug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {session.roleId === 'SUPER_ADMIN' ? 'Super Admin' : isControls ? 'Management Console' : `${activeName} Panel`}</span>
          </Link>

          {isUniversalViewer && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Switch Committee:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COMMITTEE_METAS.slice(0, 10).map((c) => (
                  <Link
                    key={c.id}
                    href={`/committee/attendance?committee=${c.slug}${date ? `&date=${date}` : ''}`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      activeSlug === c.slug
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.badge}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Embedded Attendance Sheet Component */}
        <AttendanceSheet committeeSlug={activeSlug} committeeName={activeName} />
      </main>
    </div>
  );
}
