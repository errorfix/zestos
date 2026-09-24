import React from 'react';
import Navbar from '@/components/Navbar';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { getCommitteeBySlug, getAllowedCategoriesForCommittee } from '@/lib/committeeFlags';
import { getAllRegistrations, getEvents } from '@/lib/db';
import Link from 'next/link';
import {
  Users,
  Trophy,
  CheckCircle2,
  Calendar,
  LogOut,
  Camera,
  Layers,
  Sparkles,
  Music,
  Flame,
  Gamepad2,
  BookOpen,
  Drama,
  ShieldCheck,
  Tag,
  Radio,
} from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const committee = getCommitteeBySlug(slug);
  if (!committee) return { title: 'Committee Portal • FestOS v2.0' };
  return {
    title: `${committee.name} • FestOS v2.0`,
    description: committee.description,
  };
}

export default async function CommitteePortalPage({ params }: PageProps) {
  const { slug } = await params;
  const committee = getCommitteeBySlug(slug);
  if (!committee) {
    notFound();
  }

  // Authentication check
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect(`/login?next=/committee/${slug}`);
  }

  // Committee authorization: Super Admin or this committee only
  if (session.roleId !== 'SUPER_ADMIN' && session.roleId !== committee.id) {
    const roleDef = getRoleById(session.roleId);
    redirect(roleDef?.dashboard || '/admin');
  }

  // Fetch currently enabled categories for this committee from dynamic flags system
  const allowedCategories = getAllowedCategoriesForCommittee(committee.id);

  // Fetch metrics for allowed categories
  const allRegs = await getAllRegistrations();
  const allEvents = await getEvents();

  const allowedCategoriesLower = allowedCategories.map((c) => c.toLowerCase());
  const committeeEvents = allEvents.filter((e) =>
    allowedCategoriesLower.includes(e.category.toLowerCase())
  );
  const committeeEventIds = new Set(committeeEvents.map((e) => e.id));

  const committeeRegs = allRegs.filter((r) => committeeEventIds.has(r.eventId));
  const paidRegs = committeeRegs.filter((r) => r.status === 'PAID');

  let totalTickets = 0;
  let checkedInTickets = 0;
  let totalTeamMembers = 0;

  for (const reg of committeeRegs) {
    totalTickets += reg.tickets?.length || 0;
    totalTeamMembers += reg.teamMembers?.length || 0;
    checkedInTickets += (reg.tickets || []).filter((t) => t.status === 'CHECKED_IN').length;
  }

  const hasTrackSupport = committeeEvents.some((e) => e.requiresTrackUpload === true);

  // Icon selector
  const getCommitteeIcon = () => {
    switch (committee.slug) {
      case 'music':
        return <Music className="w-5 h-5 text-violet-600" />;
      case 'dance':
        return <Flame className="w-5 h-5 text-pink-600" />;
      case 'fashion':
        return <Sparkles className="w-5 h-5 text-fuchsia-600" />;
      case 'theatre':
        return <Drama className="w-5 h-5 text-amber-600" />;
      case 'literary':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'gaming':
        return <Gamepad2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${committee.color.badgeBg} ${committee.color.badgeText} border ${committee.color.border} flex items-center gap-1.5`}
              >
                {getCommitteeIcon()}
                <span>{committee.badge}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Live Dynamic Sync
              </span>
              {session.roleId === 'SUPER_ADMIN' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Super Admin View
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {committee.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {committee.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end pr-2 text-right">
              <span className="text-xs font-bold text-slate-800">
                {session?.roleLabel}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Authorized Terminal
              </span>
            </div>

            <Link
              href="/checkin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Participant Check-In</span>
            </Link>

            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </a>
          </div>
        </div>

        {/* Dynamic SuperAdmin Flags Notice Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${committee.color.iconBg}`}>
              <Tag className={`w-4 h-4 ${committee.color.text}`} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Current Event Type Permissions (Super Admin Flags)
              </span>
              <span className="text-xs text-slate-500">
                This panel dynamically aggregates participants from all enabled event categories below.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allowedCategories.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{cat}</span>
              </span>
            ))}
            {allowedCategories.length === 0 && (
              <span className="text-xs text-rose-600 font-semibold">
                No event categories enabled by Super Admin yet.
              </span>
            )}
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Entries</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {committeeRegs.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Active Events</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {committeeEvents.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Paid &amp; Confirmed</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {paidRegs.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Gate Checked-In</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {checkedInTickets}{' '}
                <span className="text-xs font-bold text-slate-400">/ {totalTickets}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Committee Participant Registry Table */}
        <section className="space-y-4">
          <AdminRegistrationsTable
            apiEndpoint={`/api/admin/registrations?committee=${committee.id}`}
            title={`${committee.name} • Participant Roster`}
            subtitle={`Real-time participant rosters for ${allowedCategories.join(', ')} with attendee photos, team members, contact numbers, and security QR pass verification.`}
          />
        </section>

        {/* Audio / Track Cues Management if this committee has performance track events */}
        {hasTrackSupport && (
          <section className="space-y-4 pt-4">
            <StageRegistrationsManager
              apiEndpoint={`/api/stage/tracks?category=${encodeURIComponent(committee.defaultCategories[0] || 'Music')}`}
              title={`${committee.name} • Audio Tracks & Stage Cues`}
              subtitle={`Direct access to audio track links, Google Drive submissions, sound cues, and performance notes for ${committee.name}.`}
              allowEdit={true}
            />
          </section>
        )}
      </main>
    </div>
  );
}
