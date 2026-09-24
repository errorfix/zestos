import Navbar from '@/components/Navbar';
import CheckInTerminalWrapper from '@/components/CheckInTerminalWrapper';
import { ShieldCheck, Lock } from 'lucide-react';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, hasPermission } from '@/lib/auth';

export const metadata = {
  title: 'Gate Camera Check-In Terminal • ZEST 2K26',
  description: "Attendee identity & pass verification terminal for Lingaya's Vidyapeeth ZEST 2K26.",
};

export default async function CheckInPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(sessionToken);
  const isAuthorized = !!(session && hasPermission(session, 'access_checkin'));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Terminal Header — Isolated from R&I / Financials */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Gate Security Terminal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Password Protected • HMAC-SHA256</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Attendee Camera Check-In Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Inspect participant photo ID badges, verify registration details, and admit attendees or place them on waitlist.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 shrink-0">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700">Isolated Terminal View</span>
          </div>
        </div>

        {/* Password Protected Terminal Wrapper */}
        <CheckInTerminalWrapper
          initialAuthenticated={isAuthorized}
          initialRoleLabel={session?.roleLabel}
        />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth ZEST 2K26 • Gate Entry & Camera Verification Console
      </footer>
    </div>
  );
}
