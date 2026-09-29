import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import CollegeRegistrationForm from '@/components/CollegeRegistrationForm';
import { getEvents } from '@/lib/db';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export const metadata = {
  title: 'College Contingent Registration • ZEST 2026',
  description: "Official inter-college contingent and university delegation entry portal for Lingaya's Vidyapeeth ZEST 2026.",
};

export default async function CollegeRegisterPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch to Individual Event Registration
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-800" />
            <span>Dedicated University &amp; Institute Entry Desk</span>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
              <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">Loading Contingent Registration Engine...</p>
            </div>
          }
        >
          <CollegeRegistrationForm events={events} />
        </Suspense>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Inter-College Contingent Registration Engine
      </footer>
    </div>
  );
}
