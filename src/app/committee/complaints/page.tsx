import React from 'react';
import Navbar from '@/components/Navbar';
import ComplaintsInbox from '@/components/ComplaintsInbox';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getCommitteeById } from '@/lib/committeeConstants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: 'Dispute & Grievances Desk • FestOS v2.0',
    description: 'Official festival dispute, misconduct, and complaint reporting channel',
  };
}

export default async function CommitteeComplaintsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/complaints');
  }

  const isCSIT = session.roleId === 'SUPER_ADMIN';
  const isGrievance = session.roleId === 'GRIEVANCES_COMMITTEE';
  const comm = getCommitteeById(session.roleId);
  const backUrl = isCSIT ? '/super-admin' : isGrievance ? '/committee/grievances' : `/committee/${comm?.slug || 'admin'}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>

        <ComplaintsInbox />
      </main>
    </div>
  );
}
