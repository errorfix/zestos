'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  Clock,
  Check,
  RotateCcw,
  Building,
  User,
  Scale,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getLocalOperator } from '@/components/OperatorIdentityModal';

interface ComplaintItem {
  id: string;
  committeeId: string;
  committeeName: string;
  topic: string;
  explanation: string;
  status: 'UNSOLVED' | 'SOLVED';
  operatorName?: string | null;
  operatorRollNo?: string | null;
  operatorType?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintsInboxProps {
  committeeSlug?: string;
  committeeName?: string;
  selectedDate?: string;
  isAllTime?: boolean;
  isHub?: boolean;
  allowSubmission?: boolean;
}

export default function ComplaintsInbox({
  committeeSlug,
  committeeName: propCommitteeName,
  selectedDate,
  isAllTime = false,
  isHub = false,
  allowSubmission = true,
}: ComplaintsInboxProps = {}) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isResolver, setIsResolver] = useState(false);
  const [committeeName, setCommitteeName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSOLVED' | 'SOLVED'>('ALL');
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(isHub || true);

  // Pagination (25-150)
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        setIsResolver(data.isResolver || false);
        setCommitteeName(propCommitteeName || data.committeeName || '');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !explanation.trim()) return;

    setSubmitting(true);
    try {
      const localOp = getLocalOperator();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (localOp) {
        headers['x-operator-name'] = localOp.operatorName;
        headers['x-operator-roll'] = localOp.operatorRollNo;
        headers['x-operator-type'] = localOp.operatorType;
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic,
          explanation,
          committee: committeeSlug && committeeSlug !== 'all' ? committeeSlug : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to file complaint');
      }

      showToast('✓ Complaint officially recorded and dispatched to Grievance Redressal.');
      setTopic('');
      setExplanation('');
      fetchComplaints();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (complaintId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SOLVED' ? 'UNSOLVED' : 'SOLVED';
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update complaint');
      }

      showToast(`✓ Complaint marked as ${nextStatus}`);
      fetchComplaints();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (committeeSlug && committeeSlug !== 'all') {
        const targetSlug = committeeSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemComm = (c.committeeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemCommName = (c.committeeName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          !itemComm.includes(targetSlug) &&
          !targetSlug.includes(itemComm) &&
          !itemCommName.includes(targetSlug)
        ) {
          return false;
        }
      }
      if (!isAllTime && selectedDate) {
        if (!c.createdAt.startsWith(selectedDate)) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, committeeSlug, isAllTime, selectedDate]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize, committeeSlug, selectedDate, isAllTime]);

  const totalFiltered = filteredComplaints.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const displayedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const effectiveDisplayName = propCommitteeName || committeeName || (committeeSlug === 'all' ? 'Master Campus View' : committeeSlug) || 'Committee Desk';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-rose-700" />
            Official Grievance Channel
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {isResolver ? 'Grievance Committee, HAM & CS&IT War-Room' : effectiveDisplayName}
          </span>
          {isAllTime && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
              All Time View
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Formal Dispute &amp; Grievance Redressal Desk
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {!allowSubmission
            ? 'Formal tribunal log of grievances, rule violations, and misconduct reports submitted by committees. View complaint details and resolve active cases.'
            : isResolver
            ? 'Central tribunal view of formal grievances, rule violations, scoring disputes, and inter-committee misconduct reports. All festival committees can also submit new grievances from this desk.'
            : 'File a formal grievance regarding event rule violations, scoring disputes, discipline infringements, or cross-committee friction. Handled strictly by the Grievances Committee, HAM, and CS&IT.'}
        </p>
      </div>

      {/* Submission Form (Only rendered when submission is enabled) */}
      {allowSubmission && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                File a Formal Complaint / Grievance
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">
                (For: {effectiveDisplayName})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitForm((p) => !p)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {showSubmitForm ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Open Submission Form</span>
                </>
              )}
            </button>
          </div>

          {showSubmitForm && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Topic / Subject (One Sentence)
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Unfair tie-breaking protocol in Western Solo finals, Stage intrusion during live dance choreography"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Detailed Explanation / Incident Narrative (Paragraph)
                </label>
                <textarea
                  required
                  rows={4}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Detail the chronology of events, involved participants or teams, witnesses, and the exact grievance or rule violation..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500">
                  Official submissions route immediately to Grievances, Higher Authority Management, and CS&amp;IT.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging Grievance...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      <span>Submit Formal Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Complaints List Container with 25-150 Pagination */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {isResolver ? 'Master Grievances & Complaints Tribunal' : 'Your Unsolved Complaints'}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              ({totalFiltered} records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isResolver && (
              <div className="flex items-center gap-1">
                {(['ALL', 'UNSOLVED', 'SOLVED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* 25-150 Pagination Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-slate-400 text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                </select>
              </div>

              <span className="text-xs font-bold text-slate-700 tracking-tight whitespace-nowrap">
                {totalFiltered === 0
                  ? '0 of 0'
                  : `${startIndex + 1}–${endIndex} of ${totalFiltered.toLocaleString()}`}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Previous complaints"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Next complaints"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading grievance records...</p>
          </div>
        ) : displayedComplaints.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No active complaints found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isResolver
                ? 'No grievances match the active filter criteria.'
                : 'Your committee has no pending complaints. Solved items are automatically archived.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayedComplaints.map((c) => (
              <div
                key={c.id}
                className={`p-6 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  c.status === 'SOLVED'
                    ? 'bg-slate-50/90 border-slate-200'
                    : 'bg-white border-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        c.status === 'SOLVED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{c.committeeName}</span>
                    </span>
                    {c.operatorName && (
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Filed by: {c.operatorName} ({c.operatorRollNo})</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    {c.topic}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {c.explanation}
                  </p>
                </div>

                {c.resolvedBy && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    ✓ Resolved by: {c.resolvedBy}
                  </p>
                )}

                {/* Status Toggle Action (Grievance Committee, HAM & CS&IT) */}
                {isResolver && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.status)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        c.status === 'SOLVED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {c.status === 'SOLVED' ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen Complaint</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Grievance</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
