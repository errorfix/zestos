import React from 'react';
import Navbar from '@/components/Navbar';
import InfraVendorManager from '@/components/InfraVendorManager';
import CommitteeDailyTracker from '@/components/CommitteeDailyTracker';
import { OperatorDeskBadge } from '@/components/OperatorIdentityModal';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getCommitteeBySlug } from '@/lib/committeeConstants';
import Link from 'next/link';
import {
  Truck,
  FolderOpen,
  CheckSquare,
  HelpCircle,
  AlertTriangle,
  LogOut,
  Calendar,
} from 'lucide-react';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: 'Infrastructure & Logistics Committee • FestOS v2.0',
    description: 'Vendor contracts, main stage trusses, generators, and heavy equipment logistics',
  };
}

export default async function InfraCommitteePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/infra');
  }

  // Authorization: Super Admin or Infra Committee only
  if (session.roleId !== 'SUPER_ADMIN' && session.roleId !== 'INFRA_COMMITTEE') {
    redirect('/admin');
  }

  const committee = getCommitteeBySlug('infra')!;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-zinc-700" />
                <span>Infra &amp; Logistics Ops</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Live Asset Tracking
              </span>
              {session.roleId === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Super Admin View (CS&amp;IT)
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Infrastructure &amp; Logistics Committee
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Stage fabrication, acoustics, 250kVA generators, barricades, electrical grids, and vendor contract tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <OperatorDeskBadge />

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </a>
          </div>
        </div>

        {/* Quick Universal Committee Action Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-600">
            Quick Operations Modules:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/committee/attendance?committee=infra"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Attendance Sheet</span>
            </Link>

            <Link
              href="/committee/doc-stor?committee=infra"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Document Vault</span>
            </Link>

            <Link
              href="/committee/help"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>May I Help You</span>
            </Link>

            <Link
              href="/committee/complaints"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Complaints</span>
            </Link>
          </div>
        </div>

        {/* Vendor Manager Section */}
        <section className="space-y-4">
          <InfraVendorManager />
        </section>

        {/* Daily Tracking Section */}
        <section className="space-y-4">
          <CommitteeDailyTracker
            committeeId="INFRA_COMMITTEE"
            committeeName="Infrastructure & Logistics Committee"
            themeColor={committee.color}
          />
        </section>
      </main>
    </div>
  );
}
