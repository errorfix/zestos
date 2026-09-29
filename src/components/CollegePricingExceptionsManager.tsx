'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Save,
  Filter,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';
import { PricingExceptionMode } from '@/lib/collegePricingExceptions';

interface CollegePricingExceptionsManagerProps {
  events: InitialEventData[];
}

export default function CollegePricingExceptionsManager({ events }: CollegePricingExceptionsManagerProps) {
  const [exceptions, setExceptions] = useState<Record<string, PricingExceptionMode>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchExceptions = () => {
    setIsLoading(true);
    fetch('/api/super-admin/college-pricing-exceptions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exceptions) {
          setExceptions(data.exceptions);
        }
      })
      .catch((err) => console.error('Failed to load pricing exceptions:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleModeChange = (eventId: string, mode: PricingExceptionMode) => {
    setExceptions((prev) => ({
      ...prev,
      [eventId]: mode,
    }));
  };

  const handleSaveAll = () => {
    setStatusMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/super-admin/college-pricing-exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: exceptions }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save exceptions');
        setStatusMsg({ type: 'success', message: 'Pricing exceptions saved and logged successfully!' });
      } catch (err) {
        setStatusMsg({ type: 'error', message: (err as Error).message });
      }
    });
  };

  const categories = Array.from(new Set(events.map((e) => e.category)));
  const filteredEvents = events.filter((e) =>
    categoryFilter === 'ALL' ? true : e.category === categoryFilter
  );

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-indigo-400" />
          College Contingent Event Pricing Exception Rules
        </div>
        <p className="text-slate-400">
          By default, participants added via the College Portal use tokenized campus entry (Day 1 ₹100 tier up to 20 quota, Day 2 ₹150). Configure any exception events below:
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
          <span><strong>DEFAULT:</strong> Standard campus entry pricing applies.</span>
          <span><strong>ADDITIVE (+):</strong> Event fee is added on top of the campus entry fee.</span>
          <span><strong>REPLACEMENT:</strong> Event fee replaces the campus entry fee for this activity.</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.message}</span>
        </div>
      )}

      {/* Action Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Event Categories ({events.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchExceptions}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Exception Rules'}</span>
          </button>
        </div>
      </div>

      {/* Events Exception Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Fee</th>
                <th className="px-4 py-3">Festival Day</th>
                <th className="px-4 py-3">College Pricing Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map((ev) => {
                const currentMode = exceptions[ev.id] || 'DEFAULT';
                const baseFeeInr = Math.round(ev.feeAmount / 100);

                return (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">{ev.title}</td>
                    <td className="px-4 py-3 text-slate-400">{ev.category}</td>
                    <td className="px-4 py-3 text-slate-300">₹{baseFeeInr}</td>
                    <td className="px-4 py-3 text-slate-400">{ev.date || 'Fest Day'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={currentMode}
                        onChange={(e) => handleModeChange(ev.id, e.target.value as PricingExceptionMode)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none transition ${
                          currentMode === 'ADDITIVE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : currentMode === 'REPLACEMENT'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <option value="DEFAULT">DEFAULT (Campus Entry)</option>
                        <option value="ADDITIVE">ADDITIVE (+ ₹{baseFeeInr} Event Fee)</option>
                        <option value="REPLACEMENT">REPLACEMENT (₹{baseFeeInr} Replaces Campus Fee)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
