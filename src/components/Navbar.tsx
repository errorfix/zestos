import Link from 'next/link';
import { Calendar, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            F2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 tracking-tight">FestOS</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Lingaya&apos;s Vidyapeeth Events</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Events</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Register Now</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
