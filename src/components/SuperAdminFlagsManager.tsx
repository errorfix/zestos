'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers,
  RotateCcw,
  Sliders,
  Check,
  X,
  Music,
  Flame,
  Gamepad2,
  BookOpen,
  Drama,
  PartyPopper,
  Mic2,
} from 'lucide-react';
import {
  ALL_EVENT_CATEGORIES,
  COMMITTEE_METAS,
  EventCategoryKey,
  CommitteeFlagsStore,
  CommitteeMeta,
} from '@/lib/committeeConstants';

export default function SuperAdminFlagsManager() {
  const [flags, setFlags] = useState<CommitteeFlagsStore>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/flags');
      const data = await res.json();
      if (data.success && data.flags) {
        setFlags(data.flags);
      }
    } catch (err) {
      console.error('Failed to load committee flags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = async (committeeId: string, category: EventCategoryKey) => {
    const currentVal = flags[committeeId]?.[category] ?? false;
    const newVal = !currentVal;

    // Optimistic UI update
    setFlags((prev) => ({
      ...prev,
      [committeeId]: {
        ...(prev[committeeId] || {}),
        [category]: newVal,
      } as Record<EventCategoryKey, boolean>,
    }));

    try {
      const res = await fetch('/api/super-admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committeeId,
          category,
          enabled: newVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update flag');
      }

      const meta = COMMITTEE_METAS.find((c) => c.id === committeeId);
      showToast(
        `${newVal ? 'Granted' : 'Revoked'} "${category}" access for ${meta?.name || committeeId}`
      );
    } catch (err) {
      console.error('Failed to save flag change:', err);
      // Revert optimistic update
      setFlags((prev) => ({
        ...prev,
        [committeeId]: {
          ...(prev[committeeId] || {}),
          [category]: currentVal,
        } as Record<EventCategoryKey, boolean>,
      }));
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const handleSetAllForCommittee = async (committeeId: string, enableAll: boolean) => {
    const updatedCommitteeFlags: Record<EventCategoryKey, boolean> = {
      'Cultural - Music': enableAll,
      'Cultural - Dance': enableAll,
      'Cultural - Fashion': enableAll,
      'Cultural - Theatre': enableAll,
      Literary: enableAll,
      Gaming: enableAll,
      Informalz: enableAll,
    };

    const newFlags: CommitteeFlagsStore = {
      ...flags,
      [committeeId]: updatedCommitteeFlags,
    };

    setFlags(newFlags);

    try {
      const res = await fetch('/api/super-admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: newFlags }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      const meta = COMMITTEE_METAS.find((c) => c.id === committeeId);
      showToast(`${enableAll ? 'Granted all' : 'Cleared all'} categories for ${meta?.name}`);
    } catch (err) {
      console.error(err);
      fetchFlags();
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all committee flags to system defaults?')) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/super-admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_DEFAULTS' }),
      });
      const data = await res.json();
      if (data.success && data.flags) {
        setFlags(data.flags);
        showToast('All committee flags reset to initial festival defaults.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getCommitteeIcon = (slug: string) => {
    switch (slug) {
      case 'music':
        return <Music className="w-4 h-4 text-violet-400" />;
      case 'dance':
        return <Flame className="w-4 h-4 text-pink-400" />;
      case 'fashion':
        return <Sparkles className="w-4 h-4 text-fuchsia-400" />;
      case 'theatre':
        return <Drama className="w-4 h-4 text-amber-400" />;
      case 'literary':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'gaming':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'stage':
        return <Mic2 className="w-4 h-4 text-amber-400" />;
      case 'informalz':
        return <PartyPopper className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCommitteeDashboardLink = (meta: CommitteeMeta) => {
    if (meta.slug === 'admin') return '/admin';
    if (meta.slug === 'informalz') return '/informalz';
    if (meta.slug === 'stage') return '/stage';
    return `/committee/${meta.slug}`;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Loading committee access flags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-amber-400" />
              Dynamic Access Control System
            </span>
            <span className="text-xs text-slate-400">
              Live Boolean Matrix
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Committee Event Type Flags &amp; Participant Visibility
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Configure exactly which event categories and participant rosters each committee panel can view.
            Toggling a boolean flag immediately grants or restricts that committee from seeing registrations,
            attendee photos, team members, and ticket QR passes for that event type.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchFlags}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Flags</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Grid of Committee Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {COMMITTEE_METAS.map((comm) => {
          const commFlags = flags[comm.id] || {};
          const enabledCount = ALL_EVENT_CATEGORIES.filter((cat) => commFlags[cat] === true).length;
          const dashboardUrl = getCommitteeDashboardLink(comm);

          return (
            <div
              key={comm.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Committee Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {getCommitteeIcon(comm.slug)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {comm.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {comm.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {comm.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={dashboardUrl}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={`Open ${comm.name} in new tab`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between py-2 border-y border-slate-800/80 mb-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Granted Categories:</span>
                    <span className="font-bold text-amber-400">
                      {enabledCount} of {ALL_EVENT_CATEGORIES.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAllForCommittee(comm.id, true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Enable All
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => handleSetAllForCommittee(comm.id, false)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Boolean Flags Matrix */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Event Type Visibility Toggles
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_EVENT_CATEGORIES.map((category) => {
                      const isEnabled = commFlags[category] === true;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleToggle(comm.id, category)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isEnabled
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <span className="truncate pr-2">{category}</span>

                          <div
                            className={`w-8 h-4 rounded-full transition-colors relative shrink-0 p-0.5 flex items-center ${
                              isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Link */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Direct Panel URL: <code className="text-slate-400 font-mono">{dashboardUrl}</code>
                </span>
                <Link
                  href={dashboardUrl}
                  className="font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <span>Launch Panel</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
