'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DailyTrackingItem, TrackingStatus } from '@/lib/dailyTrackingTypes';
import { getCommitteeBySlug, getCommitteeById } from '@/lib/committeeConstants';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  User,
  Paperclip,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Check,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface WorkProgressTrackerProps {
  committeeSlug?: string;
  selectedDate?: string;
  isAllTime?: boolean;
}

export default function WorkProgressTracker({
  committeeSlug,
  selectedDate,
  isAllTime = false,
}: WorkProgressTrackerProps) {
  const [items, setItems] = useState<DailyTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination (25-150)
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Remark Modal State
  const [remarkItem, setRemarkItem] = useState<DailyTrackingItem | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  const committeeMeta = useMemo(() => {
    if (!committeeSlug || committeeSlug === 'all') return null;
    return getCommitteeBySlug(committeeSlug) || getCommitteeById(committeeSlug) || null;
  }, [committeeSlug]);

  const effectiveCommitteeName = committeeMeta?.name || (committeeSlug === 'all' ? 'All Committees' : committeeSlug || 'Selected Committee');

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (committeeSlug && committeeSlug !== 'all') {
        params.append('committeeId', committeeSlug);
      }
      if (!isAllTime && selectedDate) {
        params.append('date', selectedDate);
      }

      const url = `/api/daily-tracking${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || 'Failed to fetch work progress items.');
      }
    } catch (err) {
      setError((err as Error).message || 'Network error fetching progress items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [committeeSlug, selectedDate, isAllTime]);

  // Client-side filtering for search & safe slug/date match
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Date filter fallback
      if (!isAllTime && selectedDate && item.date !== selectedDate) {
        return false;
      }

      // Committee filter fallback
      if (committeeSlug && committeeSlug !== 'all') {
        const targetSlug = committeeSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemComm = (item.committeeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const metaId = (committeeMeta?.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (itemComm !== targetSlug && itemComm !== metaId) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.workDescription.toLowerCase().includes(q) ||
          item.head.toLowerCase().includes(q) ||
          item.subhead.toLowerCase().includes(q) ||
          item.operatorName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [items, selectedDate, committeeSlug, committeeMeta, searchQuery, isAllTime]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, committeeSlug, selectedDate, isAllTime]);

  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const displayedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const handleOpenRemark = (item: DailyTrackingItem) => {
    setRemarkItem(item);
    setRemarkText(item.superAdminRemarks || '');
  };

  const handleSaveRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkItem) return;

    setSubmittingRemark(true);
    try {
      const res = await fetch(`/api/daily-tracking/${remarkItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminRemarks: remarkText.trim() || null,
          superAdminReviewed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === remarkItem.id
            ? { ...i, superAdminRemarks: remarkText.trim() || null, superAdminReviewed: true }
            : i
        )
      );
      setRemarkItem(null);
    } catch (err) {
      alert((err as Error).message || 'Error saving remark');
    } finally {
      setSubmittingRemark(false);
    }
  };

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> In Progress
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Active Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Main Card Frame (Linked to Signature Stylesheet) ──────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Header: Total Count Banner & Context Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Work Progress Log:
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                {filteredItems.length} Total
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Committee:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {effectiveCommitteeName}
              </span>
              {isAllTime ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  All Time
                </span>
              ) : selectedDate ? (
                <>
                  <span>•</span>
                  <span>Date:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedDate}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {/* Search Box, 25-150 Pagination Controls & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search work logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* 25-150 Pagination Controls */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <span className="text-slate-400 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
              </select>

              <span className="text-xs font-bold text-slate-700 tracking-tight whitespace-nowrap px-1">
                {totalFiltered === 0
                  ? '0 of 0'
                  : `${startIndex + 1}–${endIndex} of ${totalFiltered.toLocaleString()}`}
              </span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center justify-center p-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Previous entries"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center justify-center p-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Next entries"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchItems();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Refresh work progress data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── Work Progress Log List ────────────────────────────────────────── */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2.5" />
            <p className="text-xs text-slate-500 font-semibold">Loading work progress records...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              No work progress logged
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No entries recorded for <strong className="text-slate-700">{effectiveCommitteeName}</strong>
              {isAllTime ? ' across all time' : selectedDate ? <> on <strong className="text-slate-700">{selectedDate}</strong></> : ''}.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs space-y-3"
              >
                {/* Top Row: Head / Subhead & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      {item.head}
                    </span>
                    <span className="text-slate-400 text-xs">/</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {item.subhead}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] font-mono font-medium text-slate-400">
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Main Content: Title & Description */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {item.workDescription}
                  </p>
                </div>

                {/* Bottom Row: Operator Details, Attachments & Admin Remark */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Logged by:</span>
                    <strong className="text-slate-700 font-bold">{item.operatorName}</strong>
                    <span className="text-[11px] text-slate-400 font-mono">({item.operatorRollNo})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.attachmentsUrl && (
                      <a
                        href={item.attachmentsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>Attachment</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenRemark(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        item.superAdminRemarks
                          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-purple-600" />
                      <span>{item.superAdminRemarks ? 'View / Edit Remark' : 'Add Remark'}</span>
                    </button>
                  </div>
                </div>

                {/* Display Existing Admin Remark */}
                {item.superAdminRemarks && (
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-0.5">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Authority Review Note</span>
                    </div>
                    <p className="text-purple-800 leading-relaxed">{item.superAdminRemarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Admin Remark Modal ────────────────────────────────────────────── */}
      {remarkItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Authority Review Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRemarkItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Milestone:
              </span>
              <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {remarkItem.title}
              </p>
            </div>

            <form onSubmit={handleSaveRemark} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Administrative Feedback / Instructions:
                </label>
                <textarea
                  rows={4}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Provide guidance, approvals, or operational advice for this milestone..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRemarkItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRemark}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Save Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
