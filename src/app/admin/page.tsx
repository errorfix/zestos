import Navbar from '@/components/Navbar';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import { getAdminMetrics, getEvents } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  IndianRupee,
  Scan,
  Calendar,
  Banknote,
  Camera,
  LogOut,
  ShieldCheck,
  MapPin,
  Clock,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'R&I Committee Panel • FestOS v2.0',
  description: "Registration & Invitation Committee dashboard for Lingaya's Vidyapeeth Campus Events.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  const metrics = await getAdminMetrics({ excludeCategory: 'Informalz' });
  const allEvents = await getEvents();
  const events = allEvents.filter((e) => e.category !== 'Informalz');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                R&I Committee Console
              </span>
              <span className="text-xs text-slate-500 font-medium">Real-Time Sync</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Registration & Invitation Committee Hub
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor registrations, audit attendee passes, and manage gate check-ins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.roleLabel || 'R&I Committee'}
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
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              View Only
            </span>
          </div>
        </div>

        {/* Section 1: Read-Only Event Overview */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[#1a73e8]" />
            <h2 className="text-xl font-bold text-slate-900">Events Overview</h2>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              Read Only
            </span>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No events configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {event.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        event.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p className="font-medium text-slate-600">{event.category}</p>
                    <p>{event.eventType} • ₹{(event.feeAmount / 100).toFixed(0)}</p>
                    {event.venue && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </p>
                    )}
                    {event.date && (
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Master Attendee Registry & CSV */}
        <section>
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?excludeCategory=informalz"
            title="R&I Attendee Registry"
            subtitle="R&I Committee registrations, ticket passes, stage track assets, and payment records (excludes Informalz)."
          />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Registration & Invitation Committee
      </footer>
    </div>
  );
}

