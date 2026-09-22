import Navbar from '@/components/Navbar';
import OnSpotForm from '@/components/OnSpotForm';
import { getEvents } from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export const metadata = {
  title: 'On-Spot Registration Desk • FestOS v2.0',
  description: "Rapid on-spot participant registration for Lingaya's Vidyapeeth Campus Events.",
};

export default async function OnSpotPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Desk Terminal
              </span>
              <span className="text-xs text-slate-500 font-medium">Fast-Track Mode</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              On-Spot Walk-In Counter
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Issue immediate passes for walk-in attendees with cash or desk UPI verification.
            </p>
          </div>

          <Link
            href="/checkin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Gate Check-In Console
          </Link>
        </div>

        <OnSpotForm events={events} />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • On-Spot Counter Operations
      </footer>
    </div>
  );
}
