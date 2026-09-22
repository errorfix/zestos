import Navbar from '@/components/Navbar';
import CheckInScanner from '@/components/CheckInScanner';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Gate Check-In Console • FestOS v2.0',
  description: "Offline-capable gate security console for Lingaya's Vidyapeeth Campus Events.",
};

export default function CheckInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Committee Gate Terminal
              </span>
              <span className="text-xs text-slate-500 font-medium">Replay Protected</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Gate Entry & Check-In Console
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Verify attendee QR codes and prevent unauthorized entry with cryptographic HMAC-SHA256 signatures.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Go to Admin Dashboard
          </Link>
        </div>

        <CheckInScanner />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Gate Security & Entry Operations
      </footer>
    </div>
  );
}
