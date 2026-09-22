import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import RegistrationForm from '@/components/RegistrationForm';
import { getEvents } from '@/lib/db';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function RegisterPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="max-w-4xl mx-auto mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1a73e8] transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Event Catalog
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Registration & Passes
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Fill in your team details. Form state is saved in real-time to prevent accidental draft loss.
          </p>
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
