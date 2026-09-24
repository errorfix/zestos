'use client';

import React, { useState } from 'react';
import AdminEventsManager from '@/components/AdminEventsManager';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import StageRegistrationsManager from '@/components/StageRegistrationsManager';
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

export default function SuperAdminView({
  events,
  masterMetrics,
  riMetrics,
  informalzMetrics,
  stageMetrics,
}: SuperAdminViewProps) {
  const [activeCommittee, setActiveCommittee] = useState<'RI' | 'INFORMALZ' | 'STAGE' | 'ONSPOT' | 'ALL'>('RI');

  const informalzCount = events.filter((e) => e.category.toLowerCase() === 'informalz').length;
  const riCount = events.filter((e) => e.category.toLowerCase() !== 'informalz').length;
  const trackCount = events.filter((e) => e.requiresTrackUpload === true).length;

  const currentMetrics =
    activeCommittee === 'INFORMALZ'
      ? informalzMetrics
      : activeCommittee === 'RI'
      ? riMetrics
      : masterMetrics;

  return (
    <div className="space-y-8">
      {/* Committee Switcher Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Select Committee Workspace
          </span>
          <span className="text-xs text-slate-400">
            Isolated events & registry view
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. R&I Committee Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('RI')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'RI'
                ? 'bg-blue-950/40 border-blue-500 shadow-lg ring-2 ring-blue-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'RI'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Competitive & Paid
                </span>
                <Trophy
                  className={`w-4 h-4 ${
                    activeCommittee === 'RI' ? 'text-blue-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                R&I Committee
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Competitive stage, cultural, and gaming events.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {riCount} Events
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'RI' ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'RI' ? '● Active' : 'Switch →'}
              </span>
            </div>
          </button>

          {/* 2. Informalz Committee Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('INFORMALZ')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'INFORMALZ'
                ? 'bg-purple-950/40 border-purple-500 shadow-lg ring-2 ring-purple-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'INFORMALZ'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  100% Free Events
                </span>
                <PartyPopper
                  className={`w-4 h-4 ${
                    activeCommittee === 'INFORMALZ' ? 'text-purple-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                Informalz Committee
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-fee campus fun, social and gaming activities.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {informalzCount} Activities
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'INFORMALZ' ? 'text-purple-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'INFORMALZ' ? '● Active' : 'Switch →'}
              </span>
            </div>
          </button>

          {/* 3. Stage Committee Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('STAGE')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'STAGE'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-2 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'STAGE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Audio &amp; Tracks
                </span>
                <Mic2
                  className={`w-4 h-4 ${
                    activeCommittee === 'STAGE' ? 'text-amber-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                Stage Committee
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Audio tracks, AV cues, and manual sound desk uploads.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {trackCount} Track Events
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'STAGE' ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'STAGE' ? '● Active' : 'Switch →'}
              </span>
            </div>
          </button>

          {/* 4. On-Spot Walk-In Counter Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('ONSPOT')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'ONSPOT'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'ONSPOT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Walk-in Pricing
                </span>
                <Banknote
                  className={`w-4 h-4 ${
                    activeCommittee === 'ONSPOT' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                On-Spot Counter
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Walk-in counter prices, desk surges &amp; cash/UPI audit.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {events.length} Events Configured
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'ONSPOT' ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'ONSPOT' ? '● Active' : 'Switch →'}
              </span>
            </div>
          </button>

          {/* 5. Master View Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('ALL')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'ALL'
                ? 'bg-slate-800 border-slate-500 shadow-lg ring-2 ring-slate-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'ALL'
                      ? 'bg-slate-700 text-slate-200 border border-slate-600'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Master View
                </span>
                <Layers
                  className={`w-4 h-4 ${
                    activeCommittee === 'ALL' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                All Combined
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Festival-wide aggregate of all operations &amp; revenue.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {events.length} Total Events
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'ALL' ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'ALL' ? '● Active' : 'Switch →'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Scoped Metric Cards */}
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
