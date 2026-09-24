'use client';

import React, { useState } from 'react';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import AuditLogsViewer from '@/components/AuditLogsViewer';
import { InitialEventData } from '@/lib/mockEvents';
import {
  Users,
  IndianRupee,
  Scan,
  Calendar,
  Sparkles,
  Trophy,
  PartyPopper,
  Layers,
  CheckCircle2,
  Mic2,
  Music,
  Flame,
  Gamepad2,
  BookOpen,
  Drama,
  Eye,
  ShieldCheck,
  RefreshCw,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';

interface MetricsData {
  totalRegistrations: number;
  paidRegistrations: number;
  totalRevenueInr: number;
  totalIssuedTickets: number;
  totalCheckedInTickets: number;
  checkInPercentage: number;
  totalEvents: number;
}

interface StageMetricsData {
  totalTrackRegistrations: number;
  tracksAttached: number;
  tracksMissing: number;
  totalTrackEvents: number;
  totalPerformers: number;
  checkedInPerformers: number;
}

interface ManagementDashboardViewProps {
  events: InitialEventData[];
  masterMetrics: MetricsData;
  riMetrics: MetricsData;
  informalzMetrics: MetricsData;
  stageMetrics?: StageMetricsData;
}

export type ManagementWorkspaceTab =
  | 'ALL'
  | 'AUDIT_LOGS'
  | 'RI'
  | 'MUSIC'
  | 'DANCE'
  | 'FASHION'
  | 'THEATRE'
  | 'LITERARY'
  | 'GAMING'
  | 'INFORMALZ'
  | 'STAGE'
  | 'EVENTS';

export default function ManagementDashboardView({
  events,
  masterMetrics,
  riMetrics,
  informalzMetrics,
  stageMetrics,
}: ManagementDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<ManagementWorkspaceTab>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      window.location.reload();
    }, 600);
  };

  const informalzCount = events.filter((e) => e.category.toLowerCase() === 'informalz').length;
  const riCount = events.filter((e) => e.category.toLowerCase() !== 'informalz').length;
  const trackCount = events.filter((e) => e.requiresTrackUpload === true).length;
  const musicCount = events.filter((e) => e.category.toLowerCase().includes('music')).length;
  const danceCount = events.filter((e) => e.category.toLowerCase().includes('dance')).length;
  const fashionCount = events.filter((e) => e.category.toLowerCase().includes('fashion')).length;
  const theatreCount = events.filter((e) => e.category.toLowerCase().includes('theatre')).length;
  const literaryCount = events.filter((e) => e.category.toLowerCase().includes('literary')).length;
  const gamingCount = events.filter((e) => e.category.toLowerCase().includes('gaming')).length;

  return (
    <div className="space-y-8">
      {/* Executive Security & Observational Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" /> Read-Only Mode
              </span>
              <span className="text-xs text-slate-400">Live Campus Observation</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Higher Authority &amp; Management Observatory
            </h3>
            <p className="text-xs text-slate-400">
              Complete cross-committee visibility of registrations, revenues, audio cues, and gate attendance with strict data protection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Last Synced</span>
            <span className="text-xs text-slate-300 font-mono">{lastRefreshed}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Registrations */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {masterMetrics.totalRegistrations}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
            {masterMetrics.paidRegistrations} Confirmed Passes
          </span>
        </div>

        {/* 2. Revenue */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            ₹{masterMetrics.totalRevenueInr.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            Razorpay + Cash Desks
          </span>
        </div>

        {/* 3. Gate Check-ins */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gate Attendance</span>
            <Scan className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {masterMetrics.checkInPercentage}%
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            {masterMetrics.totalCheckedInTickets} / {masterMetrics.totalIssuedTickets} scanned
          </span>
        </div>

        {/* 4. Tracks Attached */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stage Sound Tracks</span>
            <Mic2 className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {stageMetrics?.tracksAttached || 0}
          </span>
          <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
            {stageMetrics?.tracksMissing || 0} missing to collect
          </span>
        </div>

        {/* 5. Active Events */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Events</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {events.length}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            {riCount} Comp • {informalzCount} Free
          </span>
        </div>

        {/* 6. Performers */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Performers</span>
            <Trophy className="w-4 h-4 text-fuchsia-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">
            {stageMetrics?.totalPerformers || 0}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            Registered on Stage
          </span>
        </div>
      </div>

      {/* Committee Observatory Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Committee Observatory Stream
          </span>
          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Full Festival Read-Only Audit
          </span>
        </div>

        {/* Main Tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal All */}
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md ring-2 ring-white/10'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-300" />
            <span>Master Registry</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200">
              {masterMetrics.totalRegistrations}
            </span>
          </button>

          {/* Cultural Music */}
          <button
            type="button"
            onClick={() => setActiveTab('MUSIC')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'MUSIC'
                ? 'bg-rose-950/60 text-rose-300 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-rose-400" />
            <span>Cultural Music</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-900/40 text-rose-300">
              {musicCount} Events
            </span>
          </button>

          {/* Cultural Dance */}
          <button
            type="button"
            onClick={() => setActiveTab('DANCE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'DANCE'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Cultural Dance</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900/40 text-amber-300">
              {danceCount} Events
            </span>
          </button>

          {/* Cultural Fashion */}
          <button
            type="button"
            onClick={() => setActiveTab('FASHION')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'FASHION'
                ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500 shadow-md ring-2 ring-fuchsia-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Cultural Fashion</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-fuchsia-900/40 text-fuchsia-300">
              {fashionCount} Events
            </span>
          </button>

          {/* Cultural Theatre */}
          <button
            type="button"
            onClick={() => setActiveTab('THEATRE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'THEATRE'
                ? 'bg-violet-950/60 text-violet-300 border-violet-500 shadow-md ring-2 ring-violet-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Drama className="w-3.5 h-3.5 text-violet-400" />
            <span>Cultural Theatre</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-900/40 text-violet-300">
              {theatreCount} Events
            </span>
          </button>

          {/* Literary & Quizzing */}
          <button
            type="button"
            onClick={() => setActiveTab('LITERARY')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'LITERARY'
                ? 'bg-blue-950/60 text-blue-300 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Literary &amp; Quizzing</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-900/40 text-blue-300">
              {literaryCount} Events
            </span>
          </button>

          {/* Esports & Gaming */}
          <button
            type="button"
            onClick={() => setActiveTab('GAMING')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'GAMING'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Esports &amp; Gaming</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/40 text-emerald-300">
              {gamingCount} Events
            </span>
          </button>

          {/* Informalz */}
          <button
            type="button"
            onClick={() => setActiveTab('INFORMALZ')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'INFORMALZ'
                ? 'bg-purple-950/60 text-purple-300 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5 text-purple-400" />
            <span>Informalz (Free)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/40 text-purple-300">
              {informalzCount} Free
            </span>
          </button>

          {/* R&I */}
          <button
            type="button"
            onClick={() => setActiveTab('RI')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'RI'
                ? 'bg-blue-950/60 text-blue-300 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
            <span>R&amp;I Competitive</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-900/40 text-blue-300">
              {riCount} Events
            </span>
          </button>

          {/* Stage Sound Console */}
          <button
            type="button"
            onClick={() => setActiveTab('STAGE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'STAGE'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Stage Audio Tracks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900/40 text-amber-300">
              {trackCount} Tracks
            </span>
          </button>

          {/* Events Catalog */}
          <button
            type="button"
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'EVENTS'
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Events Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900/40 text-indigo-300">
              {events.length} Catalog
            </span>
          </button>

          {/* Security Audit Trail */}
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-rose-950/60 text-rose-300 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Audit Trail (PostgreSQL)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-900/40 text-rose-300 font-mono">
              Security
            </span>
          </button>
        </div>
      </div>

      {/* Observational Workspace Content */}

      {/* 0. SECURITY & OPERATOR AUDIT TRAIL */}
      {activeTab === 'AUDIT_LOGS' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AuditLogsViewer />
        </section>
      )}

      {/* 1. MASTER ALL REGISTRY */}
      {activeTab === 'ALL' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations"
            title="Master Attendee Registry (Universal Festival Roster)"
            subtitle="Real-time participant rosters, college distributions, gate verification stamps, and payment transactions across all committees."
          />
        </section>
      )}

      {/* 2. CULTURAL MUSIC */}
      {activeTab === 'MUSIC' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Music"
            title="Cultural Music Attendee Roster"
            subtitle="Performers, solo vocalists, and band registrations for all music competitions."
          />
        </section>
      )}

      {/* 3. CULTURAL DANCE */}
      {activeTab === 'DANCE' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Dance"
            title="Cultural Dance Attendee Roster"
            subtitle="Solo dancers, duo showdowns, and mega choreography group registrations."
          />
        </section>
      )}

      {/* 4. CULTURAL FASHION */}
      {activeTab === 'FASHION' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Fashion"
            title="Cultural Fashion Attendee Roster"
            subtitle="Runway models, styling teams, and fashion pageant participant registrations."
          />
        </section>
      )}

      {/* 5. CULTURAL THEATRE */}
      {activeTab === 'THEATRE' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Theatre"
            title="Cultural Theatre Attendee Roster"
            subtitle="Nukkad Natak street play teams, stage actors, and monologue performers."
          />
        </section>
      )}

      {/* 6. LITERARY & QUIZZING */}
      {activeTab === 'LITERARY' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Literary"
            title="Literary &amp; Quizzing Attendee Roster"
            subtitle="Debate teams, slam poets, and quiz competition participants."
          />
        </section>
      )}

      {/* 7. ESPORTS & GAMING */}
      {activeTab === 'GAMING' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Gaming"
            title="Esports &amp; Gaming Attendee Roster"
            subtitle="BGMI squads, Valorant rosters, and tournament participants."
          />
        </section>
      )}

      {/* 8. INFORMALZ */}
      {activeTab === 'INFORMALZ' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?category=Informalz"
            title="Informalz Attendee Registry (Free Campus Activities)"
            subtitle="Zero-fee passes, social event attendees, and crowd engagement registrations."
          />
        </section>
      )}

      {/* 9. R&I */}
      {activeTab === 'RI' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <AdminRegistrationsTable
            apiEndpoint="/api/admin/registrations?excludeCategory=informalz"
            title="R&amp;I Competitive Events Registry"
            subtitle="Paid competitive stage and arena participants with payment references."
          />
        </section>
      )}

      {/* 10. STAGE SOUND CONSOLE (READ-ONLY) */}
      {activeTab === 'STAGE' && (
        <section className="space-y-4 animate-in fade-in-50 duration-200">
          <StageRegistrationsManager
            apiEndpoint="/api/stage/tracks"
            title="Stage &amp; AV Sound Console (Read-Only Observatory)"
            subtitle="Direct sound cues, audio track links, and stage coordinator timings. Editing is strictly disabled for executive view."
            allowEdit={false}
          />
        </section>
      )}

      {/* 11. READ-ONLY EVENTS DIRECTORY */}
      {activeTab === 'EVENTS' && (
        <section className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Events Directory &amp; Pricing Catalog</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Read-only view of all campus events, registration fees, venues, and team limits configured for Zest 2026.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {events.length} Configured Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Venue &amp; Date</th>
                    <th className="py-3 px-4 text-right">Fee</th>
                    <th className="py-3 px-4 text-center">Track Required</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{e.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{e.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">
                          {e.eventType === 'Team' ? `Team (${e.minTeamSize}-${e.maxTeamSize})` : 'Individual'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{e.venue || 'Campus Venue'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{e.date || 'Fest Days'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-400">
                          {e.feeAmount === 0 ? 'FREE' : `₹${(e.feeAmount / 100).toLocaleString('en-IN')}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {e.requiresTrackUpload ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
