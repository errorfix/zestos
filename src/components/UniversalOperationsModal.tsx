'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  X,
  CheckSquare,
  FolderOpen,
  HelpCircle,
  AlertOctagon,
  Calendar,
  Layers,
  Loader2,
} from 'lucide-react';
import { getCommitteeBySlug, getCommitteeById } from '@/lib/committeeConstants';

export type UniversalModuleType =
  | 'attendance'
  | 'documents'
  | 'help'
  | 'complaints'
  | 'progress';

// ─── Loading Skeleton Placeholder ─────────────────────────────────────────────
function ModuleLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 animate-spin">
        <Loader2 className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Loading {title}...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Preparing committee workspace and streaming verified records.
        </p>
      </div>
    </div>
  );
}

// ─── Lazy Dynamic Imports (Code-split to prevent DOM & bundle bloat) ────────────
const AttendanceSheet = dynamic(() => import('@/components/AttendanceSheet'), {
  loading: () => <ModuleLoadingSkeleton title="Attendance Sheet" />,
  ssr: false,
});

const DocumentStorage = dynamic(() => import('@/components/DocumentStorage'), {
  loading: () => <ModuleLoadingSkeleton title="Document Vault" />,
  ssr: false,
});

const MayIHelpYou = dynamic(() => import('@/components/MayIHelpYou'), {
  loading: () => <ModuleLoadingSkeleton title="May I Help You" />,
  ssr: false,
});

const ComplaintsInbox = dynamic(() => import('@/components/ComplaintsInbox'), {
  loading: () => <ModuleLoadingSkeleton title="Complaints Tribunal" />,
  ssr: false,
});

const CommitteeDailyTracker = dynamic(
  () => import('@/components/CommitteeDailyTracker'),
  {
    loading: () => <ModuleLoadingSkeleton title="Progress Tracker" />,
    ssr: false,
  }
);

interface UniversalOperationsModalProps {
  isOpen: boolean;
  activeModule: UniversalModuleType | null;
  onClose: () => void;
  onSelectModule?: (module: UniversalModuleType) => void;
  committeeSlug?: string;
  committeeName?: string;
  committeeId?: string;
}

export default function UniversalOperationsModal({
  isOpen,
  activeModule,
  onClose,
  onSelectModule,
  committeeSlug,
  committeeName,
  committeeId,
}: UniversalOperationsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Zero-DOM footprint: completely unmounted when not open
  if (!mounted || !isOpen || !activeModule) {
    return null;
  }

  // Derive normalized committee metadata
  const meta = committeeSlug
    ? getCommitteeBySlug(committeeSlug) || getCommitteeById(committeeSlug)
    : committeeId
    ? getCommitteeById(committeeId)
    : undefined;

  const effectiveSlug = committeeSlug || meta?.slug || 'admin';
  const effectiveName = committeeName || meta?.name || 'Committee Operations';
  const effectiveId = committeeId || meta?.id || 'INFRA_COMMITTEE';

  const MODULE_METAS: Record<
    UniversalModuleType,
    { title: string; subtitle: string; icon: React.ReactNode; colorClass: string }
  > = {
    attendance: {
      title: 'Attendance Sheet',
      subtitle: 'Faculty-verified student roll call and duty tracking',
      icon: <CheckSquare className="w-4 h-4 text-violet-600" />,
      colorClass: 'bg-violet-50 text-violet-800 border-violet-200/80',
    },
    documents: {
      title: 'Document Vault',
      subtitle: 'Isolated committee asset and file storage system',
      icon: <FolderOpen className="w-4 h-4 text-blue-600" />,
      colorClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
    },
    help: {
      title: 'May I Help You',
      subtitle: 'Urgent operational assistance and live help desk',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    complaints: {
      title: 'Complaints Tribunal',
      subtitle: 'Official grievance and festival dispute reporting',
      icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
      colorClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    },
    progress: {
      title: 'Progress Tracker',
      subtitle: 'Live committee deliverables and milestone tracking',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
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
      aria-labelledby="universal-operations-modal-title"
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

      {/* ─── Top Control Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${currentMeta.colorClass}`}
          >
            {currentMeta.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                id="universal-operations-modal-title"
                className="text-sm sm:text-base font-black text-slate-900 tracking-tight"
              >
                {currentMeta.title}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[200px] sm:max-w-xs">
                {effectiveName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Module Switcher & Close Button */}
        <div className="flex items-center gap-2">
          {onSelectModule && (
            <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(
                ['attendance', 'documents', 'help', 'complaints'] as UniversalModuleType[]
              ).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => onSelectModule(mod)}
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

      {/* ─── Main Content Container (Isolated DOM subtree) ──────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {activeModule === 'attendance' && (
          <AttendanceSheet
            committeeSlug={effectiveSlug}
            committeeName={effectiveName}
          />
        )}

        {activeModule === 'documents' && (
          <DocumentStorage
            committeeSlug={effectiveSlug}
            committeeName={effectiveName}
          />
        )}

        {activeModule === 'help' && <MayIHelpYou />}

        {activeModule === 'complaints' && <ComplaintsInbox />}

        {activeModule === 'progress' && (
          <CommitteeDailyTracker
            committeeId={effectiveId}
            committeeName={effectiveName}
          />
        )}
      </main>
    </div>,
    document.body
  );
}
