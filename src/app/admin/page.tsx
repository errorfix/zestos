import Navbar from '@/components/Navbar';
import AdminEventsManager from '@/components/AdminEventsManager';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import { getAdminMetrics, getEvents } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  IndianRupee,
  Scan,
  Ticket,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Banknote,
  Camera,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Committee Admin Panel • FestOS v2.0',
  description: "Organizing & Registration Committee dashboard for Lingaya's Vidyapeeth Campus Events.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  const metrics = await getAdminMetrics();
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                Central Operations Console
              </span>
              <span className="text-xs text-slate-500 font-medium">Real-Time Sync</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Registration & Organizing Committee Hub
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage competition rules, monitor collections, audit attendee passes, and inspect gate check-ins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.email || 'admin@zest.lingayas.edu.in'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Authenticated Staff
              </span>
            </div>

            <Link
              href="/onspot"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Banknote className="w-3.5 h-3.5 text-blue-600" />
              <span>On-Spot Desk</span>
            </Link>

            <Link
              href="/checkin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Gate Scanner</span>
            </Link>

            <Link
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Link>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Registrations
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalRegistrations}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              {metrics.paidRegistrations} Confirmed Paid
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Revenue Collected
              </span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              ₹{metrics.totalRevenueInr.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Razorpay + Desk Cash
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Gate Checked In
              </span>
              <Scan className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalCheckedInTickets}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              of {metrics.totalIssuedTickets} issued passes ({metrics.checkInPercentage}%)
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Events
              </span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalEvents}
            </span>
            <span className="text-[11px] text-blue-600 font-medium block mt-1">
              Editable in Real-Time
            </span>
          </div>
        </div>

        {/* Section 1: Event Management & Live Editing */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <AdminEventsManager initialEvents={events} />
        </section>

        {/* Section 2: Master Attendee Registry & CSV */}
        <section>
          <AdminRegistrationsTable />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Organizing & Registration Committee Central System
      </footer>
    </div>
  );
}
