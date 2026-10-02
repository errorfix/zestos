'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  X,
  Calendar,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  AlertOctagon,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Filter,
} from 'lucide-react';
import { COMMITTEE_METAS } from '@/lib/committeeConstants';

export type AssessmentModuleType =
  | 'progress'
  | 'audits'
  | 'attendance'
  | 'help'
  | 'complaints';

// ─── Loading Skeleton Placeholder ─────────────────────────────────────────────
function AssessmentLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 animate-spin">
        <Loader2 className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Loading {title}...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Aggregating cross-committee assessment metrics and live operational logs.
        </p>
      </div>
    </div>
  );
}

// ─── Lazy Dynamic Imports (Code-split to prevent DOM & bundle bloat) ────────────
const WorkProgressTracker = dynamic(
  () => import('@/components/WorkProgressTracker'),
  {
    loading: () => <AssessmentLoadingSkeleton title="Work Progress Tracking" />,
    ssr: false,
  }
);

const AuditLogsViewer = dynamic(() => import('@/components/AuditLogsViewer'), {
  loading: () => <AssessmentLoadingSkeleton title="Real-Time Audit Trail" />,
  ssr: false,
});

const AttendanceSheet = dynamic(() => import('@/components/AttendanceSheet'), {
  loading: () => <AssessmentLoadingSkeleton title="Attendance Tracking" />,
  ssr: false,
});

const MayIHelpYou = dynamic(() => import('@/components/MayIHelpYou'), {
  loading: () => <AssessmentLoadingSkeleton title="May I Help You Submissions" />,
  ssr: false,
});

const ComplaintsInbox = dynamic(() => import('@/components/ComplaintsInbox'), {
  loading: () => <AssessmentLoadingSkeleton title="Complaint Submissions" />,
  ssr: false,
});

interface InternalAssessmentModalProps {
  isOpen: boolean;
  activeModule: AssessmentModuleType | null;
  onClose: () => void;
  onSelectModule?: (module: AssessmentModuleType) => void;
  initialCommitteeSlug?: string;
  canEditAttendance?: boolean;
  isReadOnly?: boolean;
}

