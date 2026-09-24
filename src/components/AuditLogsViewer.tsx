'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  IdCard,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Tag,
  Layers,
  Activity,
  Play,
  Pause,
  Radio,
  Zap,
} from 'lucide-react';
import { LocalAuditLog } from '@/lib/db';

interface AuditLogsViewerProps {
  initialLogs?: LocalAuditLog[];
}

export default function AuditLogsViewer({ initialLogs }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<LocalAuditLog[]>(initialLogs || []);
  const [loading, setLoading] = useState(!initialLogs);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Real-time streaming state
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(
    new Date().toLocaleTimeString('en-IN')
  );
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);
  const [latestLogAlert, setLatestLogAlert] = useState<LocalAuditLog | null>(null);
  const previousTopIdRef = useRef<string | null>(null);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=250');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      const fetchedLogs: LocalAuditLog[] = data.logs || [];

      // Check if new records arrived in real-time
      if (fetchedLogs.length > 0) {
        const topLog = fetchedLogs[0];
        if (previousTopIdRef.current && topLog.id !== previousTopIdRef.current) {
          setLatestLogAlert(topLog);
          setHasNewAlert(true);
          setTimeout(() => setHasNewAlert(false), 5000);
        }
        previousTopIdRef.current = topLog.id;
      }

      setLogs(fetchedLogs);
      setLastSyncedTime(new Date().toLocaleTimeString('en-IN'));
    } catch (err) {
      if (!isBackground) {
        setError((err as Error).message || 'Failed to load audit logs.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (!initialLogs) {
      fetchLogs(false);
    } else if (initialLogs.length > 0) {
      previousTopIdRef.current = initialLogs[0].id;
    }
  }, [initialLogs]);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      fetchLogs(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  const uniqueOperatorsCount = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.operatorRollNo));
    return set.size;
  }, [logs]);

  const todayLogsCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((l) => new Date(l.createdAt).toDateString() === today).length;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction =
        selectedAction === 'ALL' || log.action === selectedAction;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.operatorName.toLowerCase().includes(q) ||
        log.operatorRollNo.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.changes && log.changes.toLowerCase().includes(q));

      return matchesAction && matchesQuery;
    });
  }, [logs, selectedAction, searchQuery]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      'Log ID',
      'Timestamp',
      'Operator Name',
      'Roll No / Employee ID',
      'Operator Type',
      'Committee Role',
      'Action',
      'Target Type',
      'Target ID',
      'Changes',
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.createdAt).toLocaleString('en-IN')}"`,
      `"${l.operatorName.replace(/"/g, '""')}"`,
      `"${l.operatorRollNo}"`,
      `"${l.operatorType || 'STUDENT'}"`,
      `"${l.committeeRoleId}"`,
      `"${l.action}"`,
      `"${l.targetType}"`,
      `"${l.targetId}"`,
      `"${(l.changes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `festos_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ONSPOT')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (action.includes('EDIT') || action.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (action.includes('DELETE') || action.includes('CANCEL')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (action.includes('FLAG')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (action.includes('CHECKIN')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Top Real-Time Control & Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Super Admin Exclusive Audit Stream</span>
            </span>

            {/* Real-Time Radar Badge */}
            {isLiveStreamActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>REAL-TIME STREAM ACTIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>STREAM PAUSED</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 font-mono">
              Synced: {lastSyncedTime}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Live Security &amp; Operator Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time PostgreSQL telemetry capturing exact operator roll numbers, timestamps, target IDs, and attribute diffs across all festival panels.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pause / Resume Live Polling */}
          <button
            type="button"
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isLiveStreamActive
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isLiveStreamActive ? 'Pause real-time updates' : 'Resume live stream'}
          >
            {isLiveStreamActive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Go Live</span>
              </>
            )}
          </button>

          {/* Manual Force Refresh */}
          <button
            onClick={() => fetchLogs(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time incoming event flash ticker */}
      {hasNewAlert && latestLogAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 animate-bounce text-amber-200" />
            <span>
              Real-time update: <strong>{latestLogAlert.operatorName}</strong> ({latestLogAlert.operatorRollNo}) executed{' '}
              <code className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-mono">{latestLogAlert.action}</code> on target{' '}
              <code className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-mono">{latestLogAlert.targetId}</code>.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider bg-black/20 px-2 py-0.5 rounded">
            Just now
          </span>
        </div>
      )}

      {/* Real-Time Live Metrics Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Mutations</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{logs.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Immutable records</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Active Operators</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{uniqueOperatorsCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Identified Roll Nos / IDs</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Today&apos;s Actions</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{todayLogsCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Logged past 24 hours</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Live Status</span>
            <Radio className={`w-4 h-4 ${isLiveStreamActive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <span className={`text-sm sm:text-base font-black ${isLiveStreamActive ? 'text-emerald-700' : 'text-slate-600'}`}>
            {isLiveStreamActive ? 'Connected (3.5s)' : 'Manual Mode'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">PostgreSQL Supabase</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by operator name, roll no, target ID, action..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table / List */}
      <div className="overflow-x-auto">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Connecting to PostgreSQL audit stream...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-500 mt-1">Actions taken by desk operators will stream here in real-time.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Desk Operator</th>
                <th className="py-3 px-4">Committee Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                let parsedChanges: Record<string, unknown> | null = null;
                if (log.changes) {
                  try {
                    parsedChanges = JSON.parse(log.changes);
                  } catch {
                    // Raw string
                  }
                }

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono pl-5">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold text-[11px]">
                            {log.operatorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {log.operatorName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {log.operatorRollNo}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {log.operatorType || 'STUDENT'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.committeeRoleId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {log.targetType}
                          </span>
                          <code className="text-[11px] font-mono font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
                            {log.targetId}
                          </code>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {log.changes ? (
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <span>Diff</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible Details Row */}
                    {isExpanded && log.changes && (
                      <tr className="bg-slate-900 text-slate-100">
                        <td colSpan={6} className="p-4 sm:p-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                              <span className="font-mono text-amber-400 font-bold">
                                Object ID: {log.targetId} ({log.targetType})
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                Modified by: {log.operatorName} ({log.operatorRollNo}) • {log.committeeRoleId}
                              </span>
                            </div>
                            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto text-emerald-400">
                              {parsedChanges
                                ? JSON.stringify(parsedChanges, null, 2)
                                : log.changes}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
