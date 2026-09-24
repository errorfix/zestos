import Navbar from '@/components/Navbar';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import { getStageMetrics, getEvents } from '@/lib/db';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import Link from 'next/link';
import {
  Mic2,
  Music,
  CheckCircle2,
  AlertTriangle,
  Camera,
  LogOut,
  Radio,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Stage Committee Portal • FestOS v2.0',
  description: "Stage & AV Sound Engineering console for Lingaya's Vidyapeeth Campus Events 2026.",
};

export default async function StageCommitteePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  const metrics = await getStageMetrics();
  const allEvents = await getEvents();
  const trackEvents = allEvents.filter((e) => e.requiresTrackUpload === true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Mic2 className="w-3.5 h-3.5 text-amber-600" />
                Stage &amp; AV Operations Hub
              </span>
              <span className="text-xs text-slate-500 font-medium">Live Audio Console</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Stage Committee Portal
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Strictly monitors all performance track events, audio links, sound cues, and manual track submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.roleLabel || 'Stage Committee'}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Stage Control Terminal
              </span>
            </div>

            <a
              href="https://drive.google.com/drive/folders/1ORiYoFawuMWA0fOST-qfO2uBvEEZxTOE?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
            >
              <Music className="w-3.5 h-3.5 text-amber-700" />
              <span>Official Drive</span>
              <ExternalLink className="w-3 h-3 text-amber-600" />
            </a>

            <Link
              href="/checkin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Performer Check-In</span>
            </Link>

            <Link
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Link>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Track Performers
              </span>
              <Mic2 className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalTrackRegistrations}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              Registered in Stage Events
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tracks Ready
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block">
              {metrics.tracksAttached}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1">
              Audio links submitted &amp; ready
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Required
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 block">
              {metrics.tracksMissing}
            </span>
            <span className="text-[11px] text-rose-700 font-medium block mt-1">
              {metrics.tracksMissing > 0 ? 'Tracks missing (add manually)' : 'All tracks verified!'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stage Events
              </span>
              <Radio className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {metrics.totalTrackEvents}
            </span>
            <span className="text-[11px] text-purple-600 font-medium block mt-1">
              Music, Dance, Drama &amp; Fashion
            </span>
          </div>
        </div>

        {/* Section: Stage Tracks Manager Table & Manual Upload */}
        <section>
          <StageRegistrationsManager
            apiEndpoint="/api/stage/tracks"
            title="Performer Stage Roster &amp; Audio Tracks"
            subtitle="Live feed of participants in track-required events. Click 'Open Audio Track' to preview or use 'Add Track' for manual submissions."
            allowEdit={true}
          />
        </section>

        {/* Section: Stage & AV Production Reference */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Stage Operator Audio Checklist</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-600" />
                1. Cloud Track Playback
              </span>
              <p>
                Click &quot;Open Audio Track&quot; 10 minutes before the performer&apos;s call time to test audio clarity and ensure Google Drive sharing permissions are valid.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                2. Sound &amp; Light Cues
              </span>
              <p>
                Check the &quot;Audio / Stage Cues&quot; section on each row for entry cues, track timestamps, sound fade-outs, and spot-light transitions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                3. On-Spot Track Collection
              </span>
              <p>
                If a performer arrives with a pendrive or new Google Drive link, use the &quot;+ Manual Track Add&quot; button to attach their track and notes directly to their registration.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Lingaya&apos;s Vidyapeeth FestOS v2.0 • Stage &amp; AV Committee Hub
      </footer>
    </div>
  );
}
