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
  Eye,
  X,
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Share2,
  Pencil,
  Save,
  Loader2,
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
  const [selectedReg, setSelectedReg] = useState<RegistrationRow | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [editingReg, setEditingReg] = useState<RegistrationRow | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [apiEndpoint]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response');
      }
      const data = await res.json();
      if (data.registrations) {
        setRegistrations(data.registrations);
      }
      if (typeof data.canEditParticipants === 'boolean') {
        setCanEdit(data.canEditParticipants);
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
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingReg(reg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors shadow-2xs"
                          title="Edit Participant Record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedReg(reg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] transition-colors shadow-2xs"
                        title="View Full Attendee Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <Link
                        href={`/tickets/${reg.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="View Official Digital Passes (PNG)"
                      >
                        <Ticket className="w-3.5 h-3.5 text-slate-500" />
                        <span>Passes</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comprehensive Attendee Details Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Registration Record #{selectedReg.id.slice(0, 8)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedReg.status === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedReg.status}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {selectedReg.leadName}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedReg.eventTitle} • {selectedReg.eventCategory}
                  {selectedReg.dayOption && ` (${selectedReg.dayOption.replace('_', ' ')})`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Attendee Profile Section */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {selectedReg.photoUrl ? (
                  <a
                    href={selectedReg.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Click to view full photo"
                    className="shrink-0 group"
                  >
                    <img
                      src={selectedReg.photoUrl}
                      alt={selectedReg.leadName}
                      className="w-20 h-24 object-cover rounded-xl border border-slate-300 shadow-sm group-hover:ring-2 group-hover:ring-[#1a73e8] transition-all"
                    />
                  </a>
                ) : (
                  <div className="w-20 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lead Participant
                    </span>
                    <span className="text-base font-extrabold text-slate-900 block truncate">
                      {selectedReg.leadName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Contact Number & Actions */}
                    <div>
                      <span className="text-[10px] text-slate-500 block">Contact Phone:</span>
                      {selectedReg.leadPhone ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-slate-900 font-mono">
                            {selectedReg.leadPhone}
                          </span>
                          <a
                            href={`tel:${selectedReg.leadPhone}`}
                            className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Call Phone"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://wa.me/91${selectedReg.leadPhone.replace(/\D/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <span className="text-[10px] text-slate-500 block">Email Address:</span>
                      <a
                        href={`mailto:${selectedReg.leadEmail}`}
                        className="font-medium text-[#1a73e8] hover:underline block truncate mt-0.5"
                      >
                        {selectedReg.leadEmail}
                      </a>
                    </div>

                    {/* College */}
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-500 block">College / Institution:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {selectedReg.college || "Lingaya's Vidyapeeth (Host)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Transaction Audit */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#1a73e8]" />
                    <span className="font-bold text-slate-900 text-xs">
                      Payment Verification & Transaction Audit
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    ₹{((selectedReg.amount || selectedReg.feeAmount) / 100).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                  {/* Razorpay Payment ID */}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Razorpay Payment ID / TxID:</span>
                    {selectedReg.razorpayPaymentId ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <code className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded">
                          {selectedReg.razorpayPaymentId}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedReg.razorpayPaymentId!)}
                          className="p-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                          title="Copy ID"
                        >
                          {copiedTxId === selectedReg.razorpayPaymentId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No online TxID recorded</span>
                    )}
                  </div>

                  {/* Razorpay Order ID */}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Razorpay Order ID:</span>
                    {selectedReg.razorpayOrderId ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <code className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded truncate max-w-[170px]">
                          {selectedReg.razorpayOrderId}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedReg.razorpayOrderId!)}
                          className="p-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                          title="Copy Order ID"
                        >
                          {copiedTxId === selectedReg.razorpayOrderId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">N/A (Desk Entry)</span>
                    )}
                  </div>

                  {/* Payer Name */}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Payer / Account Holder:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReg.payerName || selectedReg.leadName}
                    </span>
                  </div>

                  {/* Payment Method & Date */}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Method & Timestamp:</span>
                    <span className="font-medium text-slate-700">
                      {selectedReg.paymentMethod} • {new Date(selectedReg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Members Roster */}
              {selectedReg.teamMembers && selectedReg.teamMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Registered Team Members ({selectedReg.teamMembers.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Included under this booking</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedReg.teamMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{m.fullName}</span>
                          {m.rollNumber && (
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                              {m.rollNumber}
                            </span>
                          )}
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{m.phone}</span>
                            <a
                              href={`tel:${m.phone}`}
                              className="text-blue-600 hover:underline text-[10px] ml-1"
                            >
                              Call
                            </a>
                          </div>
                        )}
                        {m.college && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {m.college}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Backstage Audio / Video Tracks */}
              {(selectedReg.trackUploadUrl || selectedReg.trackNotes) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <Music className="w-4 h-4 text-amber-700" />
                      <span>Backstage Stage Track & Performance Cues</span>
                    </div>
                    {selectedReg.trackUploadUrl && (
                      <a
                        href={
                          selectedReg.trackUploadUrl.startsWith('http')
                            ? selectedReg.trackUploadUrl
                            : `https://${selectedReg.trackUploadUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:underline"
                      >
                        <span>Open Audio/Video File</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {selectedReg.trackNotes && (
                    <p className="text-xs text-amber-950 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200">
                      &quot;{selectedReg.trackNotes}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Passes & Gate Check-in Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Gate Passes & Verification ({selectedReg.tickets.length})
                  </h4>
                  <Link
                    href={`/tickets/${selectedReg.id}`}
                    target="_blank"
                    className="text-[11px] font-bold text-[#1a73e8] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Official Passes (PNG Only)</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {selectedReg.tickets.map((t) => (
                    <div key={t.ticketCode} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {t.ticketCode}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                t.status === 'CHECKED_IN'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === 'WAITLIST'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {t.fullName} {t.college ? `• ${t.college}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {t.checkedInAt ? (
                          <span className="text-[10px] text-emerald-700 block font-medium">
                            Checked in: {new Date(t.checkedInAt).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">Not checked in</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `[Zest 2026 Registration Details]
Event: ${selectedReg.eventTitle} (${selectedReg.eventCategory})
Attendee: ${selectedReg.leadName}
Contact: ${selectedReg.leadPhone || 'N/A'}
College: ${selectedReg.college || "Lingaya's Vidyapeeth"}
Amount: ₹${((selectedReg.amount || selectedReg.feeAmount) / 100).toFixed(0)} (${selectedReg.status})
TxID: ${selectedReg.razorpayPaymentId || 'N/A'}
Payer: ${selectedReg.payerName || selectedReg.leadName}
Pass Codes: ${selectedReg.tickets.map((t) => t.ticketCode).join(', ')}`;
                  navigator.clipboard.writeText(summaryText);
                  setCopiedSummary(true);
                  setTimeout(() => setCopiedSummary(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Summary (WhatsApp)</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/tickets/${selectedReg.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>View Passes (PNG)</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Participant Modal ─────────────────────────────────── */}
      {editingReg && (
        <EditParticipantModal
          reg={editingReg}
          apiEndpoint={apiEndpoint}
          onClose={() => setEditingReg(null)}
          onSaved={(updated) => {
            setRegistrations((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
            // Also update the dossier modal if open on same record
            if (selectedReg?.id === updated.id) {
              setSelectedReg((prev) => prev ? { ...prev, ...updated } : prev);
            }
            setEditingReg(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditParticipantModal Component
// ─────────────────────────────────────────────────────────────────────────────

interface EditParticipantModalProps {
  reg: RegistrationRow;
  apiEndpoint: string;
  onClose: () => void;
  onSaved: (updated: Partial<RegistrationRow> & { id: string }) => void;
}

function EditParticipantModal({ reg, apiEndpoint, onClose, onSaved }: EditParticipantModalProps) {
  const [leadName, setLeadName] = useState(reg.leadName);
  const [leadEmail, setLeadEmail] = useState(reg.leadEmail);
  const [leadPhone, setLeadPhone] = useState(reg.leadPhone || '');
  const [college, setCollege] = useState(reg.college || '');
  const [status, setStatus] = useState(reg.status);
  const [dayOption, setDayOption] = useState(reg.dayOption || '');
  const [trackUploadUrl, setTrackUploadUrl] = useState(reg.trackUploadUrl || '');
  const [trackNotes, setTrackNotes] = useState(reg.trackNotes || '');
  const [teamMembers, setTeamMembers] = useState(
    reg.teamMembers.map((m) => ({ ...m }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Read operator identity from localStorage (set by OperatorIdentityModal)
  const getOperatorHeaders = (): Record<string, string> => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('festos_operator_profile') : null;
      if (!raw) return {};
      const op = JSON.parse(raw);
      if (op?.operatorName && op?.operatorRollNo) {
        return {
          'x-operator-name': op.operatorName,
          'x-operator-roll': op.operatorRollNo,
          'x-operator-type': op.operatorType || 'STUDENT',
        };
      }
    } catch {
      // ignore
    }
    return {};
  };

  const operatorHeaders = getOperatorHeaders();
  const hasOperatorIdentity = !!(operatorHeaders['x-operator-name']);

  const handleSave = async () => {
    if (!hasOperatorIdentity) {
      setErrorMsg('You must register your identity first. Please complete the "Desk Operator Verification" step from the dashboard header.');
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Determine correct PATCH endpoint (same base as apiEndpoint)
      const patchUrl = apiEndpoint.includes('?')
        ? apiEndpoint.split('?')[0]
        : apiEndpoint;

      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Always forward operator identity so audit log captures real name + roll no
          ...operatorHeaders,
        },
        body: JSON.stringify({
          registrationId: reg.id,
          leadName: leadName.trim(),
          leadEmail: leadEmail.trim(),
          leadPhone: leadPhone.trim() || null,
          college: college.trim() || null,
          status,
          dayOption: dayOption || null,
          trackUploadUrl: trackUploadUrl.trim() || null,
          trackNotes: trackNotes.trim() || null,
          teamMembers: teamMembers.map((m) => ({
            fullName: m.fullName,
            phone: m.phone || null,
            college: m.college || null,
            rollNumber: m.rollNumber || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Save failed');
      }
      setSuccessMsg('Participant record updated successfully.');
      setTimeout(() => {
        onSaved({
          id: reg.id,
          leadName: leadName.trim(),
          leadEmail: leadEmail.trim(),
          leadPhone: leadPhone.trim() || null,
          college: college.trim() || null,
          status,
          dayOption: dayOption || null,
          trackUploadUrl: trackUploadUrl.trim() || null,
          trackNotes: trackNotes.trim() || null,
          teamMembers,
        });
      }, 900);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTeamMember = (
    idx: number,
    field: keyof (typeof teamMembers)[0],
    value: string
  ) => {
    setTeamMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 bg-violet-700 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pencil className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                Edit Participant Record
              </span>
            </div>
            <h3 className="text-lg font-extrabold">{reg.leadName}</h3>
            <p className="text-xs opacity-70 mt-0.5">
              {reg.eventTitle} • ID: {reg.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-violet-800 hover:bg-violet-900 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Operator Identity Banner */}
          {hasOperatorIdentity ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Editing as{' '}
                <strong>{operatorHeaders['x-operator-name']}</strong>{' '}
                <span className="font-mono text-emerald-700">({operatorHeaders['x-operator-roll']})</span>
                {' '}— all changes will be audit-logged with this identity.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                ⚠️ No desk operator identity registered. Please click <strong>"Identify Desk Operator"</strong> in the dashboard header before saving — edits without identity cannot be saved.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Core Info */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Lead Participant</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">College / Institute</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Registration Fields */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Registration Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Payment Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:border-violet-500 focus:outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Day Pass Option</label>
                <select
                  value={dayOption}
                  onChange={(e) => setDayOption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:border-violet-500 focus:outline-none"
                >
                  <option value="">— Not Applicable —</option>
                  <option value="DAY_1">Day 1 Only</option>
                  <option value="DAY_2">Day 2 Only</option>
                  <option value="BOTH_DAYS">Both Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stage Track */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Stage Track & AV Cues</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Audio/Video Upload URL</label>
                <input
                  type="url"
                  value={trackUploadUrl}
                  onChange={(e) => setTrackUploadUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Stage Notes / AV Cues</label>
                <textarea
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Start at 0:30, fade out at 2:45, requires mic stand..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Team Members ({teamMembers.length})
              </p>
              <div className="space-y-3">
                {teamMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Member {idx + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={m.fullName}
                          onChange={(e) => updateTeamMember(idx, 'fullName', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Roll Number</label>
                        <input
                          type="text"
                          value={m.rollNumber || ''}
                          onChange={(e) => updateTeamMember(idx, 'rollNumber', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Phone</label>
                        <input
                          type="tel"
                          value={m.phone || ''}
                          onChange={(e) => updateTeamMember(idx, 'phone', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">College</label>
                        <input
                          type="text"
                          value={m.college || ''}
                          onChange={(e) => updateTeamMember(idx, 'college', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400">
            All edits are immutably audit-logged with your identity &amp; timestamp.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !!successMsg}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
