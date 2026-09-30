import React from 'react';
import Navbar from '@/components/Navbar';
import MayIHelpYou from '@/components/MayIHelpYou';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getCommitteeById } from '@/lib/committeeConstants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: 'May I Help You • FestOS v2.0',
    description: 'Committee help desk and urgent operational dispatch console',
  };
}

export default async function CommitteeHelpPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/help');
  }

  const isCSIT = session.roleId === 'SUPER_ADMIN';
  const isControls = session.roleId === 'MANAGEMENT';
  const comm = getCommitteeById(session.roleId);
  const backUrl = isCSIT ? '/super-admin' : isControls ? '/management' : `/committee/${comm?.slug || 'admin'}`;

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

        <MayIHelpYou />
      </main>
    </div>
  );
}
