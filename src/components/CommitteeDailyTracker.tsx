'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DailyTrackingItem, TrackingStatus, PRESET_HEADS } from '@/lib/dailyTrackingTypes';
import OperatorIdentityModal, { getLocalOperator, OperatorIdentity } from './OperatorIdentityModal';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Sliders,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
  Paperclip,
  Check,
  HelpCircle,
  Tag,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface CommitteeDailyTrackerProps {
  committeeId: string;
  committeeName: string;
  themeColor?: {
    badgeBg: string;
    badgeText: string;
    border: string;
    iconBg: string;
    text: string;
  };
}

export default function CommitteeDailyTracker({
  committeeId,
  committeeName,
  themeColor,
}: CommitteeDailyTrackerProps) {
  const [items, setItems] = useState<DailyTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Available Heads & Subheads
  const [availableHeads, setAvailableHeads] = useState<Record<string, string[]>>(PRESET_HEADS);

  // Filter States
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [headFilter, setHeadFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded Heads accordion state
  const [expandedHeads, setExpandedHeads] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyTrackingItem | null>(null);

  // Form Fields
  const [formHead, setFormHead] = useState('');
  const [isCustomHead, setIsCustomHead] = useState(false);
  const [customHeadName, setCustomHeadName] = useState('');

  const [formSubhead, setFormSubhead] = useState('');
  const [isCustomSubhead, setIsCustomSubhead] = useState(false);
  const [customSubheadName, setCustomSubheadName] = useState('');

  const [formDate, setFormDate] = useState(todayStr);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TrackingStatus>('IN_PROGRESS');
  const [formProgress, setFormProgress] = useState(50);
  const [formBlockers, setFormBlockers] = useState('');
  const [formAttachmentsUrl, setFormAttachmentsUrl] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Operator check
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [operator, setOperator] = useState<OperatorIdentity | null>(null);

  const fetchItems = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/daily-tracking?committeeId=${encodeURIComponent(committeeId)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || 'Failed to load tracking items');
      }
    } catch (err) {
      setError((err as Error).message || 'Network error loading tracking items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHeads = async () => {
    try {
      const res = await fetch('/api/daily-tracking/heads');
      const data = await res.json();
      if (data.success && data.headsAndSubheads) {
        setAvailableHeads(data.headsAndSubheads);
      }
    } catch {
      // Fallback to preset
    }
  };

  useEffect(() => {
    fetchItems();
    fetchHeads();
    setOperator(getLocalOperator());

    const handleOpUpdate = () => setOperator(getLocalOperator());
    window.addEventListener('festos_operator_updated', handleOpUpdate);
    return () => window.removeEventListener('festos_operator_updated', handleOpUpdate);
  }, [committeeId]);

  // Expand all heads by default when items load
  useEffect(() => {
    const heads: Record<string, boolean> = {};
    for (const item of items) {
      heads[item.head] = true;
    }
    setExpandedHeads((prev) => ({ ...heads, ...prev }));
  }, [items]);

  const toggleHeadAccordion = (head: string) => {
    setExpandedHeads((prev) => ({ ...prev, [head]: !prev[head] }));
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Date filter
      if (dateFilter === 'TODAY' && item.date !== todayStr) return false;
      if (dateFilter === 'CUSTOM' && item.date !== customDate) return false;

      // Head filter
      if (headFilter !== 'ALL' && item.head.toLowerCase() !== headFilter.toLowerCase()) return false;

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.workDescription.toLowerCase().includes(q) ||
          item.head.toLowerCase().includes(q) ||
          item.subhead.toLowerCase().includes(q) ||
          item.operatorName.toLowerCase().includes(q) ||
          (item.blockers && item.blockers.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [items, dateFilter, customDate, headFilter, statusFilter, searchQuery, todayStr]);

  // Group items by Head -> Subhead
  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, DailyTrackingItem[]>> = {};

    for (const item of filteredItems) {
      if (!groups[item.head]) {
        groups[item.head] = {};
      }
      if (!groups[item.head][item.subhead]) {
        groups[item.head][item.subhead] = [];
      }
      groups[item.head][item.subhead].push(item);
    }

    return groups;
  }, [filteredItems]);

  // KPI calculations
  const todayUpdatesCount = items.filter((i) => i.date === todayStr).length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const blockedCount = items.filter((i) => i.status === 'BLOCKED' || i.status === 'DELAYED').length;

  const openCreateModal = () => {
    setEditingItem(null);
    const defaultHead = Object.keys(availableHeads)[0] || 'Logistics & Infrastructure';
    setFormHead(defaultHead);
    setIsCustomHead(false);
    setCustomHeadName('');

    const defaultSub = (availableHeads[defaultHead] && availableHeads[defaultHead][0]) || '';
    setFormSubhead(defaultSub);
    setIsCustomSubhead(false);
    setCustomSubheadName('');

    setFormDate(todayStr);
    setFormTitle('');
    setFormDescription('');
    setFormStatus('IN_PROGRESS');
    setFormProgress(50);
    setFormBlockers('');
    setFormAttachmentsUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: DailyTrackingItem) => {
    setEditingItem(item);
    setFormHead(item.head);
    setIsCustomHead(false);
    setCustomHeadName('');

    setFormSubhead(item.subhead);
    setIsCustomSubhead(false);
    setCustomSubheadName('');

    setFormDate(item.date);
    setFormTitle(item.title);
    setFormDescription(item.workDescription);
    setFormStatus(item.status);
    setFormProgress(item.progressPercentage);
    setFormBlockers(item.blockers || '');
    setFormAttachmentsUrl(item.attachmentsUrl || '');
    setIsModalOpen(true);
  };

  const handleHeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomHead(true);
      setFormHead('');
      setFormSubhead('');
      setIsCustomSubhead(true);
    } else {
      setIsCustomHead(false);
      setFormHead(val);
      const subs = availableHeads[val] || [];
      setFormSubhead(subs[0] || '');
      setIsCustomSubhead(false);
    }
  };

  const handleSubheadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomSubhead(true);
      setFormSubhead('');
    } else {
      setIsCustomSubhead(false);
      setFormSubhead(val);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentOp = getLocalOperator();
    if (!currentOp && !editingItem) {
      setIsIdentityModalOpen(true);
      return;
    }

    const finalHead = (isCustomHead ? customHeadName : formHead).trim();
    const finalSubhead = (isCustomSubhead ? customSubheadName : formSubhead).trim();

    if (!finalHead || !finalSubhead) {
      alert('Please specify both Head and Subhead.');
      return;
    }

    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Title and Work Done description are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/daily-tracking/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            head: finalHead,
            subhead: finalSubhead,
            title: formTitle.trim(),
            workDescription: formDescription.trim(),
            status: formStatus,
            progressPercentage: formProgress,
            blockers: formBlockers.trim() || null,
            attachmentsUrl: formAttachmentsUrl.trim() || null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchItems();
          await fetchHeads();
        } else {
          alert(data.error || 'Failed to update tracking item');
        }
      } else {
        // Create
        const res = await fetch('/api/daily-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            committeeId,
            committeeName,
            date: formDate,
            head: finalHead,
            subhead: finalSubhead,
            title: formTitle.trim(),
            workDescription: formDescription.trim(),
            status: formStatus,
            progressPercentage: formProgress,
            blockers: formBlockers.trim() || null,
            attachmentsUrl: formAttachmentsUrl.trim() || null,
            operatorName: currentOp?.operatorName,
            operatorRollNo: currentOp?.operatorRollNo,
            operatorType: currentOp?.operatorType,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchItems();
          await fetchHeads();
        } else {
          alert(data.error || 'Failed to create tracking item');
        }
      }
    } catch (err) {
      alert((err as Error).message || 'Error saving tracking entry');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the daily tracking log: "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/daily-tracking/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert(data.error || 'Failed to delete tracking item');
      }
    } catch (err) {
      alert((err as Error).message || 'Error deleting item');
    }
  };

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Blocked
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Delayed
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <HelpCircle className="w-3 h-3 text-purple-600" /> Review
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-200/80 bg-linear-to-r from-slate-50 via-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-600" />
                Workstream Tracking
              </span>
              <span className="text-xs text-slate-500 font-medium">Daily Heads &amp; Subheads</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {committeeName} • Daily Tracking Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log daily milestone progress by department heads and subheads. Updates reflect synchronously in Super Admin and Higher Authority panels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchItems();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh tracking data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {operator ? (
              <button
                onClick={() => setIsIdentityModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Click to switch active operator profile"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{operator.operatorName.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400">({operator.operatorRollNo})</span>
              </button>
            ) : (
              <button
                onClick={() => setIsIdentityModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Identify Coordinator</span>
              </button>
            )}

            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Daily Work</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Today&apos;s Updates
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900">{todayUpdatesCount}</span>
              <span className="text-[10px] font-medium text-slate-400">entries today</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              In Progress
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-blue-600">{inProgressCount}</span>
              <span className="text-[10px] font-medium text-slate-400">active items</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Completed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-600">{completedCount}</span>
              <span className="text-[10px] font-medium text-slate-400">done</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Blockers / Attention
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-rose-600">{blockedCount}</span>
              <span className="text-[10px] font-medium text-slate-400">need action</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filters */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setDateFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Dates
              </button>
              <button
                onClick={() => setDateFilter('TODAY')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === 'TODAY'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today Only
              </button>
              <button
                onClick={() => setDateFilter('CUSTOM')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Date
              </button>
            </div>

            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            )}

            {/* Head Filter */}
            <select
              value={headFilter}
              onChange={(e) => setHeadFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Heads / Departments</option>
              {Object.keys(availableHeads).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DELAYED">Delayed</option>
              <option value="PENDING_REVIEW">Pending Review</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Body: Grouped by Head and Subhead */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading daily tracking entries...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No tracking logs recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Get started by logging your committee&apos;s daily work items under designated heads and subheads.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Entry</span>
            </button>
          </div>
        ) : (
          Object.entries(groupedData).map(([head, subheads]) => {
            const isExpanded = expandedHeads[head] !== false;
            const totalHeadItems = Object.values(subheads).flat().length;

            return (
              <div
                key={head}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-2xs transition-all"
              >
                {/* Head Banner / Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleHeadAccordion(head)}
                  className="w-full px-5 py-3.5 bg-slate-100 hover:bg-slate-200/70 border-b border-slate-200/80 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                        Head: {head}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {Object.keys(subheads).length} subheads &bull; {totalHeadItems} tracked work items
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-300">
                    {totalHeadItems} Items
                  </span>
                </button>

                {/* Subheads and Tasks Container */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5 bg-white">
                    {Object.entries(subheads).map(([subhead, taskItems]) => (
                      <div key={subhead} className="space-y-3">
                        {/* Subhead Label */}
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                            Subhead: <span className="text-indigo-900">{subhead}</span>
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({taskItems.length} logs)
                          </span>
                        </div>

                        {/* Task Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {taskItems.map((task) => (
                            <div
                              key={task.id}
                              className={`p-4 rounded-xl border transition-all ${
                                task.status === 'BLOCKED'
                                  ? 'bg-rose-50/40 border-rose-200'
                                  : task.status === 'COMPLETED'
                                  ? 'bg-emerald-50/30 border-emerald-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              } shadow-2xs flex flex-col justify-between`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                        {task.date}
                                      </span>
                                      {getStatusBadge(task.status)}
                                    </div>
                                    <h5 className="text-sm font-bold text-slate-900 leading-snug">
                                      {task.title}
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => openEditModal(task)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                      title="Edit entry"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(task.id, task.title)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-3">
                                  {task.workDescription}
                                </p>

                                {/* Blocker Warning Box */}
                                {task.blockers && (
                                  <div className="p-2.5 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 text-xs mb-3">
                                    <div className="flex items-center gap-1.5 font-bold mb-0.5 text-rose-900">
                                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                                      <span>Reported Blocker:</span>
                                    </div>
                                    <p className="text-[11px] leading-tight">{task.blockers}</p>
                                  </div>
                                )}

                                {/* Super Admin Feedback Callout */}
                                {task.superAdminRemarks && (
                                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-3">
                                    <div className="flex items-center gap-1 font-bold text-amber-950 mb-0.5">
                                      <MessageSquare className="w-3 h-3 text-amber-700" />
                                      <span>Super Admin Remark:</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800 leading-tight">
                                      {task.superAdminRemarks}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div>
                                {/* Progress Bar */}
                                <div className="space-y-1 mb-3 pt-2 border-t border-slate-100">
                                  <div className="flex justify-between text-[11px] font-semibold">
                                    <span className="text-slate-500">Milestone Progress</span>
                                    <span className="text-slate-900">{task.progressPercentage}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        task.status === 'COMPLETED'
                                          ? 'bg-emerald-500'
                                          : task.status === 'BLOCKED'
                                          ? 'bg-rose-500'
                                          : 'bg-indigo-600'
                                      }`}
                                      style={{ width: `${task.progressPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Card Footer: Operator & Proof */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-1.5 truncate pr-2">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="font-semibold text-slate-700 truncate">
                                      {task.operatorName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      ({task.operatorRollNo})
                                    </span>
                                  </div>

                                  {task.attachmentsUrl && (
                                    <a
                                      href={task.attachmentsUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  {committeeName}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Daily Tracking Entry' : 'Log Daily Work (Head & Subhead)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              {/* Operator info reminder */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-slate-500">Logging as: </span>
                    <span className="font-bold text-slate-800">
                      {operator ? `${operator.operatorName} (${operator.operatorRollNo})` : 'Unidentified Coordinator'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIdentityModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Change
                </button>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Department Head */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Work Head
                </label>
                {!isCustomHead ? (
                  <div className="space-y-1.5">
                    <select
                      value={formHead}
                      onChange={handleHeadChange}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(availableHeads).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Add Custom Department Head</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. VIP Transportation & Convoy"
                        required
                        value={customHeadName}
                        onChange={(e) => setCustomHeadName(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomHead(false);
                          setFormHead(Object.keys(availableHeads)[0] || '');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subhead */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Subhead / Activity
                </label>
                {!isCustomSubhead && !isCustomHead ? (
                  <div className="space-y-1.5">
                    <select
                      value={formSubhead}
                      onChange={handleSubheadChange}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {(availableHeads[formHead] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Add Custom Subhead</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Stage Drum Kit Monitor Check"
                        required
                        value={customSubheadName}
                        onChange={(e) => setCustomSubheadName(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      {!isCustomHead && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomSubhead(false);
                            const subs = availableHeads[formHead] || [];
                            setFormSubhead(subs[0] || '');
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Work Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task / Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contract signed with light vendor & truss rigging completed"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Work Done Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Work Accomplished
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe in detail what tasks were executed today, vendors spoken to, inventory arranged, or tests run..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status & Progress Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TrackingStatus)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="BLOCKED">Blocked (Requires Help)</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Completion %</label>
                    <span className="text-xs font-bold text-indigo-600">{formProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Blockers or Issues */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blockers / Dependencies / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Mention any issues delaying this work, or approvals needed from Higher Authority"
                  value={formBlockers}
                  onChange={(e) => setFormBlockers(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Attachments / Drive Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Drive / Photo Proof URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formAttachmentsUrl}
                  onChange={(e) => setFormAttachmentsUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Update Tracking' : 'Submit Daily Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operator Identity Switcher Modal */}
      <OperatorIdentityModal
        forceOpen={isIdentityModalOpen}
        onClose={() => {
          setIsIdentityModalOpen(false);
          setOperator(getLocalOperator());
        }}
        committeeRole={committeeName}
      />
    </div>
  );
}
