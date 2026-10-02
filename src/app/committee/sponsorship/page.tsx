import React from 'react';
import Navbar from '@/components/Navbar';
import SponsorshipManager from '@/components/SponsorshipManager';
import CommitteeDailyTracker from '@/components/CommitteeDailyTracker';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Handshake,
  LogOut,
  ShieldCheck,
  Briefcase,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Sponsorship & Brand Partnerships • FestOS v2.0',
  description: "Corporate sponsorship deal flow, brand pitching, MoUs, and deliverables console for Lingaya's Vidyapeeth FestOS.",
};

export default async function SponsorshipCommitteePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/sponsorship');
  }

  // Only SPONSORSHIP_COMMITTEE, SUPER_ADMIN, and MANAGEMENT can enter
  if (
    session.roleId !== 'SPONSORSHIP_COMMITTEE' &&
    session.roleId !== 'SUPER_ADMIN' &&
    session.roleId !== 'MANAGEMENT'
  ) {
    const roleDef = getRoleById(session.roleId);
    redirect(roleDef?.dashboard || '/login');
  }

  const isSuperAdmin = session.roleId === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Corporate Partnerships Core</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Brand Deals &amp; MoUs</span>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Super Admin Full Access
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sponsorship &amp; Corporate Partnerships Hub
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Track company outreach, pitch deck submissions, verbal commitments, signed MoUs, and partnership deliverables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.roleLabel}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Corporate Terminal
              </span>
            </div>

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </a>
          </div>
        </div>

        {/* Brand Outreach & Deals Pipeline Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Handshake className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Brand Outreach &amp; Sponsorship Deals Pipeline</h2>
          </div>
          <SponsorshipManager allowEdit={true} isSuperAdmin={isSuperAdmin} />
        </section>

        {/* Daily Tracking (Heads & Subheads) Section */}
        <section className="space-y-4 pt-4">
          <CommitteeDailyTracker
            committeeId="SPONSORSHIP_COMMITTEE"
            committeeName="Sponsorship & Corporate Partnerships Committee"
          />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Sponsorship &amp; Corporate Partnerships Committee
      </footer>
    </div>
  );
}