export default function InternalAssessmentModal({
  isOpen,
  activeModule,
  onClose,
  onSelectModule,
  initialCommitteeSlug,
  canEditAttendance = true,
  isReadOnly = false,
}: InternalAssessmentModalProps) {
  const [mounted, setMounted] = useState(false);

  // Today's Date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

  // Committees arranged in alphabetical order by name
  const sortedCommittees = useMemo(() => {
    return [...COMMITTEE_METAS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [selectedCommitteeSlug, setSelectedCommitteeSlug] = useState<string>(
    initialCommitteeSlug || sortedCommittees[0]?.slug || 'dance'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial committee slug if changed
  useEffect(() => {
    if (initialCommitteeSlug) {
      setSelectedCommitteeSlug(initialCommitteeSlug);
    }
  }, [initialCommitteeSlug]);

  // Lock background scrolling while modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Zero-DOM footprint: unmounted when closed
  if (!mounted || !isOpen || !activeModule) {
    return null;
  }

  const selectedCommitteeMeta = sortedCommittees.find(
    (c) => c.slug.toLowerCase() === selectedCommitteeSlug.toLowerCase()
  );

  const effectiveCommitteeName =
    selectedCommitteeMeta?.name || 'Selected Committee';

  const handleApplyAttendance = () => {
    window.dispatchEvent(new Event('festos_apply_attendance'));
  };

  const MODULE_METAS: Record<
    AssessmentModuleType,
    { title: string; subtitle: string; icon: React.ReactNode; colorClass: string }
  > = {
    progress: {
      title: 'Progress Tracking',
      subtitle: 'Cross-committee deliverables, milestone logs, and live completion',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    audits: {
      title: 'Audit Trail',
      subtitle: 'Immutable real-time audit log of all committee actions',
      icon: <ShieldCheck className="w-4 h-4 text-violet-600" />,
      colorClass: 'bg-violet-50 text-violet-800 border-violet-200/80',
    },
    attendance: {
      title: 'Attendance Tracking',
      subtitle: 'Faculty-verified student roll call and duty tracking across committees',
      icon: <CheckSquare className="w-4 h-4 text-indigo-600" />,
      colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    },
    help: {
      title: 'May I Help You Submissions',
      subtitle: 'Central help desk queue and operational resolution dispatch',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    complaints: {
      title: 'Complaint Submissions',
      subtitle: 'Festival-wide grievances, disputes, and incident reporting desk',
      icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
      colorClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    },
  };

  const currentMeta = MODULE_METAS[activeModule];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 overscroll-contain select-text"
      style={{
        animation: 'festosModalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        willChange: 'transform',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="internal-assessment-modal-title"
    >
      <style>{`
        @keyframes festosModalSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* ─── Top Control Row (Date Select on Far Left, Committee Dropdown, Module Switchers, Apply Changes on Far Right) ─── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left Side: Date Select + Alphabetical Committee Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Date Select (Left-Most Side) + All Time Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 transition-colors">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-opacity ${isAllTime ? 'opacity-40 pointer-events-none' : ''}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                disabled={isAllTime}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                title="Filter by target date"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAllTime((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAllTime
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="Show records of all time (bypasses date filter)"
            >
              All Time
            </button>
          </div>

          {/* 2. Committee Names Dropdown (Alphabetical Order) */}
          <div className="relative">
            <select
              value={selectedCommitteeSlug}
              onChange={(e) => setSelectedCommitteeSlug(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition-colors cursor-pointer max-w-[220px] sm:max-w-xs truncate"
              title="Select committee"
            >
              <option value="all">All Committees (Master Overview)</option>
              {sortedCommittees.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Middle: Module Switcher Pills */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(
            [
              'progress',
              'audits',
              'attendance',
              'help',
              'complaints',
            ] as AssessmentModuleType[]
          ).map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => onSelectModule && onSelectModule(mod)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeModule === mod
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {MODULE_METAS[mod].title}
            </button>
          ))}
        </div>

        {/* Far Right: Apply Changes (Only for Attendance Tracking & ONLY IF CAN EDIT ATTENDANCE) + Close Button */}
        <div className="flex items-center gap-2">
          {activeModule === 'attendance' && canEditAttendance && !isReadOnly && (
            <button
              type="button"
              onClick={handleApplyAttendance}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              title="Confirm and seal attendance records for selected date"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors border border-slate-300 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Close module (or press Esc)"
          >
            <span>Close</span>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-500 font-semibold">
              ESC
            </span>
            <X className="w-3.5 h-3.5 text-slate-700 ml-0.5" />
          </button>
        </div>
      </header>

      {/* ─── Main Content Container (Isolated DOM Subtree) ──────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {activeModule === 'progress' && (
          <WorkProgressTracker
            key={`progress-${selectedCommitteeSlug}-${isAllTime ? 'all' : selectedDate}`}
            committeeSlug={selectedCommitteeSlug}
            selectedDate={selectedDate}
            isAllTime={isAllTime}
          />
        )}

        {activeModule === 'audits' && (
          <AuditLogsViewer
            key={`audits-${selectedCommitteeSlug}-${isAllTime ? 'all' : selectedDate}`}
            committeeSlug={selectedCommitteeSlug}
            selectedDate={selectedDate}
            isAllTime={isAllTime}
          />
        )}

        {activeModule === 'attendance' && (
          <AttendanceSheet
            key={`attendance-${selectedCommitteeSlug}-${isAllTime ? 'all' : selectedDate}`}
            committeeSlug={selectedCommitteeSlug}
            committeeName={effectiveCommitteeName}
            initialDate={selectedDate}
            isAllTime={isAllTime}
            canEdit={canEditAttendance && !isReadOnly}
            isReadOnly={!canEditAttendance || isReadOnly}
          />
        )}

        {activeModule === 'help' && (
          <MayIHelpYou
            key={`help-${selectedCommitteeSlug}-${isAllTime ? 'all' : selectedDate}`}
            committeeSlug={selectedCommitteeSlug}
            selectedDate={selectedDate}
            isAllTime={isAllTime}
            allowSubmission={false}
          />
        )}

        {activeModule === 'complaints' && (
          <ComplaintsInbox
            key={`complaints-${selectedCommitteeSlug}-${isAllTime ? 'all' : selectedDate}`}
            committeeSlug={selectedCommitteeSlug}
            selectedDate={selectedDate}
            isAllTime={isAllTime}
            allowSubmission={false}
          />
        )}
      </main>
    </div>,
    document.body
  );
}
