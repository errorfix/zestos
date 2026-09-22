import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TicketPass, { TicketPassData } from '@/components/TicketPass';
import { getRegistrationDetails } from '@/lib/db';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Ticket as TicketIcon,
} from 'lucide-react';

export const revalidate = 0;

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const registration = await getRegistrationDetails(id);

  if (!registration) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center flex-1">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Registration Not Found</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            We couldn&apos;t locate registration reference &quot;{id}&quot;. It might still be processing or was not finalized.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1a73e8] text-white hover:bg-[#1557b0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  const eventTitle = registration.event?.title || 'Campus Event';
  const eventCategory = registration.event?.category || 'General';
  const eventVenue = registration.event?.venue || "Lingaya's Vidyapeeth Campus";
  const eventDate = registration.event?.date || 'March 2026';

  const ticketPasses: TicketPassData[] = registration.tickets.map((t) => ({
    id: t.id,
    ticketCode: t.ticketCode,
    status: t.status,
    securityHash: t.securityHash,
    fullName: t.fullName || registration.leadName,
    leadEmail: registration.leadEmail,
    eventTitle,
    eventCategory,
    eventDate,
    eventVenue,
    dayOption: registration.dayOption,
    trackUploadUrl: registration.trackUploadUrl,
    trackNotes: registration.trackNotes,
    requiresTrackUpload: registration.event?.requiresTrackUpload,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Success Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Payment Confirmed • Registration Completed
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                  Your Digital Passes Are Ready
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 block">Registration Reference</span>
              <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                {registration.id}
              </code>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1a73e8]" />
              <span>
                Event: <strong className="text-slate-900">{eventTitle}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{eventVenue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{eventDate}</span>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Entry Passes ({ticketPasses.length})
            </h2>
            <p className="text-xs text-slate-500">
              Each pass has an offline-verifiable HMAC-SHA256 signature for gate security.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1a73e8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Event Catalog
          </Link>
        </div>

        {/* List of Passes */}
        <div className="space-y-6">
          {ticketPasses.map((pass) => (
            <TicketPass key={pass.id} ticket={pass} />
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Offline Gate Validation Ready
      </footer>
    </div>
  );
}
