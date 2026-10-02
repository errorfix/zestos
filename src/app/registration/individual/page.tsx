import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import RegistrationForm from '@/components/RegistrationForm';
import { getEvents } from '@/lib/db';
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export const metadata = {
  title: 'Individual Event Registration & Passes • ZEST 2026',
  description: "Official individual event registration and entry passes portal for Lingaya's Vidyapeeth ZEST 2026.",
};

export default async function IndividualRegisterPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1a73e8] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Event Catalog
            </Link>

            <Link
              href="/registration"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400 text-xs font-bold transition shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>College Registration</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Event Registration &amp; Passes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Individual and team registrations for cultural, literary, technical, gaming, and informalz events.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto p-12 bg-white rounded-3xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">Loading Registration Engine...</p>
            </div>
          }
        >
          <RegistrationForm events={events} />
        </Suspense>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Offline-Ready Concurrency-Safe Engine
      </footer>
    </div>
  );
}
