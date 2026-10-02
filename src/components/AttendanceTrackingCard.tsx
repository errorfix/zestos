'use client';

import React, { useState } from 'react';
import AttendanceSheet from './AttendanceSheet';
import { COMMITTEE_METAS } from '@/lib/committeeConstants';
import { CheckSquare, ExternalLink, ShieldCheck, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface AttendanceTrackingCardProps {
  initialCommitteeSlug?: string;
  canEdit?: boolean;
}

export default function AttendanceTrackingCard({
  initialCommitteeSlug = 'all',
  canEdit = true,
}: AttendanceTrackingCardProps) {
  const [selectedCommittee, setSelectedCommittee] = useState<string>(initialCommitteeSlug);

  const activeMeta = COMMITTEE_METAS.find(
    (c) => c.slug.toLowerCase() === selectedCommittee.toLowerCase()
  );
  const activeName = selectedCommittee === 'all' ? 'All Committees (Master View)' : activeMeta?.name || selectedCommittee;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              Attendance Operations Core
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Full Edit Authority Enabled
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Central Attendance Tracking &amp; Roll Call
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Verify student attendance, duty tracking, and seal official volunteer records across festival committees. Attendance Committee has full editing access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Committee Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">★ All Committees (Master View)</option>
              {COMMITTEE_METAS.map((comm) => (
                <option key={comm.id} value={comm.slug}>
                  {comm.badge} — {comm.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Direct link to dedicated stream */}
          <Link
            href={`/committee/attendance?committee=${selectedCommittee}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
            title="Open Dedicated Fullscreen Attendance Terminal"
          >
            <span>Fullscreen View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Attendance Sheet */}
      <AttendanceSheet
        key={selectedCommittee}
        committeeSlug={selectedCommittee}
        committeeName={activeName}
        canEdit={canEdit}
        isReadOnly={false}
      />
    </div>
  );
}
