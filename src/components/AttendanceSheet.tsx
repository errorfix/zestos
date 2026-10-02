'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckSquare,
  UploadCloud,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { getLocalOperator } from '@/components/OperatorIdentityModal';
import { getCommitteeBySlug, getCommitteeById } from '@/lib/committeeConstants';

interface RosterMember {
  id: string;
  rollNumber: string;
  studentName?: string | null;
  committeeId?: string;
  date?: string;
}

interface AttendanceRecord {
  id: string;
  committeeId: string;
  rollNumber: string;
  isPresent: boolean;
  date: string;
  facultyName?: string | null;
  facultyRollNo?: string | null;
}

interface PublishInfo {
  id: string;
  date: string;
  publishedAt: string;
  facultyName: string;
  facultyRollNo: string;
  totalPresent: number;
  totalAbsent: number;
}

interface AttendanceSheetProps {
  committeeSlug?: string;
  committeeName?: string;
  initialDate?: string;
  selectedDate?: string;
  isAllTime?: boolean;
  isReadOnly?: boolean;
}

export default function AttendanceSheet({
  committeeSlug,
  committeeName,
  initialDate,
  selectedDate: propSelectedDate,
  isAllTime = false,
  isReadOnly = false,
}: AttendanceSheetProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (propSelectedDate) return propSelectedDate;
    if (initialDate) return initialDate;
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [publishInfo, setPublishInfo] = useState<PublishInfo | null>(null);
  const [latestPublishedDate, setLatestPublishedDate] = useState<string | null>(null);
  const [canMark, setCanMark] = useState(false);
  const [operatorType, setOperatorType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination & Search state (25 - 150)
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const localOp = getLocalOperator();
      const headers: Record<string, string> = {};
      if (localOp) {
        headers['x-operator-name'] = localOp.operatorName;
        headers['x-operator-roll'] = localOp.operatorRollNo;
        headers['x-operator-type'] = localOp.operatorType;
      }

      const params = new URLSearchParams();
      if (isAllTime) {
        params.append('allTime', 'true');
      } else {
        params.append('date', selectedDate);
      }
      if (committeeSlug) {
        params.append('committee', committeeSlug);
      }

      const url = `/api/attendance?${params.toString()}`;
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.success) {
        setRoster(data.roster || []);
        setAttendanceRecords(data.attendanceRecords || []);
        setPublishInfo(data.publishInfo || null);
        setLatestPublishedDate(data.latestPublishedDate || null);

        const isHamObservatory = Boolean(data.isHAM || isReadOnly);
        const finalCanMark = !isHamObservatory && Boolean(data.canMark || (data.canEdit && localOp?.operatorType === 'FACULTY'));
        setCanMark(finalCanMark);
        setOperatorType(localOp?.operatorType || data.operatorType || (finalCanMark ? 'FACULTY' : 'STUDENT'));
        setOperatorName(localOp?.operatorName || data.operatorName || (finalCanMark ? 'Faculty In-Charge' : null));

        // Populate presence map from existing records or default to false
        const map: Record<string, boolean> = {};
        if (data.attendanceRecords && data.attendanceRecords.length > 0) {
          for (const rec of data.attendanceRecords) {
            // For single date mode or all time latest status
            map[rec.rollNumber] = rec.isPresent;
          }
        }
        for (const m of data.roster || []) {
          if (map[m.rollNumber] === undefined) {
            map[m.rollNumber] = false;
          }
        }
        setPresenceMap(map);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, committeeSlug, isAllTime]);

  // Listen to operator changes from header modal
  useEffect(() => {
    const handleOpChange = () => {
      fetchAttendance();
    };
    window.addEventListener('festos_operator_updated', handleOpChange);
    return () => {
      window.removeEventListener('festos_operator_updated', handleOpChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = (rollNumber: string) => {
    if (isAllTime) return; // All time is a master review mode
    if (publishInfo) return;
    if (!canMark) return;

    setPresenceMap((prev) => ({
      ...prev,
      [rollNumber]: !prev[rollNumber],
    }));
  };

  const handleMarkAll = (val: boolean) => {
    if (isAllTime || publishInfo || !canMark) return;
    const newMap: Record<string, boolean> = {};
    for (const m of roster) {
      newMap[m.rollNumber] = val;
    }
    setPresenceMap(newMap);
  };

  const handlePushAttendance = async () => {
    if (isAllTime) {
      alert('Attendance cannot be pushed in "All Time" mode. Please select a specific date.');
      return;
    }

    if (!canMark) {
      alert('Only Faculty Staff In-Charge can officially push and seal attendance records.');
      return;
    }

    if (roster.length === 0) {
      alert('Cannot push attendance with an empty student roster. Please add student roll numbers first.');
      return;
    }

    if (publishInfo) {
      alert(`Attendance for ${selectedDate} has already been pushed and sealed. You cannot overwrite a finalized date.`);
      return;
    }

    const presentCount = Object.values(presenceMap).filter(Boolean).length;
    const absentCount = roster.length - presentCount;

    const confirmMsg = `Confirm submission of final attendance for ${selectedDate}?\n\n• Committee: ${committeeName || committeeSlug}\n• Present: ${presentCount}\n• Absent: ${absentCount}\n• Sealed By: ${operatorName || 'Faculty In-Charge'}\n\nNote: Once pushed, this date cannot be re-pushed.`;
    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const localOp = getLocalOperator();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (localOp) {
        headers['x-operator-name'] = localOp.operatorName;
        headers['x-operator-roll'] = localOp.operatorRollNo;
        headers['x-operator-type'] = localOp.operatorType;
      }

      const entries = roster.map((m) => ({
        rollNumber: m.rollNumber,
        isPresent: Boolean(presenceMap[m.rollNumber]),
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'PUSH_ATTENDANCE',
          committee: committeeSlug,
          date: selectedDate,
          entries,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to push attendance');
      }

      showToast(`✓ ${data.message}`);
      fetchAttendance();
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleTriggerPush = () => {
      handlePushAttendance();
    };
    window.addEventListener('festos_apply_attendance', handleTriggerPush);
    return () => window.removeEventListener('festos_apply_attendance', handleTriggerPush);
  }, [presenceMap, roster, selectedDate, committeeSlug, canMark, publishInfo, operatorName, committeeName, isAllTime]);

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const absentCount = roster.length - presentCount;

  // Filtered and paginated rows
  const filteredItems = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (isAllTime && attendanceRecords.length > 0) {
      // In all-time mode, show individual attendance events
      return attendanceRecords.filter((rec) => {
        if (!q) return true;
        return (
          rec.rollNumber.toLowerCase().includes(q) ||
          (rec.committeeId && rec.committeeId.toLowerCase().includes(q)) ||
          rec.date.includes(q)
        );
      });
    }

    // Single-date roster mode
    return roster.filter((member) => {
      if (!q) return true;
      return (
        member.rollNumber.toLowerCase().includes(q) ||
        (member.studentName && member.studentName.toLowerCase().includes(q)) ||
        (member.committeeId && member.committeeId.toLowerCase().includes(q))
      );
    });
  }, [isAllTime, attendanceRecords, roster, searchFilter]);

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, pageSize, isAllTime, committeeSlug]);

  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const displayedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const resolveBadgeName = (commId?: string) => {
    if (!commId) return committeeName || committeeSlug || 'General Desk';
    const match = getCommitteeBySlug(commId) || getCommitteeById(commId);
    return match ? match.name : commId;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-900 border border-violet-200 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-violet-700" />
                Attendance Stream
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {committeeSlug === 'all' ? 'Master Campus View' : (committeeName || committeeSlug)}
              </span>
              {isAllTime && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                  All Time Archive
                </span>
              )}
              {!isAllTime && publishInfo && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Sealed &amp; Published
                </span>
              )}
              {!canMark && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  View-Only Observatory
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isAllTime ? 'Master Attendance Archive (All Time)' : 'Committee Attendance Roster & Daily Publish'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isAllTime
                ? 'Comprehensive institutional record of student volunteer presence across all recorded dates and committees.'
                : canMark
                ? 'Mark student roll numbers present or absent for duty. Only Faculty Staff In-Charge or CS&IT Administration can push and seal attendance records.'
                : 'Higher Authority Observatory: View-only inspection mode. Attendance modifications and publishing are exclusive to CS&IT Committee.'}
            </p>
          </div>

          {/* Right Edge: Date Picker + Push Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isAllTime && (
              <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            )}

            <a
              href={`/api/attendance?date=${encodeURIComponent(isAllTime ? 'all' : selectedDate)}&export=csv${committeeSlug ? `&committee=${encodeURIComponent(committeeSlug)}` : ''}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            {!isAllTime && (
              publishInfo ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pushed on {new Date(publishInfo.publishedAt).toLocaleDateString('en-IN')}</span>
                </div>
              ) : canMark ? (
                <button
                  type="button"
                  onClick={handlePushAttendance}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  title="Push attendance to central system"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Push Attendance for {selectedDate}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Only (CS&amp;IT Exclusive)</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {!canMark && !isAllTime && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span>Attendance marking and publishing is <strong>restricted to Faculty Staff In-Charge</strong>.</span>
              <span className="block text-[11px] text-amber-700 font-normal mt-0.5">
                Current active operator is logged in as Student Desk ({operatorName || 'Student'}). To mark attendance, switch desk operator to a Faculty profile using the desk header badge.
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              {isAllTime ? 'Total Entries' : 'Total Roster'}
            </span>
            <span className="text-xl font-black text-slate-900">
              {isAllTime ? attendanceRecords.length : roster.length}
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Present</span>
            <span className="text-xl font-black text-emerald-800">
              {isAllTime
                ? attendanceRecords.filter((r) => r.isPresent).length
                : presentCount}
            </span>
          </div>
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Absent</span>
            <span className="text-xl font-black text-rose-800">
              {isAllTime
                ? attendanceRecords.filter((r) => !r.isPresent).length
                : absentCount}
            </span>
          </div>
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Latest Sealed Date</span>
            <span className="text-sm font-bold text-blue-900">{latestPublishedDate || 'None Yet'}</span>
          </div>
        </div>
      </div>

      {/* Attendance Table Container with Gmail-style 25-150 Pagination */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading attendance records...</p>
        </div>
      ) : totalFiltered === 0 && roster.length === 0 && attendanceRecords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No attendance records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAllTime
              ? 'No historical attendance records have been registered for this filter selection yet.'
              : 'No volunteer records found for this committee on the selected date.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Toolbar: Search + Mark All + Pagination Range Controls */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Search input */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search roll number..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Middle: Mark All buttons for non-published date mode */}
            {!isAllTime && canMark && !publishInfo && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 cursor-pointer shadow-2xs"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-rose-700 cursor-pointer shadow-2xs"
                >
                  Mark All Absent
                </button>
              </div>
            )}

            {/* Right: 25-150 Pagination Control */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-slate-400 text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                </select>
              </div>

              <span className="text-xs font-bold text-slate-700 tracking-tight whitespace-nowrap">
                {totalFiltered === 0
                  ? '0 of 0'
                  : `${startIndex + 1}–${endIndex} of ${totalFiltered.toLocaleString()}`}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Previous entries"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  title="Next entries"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {!isAllTime && <th className="py-3 px-4 w-16 text-center">Status</th>}
                  {isAllTime && <th className="py-3 px-4">Date</th>}
                  <th className="py-3 px-4">Student Roll Number</th>
                  {!isAllTime && <th className="py-3 px-4">Student Name</th>}
                  <th className="py-3 px-4">Committee</th>
                  {isAllTime && <th className="py-3 px-4">Faculty In-Charge</th>}
                  <th className="py-3 px-4 text-right">Attendance State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedItems.map((item, idx) => {
                  if (isAllTime) {
                    const record = item as AttendanceRecord;
                    return (
                      <tr key={record.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {record.date}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {record.rollNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {resolveBadgeName(record.committeeId)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {record.facultyName || 'Staff In-Charge'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              record.isPresent
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                            }`}
                          >
                            {record.isPresent ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const member = item as RosterMember;
                  const isPresent = Boolean(presenceMap[member.rollNumber]);
                  return (
                    <tr
                      key={member.id || idx}
                      onClick={() => canMark && !publishInfo && !isAllTime && handleToggle(member.rollNumber)}
                      className={`transition-colors ${
                        canMark && !publishInfo && !isAllTime ? 'cursor-pointer hover:bg-slate-50' : ''
                      } ${isPresent ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          disabled={!canMark || Boolean(publishInfo) || isAllTime}
                          onChange={() => canMark && !publishInfo && !isAllTime && handleToggle(member.rollNumber)}
                          className={`w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 ${
                            canMark && !publishInfo && !isAllTime ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {member.rollNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {member.studentName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {resolveBadgeName(member.committeeId)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {isPresent ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
