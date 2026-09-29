'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyTrackingItem,
  TrackingStatus,
  DailyTrackingStatsResponse,
} from '@/lib/dailyTrackingTypes';
import { COMMITTEE_METAS } from '@/lib/committeeConstants';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Sliders,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  User,
  Paperclip,
  Flame,
  ArrowUpRight,
  Layers,
  Sparkles,
  Lock,
  Tag,
  Check,
  HelpCircle,
} from 'lucide-react';

export default function ManagementDailyTracking() {
  const [items, setItems] = useState<DailyTrackingItem[]>([]);
  const [stats, setStats] = useState<DailyTrackingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filter States
  const [selectedCommittee, setSelectedCommittee] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [headFilter, setHeadFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state
  const [expandedCommittees, setExpandedCommittees] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      setError(null);
      const [itemsRes, statsRes] = await Promise.all([
        fetch('/api/daily-tracking', { cache: 'no-store' }),
        fetch('/api/daily-tracking/stats', { cache: 'no-store' }),
      ]);

      const itemsData = await itemsRes.json();
      const statsData = await statsRes.json();

      if (itemsData.success) {
        setItems(itemsData.items || []);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch executive tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const comms: Record<string, boolean> = {};
    for (const meta of COMMITTEE_METAS) {
      comms[meta.id] = true;
    }
    setExpandedCommittees((prev) => ({ ...comms, ...prev }));
  }, []);

  const toggleCommittee = (commId: string) => {
    setExpandedCommittees((prev) => ({ ...prev, [commId]: !prev[commId] }));
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCommittee !== 'ALL' && item.committeeId !== selectedCommittee) return false;
      if (dateFilter === 'TODAY' && item.date !== todayStr) return false;
      if (dateFilter === 'CUSTOM' && item.date !== customDate) return false;
      if (headFilter !== 'ALL' && item.head.toLowerCase() !== headFilter.toLowerCase()) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.workDescription.toLowerCase().includes(q) ||
          item.committeeName.toLowerCase().includes(q) ||
          item.head.toLowerCase().includes(q) ||
          item.subhead.toLowerCase().includes(q) ||
          item.operatorName.toLowerCase().includes(q) ||
          (item.blockers && item.blockers.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [items, selectedCommittee, dateFilter, customDate, headFilter, statusFilter, searchQuery, todayStr]);

  // Group by Committee -> Head -> Subhead
  const groupedByCommittee = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, DailyTrackingItem[]>>> = {};

    for (const item of filteredItems) {
      if (!tree[item.committeeId]) {
        tree[item.committeeId] = {};
      }
      if (!tree[item.committeeId][item.head]) {
        tree[item.committeeId][item.head] = {};
      }
      if (!tree[item.committeeId][item.head][item.subhead]) {
        tree[item.committeeId][item.head][item.subhead] = [];
      }
      tree[item.committeeId][item.head][item.subhead].push(item);
    }

    return tree;
  }, [filteredItems]);

  const uniqueHeads = useMemo(() => {
    const s = new Set<string>();
    for (const item of items) {
      s.add(item.head);
    }
    return Array.from(s);
  }, [items]);

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-800">
            <Clock className="w-3 h-3 text-blue-400" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Blocked
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Executive Observatory Header Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Executive Observatory
            </span>
            <span className="text-xs text-slate-500 font-medium">Read-Only Oversight</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Committee Work &amp; Daily Tracking Observatory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic institutional oversight of daily committee operations, department heads progress, and high-priority bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Daily Reporting Compliance
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.reportingCompliancePercentage ?? 0}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats?.committeesReportingTodayCount ?? 0}/{stats?.totalCommitteesCount ?? 0} Committees)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats?.reportingCompliancePercentage ?? 0}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Campus-Wide Progress
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.overallProgressPercentage ?? 0}%
            </span>
            <span className="text-xs text-slate-400 font-medium">overall completion</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats?.overallProgressPercentage ?? 0}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Updates Logged Today
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-blue-400">
              {stats?.updatesLoggedToday ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {stats?.totalUpdatesOverall ?? 0} total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Synchronized from committee portals.</p>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Active Critical Blockers
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {stats?.activeBlockersCount ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">impediments</span>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-2">
            Items requiring management or faculty intervention.
          </p>
        </div>
      </div>

      {/* Department Head Progress Matrix */}
      {stats?.headWiseStats && stats.headWiseStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">
                Functional Department Readiness Matrix
              </h3>
            </div>
            <span className="text-xs text-slate-400">Aggregated across all committees</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.headWiseStats.map((h) => (
              <div
                key={h.head}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate">{h.head}</span>
                    <span className="text-xs font-extrabold text-indigo-400">
                      {h.avgProgress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full"
                      style={{ width: `${h.avgProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                  <span>{h.totalItems} work logs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">{h.completedCount} done</span>
                    {h.blockedCount > 0 && (
                      <span className="text-rose-400 font-semibold">{h.blockedCount} blocked</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committee Filter Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Committee Scope Filter
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Select a committee to inspect its workstream
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCommittee('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCommittee === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Committees
          </button>

          {stats?.committeeComplianceList.map((comm) => (
            <button
              key={comm.committeeId}
              onClick={() => setSelectedCommittee(comm.committeeId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                selectedCommittee === comm.committeeId
                  ? 'bg-white text-slate-950 border-white shadow-xs'
                  : comm.updatedToday
                  ? 'bg-slate-800/90 text-slate-200 border-emerald-600/40 hover:bg-slate-800'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  comm.updatedToday ? 'bg-emerald-400 shadow-xs' : 'bg-slate-600'
                }`}
              />
              <span>{comm.committeeName.replace('Cultural ', '').replace(' Committee', '')}</span>
              {comm.updatedToday && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300">
                  {comm.totalItemsToday}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === 'TODAY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today Only
            </button>
            <button
              onClick={() => setDateFilter('CUSTOM')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {dateFilter === 'CUSTOM' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {/* Department Head Selector */}
          <select
            value={headFilter}
            onChange={(e) => setHeadFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Heads / Departments</option>
            {uniqueHeads.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DELAYED">Delayed</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search journal entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Committee Workstream Journal */}
      <div className="space-y-5">
        {loading ? (
          <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading committee tracking observatory...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        ) : Object.keys(groupedByCommittee).length === 0 ? (
          <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">No entries match your search criteria</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Adjust your committee or date filters to inspect logged work.
            </p>
          </div>
        ) : (
          Object.entries(groupedByCommittee).map(([commId, heads]) => {
            const committeeMeta = COMMITTEE_METAS.find((c) => c.id === commId);
            const commName = committeeMeta?.name || commId;
            const isExpanded = expandedCommittees[commId] !== false;
            const totalCommItems = Object.values(heads)
              .flatMap((h) => Object.values(h))
              .flat().length;

            return (
              <div
                key={commId}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Committee Header */}
                <button
                  type="button"
                  onClick={() => toggleCommittee(commId)}
                  className="w-full px-6 py-4 bg-slate-950/80 hover:bg-slate-950 border-b border-slate-800 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white tracking-tight">
                          {commName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {committeeMeta?.badge || 'Committee'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Object.keys(heads).length} Heads &bull; {totalCommItems} Work Records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {totalCommItems} Records
                  </span>
                </button>

                {/* Subheads and Tasks */}
                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {Object.entries(heads).map(([head, subheads]) => (
                      <div
                        key={head}
                        className="border border-slate-800/80 rounded-xl bg-slate-950/50 p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Head: {head}
                            </h4>
                          </div>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {Object.keys(subheads).length} Subheads
                          </span>
                        </div>

                        {Object.entries(subheads).map(([subhead, tasks]) => (
                          <div key={subhead} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <h5 className="text-xs font-semibold text-indigo-300">
                                Subhead: <strong className="text-white">{subhead}</strong>
                              </h5>
                              <span className="text-[10px] text-slate-500">
                                ({tasks.length} entries)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`p-4 rounded-xl border transition-all ${
                                    task.status === 'BLOCKED'
                                      ? 'bg-rose-950/20 border-rose-800/60'
                                      : task.status === 'COMPLETED'
                                      ? 'bg-emerald-950/20 border-emerald-800/50'
                                      : 'bg-slate-900 border-slate-800'
                                  } flex flex-col justify-between`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                            {task.date}
                                          </span>
                                          {getStatusBadge(task.status)}
                                          {task.superAdminReviewed && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                                              <ShieldCheck className="w-2.5 h-2.5" /> Reviewed
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-sm font-bold text-white leading-snug">
                                          {task.title}
                                        </h5>
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                                      {task.workDescription}
                                    </p>

                                    {task.blockers && (
                                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs mb-3">
                                        <div className="flex items-center gap-1.5 font-bold mb-0.5 text-rose-200">
                                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                                          <span>Reported Blocker:</span>
                                        </div>
                                        <p className="text-[11px] leading-tight">{task.blockers}</p>
                                      </div>
                                    )}

                                    {task.superAdminRemarks && (
                                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60 text-amber-300 text-xs mb-3">
                                        <div className="flex items-center gap-1 font-bold text-amber-200 mb-0.5">
                                          <MessageSquare className="w-3 h-3 text-amber-400" />
                                          <span>Super Admin Remark:</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-amber-200/90">
                                          {task.superAdminRemarks}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="space-y-1 mb-2 pt-2 border-t border-slate-800">
                                      <div className="flex justify-between text-[11px] font-semibold">
                                        <span className="text-slate-400">Milestone Progress</span>
                                        <span className="text-white">{task.progressPercentage}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${
                                            task.status === 'COMPLETED'
                                              ? 'bg-emerald-500'
                                              : task.status === 'BLOCKED'
                                              ? 'bg-rose-500'
                                              : 'bg-indigo-500'
                                          }`}
                                          style={{ width: `${task.progressPercentage}%` }}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                                      <div className="flex items-center gap-1.5 truncate pr-2">
                                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span className="font-semibold text-slate-200 truncate">
                                          {task.operatorName}
                                        </span>
                                        <span className="text-[10px] text-slate-500 shrink-0">
                                          ({task.operatorRollNo})
                                        </span>
                                      </div>

                                      {task.attachmentsUrl && (
                                        <a
                                          href={task.attachmentsUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold shrink-0"
                                        >
                                          <Paperclip className="w-3 h-3" />
                                          <span>Proof</span>
                                          <ArrowUpRight className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
