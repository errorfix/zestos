'use client';

import React, { useState } from 'react';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import CollegeDelegationsView from '@/components/CollegeDelegationsView';
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
  Building2,
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
  | 'COLLEGE_DELEGATIONS'
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
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" /> Read-Only Mode
              </span>
              <span className="text-xs text-slate-500">Live Campus Observation</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Higher Authority &amp; Management Observatory
            </h3>
            <p className="text-xs text-slate-600">
              Complete cross-committee visibility of registrations, revenues, audio cues, and gate attendance with strict data protection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Last Synced</span>
            <span className="text-xs text-slate-700 font-mono font-bold">{lastRefreshed}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all border border-slate-900 flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Registrations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Entries</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {masterMetrics.totalRegistrations}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
            {masterMetrics.paidRegistrations} Confirmed Passes
          </span>
        </div>

        {/* 2. Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            ₹{masterMetrics.totalRevenueInr.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Razorpay + Cash Desks
          </span>
        </div>

        {/* 3. Gate Check-ins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gate Attendance</span>
            <Scan className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {masterMetrics.checkInPercentage}%
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {masterMetrics.totalCheckedInTickets} / {masterMetrics.totalIssuedTickets} scanned
          </span>
        </div>

        {/* 4. Tracks Attached */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stage Sound Tracks</span>
            <Mic2 className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {stageMetrics?.tracksAttached || 0}
          </span>
          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
            {stageMetrics?.tracksMissing || 0} missing to collect
          </span>
        </div>

        {/* 5. Active Events */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Events</span>
            <Calendar className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {events.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {riCount} Comp • {informalzCount} Free
          </span>
        </div>

        {/* 6. Performers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Performers</span>
            <Trophy className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {stageMetrics?.totalPerformers || 0}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Registered on Stage
          </span>
        </div>
      </div>

      {/* Committee Observatory Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Committee Observatory Stream
          </span>
          <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-800" /> Full Festival Read-Only Audit
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
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Registry</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {masterMetrics.totalRegistrations}
            </span>
          </button>

          {/* College Delegations */}
          <button
            type="button"
            onClick={() => setActiveTab('COLLEGE_DELEGATIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'COLLEGE_DELEGATIONS'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>College Delegations</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'COLLEGE_DELEGATIONS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              Inter-College
            </span>
          </button>

          {/* Cultural Music */}
          <button
            type="button"
            onClick={() => setActiveTab('MUSIC')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'MUSIC'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Cultural Music</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'MUSIC' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {musicCount} Events
            </span>
          </button>

          {/* Cultural Dance */}
          <button
            type="button"
            onClick={() => setActiveTab('DANCE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'DANCE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cultural Dance</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'DANCE' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {danceCount} Events
            </span>
          </button>

          {/* Cultural Fashion */}
          <button
            type="button"
            onClick={() => setActiveTab('FASHION')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'FASHION'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cultural Fashion</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'FASHION' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {fashionCount} Events
            </span>
          </button>

          {/* Cultural Theatre */}
          <button
            type="button"
            onClick={() => setActiveTab('THEATRE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'THEATRE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Drama className="w-3.5 h-3.5" />
            <span>Cultural Theatre</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'THEATRE' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {theatreCount} Events
            </span>
          </button>

          {/* Literary & Quizzing */}
          <button
            type="button"
            onClick={() => setActiveTab('LITERARY')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'LITERARY'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Literary &amp; Quizzing</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'LITERARY' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {literaryCount} Events
            </span>
          </button>

          {/* Esports & Gaming */}
          <button
            type="button"
            onClick={() => setActiveTab('GAMING')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'GAMING'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Esports &amp; Gaming</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'GAMING' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {gamingCount} Events
            </span>
          </button>

          {/* Informalz */}
          <button
            type="button"
            onClick={() => setActiveTab('INFORMALZ')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'INFORMALZ'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Informalz (Free)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'INFORMALZ' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {informalzCount} Free
            </span>
          </button>

          {/* R&I */}
          <button
            type="button"
            onClick={() => setActiveTab('RI')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'RI'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>R&amp;I Competitive</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'RI' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {riCount} Events
            </span>
          </button>

          {/* Stage Sound Console */}
          <button
            type="button"
            onClick={() => setActiveTab('STAGE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'STAGE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Stage Audio Tracks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'STAGE' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {trackCount} Tracks
            </span>
          </button>

          {/* Events Catalog */}
          <button
            type="button"
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'EVENTS'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events Directory</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'EVENTS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {events.length} Catalog
            </span>
          </button>
        </div>
      </div>

      {/* Observational Workspace Content */}

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
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Events Directory &amp; Pricing Catalog</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Read-only view of all campus events, registration fees, venues, and team limits configured for Zest 2026.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {events.length} Configured Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{e.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{e.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">
                          {e.eventType === 'Team' ? `Team (${e.minTeamSize}-${e.maxTeamSize})` : 'Individual'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{e.venue || 'Campus Venue'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{e.date || 'Fest Days'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-700">
                          {e.feeAmount === 0 ? 'FREE' : `₹${(e.feeAmount / 100).toLocaleString('en-IN')}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {e.requiresTrackUpload ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
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

      {/* College Delegations Observatory */}
      {activeTab === 'COLLEGE_DELEGATIONS' && (
        <section className="space-y-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Inter-College Observational Roster
                </span>
                <span className="text-xs text-slate-500 font-medium">Read-Only View</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">College Contingent Registries</h2>
              <p className="text-xs text-slate-600">
                Explore participating institutions, view delegation team leaders, participated activities, and issued passes.
              </p>
            </div>
            <CollegeDelegationsView />
          </div>
        </section>
      )}
    </div>
  );
}
