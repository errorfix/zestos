'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  FolderOpen,
  HelpCircle,
  AlertOctagon,
  Building2,
  Calendar,
} from 'lucide-react';
import UniversalOperationsModal, {
  UniversalModuleType,
} from './UniversalOperationsModal';

interface UniversalCommitteeActionsProps {
  committeeSlug?: string;
  committeeName?: string;
  className?: string;
  showInfra?: boolean;
  showProgress?: boolean;
}

export default function UniversalCommitteeActions({
  committeeSlug,
  committeeName,
  className = '',
  showInfra = false,
  showProgress = false,
}: UniversalCommitteeActionsProps) {
  const [activeModal, setActiveModal] = useState<UniversalModuleType | null>(
    null
  );

  return (
    <>
      <div
        className={`bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Universal Operations Hub:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('attendance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open verified attendance roll call"
          >
            <CheckSquare className="w-3.5 h-3.5 text-violet-600" />
            <span>Attendance Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('documents')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open isolated committee file vault"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Document Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open urgent operational help desk"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>May I Help You</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('complaints')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open official grievance & complaint reporting"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Complaints Tribunal</span>
          </button>

          {showProgress && (
            <button
              type="button"
              onClick={() => setActiveModal('progress')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
              title="Open deliverables & milestone tracking"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Progress Tracker</span>
            </button>
          )}

          {showInfra && (
            <Link
              href="/committee/infra"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Infra Vendors</span>
            </Link>
          )}
        </div>
      </div>

      {/* Full-Screen Slide-Up Operations Modal */}
      <UniversalOperationsModal
        isOpen={Boolean(activeModal)}
        activeModule={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectModule={(mod) => setActiveModal(mod)}
        committeeSlug={committeeSlug}
        committeeName={committeeName}
      />
    </>
  );
}
