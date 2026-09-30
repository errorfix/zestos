'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
  Building,
  User,
} from 'lucide-react';

interface Ticket {
  id: string;
  committeeId: string;
  committeeName: string;
  concern: string;
  status: 'UNSOLVED' | 'SOLVED';
  operatorName?: string | null;
  operatorRollNo?: string | null;
  operatorType?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MayIHelpYou() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isResolver, setIsResolver] = useState(false);
  const [committeeName, setCommitteeName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [concern, setConcern] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSOLVED' | 'SOLVED'>('ALL');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/help');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setIsResolver(data.isResolver || false);
        setCommitteeName(data.committeeName || '');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concern }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit help ticket');
      }

      showToast('✓ Your concern has been dispatched to CS&IT & Management Control.');
      setConcern('');
      fetchTickets();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ticketId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SOLVED' ? 'UNSOLVED' : 'SOLVED';
    try {
      const res = await fetch('/api/help', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      showToast(`✓ Marked issue as ${nextStatus}`);
      fetchTickets();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            May I Help You Desk
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {isResolver ? 'Universal Dispatch Console (CS&IT & Controls)' : committeeName}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Operational Assistance &amp; Urgent Dispatch Desk
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {isResolver
            ? 'Real-time master queue of all operational concerns, AV bottlenecks, and requests raised across all festival committees. You can update resolution statuses.'
            : 'Facing an operational issue, volunteer shortage, electrical delay, or sound crisis? Submit your concern here. It routes immediately to the central CS&IT & Management war-room.'}
        </p>
      </div>

      {/* Submission Form (Visible to Committees) */}
      {!isResolver && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Submit an Urgent Concern / Help Request
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              Auto-tagged with {committeeName}
            </span>
          </div>

          <textarea
            required
            rows={4}
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="Describe the issue or assistance required in detail (e.g. stage microphone #3 not receiving signal, water supply delayed at green room, need additional security volunteers at North gate)..."
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-y"
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              Solved issues will automatically be archived from this active panel.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Help Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            {isResolver ? 'Master Emergency & Help Requests Queue' : 'Your Unsolved Help Requests'}
            <span className="ml-2 text-xs font-semibold text-slate-500">
              ({filteredTickets.length} items)
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
            <p className="text-xs text-slate-500 font-semibold">Loading help desk requests...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No active unsolved issues</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isResolver
                ? 'All committee help requests are currently resolved.'
                : 'Your committee has no pending unsolved issues. Solved items are automatically archived.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className={`p-6 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  t.status === 'SOLVED'
                    ? 'bg-slate-50/90 border-slate-200'
                    : 'bg-white border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        t.status === 'SOLVED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{t.committeeName}</span>
                    </span>
                    {t.operatorName && (
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{t.operatorName} ({t.operatorRollNo})</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {t.concern}
                </p>

                {t.resolvedBy && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    ✓ Resolved by: {t.resolvedBy}
                  </p>
                )}

                {/* Status Toggle Action (CS&IT & Controls only) */}
                {isResolver && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        t.status === 'SOLVED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {t.status === 'SOLVED' ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen Issue</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as Solved</span>
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
