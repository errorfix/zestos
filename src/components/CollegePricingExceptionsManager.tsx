'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Tag,
  CheckCircle2,
  AlertCircle,
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
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-xs">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-slate-700" />
          College Contingent Event Pricing Exception Rules
        </div>
        <p className="text-slate-600">
          By default, participants added via the College Portal use tokenized campus entry (Day 1 ₹100 tier up to 20 quota, Day 2 ₹150). Configure any exception events below:
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-600">
          <span><strong>DEFAULT:</strong> Standard campus entry pricing applies.</span>
          <span><strong>ADDITIVE (+):</strong> Event fee is added on top of the campus entry fee.</span>
          <span><strong>REPLACEMENT:</strong> Event fee replaces the campus entry fee for this activity.</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.message}</span>
        </div>
      )}

      {/* Action Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-slate-900 shadow-xs"
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
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Exception Rules'}</span>
          </button>
        </div>
      </div>

      {/* Events Exception Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Event Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Fee</th>
                <th className="px-4 py-3">Festival Day</th>
                <th className="px-4 py-3">College Pricing Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const currentMode = exceptions[ev.id] || 'DEFAULT';
                const baseFeeInr = Math.round(ev.feeAmount / 100);

                return (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{ev.title}</td>
                    <td className="px-4 py-3 text-slate-500">{ev.category}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">₹{baseFeeInr}</td>
                    <td className="px-4 py-3 text-slate-500">{ev.date || 'Fest Day'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={currentMode}
                        onChange={(e) => handleModeChange(ev.id, e.target.value as PricingExceptionMode)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none transition ${
                          currentMode === 'ADDITIVE'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : currentMode === 'REPLACEMENT'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
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
