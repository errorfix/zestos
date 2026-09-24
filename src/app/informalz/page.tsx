import Navbar from '@/components/Navbar';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import { getAdminMetrics, getEvents } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  Sparkles,
  Scan,
  Calendar,
  Camera,
  LogOut,
  MapPin,
  Clock,
  PartyPopper,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Informalz Committee Panel • FestOS v2.0',
  description: "Informalz Committee dashboard for Lingaya's Vidyapeeth Campus Events 2026.",
};

export default async function InformalzAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  const metrics = await getAdminMetrics({ category: 'Informalz' });
  const allEvents = await getEvents();
  const informalzEvents = allEvents.filter(
    (e) => e.category.toLowerCase() === 'informalz'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <PartyPopper className="w-3 h-3 text-purple-600" />
                Informalz Committee Console
              </span>
              <span className="text-xs text-slate-500 font-medium">100% Free Campus Fun</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Informalz & Fun Events Hub
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Oversee informal activities, track free multi-event participants, and audit gate entries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.roleLabel || 'Informalz Committee'}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Authenticated Committee
              </span>
            </div>

            <Link
              href="/checkin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Gate Check-In</span>
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
                Informal Registrations
              </span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalRegistrations}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              {metrics.paidRegistrations} Confirmed Passes
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Participation Fee
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block">
              FREE (₹0)
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Unlimited Participation
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
              of {metrics.totalIssuedTickets} passes ({metrics.checkInPercentage}%)
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Informal Events
              </span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {informalzEvents.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Under Informal Committee
            </span>
          </div>
        </div>

        {/* Section 1: Informalz Events Overview */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-900">Informalz Events Catalog</h2>
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% Free Entry
            </span>
          </div>

          {informalzEvents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No informal events configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {informalzEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-purple-100 bg-purple-50/20 rounded-2xl p-4 hover:shadow-sm hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {event.title}
                    </h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      FREE
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  )}
                  <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <p className="font-medium text-purple-700">
                      {event.eventType} {event.eventType === 'Team' ? `(${event.minTeamSize}-${event.maxTeamSize} members)` : '(Solo)'}
                    </p>
                    {event.venue && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {event.venue}
                      </p>
                    )}
                    {event.date && (
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {event.date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Informalz Attendee Registry */}
        <section>
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=informalz"
            title="Informalz Attendee Registry"
            subtitle="Search across attendee names, college emails, informal passes, and gate check-in status."
          />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Informalz Committee Hub
      </footer>
    </div>
  );
}
