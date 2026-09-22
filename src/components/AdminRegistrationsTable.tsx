'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Ticket,
} from 'lucide-react';

interface RegistrationRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  feeAmount: number;
  leadName: string;
  leadEmail: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
    fullName: string;
    checkedInAt?: string | null;
  }>;
}

export default function AdminRegistrationsTable() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      const data = await res.json();
      if (data.registrations) {
        setRegistrations(data.registrations);
      }
    } catch (e) {
      console.error('Failed to load registrations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = registrations.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      r.leadName.toLowerCase().includes(query) ||
      r.leadEmail.toLowerCase().includes(query) ||
      r.eventTitle.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query) ||
      r.tickets.some((t) => t.ticketCode.toLowerCase().includes(query)) ||
      r.teamMembers.some((m) => m.fullName.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const handleExportCsv = () => {
    if (registrations.length === 0) return;

    // Header row
    const headers = [
      'Registration ID',
      'Event Title',
      'Event Category',
      'Fee (INR)',
      'Lead Attendee Name',
      'Lead Email',
      'Payment Status',
      'Payment Method',
      'Team Members Count',
      'Ticket Codes',
      'Gate Check-In Status',
      'Registered Date',
    ];

    const rows = registrations.map((r) => [
      `"${r.id}"`,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.eventCategory}"`,
      (r.feeAmount / 100).toFixed(2),
      `"${r.leadName.replace(/"/g, '""')}"`,
      `"${r.leadEmail}"`,
      r.status,
      r.paymentMethod,
      1 + r.teamMembers.length,
      `"${r.tickets.map((t) => t.ticketCode).join(', ')}"`,
      `"${r.tickets.map((t) => `${t.ticketCode}: ${t.status}`).join(' | ')}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `festos_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Master Attendee Registry ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500">
            Real-time participant rosters, payment records, and gate check-in audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by attendee name, email, event, or ticket code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-[#1a73e8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading registration records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
          No registration records matching your filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Lead Attendee</th>
                <th className="py-3 px-3">Event</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Passes & Gate</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block">{reg.leadName}</span>
                    <span className="text-[11px] text-slate-500 block">{reg.leadEmail}</span>
                    {reg.teamMembers.length > 0 && (
                      <span className="text-[10px] text-blue-600 block mt-0.5">
                        +{reg.teamMembers.length} team member(s)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800 block">{reg.eventTitle}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {reg.eventCategory} • ₹{reg.feeAmount / 100}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          reg.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {reg.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {reg.tickets.map((t) => (
                        <span
                          key={t.ticketCode}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                            t.status === 'CHECKED_IN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Ticket className="w-3 h-3" />
                          {t.ticketCode}
                          {t.status === 'CHECKED_IN' && ' (In)'}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <Link
                      href={`/tickets/${reg.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] hover:underline"
                    >
                      <span>Passes</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
