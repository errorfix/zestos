'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  CheckCircle2,
  ExternalLink,
  Ticket,
  Music,
  UploadCloud,
  FileText,
  Copy,
  Check,
  User,
  Phone,
  GraduationCap,
  CreditCard,
} from 'lucide-react';

interface RegistrationRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  feeAmount: number;
  dayOption?: string | null;
  trackUploadUrl?: string | null;
  trackNotes?: string | null;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  college?: string | null;
  photoUrl?: string | null;
  payerName?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  amount?: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string; phone?: string; college?: string }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
    fullName: string;
    college?: string | null;
    photoUrl?: string | null;
    checkedInAt?: string | null;
  }>;
}

interface AdminRegistrationsTableProps {
  apiEndpoint?: string;
  title?: string;
  subtitle?: string;
}

export default function AdminRegistrationsTable({
  apiEndpoint = '/api/admin/registrations',
  title = 'Master Attendee Registry',
  subtitle = 'Search across attendee names, college emails, track notes, and unique HMAC security hashes.',
}: AdminRegistrationsTableProps = {}) {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [apiEndpoint]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiEndpoint);
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(text);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const filtered = registrations.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      r.leadName.toLowerCase().includes(query) ||
      r.leadEmail.toLowerCase().includes(query) ||
      (r.leadPhone && r.leadPhone.toLowerCase().includes(query)) ||
      (r.college && r.college.toLowerCase().includes(query)) ||
      (r.payerName && r.payerName.toLowerCase().includes(query)) ||
      (r.razorpayPaymentId && r.razorpayPaymentId.toLowerCase().includes(query)) ||
      r.eventTitle.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query) ||
      (r.trackNotes && r.trackNotes.toLowerCase().includes(query)) ||
      (r.trackUploadUrl && r.trackUploadUrl.toLowerCase().includes(query)) ||
      r.tickets.some((t) => t.ticketCode.toLowerCase().includes(query)) ||
      r.teamMembers.some((m) => m.fullName.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const handleExportCsv = () => {
    if (registrations.length === 0) return;

    // Header row
    const headers = [
      'Registration ID',
      'Transaction ID (Razorpay)',
      'Razorpay Order ID',
      'Payer Name',
      'Lead Attendee Name',
      'Contact No',
      'College / Institute',
      'Lead Email',
      'Event Title',
      'Event Category',
      'Fee (INR)',
      'Day Pass Option',
      'Payment Status',
      'Payment Method',
      'Team Members Count',
      'Stage Track Link',
      'Stage AV Notes',
      'Ticket Codes',
      'Gate Check-In Status',
      'Registered Date',
    ];

    const rows = registrations.map((r) => [
      `"${r.id}"`,
      `"${r.razorpayPaymentId || 'N/A'}"`,
      `"${r.razorpayOrderId || 'N/A'}"`,
      `"${(r.payerName || r.leadName).replace(/"/g, '""')}"`,
      `"${r.leadName.replace(/"/g, '""')}"`,
      `"${r.leadPhone || 'N/A'}"`,
      `"${(r.college || 'N/A').replace(/"/g, '""')}"`,
      `"${r.leadEmail}"`,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.eventCategory}"`,
      ((r.amount || r.feeAmount) / 100).toFixed(2),
      `"${r.dayOption || 'Standard'}"`,
      r.status,
      r.paymentMethod,
      1 + r.teamMembers.length,
      `"${(r.trackUploadUrl || '').replace(/"/g, '""')}"`,
      `"${(r.trackNotes || '').replace(/"/g, '""')}"`,
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
            {title} ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://drive.google.com/drive/folders/1ORiYoFawuMWA0fOST-qfO2uBvEEZxTOE?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
          >
            <Music className="w-3.5 h-3.5 text-amber-700" />
            <span>Official Stage Drive</span>
            <ExternalLink className="w-3 h-3 text-amber-600" />
          </a>

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
            placeholder="Search attendee, transaction ID (pay_...), phone, college, event, ticket code..."
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
                <th className="py-3 px-3">Participant</th>
                <th className="py-3 px-3">Event & Access</th>
                <th className="py-3 px-3">Transaction ID & Payment</th>
                <th className="py-3 px-3">Stage Track / Cues</th>
                <th className="py-3 px-3">Passes & Gate</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Lead Attendee Column with Photo, Name, Phone, Email, College */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-start gap-2.5">
                      {reg.photoUrl ? (
                        <a
                          href={reg.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Click to view full photo"
                          className="shrink-0 relative group"
                        >
                          <img
                            src={reg.photoUrl}
                            alt={reg.leadName}
                            className="w-10 h-12 object-cover rounded-lg border border-slate-200 shadow-xs group-hover:ring-2 group-hover:ring-[#1a73e8] transition-all"
                          />
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                          {reg.leadName}
                        </span>
                        {reg.leadPhone && (
                          <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {reg.leadPhone}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 block truncate max-w-[170px]">
                          {reg.leadEmail}
                        </span>
                        {reg.college && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[170px]" title={reg.college}>
                            <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                            {reg.college}
                          </span>
                        )}
                        {reg.teamMembers.length > 0 && (
                          <span className="text-[10px] text-blue-600 block mt-1 font-semibold">
                            +{reg.teamMembers.length} team member(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Event & Day */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800 block">{reg.eventTitle}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500">
                        {reg.eventCategory} • ₹{(reg.amount || reg.feeAmount) / 100}
                      </span>
                      {reg.dayOption && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {reg.dayOption === 'BOTH_DAYS' ? 'Both Days' : reg.dayOption === 'DAY_2' ? 'Day 2' : 'Day 1'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Transaction ID & Payment Details */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {reg.status}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          ₹{((reg.amount || reg.feeAmount) / 100).toFixed(0)}
                        </span>
                      </div>

                      {/* Transaction ID Pill with 1-Click Copy */}
                      {reg.razorpayPaymentId ? (
                        <div className="flex items-center gap-1 mt-1">
                          <code
                            className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded max-w-[150px] truncate block"
                            title={reg.razorpayPaymentId}
                          >
                            {reg.razorpayPaymentId}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(reg.razorpayPaymentId!)}
                            title="Copy Transaction ID"
                            aria-label="Copy Transaction ID"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedTxId === reg.razorpayPaymentId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block">
                          No TxID (Pending/Unpaid)
                        </span>
                      )}

                      {reg.payerName && reg.payerName !== reg.leadName && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                          Payer: <strong className="text-slate-700">{reg.payerName}</strong>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 block">
                        {reg.paymentMethod}
                      </span>
                    </div>
                  </td>

                  {/* Stage Track */}
                  <td className="py-3.5 px-3">
                    {reg.trackUploadUrl ? (
                      <div className="space-y-1">
                        <a
                          href={reg.trackUploadUrl.startsWith('http') ? reg.trackUploadUrl : `https://${reg.trackUploadUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a73e8] hover:underline"
                        >
                          <Music className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[130px]">View Track File</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                        {reg.trackNotes && (
                          <span className="block text-[10px] text-slate-500 italic max-w-[150px] truncate" title={reg.trackNotes}>
                            &quot;{reg.trackNotes}&quot;
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">None required / attached</span>
                    )}
                  </td>

                  {/* Passes & Gate */}
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

                  {/* Actions */}
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
