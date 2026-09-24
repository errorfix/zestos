import Navbar from '@/components/Navbar';
import SuperAdminView from '@/components/SuperAdminView';
import { getAdminMetrics, getEvents, getStageMetrics } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Banknote,
  Camera,
  LogOut,
  Crown,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Super Admin Panel • FestOS v2.0',
  description: "Master control panel for Lingaya's Vidyapeeth Campus Events.",
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-700/50">
                Super Admin Console
              </span>
              <span className="text-xs text-slate-500 font-medium">Full Access</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Master Control Panel
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, edit, and manage all events. Full oversight of registrations, revenue, and gate operations across committees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-white">
                {session?.roleLabel || 'Super Admin'}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" /> Elevated Privileges
              </span>
            </div>

            <Link
              href="/onspot"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors shadow-xs"
            >
              <Banknote className="w-3.5 h-3.5 text-blue-400" />
              <span>On-Spot Desk</span>
            </Link>

            <Link
              href="/checkin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Gate Scanner</span>
            </Link>

            <Link
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-950/60 border border-red-800/50 text-red-400 hover:bg-red-950 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Super Admin View with Isolated Committee Switcher */}
        <SuperAdminView
          events={events}
          masterMetrics={masterMetrics}
          riMetrics={riMetrics}
          informalzMetrics={informalzMetrics}
          stageMetrics={stageMetrics}
        />
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Super Admin Master Control
      </footer>
    </div>
  );
}
