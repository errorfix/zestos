import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import CollegeRegistrationForm from '@/components/CollegeRegistrationForm';
import { getEvents } from '@/lib/db';
import { ArrowLeft, ArrowRight, Building2, User } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export const metadata = {
  title: 'College Contingent Registration • ZEST 2026',
  description: "Official inter-college contingent and university delegation entry portal for Lingaya's Vidyapeeth ZEST 2026.",
};

interface PageProps {
  searchParams?: Promise<{ event?: string; category?: string }>;
}

export default async function RegistrationPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;

  // Forward event-specific queries to individual registration
  if (sp?.event || sp?.category) {
    const params = new URLSearchParams();
    if (sp.event) params.set('event', sp.event);
    if (sp.category) params.set('category', sp.category);
    redirect(`/registration/individual?${params.toString()}`);
  }

  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
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

            {/* Top right button to navigate to Individual Registration */}
            <Link
              href="/registration/individual"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs hover:shadow focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Individual Registration</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold w-fit">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>College &amp; University Contingents</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              College Contingent Registration
            </h1>
            <p className="text-sm text-slate-500">
              Register official college delegations, build multi-event squad rosters, and get tiered passes.
            </p>
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
