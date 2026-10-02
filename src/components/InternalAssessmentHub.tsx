'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  AlertOctagon,
} from 'lucide-react';
import InternalAssessmentModal, {
  AssessmentModuleType,
} from './InternalAssessmentModal';

interface InternalAssessmentHubProps {
  className?: string;
  initialCommitteeSlug?: string;
  canEditAttendance?: boolean;
  isReadOnly?: boolean;
  title?: string;
}

export default function InternalAssessmentHub({
  className = '',
  initialCommitteeSlug,
  canEditAttendance = true,
  isReadOnly = false,
  title = 'Internal Assessment Hub:',
}: InternalAssessmentHubProps) {
  const [activeModal, setActiveModal] = useState<AssessmentModuleType | null>(
    null
  );

  return (
    <>
      <div
        className={`bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {title}
          </span>
          {isReadOnly && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Observatory
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('progress')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open cross-committee progress deliverables and milestones"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Progress Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('audits')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open real-time immutable audit trail"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('attendance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open cross-committee attendance tracking and roster inspection"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Attendance Tracking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open help desk tickets and submissions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>May I Help You</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('complaints')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
            title="Open complaint submissions and tribunal investigations"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Complaint Submissions</span>
          </button>
        </div>
      </div>

      {/* Internal Assessment Takeover Modal */}
      <InternalAssessmentModal
        isOpen={Boolean(activeModal)}
        activeModule={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectModule={(mod) => setActiveModal(mod)}
        initialCommitteeSlug={initialCommitteeSlug}
        canEditAttendance={canEditAttendance}
        isReadOnly={isReadOnly}
      />
    </>
  );
}
