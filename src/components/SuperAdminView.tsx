'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdminEventsManager from '@/components/AdminEventsManager';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
import SuperAdminFlagsManager from '@/components/SuperAdminFlagsManager';
import AuditLogsViewer from '@/components/AuditLogsViewer';
import SuperAdminDailyTracking from '@/components/SuperAdminDailyTracking';
import SponsorshipManager from '@/components/SponsorshipManager';
import CollegeDelegationsView from '@/components/CollegeDelegationsView';
import CollegePricingExceptionsManager from '@/components/CollegePricingExceptionsManager';
import InfraVendorManager from '@/components/InfraVendorManager';
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
  ShieldCheck,
  Building2,
  Tag,
  Handshake,
  Truck,
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
  | 'DAILY_TRACKING'
  | 'SPONSORSHIP'
  | 'INFRA_VENDORS'
  | 'AUDIT_LOGS'
  | 'COLLEGE_DELEGATIONS'
  | 'COLLEGE_PRICING'
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
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${activeCommittee === 'FLAGS'
              ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
              : 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border-slate-700/80 hover:border-amber-500/50'
            }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${activeCommittee === 'FLAGS'
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
            className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${activeCommittee === 'FLAGS'
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Specialized Event Committee Workspaces
            </span>
            <span className="text-[11px] text-slate-500">
              Direct attendee rosters &amp; dedicated panel access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Music */}
            <button
              type="button"
              onClick={() => setActiveCommittee('MUSIC')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'MUSIC'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Music className={`w-4 h-4 ${activeCommittee === 'MUSIC' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'MUSIC' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {musicCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Cultural Music</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'MUSIC' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Vocal &amp; Band tracks
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'MUSIC' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'MUSIC' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/music</span>
              </div>
            </button>

            {/* Dance */}
            <button
              type="button"
              onClick={() => setActiveCommittee('DANCE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'DANCE'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Flame className={`w-4 h-4 ${activeCommittee === 'DANCE' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'DANCE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {danceCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Cultural Dance</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'DANCE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Solo &amp; Group tracks
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'DANCE' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'DANCE' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/dance</span>
              </div>
            </button>

            {/* Fashion */}
            <button
              type="button"
              onClick={() => setActiveCommittee('FASHION')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'FASHION'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Sparkles className={`w-4 h-4 ${activeCommittee === 'FASHION' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'FASHION' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {fashionCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Cultural Fashion</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'FASHION' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Runway &amp; Vogue
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'FASHION' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'FASHION' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/fashion</span>
              </div>
            </button>

            {/* Theatre */}
            <button
              type="button"
              onClick={() => setActiveCommittee('THEATRE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'THEATRE'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Drama className={`w-4 h-4 ${activeCommittee === 'THEATRE' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'THEATRE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {theatreCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Cultural Theatre</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'THEATRE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Nukkad &amp; Drama
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'THEATRE' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'THEATRE' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/theatre</span>
              </div>
            </button>

            {/* Literary */}
            <button
              type="button"
              onClick={() => setActiveCommittee('LITERARY')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'LITERARY'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <BookOpen className={`w-4 h-4 ${activeCommittee === 'LITERARY' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'LITERARY' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {literaryCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Literary &amp; Quizzing</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'LITERARY' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Debate &amp; Trivia
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'LITERARY' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'LITERARY' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/literary</span>
              </div>
            </button>

            {/* Gaming */}
            <button
              type="button"
              onClick={() => setActiveCommittee('GAMING')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'GAMING'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Gamepad2 className={`w-4 h-4 ${activeCommittee === 'GAMING' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'GAMING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {gamingCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold truncate">Esports &amp; Gaming</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'GAMING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  BGMI, Valorant, FIFA
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'GAMING' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'GAMING' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/gaming</span>
              </div>
            </button>
          </div>
        </div>

        {/* Core Operations Workspaces */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Core Operations &amp; Registries
            </span>
            <span className="text-[11px] text-slate-500">
              Master aggregation, desk, AV console &amp; R&amp;I
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. R&I */}
            <button
              type="button"
              onClick={() => setActiveCommittee('RI')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'RI'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Trophy className={`w-4 h-4 ${activeCommittee === 'RI' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'RI' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {riCount} Events
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">R&amp;I Committee</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'RI' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Competitive &amp; Paid events
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'RI' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'RI' ? '● Viewing' : 'Switch'}</span>
                <span>/admin/rni</span>
              </div>
            </button>

            {/* 2. Informalz */}
            <button
              type="button"
              onClick={() => setActiveCommittee('INFORMALZ')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'INFORMALZ'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <PartyPopper className={`w-4 h-4 ${activeCommittee === 'INFORMALZ' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'INFORMALZ' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {informalzCount} Free
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Informalz</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'INFORMALZ' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Zero-fee campus activities
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'INFORMALZ' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'INFORMALZ' ? '● Viewing' : 'Switch'}</span>
                <span>/admin/informalz</span>
              </div>
            </button>

            {/* 3. Stage AV */}
            <button
              type="button"
              onClick={() => setActiveCommittee('STAGE')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'STAGE'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Mic2 className={`w-4 h-4 ${activeCommittee === 'STAGE' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'STAGE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {trackCount} Tracks
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Stage &amp; AV Cues</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'STAGE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Audio &amp; Drive tracks
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'STAGE' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'STAGE' ? '● Viewing' : 'Switch'}</span>
                <span>/admin/stage</span>
              </div>
            </button>

            {/* 4. On-Spot */}
            <button
              type="button"
              onClick={() => setActiveCommittee('ONSPOT')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'ONSPOT'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Banknote className={`w-4 h-4 ${activeCommittee === 'ONSPOT' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'ONSPOT' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Surge Pricing
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">On-Spot Desk</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'ONSPOT' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Counter price &amp; cash audit
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'ONSPOT' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'ONSPOT' ? '● Viewing' : 'Switch'}</span>
                <span>Door Counter</span>
              </div>
            </button>

            {/* 5. Master View */}
            <button
              type="button"
              onClick={() => setActiveCommittee('ALL')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'ALL'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Layers className={`w-4 h-4 ${activeCommittee === 'ALL' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {events.length} Total
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Master View</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Universal combined audit
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'ALL' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'ALL' ? '● Viewing' : 'Switch'}</span>
                <span>Universal</span>
              </div>
            </button>

            {/* 6. Security Audit Trail */}
            <button
              type="button"
              onClick={() => setActiveCommittee('AUDIT_LOGS')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'AUDIT_LOGS'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${activeCommittee === 'AUDIT_LOGS' ? 'text-white' : 'text-slate-700'}`} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 font-mono">LIVE FEED</span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Audit Trail</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'AUDIT_LOGS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Real-time operator logs
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'AUDIT_LOGS' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'AUDIT_LOGS' ? '● Live Stream' : 'Open Stream'}</span>
                <span>Super Admin Only</span>
              </div>
            </button>

            {/* Vendor Logistics & Equipment */}
            <button
              type="button"
              onClick={() => setActiveCommittee('INFRA_VENDORS')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'INFRA_VENDORS'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Truck className={`w-4 h-4 ${activeCommittee === 'INFRA_VENDORS' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'INFRA_VENDORS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Infra
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Vendor Logistics</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'INFRA_VENDORS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Contracts &amp; equipment
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'INFRA_VENDORS' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'INFRA_VENDORS' ? '● Viewing' : 'Switch'}</span>
                <span>/committee/infra</span>
              </div>
            </button>

            {/* 7. College Delegations Drilldown */}
            <button
              type="button"
              onClick={() => setActiveCommittee('COLLEGE_DELEGATIONS')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'COLLEGE_DELEGATIONS'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Building2 className={`w-4 h-4 ${activeCommittee === 'COLLEGE_DELEGATIONS' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'COLLEGE_DELEGATIONS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  INSTITUTES
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">College Contingents</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'COLLEGE_DELEGATIONS' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Delegations &amp; passes
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'COLLEGE_DELEGATIONS' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'COLLEGE_DELEGATIONS' ? '● Viewing' : 'Switch'}</span>
                <span>Contingents</span>
              </div>
            </button>

            {/* Daily Work Tracking */}
            <button
              type="button"
              onClick={() => setActiveCommittee('DAILY_TRACKING')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'DAILY_TRACKING'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Calendar className={`w-4 h-4 ${activeCommittee === 'DAILY_TRACKING' ? 'text-white' : 'text-slate-700'}`} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Daily Tracking</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'DAILY_TRACKING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Heads &amp; subheads progress
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'DAILY_TRACKING' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'DAILY_TRACKING' ? '● Active' : 'Switch'}</span>
                <span>Workstreams</span>
              </div>
            </button>

            {/* Sponsorship & Brand Deals */}
            <button
              type="button"
              onClick={() => setActiveCommittee('SPONSORSHIP')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'SPONSORSHIP'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Handshake className={`w-4 h-4 ${activeCommittee === 'SPONSORSHIP' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'SPONSORSHIP' ? 'text-slate-300' : 'text-slate-500'}`}>
                  DEALS
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Sponsorship</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'SPONSORSHIP' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Corporate brand pipeline
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'SPONSORSHIP' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'SPONSORSHIP' ? '● Active' : 'Switch'}</span>
                <span>Brands &amp; MoUs</span>
              </div>
            </button>

            {/* College Pricing Exceptions */}
            <button
              type="button"
              onClick={() => setActiveCommittee('COLLEGE_PRICING')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${activeCommittee === 'COLLEGE_PRICING'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <Tag className={`w-4 h-4 ${activeCommittee === 'COLLEGE_PRICING' ? 'text-white' : 'text-slate-700'}`} />
                <span className={`text-[10px] font-bold ${activeCommittee === 'COLLEGE_PRICING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  FEES
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold">Pricing Exceptions</h4>
                <p className={`text-[11px] mt-0.5 ${activeCommittee === 'COLLEGE_PRICING' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Contingent fee matrix
                </p>
              </div>
              <div className={`mt-2.5 pt-2 border-t text-[10px] font-bold flex justify-between ${activeCommittee === 'COLLEGE_PRICING' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}>
                <span>{activeCommittee === 'COLLEGE_PRICING' ? '● Active' : 'Switch'}</span>
                <span>Config</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Scoped Metric Cards */}
      {activeCommittee !== 'FLAGS' && activeCommittee !== 'AUDIT_LOGS' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeCommittee === 'STAGE' ? 'Track Performers' : 'Registrations'}
              </span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {activeCommittee === 'STAGE'
                ? stageMetrics?.totalTrackRegistrations || 0
                : currentMetrics.totalRegistrations}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              {activeCommittee === 'STAGE'
                ? `${stageMetrics?.totalPerformers || 0} Registered Performers`
                : `${currentMetrics.paidRegistrations} Confirmed Passes`}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeCommittee === 'STAGE'
                  ? 'Tracks Ready'
                  : 'Revenue Collected'}
              </span>
              {activeCommittee === 'STAGE' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {activeCommittee === 'STAGE'
                ? stageMetrics?.tracksAttached || 0
                : `₹${currentMetrics.totalRevenueInr.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              {activeCommittee === 'INFORMALZ'
                ? 'Day Passes (₹150 / ₹250)'
                : activeCommittee === 'STAGE'
                  ? 'Audio links attached'
                  : 'Razorpay + Desk Cash'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeCommittee === 'STAGE' ? 'Action Required' : 'Gate Checked In'}
              </span>
              <Scan className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
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

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeCommittee === 'STAGE' ? 'Track Events' : 'Active Events'}
              </span>
              <Calendar className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {activeCommittee === 'INFORMALZ'
                ? informalzCount
                : activeCommittee === 'RI'
                  ? riCount
                  : activeCommittee === 'STAGE'
                    ? trackCount
                    : events.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
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
      {/* 📊 SECTION: DAILY COMMITTEE TRACKING (HEADS & SUBHEADS) */}
      {/* ========================================================================= */}
      {activeCommittee === 'DAILY_TRACKING' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <SuperAdminDailyTracking />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🤝 SECTION: SPONSORSHIP & CORPORATE PARTNERSHIPS OVERVIEW */}
      {/* ========================================================================= */}
      {activeCommittee === 'SPONSORSHIP' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  sponsor@lv2026
                </span>
                <span className="text-xs text-emerald-300 font-mono">Dedicated Portal: /committee/sponsorship</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Sponsorship &amp; Brand Partnerships Oversight</h3>
              <p className="text-xs text-slate-300">
                Corporate brand pitches, confirmed sponsorships, signed MoUs, and fund receipts verification.
              </p>
            </div>
            <Link
              href="/committee/sponsorship"
              target="_blank"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SponsorshipManager allowEdit={true} isSuperAdmin={true} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚚 SECTION: INFRASTRUCTURE VENDOR CONTRACTS & LOGISTICS */}
      {/* ========================================================================= */}
      {activeCommittee === 'INFRA_VENDORS' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <InfraVendorManager />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ SECTION 0.5: IMMUTABLE OPERATOR AUDIT TRAIL (POSTGRESQL) */}
      {/* ========================================================================= */}
      {activeCommittee === 'AUDIT_LOGS' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <AuditLogsViewer />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏛️ SECTION 0.6: COLLEGE CONTINGENT DELEGATIONS & DRILLDOWN */}
      {/* ========================================================================= */}
      {activeCommittee === 'COLLEGE_DELEGATIONS' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Inter-College Delegations Hub
                </span>
                <span className="text-xs text-slate-500 font-medium">Super Admin Access</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">College Contingent Registrations</h3>
              <p className="text-xs text-slate-600">
                Drill down into registered institutions, view contingent leaders, activities, and individual attendee passes.
              </p>
            </div>
            <CollegeDelegationsView />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏷️ SECTION 0.7: COLLEGE PRICING EXCEPTIONS CONFIGURATOR */}
      {/* ========================================================================= */}
      {activeCommittee === 'COLLEGE_PRICING' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-600" />
                  Pricing Exceptions Configurator
                </span>
                <span className="text-xs text-slate-500 font-medium">Live Server Matrix</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">College Registration Event Pricing Exceptions</h3>
              <p className="text-xs text-slate-600">
                Configure which events incur an additive fee or replace the base campus entry fee for college delegations.
              </p>
            </div>
            <CollegePricingExceptionsManager events={events} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎵 SECTION: CULTURAL MUSIC COMMITTEE WORKSPACE */}
      {/* ========================================================================= */}
      {activeCommittee === 'MUSIC' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  melody@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/music</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Cultural Music Operations &amp; Soundtracks</h3>
              <p className="text-xs text-slate-600">
                Attendees, vocal track submissions, and band audio cues for all music events.
              </p>
            </div>
            <Link
              href="/committee/music"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
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

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  rhythm@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/dance</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Cultural Dance Operations &amp; Soundtracks</h3>
              <p className="text-xs text-slate-600">
                Attendees, choreography soundtrack submissions, and stage cues for solo &amp; group dances.
              </p>
            </div>
            <Link
              href="/committee/dance"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
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

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  vogue@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/fashion</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Cultural Fashion Operations</h3>
              <p className="text-xs text-slate-600">
                Runway model teams, styling groups, and attendee records for fashion shows.
              </p>
            </div>
            <Link
              href="/committee/fashion"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  drama@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/theatre</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Cultural Theatre Operations</h3>
              <p className="text-xs text-slate-600">
                Nukkad Natak, stage plays, mono-acts, and theater troupe rosters.
              </p>
            </div>
            <Link
              href="/committee/theatre"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  words@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/literary</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Literary &amp; Quizzing Operations</h3>
              <p className="text-xs text-slate-600">
                Debaters, quizzers, poetry slams, and creative writing attendee rosters.
              </p>
            </div>
            <Link
              href="/committee/literary"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  nexus@lv321
                </span>
                <span className="text-xs text-slate-500 font-mono">Dedicated Portal: /committee/gaming</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Esports &amp; Gaming Operations</h3>
              <p className="text-xs text-slate-600">
                Squad rosters, in-game tags, and tournament brackets for BGMI, Valorant, FIFA.
              </p>
            </div>
            <Link
              href="/committee/gaming"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              Open Live Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
            <AdminEventsManager
              initialEvents={events}
              categoryFilter="Informalz"
              defaultCategory="Informalz"
              apiEndpoint="/api/super-admin/events"
              title="Informalz Committee Events (Day Pass System)"
              subtitle="Full CRUD on informal, social, and gaming activities covered under the ₹150 / ₹250 Day Pass."
            />
          </section>

          <section>
            <AdminRegistrationsTable
              apiEndpoint="/api/admin/registrations?category=informalz"
              title="Informalz Attendee Registry"
              subtitle="Day pass holders, participant rosters, and gate attendance for all informal activities."
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
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
