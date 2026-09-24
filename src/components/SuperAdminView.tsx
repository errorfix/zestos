'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdminEventsManager from '@/components/AdminEventsManager';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import SuperAdminFlagsManager from '@/components/SuperAdminFlagsManager';
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
  Banknote,
  QrCode,
  Sliders,
  Flame,
  Gamepad2,
  BookOpen,
  Drama,
  ExternalLink,
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

interface SuperAdminViewProps {
  events: InitialEventData[];
  masterMetrics: MetricsData;
  riMetrics: MetricsData;
  informalzMetrics: MetricsData;
  stageMetrics?: StageMetricsData;
}

export type SuperAdminWorkspaceTab =
  | 'FLAGS'
  | 'RI'
  | 'MUSIC'
  | 'DANCE'
  | 'FASHION'
  | 'THEATRE'
  | 'LITERARY'
  | 'GAMING'
  | 'INFORMALZ'
  | 'STAGE'
  | 'ONSPOT'
  | 'ALL';

export default function SuperAdminView({
  events,
  masterMetrics,
  riMetrics,
  informalzMetrics,
  stageMetrics,
}: SuperAdminViewProps) {
  const [activeCommittee, setActiveCommittee] = useState<SuperAdminWorkspaceTab>('FLAGS');

  const informalzCount = events.filter((e) => e.category.toLowerCase() === 'informalz').length;
  const riCount = events.filter((e) => e.category.toLowerCase() !== 'informalz').length;
  const trackCount = events.filter((e) => e.requiresTrackUpload === true).length;
  const musicCount = events.filter((e) => e.category.toLowerCase().includes('music')).length;
  const danceCount = events.filter((e) => e.category.toLowerCase().includes('dance')).length;
  const fashionCount = events.filter((e) => e.category.toLowerCase().includes('fashion')).length;
  const theatreCount = events.filter((e) => e.category.toLowerCase().includes('theatre')).length;
  const literaryCount = events.filter((e) => e.category.toLowerCase().includes('literary')).length;
  const gamingCount = events.filter((e) => e.category.toLowerCase().includes('gaming')).length;

  const currentMetrics =
    activeCommittee === 'INFORMALZ'
      ? informalzMetrics
      : activeCommittee === 'RI'
      ? riMetrics
      : masterMetrics;

  return (
    <div className="space-y-8">
      {/* Committee & Flags Navigation Hub */}
      <div className="space-y-4">
        {/* Top Flag Access Matrix Feature Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            activeCommittee === 'FLAGS'
              ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
              : 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border-slate-700/80 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                activeCommittee === 'FLAGS'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Access Control Engine
                </span>
                <span className="text-xs text-slate-400">Dynamic Boolean Matrix</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Committee Event Visibility &amp; Boolean Flags Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Grant or restrict any committee panel&apos;s access to specific event types in real time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveCommittee('FLAGS')}
            className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeCommittee === 'FLAGS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-white/20'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {activeCommittee === 'FLAGS' ? '● Matrix Active' : 'Open Flags Configurator →'}
          </button>
        </div>

        {/* Specialized Event Panels (The 6 Cultural & Gaming Committees) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-400">
              Specialized Event Committee Workspaces
            </span>
            <span className="text-[11px] text-slate-400">
              Direct attendee rosters &amp; dedicated panel access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Music */}
            <button
              type="button"
              onClick={() => setActiveCommittee('MUSIC')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'MUSIC'
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Music className={`w-4 h-4 ${activeCommittee === 'MUSIC' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{musicCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Cultural Music</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Vocal &amp; Band tracks</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'MUSIC' ? 'text-rose-400' : 'text-slate-500'}>
                  {activeCommittee === 'MUSIC' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/music</span>
              </div>
            </button>

            {/* Dance */}
            <button
              type="button"
              onClick={() => setActiveCommittee('DANCE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'DANCE'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Flame className={`w-4 h-4 ${activeCommittee === 'DANCE' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{danceCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Cultural Dance</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Solo &amp; Group tracks</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'DANCE' ? 'text-amber-400' : 'text-slate-500'}>
                  {activeCommittee === 'DANCE' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/dance</span>
              </div>
            </button>

            {/* Fashion */}
            <button
              type="button"
              onClick={() => setActiveCommittee('FASHION')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'FASHION'
                  ? 'bg-fuchsia-950/40 border-fuchsia-500 ring-2 ring-fuchsia-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Sparkles className={`w-4 h-4 ${activeCommittee === 'FASHION' ? 'text-fuchsia-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{fashionCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Cultural Fashion</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Runway &amp; Vogue</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'FASHION' ? 'text-fuchsia-400' : 'text-slate-500'}>
                  {activeCommittee === 'FASHION' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/fashion</span>
              </div>
            </button>

            {/* Theatre */}
            <button
              type="button"
              onClick={() => setActiveCommittee('THEATRE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'THEATRE'
                  ? 'bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Drama className={`w-4 h-4 ${activeCommittee === 'THEATRE' ? 'text-violet-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{theatreCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Cultural Theatre</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Nukkad &amp; Drama</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'THEATRE' ? 'text-violet-400' : 'text-slate-500'}>
                  {activeCommittee === 'THEATRE' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/theatre</span>
              </div>
            </button>

            {/* Literary */}
            <button
              type="button"
              onClick={() => setActiveCommittee('LITERARY')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'LITERARY'
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <BookOpen className={`w-4 h-4 ${activeCommittee === 'LITERARY' ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{literaryCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Literary &amp; Quizzing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Debate &amp; Trivia</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'LITERARY' ? 'text-blue-400' : 'text-slate-500'}>
                  {activeCommittee === 'LITERARY' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/literary</span>
              </div>
            </button>

            {/* Gaming */}
            <button
              type="button"
              onClick={() => setActiveCommittee('GAMING')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'GAMING'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Gamepad2 className={`w-4 h-4 ${activeCommittee === 'GAMING' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{gamingCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate">Esports &amp; Gaming</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">BGMI, Valorant, FIFA</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'GAMING' ? 'text-emerald-400' : 'text-slate-500'}>
                  {activeCommittee === 'GAMING' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/committee/gaming</span>
              </div>
            </button>
          </div>
        </div>

        {/* Core Operations Workspaces */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Core Operations &amp; Registries
            </span>
            <span className="text-[11px] text-slate-400">
              Master aggregation, desk, AV console &amp; R&amp;I
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. R&I */}
            <button
              type="button"
              onClick={() => setActiveCommittee('RI')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'RI'
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Trophy className={`w-4 h-4 ${activeCommittee === 'RI' ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{riCount} Events</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">R&amp;I Committee</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Competitive &amp; Paid events</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'RI' ? 'text-blue-400' : 'text-slate-500'}>
                  {activeCommittee === 'RI' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/admin/rni</span>
              </div>
            </button>

            {/* 2. Informalz */}
            <button
              type="button"
              onClick={() => setActiveCommittee('INFORMALZ')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'INFORMALZ'
                  ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <PartyPopper className={`w-4 h-4 ${activeCommittee === 'INFORMALZ' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{informalzCount} Free</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Informalz</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero-fee campus activities</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'INFORMALZ' ? 'text-purple-400' : 'text-slate-500'}>
                  {activeCommittee === 'INFORMALZ' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/admin/informalz</span>
              </div>
            </button>

            {/* 3. Stage AV */}
            <button
              type="button"
              onClick={() => setActiveCommittee('STAGE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'STAGE'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Mic2 className={`w-4 h-4 ${activeCommittee === 'STAGE' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{trackCount} Tracks</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Stage &amp; AV Cues</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Audio &amp; Drive tracks</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'STAGE' ? 'text-amber-400' : 'text-slate-500'}>
                  {activeCommittee === 'STAGE' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">/admin/stage</span>
              </div>
            </button>

            {/* 4. On-Spot */}
            <button
              type="button"
              onClick={() => setActiveCommittee('ONSPOT')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'ONSPOT'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Banknote className={`w-4 h-4 ${activeCommittee === 'ONSPOT' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">Surge Pricing</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">On-Spot Desk</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Counter price &amp; cash audit</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'ONSPOT' ? 'text-emerald-400' : 'text-slate-500'}>
                  {activeCommittee === 'ONSPOT' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">Door Counter</span>
              </div>
            </button>

            {/* 5. Master View */}
            <button
              type="button"
              onClick={() => setActiveCommittee('ALL')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeCommittee === 'ALL'
                  ? 'bg-slate-800 border-slate-500 ring-2 ring-slate-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Layers className={`w-4 h-4 ${activeCommittee === 'ALL' ? 'text-slate-200' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-400">{events.length} Total</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Master View</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Universal combined audit</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-bold flex justify-between">
                <span className={activeCommittee === 'ALL' ? 'text-slate-200' : 'text-slate-500'}>
                  {activeCommittee === 'ALL' ? '● Viewing' : 'Switch'}
                </span>
                <span className="text-slate-500">Universal</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Scoped Metric Cards */}
      {activeCommittee !== 'FLAGS' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeCommittee === 'STAGE' ? 'Track Performers' : 'Registrations'}
              </span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {activeCommittee === 'STAGE'
                ? stageMetrics?.totalTrackRegistrations || 0
                : currentMetrics.totalRegistrations}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">
              {activeCommittee === 'STAGE'
                ? `${stageMetrics?.totalPerformers || 0} Registered Performers`
                : `${currentMetrics.paidRegistrations} Confirmed Passes`}
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeCommittee === 'INFORMALZ'
                  ? 'Event Pricing'
                  : activeCommittee === 'STAGE'
                  ? 'Tracks Ready'
                  : 'Revenue Collected'}
              </span>
              {activeCommittee === 'INFORMALZ' ? (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              ) : activeCommittee === 'STAGE' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <IndianRupee className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {activeCommittee === 'INFORMALZ'
                ? 'FREE (₹0)'
                : activeCommittee === 'STAGE'
                ? stageMetrics?.tracksAttached || 0
                : `₹${currentMetrics.totalRevenueInr.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              {activeCommittee === 'INFORMALZ'
                ? '100% Free Activities'
                : activeCommittee === 'STAGE'
                ? 'Audio links attached'
                : 'Razorpay + Desk Cash'}
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeCommittee === 'STAGE' ? 'Action Required' : 'Gate Checked In'}
              </span>
              <Scan className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {activeCommittee === 'STAGE'
                ? stageMetrics?.tracksMissing || 0
                : currentMetrics.totalCheckedInTickets}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              {activeCommittee === 'STAGE'
                ? 'Missing tracks to collect'
                : `of ${currentMetrics.totalIssuedTickets} passes (${currentMetrics.checkInPercentage}%)`}
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeCommittee === 'STAGE' ? 'Track Events' : 'Active Events'}
              </span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {activeCommittee === 'INFORMALZ'
                ? informalzCount
                : activeCommittee === 'RI'
                ? riCount
                : activeCommittee === 'STAGE'
                ? trackCount
                : events.length}
            </span>
            <span className="text-[11px] text-amber-400 font-medium block mt-1">
              Full Super Admin CRUD
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎛️ SECTION 0: COMMITTEE ACCESS FLAGS & VISIBILITY MATRIX */}
      {/* ========================================================================= */}
      {activeCommittee === 'FLAGS' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <SuperAdminFlagsManager />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎵 SECTION: CULTURAL MUSIC COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'MUSIC' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  melody@lv321
                </span>
                <span className="text-xs text-rose-300 font-mono">Dedicated Portal: /committee/music</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Cultural Music Operations &amp; Soundtracks</h3>
              <p className="text-xs text-slate-300">
                Attendees, vocal track submissions, and band audio cues for all music events.
              </p>
            </div>
            <Link
              href="/committee/music"
              target="_blank"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section>
            <StageRegistrationsManager
              apiEndpoint="/api/stage/tracks"
              categoryFilter="Cultural - Music"
              title="Music Audio &amp; Backing Tracks Console"
              subtitle="Performers who submitted vocal/band accompaniment tracks or Google Drive links."
              allowEdit={true}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Cultural - Music"
              defaultCategory="Cultural - Music"
              apiEndpoint="/api/super-admin/events"
              title="Cultural Music Events"
              subtitle="Events classified under Cultural - Music."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Music"
              title="Cultural Music Attendee Roster"
              subtitle="Participant registrations, colleges, and contact details for music events."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💃 SECTION: CULTURAL DANCE COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'DANCE' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  rhythm@lv321
                </span>
                <span className="text-xs text-amber-300 font-mono">Dedicated Portal: /committee/dance</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Cultural Dance Operations &amp; Soundtracks</h3>
              <p className="text-xs text-slate-300">
                Attendees, choreography soundtrack submissions, and stage cues for solo &amp; group dances.
              </p>
            </div>
            <Link
              href="/committee/dance"
              target="_blank"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section>
            <StageRegistrationsManager
              apiEndpoint="/api/stage/tracks"
              categoryFilter="Cultural - Dance"
              title="Dance Performance Tracks Console"
              subtitle="Dancers and teams who submitted choreography audio or performance tracks."
              allowEdit={true}
            />
          </section>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Cultural - Dance"
              defaultCategory="Cultural - Dance"
              apiEndpoint="/api/super-admin/events"
              title="Cultural Dance Events"
              subtitle="Events classified under Cultural - Dance."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Dance"
              title="Cultural Dance Attendee Roster"
              subtitle="Participant registrations, teams, and payment verifications for dance events."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👗 SECTION: CULTURAL FASHION COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'FASHION' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-fuchsia-950/30 border border-fuchsia-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  vogue@lv321
                </span>
                <span className="text-xs text-fuchsia-300 font-mono">Dedicated Portal: /committee/fashion</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Cultural Fashion Operations</h3>
              <p className="text-xs text-slate-300">
                Runway model teams, styling groups, and attendee records for fashion shows.
              </p>
            </div>
            <Link
              href="/committee/fashion"
              target="_blank"
              className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Cultural - Fashion"
              defaultCategory="Cultural - Fashion"
              apiEndpoint="/api/super-admin/events"
              title="Cultural Fashion Events"
              subtitle="Events classified under Cultural - Fashion."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Fashion"
              title="Cultural Fashion Attendee Roster"
              subtitle="Participant registrations, teams, and passes for fashion events."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎭 SECTION: CULTURAL THEATRE COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'THEATRE' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-violet-950/30 border border-violet-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  drama@lv321
                </span>
                <span className="text-xs text-violet-300 font-mono">Dedicated Portal: /committee/theatre</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Cultural Theatre Operations</h3>
              <p className="text-xs text-slate-300">
                Nukkad Natak, stage plays, mono-acts, and theater troupe rosters.
              </p>
            </div>
            <Link
              href="/committee/theatre"
              target="_blank"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Cultural - Theatre"
              defaultCategory="Cultural - Theatre"
              apiEndpoint="/api/super-admin/events"
              title="Cultural Theatre Events"
              subtitle="Events classified under Cultural - Theatre."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Cultural%20-%20Theatre"
              title="Cultural Theatre Attendee Roster"
              subtitle="Participant registrations, casts, and team passes for theatre events."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 SECTION: LITERARY & QUIZZING COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'LITERARY' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  words@lv321
                </span>
                <span className="text-xs text-blue-300 font-mono">Dedicated Portal: /committee/literary</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Literary &amp; Quizzing Operations</h3>
              <p className="text-xs text-slate-300">
                Debaters, quizzers, poetry slams, and creative writing attendee rosters.
              </p>
            </div>
            <Link
              href="/committee/literary"
              target="_blank"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Literary"
              defaultCategory="Literary"
              apiEndpoint="/api/super-admin/events"
              title="Literary &amp; Quizzing Events"
              subtitle="Events classified under Literary &amp; Quizzing."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Literary"
              title="Literary &amp; Quizzing Attendee Roster"
              subtitle="Participant registrations, teams, and verification records for literary competitions."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎮 SECTION: ESPORTS & GAMING COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'GAMING' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  nexus@lv321
                </span>
                <span className="text-xs text-emerald-300 font-mono">Dedicated Portal: /committee/gaming</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Esports &amp; Gaming Operations</h3>
              <p className="text-xs text-slate-300">
                Squad rosters, in-game tags, and tournament brackets for BGMI, Valorant, FIFA.
              </p>
            </div>
            <Link
              href="/committee/gaming"
              target="_blank"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Gaming"
              defaultCategory="Gaming"
              apiEndpoint="/api/super-admin/events"
              title="Esports &amp; Gaming Events"
              subtitle="Events classified under Gaming / Esports."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=Gaming"
              title="Esports &amp; Gaming Attendee Roster"
              subtitle="Team rosters, gamer handles, and check-in records for all tournament matches."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 SECTION 1: R&I COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'RI' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              excludeCategory="Informalz"
              defaultCategory="Cultural - Music"
              apiEndpoint="/api/super-admin/events"
              title="R&I Committee Events (Competitive & Stage)"
              subtitle="Full CRUD on competitive campus events. Informalz activities are isolated from this view."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?excludeCategory=informalz"
              title="R&I Attendee Registry"
              subtitle="Registrations, stage audio tracks, and payment records for R&I competitive events."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 SECTION 2: INFORMALZ COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'INFORMALZ' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <section className="bg-slate-900 rounded-3xl border border-purple-900/40 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Informalz"
              defaultCategory="Informalz"
              apiEndpoint="/api/super-admin/events"
              title="Informalz Committee Events (100% Free Activities)"
              subtitle="Full CRUD on informal, social, and gaming activities. All events have ₹0 fee."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=informalz"
              title="Informalz Attendee Registry"
              subtitle="Free passes, participant rosters, and gate attendance for all informal activities."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎵 SECTION 3: STAGE COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'STAGE' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <section>
            <StageRegistrationsManager
              apiEndpoint="/api/stage/tracks"
              title="Stage & AV Sound Console (Super Admin Elevated)"
              subtitle="Direct sound cues, audio links, and manual track attachment for all performance events."
              allowEdit={true}
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💵 SECTION 4: ON-SPOT WALK-IN COUNTER WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'ONSPOT' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <section className="bg-slate-900 rounded-3xl border border-emerald-900/40 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              apiEndpoint="/api/super-admin/events"
              title="On-Spot Walk-in Counter Event & Price Manager"
              subtitle="Configure special on-spot door prices (e.g. ₹200 walk-in vs ₹150 online) and manage on-spot counter availability in real time."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations"
              title="Walk-in &amp; On-Spot Desk Registry"
              subtitle="Audit desk walk-in attendees, cash receipts, and desk UPI payments with 1-click Razorpay ID verification."
            />
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌐 SECTION 5: MASTER OVERVIEW (ALL COMBINED) */}
      {/* ========================================================================= */}
      {activeCommittee === 'ALL' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              apiEndpoint="/api/super-admin/events"
              title="Master Events Catalog (All Committees Combined)"
              subtitle="Universal event directory with full Super Admin CRUD privileges."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations"
              title="Master Attendee Registry (All Committees)"
              subtitle="Universal participant rosters, stage track assets, and payment records."
            />
          </section>
        </div>
      )}
    </div>
  );
}
