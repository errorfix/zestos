'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  UploadCloud,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserCheck,
  ShieldAlert,
  Users,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface RosterMember {
  id: string;
  rollNumber: string;
  studentName?: string | null;
}

interface AttendanceRecord {
  id: string;
  rollNumber: string;
  isPresent: boolean;
  date: string;
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
}

export default function AttendanceSheet({ committeeSlug, committeeName, initialDate }: AttendanceSheetProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [publishInfo, setPublishInfo] = useState<PublishInfo | null>(null);
  const [latestPublishedDate, setLatestPublishedDate] = useState<string | null>(null);
  const [publishHistory, setPublishHistory] = useState<PublishInfo[]>([]);
  const [canMark, setCanMark] = useState(false);
  const [operatorType, setOperatorType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Roll Number Input
  const [newRollNo, setNewRollNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const url = `/api/attendance?date=${encodeURIComponent(selectedDate)}${committeeSlug ? `&committee=${encodeURIComponent(committeeSlug)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setRoster(data.roster || []);
        setPublishInfo(data.publishInfo || null);
        setLatestPublishedDate(data.latestPublishedDate || null);
        setPublishHistory(data.publishHistory || []);
        setCanMark(data.canMark || false);
        setOperatorType(data.operatorType || 'STUDENT');
        setOperatorName(data.operatorName || null);

        // Populate presence map from existing records or default to false
        const map: Record<string, boolean> = {};
        if (data.attendanceRecords && data.attendanceRecords.length > 0) {
          for (const rec of data.attendanceRecords) {
            map[rec.rollNumber] = rec.isPresent;
          }
        }
        // Fill remaining roster with false if not in map
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
  }, [selectedDate, committeeSlug]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = (rollNumber: string) => {
    // If published, edits are locked
    if (publishInfo) return;
    if (!canMark) return;

    setPresenceMap((prev) => ({
      ...prev,
      [rollNumber]: !prev[rollNumber],
    }));
  };

  const handleMarkAll = (val: boolean) => {
    if (publishInfo || !canMark) return;
    const newMap: Record<string, boolean> = {};
    for (const m of roster) {
      newMap[m.rollNumber] = val;
    }
    setPresenceMap(newMap);
  };

  const handleAddRollNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim()) return;

    setAddingMember(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ROLL_NUMBER',
          committee: committeeSlug,
          rollNumber: newRollNo.trim().toUpperCase(),
          studentName: newStudentName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add roll number');
      }

      showToast(`✓ Added Roll Number ${newRollNo.trim().toUpperCase()}`);
      setNewRollNo('');
      setNewStudentName('');
      fetchAttendance();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setAddingMember(false);
    }
  };

  const handlePushAttendance = async () => {
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
      const entries = roster.map((m) => ({
        rollNumber: m.rollNumber,
        isPresent: Boolean(presenceMap[m.rollNumber]),
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }, [presenceMap, roster, selectedDate, committeeSlug, canMark, publishInfo, operatorName, committeeName]);

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const absentCount = roster.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Header with Date on one edge & Push Button */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-900 border border-violet-200 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-violet-700" />
                Attendance Stream
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {committeeName || committeeSlug}
              </span>
              {publishInfo && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Sealed &amp; Published
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Committee Attendance Roster &amp; Daily Publish
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Mark student roll numbers present or absent for duty. Only Faculty Staff In-Charge can push and seal attendance records. Finalized records are exported to CS&amp;IT and Controls.
            </p>
          </div>

          {/* Right Edge: Date Picker + Push Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            <a
              href={`/api/attendance?date=${encodeURIComponent(selectedDate)}&export=csv${committeeSlug ? `&committee=${encodeURIComponent(committeeSlug)}` : ''}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            {publishInfo ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pushed on {new Date(publishInfo.publishedAt).toLocaleDateString('en-IN')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePushAttendance}
                disabled={submitting || !canMark}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all ${
                  canMark
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-400 cursor-not-allowed opacity-75'
                }`}
                title={canMark ? 'Push attendance to central system' : 'Only Faculty In-Charge can push attendance'}
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
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {!canMark && (
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

        {publishInfo && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Attendance for <strong>{selectedDate}</strong> was officially finalized by <strong>{publishInfo.facultyName}</strong> ({publishInfo.facultyRollNo}) on {new Date(publishInfo.publishedAt).toLocaleTimeString('en-IN')}.
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 shrink-0">
              Present: {publishInfo.totalPresent} • Absent: {publishInfo.totalAbsent}
            </span>
          </div>
        )}

        {/* Quick Stats & Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Roster</span>
            <span className="text-xl font-black text-slate-900">{roster.length}</span>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Present</span>
            <span className="text-xl font-black text-emerald-800">{presentCount}</span>
          </div>
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Absent</span>
            <span className="text-xl font-black text-rose-800">{absentCount}</span>
          </div>
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Latest Sealed Date</span>
            <span className="text-sm font-bold text-blue-900">{latestPublishedDate || 'None Yet'}</span>
          </div>
        </div>
      </div>

      {/* Add New Student Roll Number Bar */}
      <form onSubmit={handleAddRollNumber} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Add Roll Number to Roster:</span>
        </div>
        <input
          type="text"
          maxLength={20}
          required
          value={newRollNo}
          onChange={(e) => setNewRollNo(e.target.value)}
          placeholder="e.g. 23BTECH104 (max 20 chars)"
          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
        />
        <input
          type="text"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          placeholder="Student Name (Optional)"
          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
        />
        <button
          type="submit"
          disabled={addingMember}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          {addingMember ? 'Adding...' : 'Add to Roster'}
        </button>
      </form>

      {/* Roster Table with Checkboxes */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading attendance roster...</p>
        </div>
      ) : roster.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No student roll numbers in this committee roster</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the bar above to enter volunteer roll numbers for this committee. Roll numbers are recorded once and persist across all days.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header controls */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">
              Attendance Roster ({roster.length} students)
            </span>
            {canMark && !publishInfo && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-rose-700"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Status</th>
                  <th className="py-3 px-4">Student Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Committee</th>
                  <th className="py-3 px-4 text-right">Attendance State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {roster.map((member) => {
                  const isPresent = Boolean(presenceMap[member.rollNumber]);
                  return (
                    <tr
                      key={member.id}
                      onClick={() => handleToggle(member.rollNumber)}
                      className={`transition-colors ${
                        canMark && !publishInfo ? 'cursor-pointer hover:bg-slate-50' : ''
                      } ${isPresent ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          disabled={!canMark || Boolean(publishInfo)}
                          onChange={() => handleToggle(member.rollNumber)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                          {committeeName || committeeSlug}
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
