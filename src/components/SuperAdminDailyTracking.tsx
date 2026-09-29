'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyTrackingItem,
  TrackingStatus,
  DailyTrackingStatsResponse,
} from '@/lib/dailyTrackingTypes';
import { COMMITTEE_METAS } from '@/lib/committeeConstants';
import {
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
  X,
  ShieldCheck,
  User,
  Paperclip,
  Building2,
  Check,
  Flame,
  FileSpreadsheet,
  ArrowUpRight,
  Send,
  Eye,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function SuperAdminDailyTracking() {
  const [items, setItems] = useState<DailyTrackingItem[]>([]);
  const [stats, setStats] = useState<DailyTrackingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedCommittee, setSelectedCommittee] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [headFilter, setHeadFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Remarks Modal State
  const [remarkModalItem, setRemarkModalItem] = useState<DailyTrackingItem | null>(null);
  const [adminRemarkText, setAdminRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  // Expanded Committees & Heads in accordion view
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
      setError((err as Error).message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Expand all committees initially
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

  // Filtered Items
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

  // Unique heads across items for filter dropdown
  const uniqueHeads = useMemo(() => {
    const s = new Set<string>();
    for (const item of items) {
      s.add(item.head);
    }
    return Array.from(s);
  }, [items]);

  const openRemarkModal = (item: DailyTrackingItem) => {
    setRemarkModalItem(item);
    setAdminRemarkText(item.superAdminRemarks || '');
  };

  const handleSaveRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkModalItem) return;

    setSubmittingRemark(true);
    try {
      const res = await fetch(`/api/daily-tracking/${remarkModalItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminRemarks: adminRemarkText.trim() || null,
          superAdminReviewed: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRemarkModalItem(null);
        await fetchData();
      } else {
        alert(data.error || 'Failed to submit remarks');
      }
    } catch (err) {
      alert((err as Error).message || 'Error saving remark');
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleQuickReview = async (item: DailyTrackingItem) => {
    try {
      const res = await fetch(`/api/daily-tracking/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminReviewed: !item.superAdminReviewed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, superAdminReviewed: !item.superAdminReviewed } : i))
        );
      }
    } catch {
      // Non-fatal
    }
  };

  // Export CSV functionality
  const exportCsv = () => {
    if (filteredItems.length === 0) {
      alert('No tracking records to export.');
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Committee',
      'Department Head',
      'Subhead',
      'Title',
      'Work Description',
      'Status',
      'Progress %',
      'Reported Blockers',
      'Operator Name',
      'Operator Roll No',
      'Super Admin Remarks',
      'Reviewed',
    ];

    const rows = filteredItems.map((i) => [
      i.id,
      i.date,
      `"${i.committeeName}"`,
      `"${i.head}"`,
      `"${i.subhead}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.workDescription.replace(/"/g, '""')}"`,
      i.status,
      `${i.progressPercentage}%`,
      `"${(i.blockers || '').replace(/"/g, '""')}"`,
      `"${i.operatorName}"`,
      i.operatorRollNo,
      `"${(i.superAdminRemarks || '').replace(/"/g, '""')}"`,
      i.superAdminReviewed ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `festos_daily_tracking_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="space-y-6">
      {/* Master Overview KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Meter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reporting Compliance
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              Today
            </span>
          </div>
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

        {/* Overall Festival Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Progress
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Avg Milestone
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.overallProgressPercentage ?? 0}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              across {stats?.totalUpdatesOverall ?? 0} logged tasks
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats?.overallProgressPercentage ?? 0}%` }}
            />
          </div>
        </div>

        {/* Today's Total Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Updates Logged Today
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
              {todayStr}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-blue-400">
              {stats?.updatesLoggedToday ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">entries received</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Real-time synchronization from all active committee consoles.
          </p>
        </div>

        {/* Critical Blockers Alert */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Active Blockers
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
              Attention
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {stats?.activeBlockersCount ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">bottlenecks flagged</span>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-2">
            Tasks currently impeded by permissions, vendors, or materials.
          </p>
        </div>
      </div>

      {/* Committee Reporting Compliance Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Committee Daily Submission Status (Today)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click on any committee pill to isolate its workstream
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
            All Committees ({items.length})
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
              {comm.updatedToday ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300">
                  {comm.totalItemsToday}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">pending</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Blocker Radar (if any blockers exist) */}
      {stats?.recentBlockers && stats.recentBlockers.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Urgent Blocker Radar ({stats.recentBlockers.length} Items Needing Action)
              </h3>
            </div>
            <span className="text-xs text-rose-300 font-medium">Super Admin Direct Intervention</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.recentBlockers.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {b.committeeName}
                    </span>
                    <span className="text-[11px] text-slate-400">{b.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{b.title}</h4>
                  <p className="text-xs text-rose-300/90 mt-1 font-medium bg-rose-950/40 p-2 rounded-lg border border-rose-900/30">
                    &bull; {b.blockers}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 mt-2 border-t border-slate-800">
                  <span>
                    Coordinator: <strong className="text-slate-300">{b.operatorName}</strong> ({b.operatorRollNo})
                  </span>
                  <button
                    onClick={() => openRemarkModal(b)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Send Guidance</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Action Toolbar */}
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search across all committees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Committee Workstream Explorer */}
      <div className="space-y-5">
        {loading ? (
          <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading master committee tracking logs...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        ) : Object.keys(groupedByCommittee).length === 0 ? (
          <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">No tracking records found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              No entries match the currently applied committee, date, or status filters.
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
                {/* Committee Header Bar */}
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
                          {committeeMeta?.badge || 'Committee Core'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Object.keys(heads).length} Department Heads &bull; {totalCommItems} Work Entries
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {totalCommItems} Tasks
                  </span>
                </button>

                {/* Heads and Subheads Section */}
                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {Object.entries(heads).map(([head, subheads]) => (
                      <div
                        key={head}
                        className="border border-slate-800/80 rounded-xl bg-slate-950/50 p-4 space-y-4"
                      >
                        {/* Head Title */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Head: {head}
                            </h4>
                          </div>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {Object.keys(subheads).length} subheads
                          </span>
                        </div>

                        {/* Subheads */}
                        {Object.entries(subheads).map(([subhead, tasks]) => (
                          <div key={subhead} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <h5 className="text-xs font-semibold text-indigo-300">
                                Subhead: <strong className="text-white">{subhead}</strong>
                              </h5>
                              <span className="text-[10px] text-slate-500 font-medium">
                                ({tasks.length} updates)
                              </span>
                            </div>

                            {/* Task Cards Grid */}
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

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => handleQuickReview(task)}
                                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            task.superAdminReviewed
                                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
                                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                          }`}
                                          title={
                                            task.superAdminReviewed
                                              ? 'Click to unmark reviewed'
                                              : 'Click to mark reviewed'
                                          }
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => openRemarkModal(task)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                                          title="Add Super Admin Guidance/Remark"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                                      {task.workDescription}
                                    </p>

                                    {/* Reported Blocker Notice */}
                                    {task.blockers && (
                                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs mb-3">
                                        <div className="flex items-center gap-1.5 font-bold mb-0.5 text-rose-200">
                                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                                          <span>Reported Blocker:</span>
                                        </div>
                                        <p className="text-[11px] leading-tight">{task.blockers}</p>
                                      </div>
                                    )}

                                    {/* Super Admin Remark Display */}
                                    {task.superAdminRemarks && (
                                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60 text-amber-300 text-xs mb-3">
                                        <div className="flex items-center gap-1 font-bold text-amber-200 mb-0.5">
                                          <MessageSquare className="w-3 h-3 text-amber-400" />
                                          <span>Super Admin Directive / Remark:</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-amber-200/90">
                                          {task.superAdminRemarks}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    {/* Milestone Progress Bar */}
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

                                    {/* Card Footer: Operator & Proof */}
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

      {/* Super Admin Remarks Modal */}
      {remarkModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Super Admin Console
                </span>
                <h3 className="text-base font-bold text-white">
                  Add Remarks / Directive to Task
                </h3>
              </div>
              <button
                onClick={() => setRemarkModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block font-semibold mb-0.5">
                Committee: {remarkModalItem.committeeName}
              </span>
              <span className="text-white font-bold block mb-1">
                {remarkModalItem.title}
              </span>
              <span className="text-slate-400 block text-[11px]">
                Head: {remarkModalItem.head} &bull; Subhead: {remarkModalItem.subhead}
              </span>
            </div>

            <form onSubmit={handleSaveRemark} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Super Admin Guidance / Remarks / Action Item
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide instructions, approval notice, vendor contact, or resolution guidance for this committee..."
                  value={adminRemarkText}
                  onChange={(e) => setAdminRemarkText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRemarkModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRemark}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submittingRemark && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
