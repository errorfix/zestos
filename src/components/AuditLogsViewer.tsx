'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=200');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }
      setLogs(data.logs || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLogs) {
      fetchLogs();
    }
  }, [initialLogs]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Immutable PostgreSQL Audit Trail</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {filteredLogs.length} Records
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Security &amp; Operator Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every modification is cryptographically associated with the desk officer&apos;s verified Roll No. / Employee ID.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by operator name, roll no, target ID, action..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
            <p className="text-xs font-semibold text-slate-500">Loading audit records from PostgreSQL...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No audit records match your filters</p>
            <p className="text-xs text-slate-500 mt-1">Actions taken by desk operators will stream here automatically.</p>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
                                Modified by: {log.operatorName} ({log.operatorRollNo})
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
