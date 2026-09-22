import Link from 'next/link';
import { getEvents } from '@/lib/db';
import EventCard from '@/components/EventCard';
import Navbar from '@/components/Navbar';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Ticket,
  ArrowRight,
  Database,
  Lock,
  Users,
} from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FestOS v2.0 • High-Velocity Campus Event Operating System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Lingaya&apos;s Vidyapeeth <br />
              <span className="text-[#1a73e8]">Campus Events 2026</span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Automated, zero-downtime registration and payment pipeline. Built with
              cryptographic passes, aggressive draft persistence, and instant entry verification.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              >
                <span>Register for Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#events-catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                <span>Explore Catalog</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Zero Downtime</h4>
              <p className="text-[11px] text-slate-500">1,000+ Concurrent checkouts</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Pass Cryptography</h4>
              <p className="text-[11px] text-slate-500">HMAC-SHA256 Signed QR</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">State Persistence</h4>
              <p className="text-[11px] text-slate-500">100% draft recovery on app switch</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Razorpay Verified</h4>
              <p className="text-[11px] text-slate-500">Tamper-proof webhook truth</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Catalog */}
      <main id="events-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
              Official Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Active Events & Competitions
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select solo or team events. Dynamic slots and fee calculations apply automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Showing {events.length} Competitions
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">
              FestOS v2.0 • Lingaya&apos;s Vidyapeeth Campus Events
            </p>
            <p className="mt-0.5">Engineered by Anuj Kumar Thakur</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Engine Online
            </span>
            <Link
              href="/admin"
              className="text-slate-600 hover:text-[#1a73e8] font-medium transition-colors"
            >
              Committee Portal (Staff Login)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
