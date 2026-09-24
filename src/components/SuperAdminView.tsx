'use client';

import React, { useState } from 'react';
import AdminEventsManager from '@/components/AdminEventsManager';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
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

interface SuperAdminViewProps {
  events: InitialEventData[];
  masterMetrics: MetricsData;
  riMetrics: MetricsData;
  informalzMetrics: MetricsData;
}

export default function SuperAdminView({
  events,
  masterMetrics,
  riMetrics,
  informalzMetrics,
}: SuperAdminViewProps) {
  const [activeCommittee, setActiveCommittee] = useState<'RI' | 'INFORMALZ' | 'ALL'>('RI');

  const informalzCount = events.filter((e) => e.category.toLowerCase() === 'informalz').length;
  const riCount = events.filter((e) => e.category.toLowerCase() !== 'informalz').length;

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                Registration & Invitation. Competitive stage, cultural, and gaming events.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {riCount} Events Configured
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'RI' ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'RI' ? '● Active View' : 'Switch →'}
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
                Social fun, sports challenges, and open talent events with zero entry fee.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {informalzCount} Informal Activities
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'INFORMALZ' ? 'text-purple-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'INFORMALZ' ? '● Active View' : 'Switch →'}
              </span>
            </div>
          </button>

          {/* 3. Master View Tab */}
          <button
            type="button"
            onClick={() => setActiveCommittee('ALL')}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
              activeCommittee === 'ALL'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-2 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCommittee === 'ALL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Master Overview
                </span>
                <Layers
                  className={`w-4 h-4 ${
                    activeCommittee === 'ALL' ? 'text-amber-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">
                All Combined
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Festival-wide aggregate of all committees, total revenue, and passes.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {events.length} Total Events
              </span>
              <span
                className={`font-bold ${
                  activeCommittee === 'ALL' ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {activeCommittee === 'ALL' ? '● Active View' : 'Switch →'}
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
              Registrations
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white block">
            {currentMetrics.totalRegistrations}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium block mt-1">
            {currentMetrics.paidRegistrations} Confirmed Passes
          </span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeCommittee === 'INFORMALZ' ? 'Event Pricing' : 'Revenue Collected'}
            </span>
            {activeCommittee === 'INFORMALZ' ? (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            ) : (
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white block">
            {activeCommittee === 'INFORMALZ'
              ? 'FREE (₹0)'
              : `₹${currentMetrics.totalRevenueInr.toLocaleString('en-IN')}`}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {activeCommittee === 'INFORMALZ'
              ? '100% Free Activities'
              : 'Razorpay + Desk Cash'}
          </span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gate Checked In
            </span>
            <Scan className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white block">
            {currentMetrics.totalCheckedInTickets}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            of {currentMetrics.totalIssuedTickets} passes ({currentMetrics.checkInPercentage}%)
          </span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Events
            </span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white block">
            {activeCommittee === 'INFORMALZ'
              ? informalzCount
              : activeCommittee === 'RI'
              ? riCount
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
      {/* 🌐 SECTION 3: MASTER OVERVIEW (ALL COMBINED) */}
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
