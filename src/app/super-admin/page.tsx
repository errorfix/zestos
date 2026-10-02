import Navbar from '@/components/Navbar';
import SuperAdminView from '@/components/SuperAdminView';
import { getAdminMetrics, getEvents, getStageMetrics } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { OperatorDeskBadge } from '@/components/OperatorIdentityModal';
import UniversalCommitteeActions from '@/components/UniversalCommitteeActions';
import InternalAssessmentHub from '@/components/InternalAssessmentHub';
import Link from 'next/link';
import {
  LogOut,
  Crown,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Super Admin Panel (CS&IT Committee) • FestOS v2.0',
  description: "Master control panel for Lingaya's Vidyapeeth Campus Events handled by CS&IT Committee.",
};

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  const masterMetrics = await getAdminMetrics();
  const riMetrics = await getAdminMetrics({ excludeCategory: 'Informalz' });
  const informalzMetrics = await getAdminMetrics({ category: 'Informalz' });
  const stageMetrics = await getStageMetrics();
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Super Admin Console
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                CS&amp;IT Committee Core
              </span>
              <span className="text-xs text-slate-500 font-medium">Full Access</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Master Festival Control Panel
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Handled by CS&amp;IT Committee. Universal oversight of registrations, revenue, gate check-in, vendor contracts, complaints tribunal, and committee flags.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <OperatorDeskBadge />

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </a>
          </div>
        </div>

        {/* Universal CS&IT Operations Quick Action Bar */}
        <UniversalCommitteeActions />

        {/* Cross-Committee Internal Assessment Hub */}
        <InternalAssessmentHub />

        {/* Dynamic Super Admin View with Isolated Committee Switcher */}
        <SuperAdminView
          events={events}
          masterMetrics={masterMetrics}
          riMetrics={riMetrics}
          informalzMetrics={informalzMetrics}
          stageMetrics={stageMetrics}
        />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Super Admin Master Control
      </footer>
    </div>
  );
}
