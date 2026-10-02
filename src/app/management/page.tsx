import Navbar from '@/components/Navbar';
import ManagementDashboardView from '@/components/ManagementDashboardView';
import { getAdminMetrics, getEvents, getStageMetrics } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import UniversalCommitteeActions from '@/components/UniversalCommitteeActions';
import InternalAssessmentHub from '@/components/InternalAssessmentHub';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  LogOut,
  Building2,
  Lock,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Higher Authority & Management Observatory • FestOS v2.0',
  description: "Executive read-only festival observatory for Lingaya's Vidyapeeth Leadership and Management Trustees.",
};

export default async function ManagementPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/management');
  }

  // Only MANAGEMENT and SUPER_ADMIN can enter this executive suite
  if (session.roleId !== 'MANAGEMENT' && session.roleId !== 'SUPER_ADMIN') {
    const role = getRoleById(session.roleId);
    redirect(role?.dashboard || '/login');
  }

  const masterMetrics = await getAdminMetrics();
  const riMetrics = await getAdminMetrics({ excludeCategory: 'Informalz' });
  const informalzMetrics = await getAdminMetrics({ category: 'Informalz' });
  const stageMetrics = await getStageMetrics();
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Executive Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                Executive Leadership
              </span>
              <span className="text-xs text-slate-500 font-medium">Read-Only Observatory</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Higher Authority &amp; Management Panel
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              High-level institutional observation of festival metrics, committee attendee registries, and stage track readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-900">
                {session?.roleLabel || 'Executive Management'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-600" /> Audit &amp; View Only
              </span>
            </div>

            <a
              href="/api/auth/logout"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Log Out</span>
            </a>
          </div>
        </div>

        {/* Universal Committee Quick Action Modules */}
        <UniversalCommitteeActions />

        {/* Cross-Committee Internal Assessment Hub */}
        <InternalAssessmentHub />

        {/* Management Observatory Main Dashboard Component */}
        <ManagementDashboardView
          events={events}
          masterMetrics={masterMetrics}
          riMetrics={riMetrics}
          informalzMetrics={informalzMetrics}
          stageMetrics={stageMetrics}
        />
      </main>

      {/* Institutional Footer Notice */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>
            FestOS v2.0 • Lingaya&apos;s Vidyapeeth Campus Events &bull; Confidential Executive Access
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            All data displayed is refreshed dynamically from the unified transaction store.
          </p>
        </div>
      </footer>
    </div>
  );
}
