'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
  Building,
  User,
  Scale,
} from 'lucide-react';

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
  selectedDate?: string;
}

export default function ComplaintsInbox({ committeeSlug, selectedDate }: ComplaintsInboxProps = {}) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isResolver, setIsResolver] = useState(false);
  const [committeeName, setCommitteeName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSOLVED' | 'SOLVED'>('ALL');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        setIsResolver(data.isResolver || false);
        setCommitteeName(data.committeeName || '');
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
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, explanation }),
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

  const filteredComplaints = complaints.filter((c) => {
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
    if (selectedDate) {
      if (!c.createdAt.startsWith(selectedDate)) return false;
    }
    return true;
  });

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
            {isResolver ? 'Grievance Committee & CS&IT War-Room' : committeeName}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Formal Dispute &amp; Grievance Redressal Desk
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {isResolver
            ? 'Central tribunal view of all formal grievances, rule violations, scoring disputes, and inter-committee misconduct reports. Retained permanently for administrative documentation.'
            : 'File a formal grievance regarding event rule violations, scoring disputes, discipline infringements, or cross-committee friction. Handled strictly by the Grievances Committee and CS&IT.'}
        </p>
      </div>

      {/* Submission Form (Visible to Committees) */}
      {!isResolver && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              File a Formal Complaint / Grievance
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              Originating from {committeeName}
            </span>
          </div>

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
              Solved complaints will automatically be archived from this active queue.
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

      {/* Complaints List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            {isResolver ? 'Master Grievances & Complaints Tribunal' : 'Your Unsolved Complaints'}
            <span className="ml-2 text-xs font-semibold text-slate-500">
              ({filteredComplaints.length} records)
            </span>
          </h3>

          {isResolver && (
            <div className="flex items-center gap-1.5">
              {(['ALL', 'UNSOLVED', 'SOLVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading grievance records...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No active unsolved complaints</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isResolver
                ? 'All logged grievances across the festival have been reviewed and resolved.'
                : 'Your committee has no pending complaints. Solved items are automatically archived.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((c) => (
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

                {/* Status Toggle Action (Grievance Committee & CS&IT only) */}
                {isResolver && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.status)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
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
