'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SponsorshipDeal,
  SponsorshipKind,
  DealStatus,
  SponsorshipStatsResponse,
  SPONSORSHIP_KIND_LABELS,
  DEAL_STATUS_LABELS,
} from '@/lib/sponsorshipTypes';
import OperatorIdentityModal, { getLocalOperator, OperatorIdentity } from './OperatorIdentityModal';
import {
  Building2,
  Handshake,
  IndianRupee,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  FileText,
  Paperclip,
  ShieldCheck,
  User,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Briefcase,
  Layers,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';

interface SponsorshipManagerProps {
  allowEdit?: boolean;
  isSuperAdmin?: boolean;
}

export default function SponsorshipManager({
  allowEdit = true,
  isSuperAdmin = false,
}: SponsorshipManagerProps) {
  const [deals, setDeals] = useState<SponsorshipDeal[]>([]);
  const [stats, setStats] = useState<SponsorshipStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<SponsorshipDeal | null>(null);

  // Form Fields
  const [formCompany, setFormCompany] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formKind, setFormKind] = useState<SponsorshipKind>('ASSOCIATE_SPONSOR');
  const [formStatus, setFormStatus] = useState<DealStatus>('REACHED_OUT');
  const [formPitched, setFormPitched] = useState<number>(0);
  const [formCommitted, setFormCommitted] = useState<number>(0);
  const [formReceived, setFormReceived] = useState<number>(0);
  const [formDeliverables, setFormDeliverables] = useState('');
  const [formMouUrl, setFormMouUrl] = useState('');
  const [formProofUrl, setFormProofUrl] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Operator check
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [operator, setOperator] = useState<OperatorIdentity | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [dealsRes, statsRes] = await Promise.all([
        fetch('/api/sponsorship', { cache: 'no-store' }),
        fetch('/api/sponsorship/stats', { cache: 'no-store' }),
      ]);

      const dealsData = await dealsRes.json();
      const statsData = await statsRes.json();

      if (dealsData.success) {
        setDeals(dealsData.deals || []);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load sponsorship data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    setOperator(getLocalOperator());

    const handleOpUpdate = () => setOperator(getLocalOperator());
    window.addEventListener('festos_operator_updated', handleOpUpdate);
    return () => window.removeEventListener('festos_operator_updated', handleOpUpdate);
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (statusFilter !== 'ALL' && deal.dealStatus !== statusFilter) return false;
      if (kindFilter !== 'ALL' && deal.sponsorshipKind !== kindFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          deal.companyName.toLowerCase().includes(q) ||
          deal.brandSector.toLowerCase().includes(q) ||
          deal.contactPerson.toLowerCase().includes(q) ||
          deal.contactEmail.toLowerCase().includes(q) ||
          deal.deliverablesSummary.toLowerCase().includes(q) ||
          deal.operatorName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [deals, statusFilter, kindFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingDeal(null);
    setFormCompany('');
    setFormSector('Beverage & FMCG');
    setFormPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormKind('ASSOCIATE_SPONSOR');
    setFormStatus('REACHED_OUT');
    setFormPitched(100000);
    setFormCommitted(0);
    setFormReceived(0);
    setFormDeliverables('');
    setFormMouUrl('');
    setFormProofUrl('');
    setFormRemarks('');
    setIsModalOpen(true);
  };

  const openEditModal = (deal: SponsorshipDeal) => {
    setEditingDeal(deal);
    setFormCompany(deal.companyName);
    setFormSector(deal.brandSector);
    setFormPerson(deal.contactPerson);
    setFormEmail(deal.contactEmail);
    setFormPhone(deal.contactPhone);
    setFormKind(deal.sponsorshipKind);
    setFormStatus(deal.dealStatus);
    setFormPitched(deal.pitchedAmountInr);
    setFormCommitted(deal.committedAmountInr);
    setFormReceived(deal.receivedAmountInr);
    setFormDeliverables(deal.deliverablesSummary);
    setFormMouUrl(deal.mouDocumentUrl || '');
    setFormProofUrl(deal.paymentProofUrl || '');
    setFormRemarks(deal.remarks || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentOp = getLocalOperator();
    if (!currentOp && !editingDeal) {
      setIsIdentityModalOpen(true);
      return;
    }

    if (!formCompany.trim() || !formPerson.trim() || !formDeliverables.trim()) {
      alert('Please fill out Company Name, Contact Person, and Promised Deliverables.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDeal) {
        const res = await fetch(`/api/sponsorship/${editingDeal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formCompany.trim(),
            brandSector: formSector.trim(),
            contactPerson: formPerson.trim(),
            contactEmail: formEmail.trim(),
            contactPhone: formPhone.trim(),
            sponsorshipKind: formKind,
            dealStatus: formStatus,
            pitchedAmountInr: formPitched,
            committedAmountInr: formCommitted,
            receivedAmountInr: formReceived,
            deliverablesSummary: formDeliverables.trim(),
            mouDocumentUrl: formMouUrl.trim() || null,
            paymentProofUrl: formProofUrl.trim() || null,
            remarks: formRemarks.trim() || null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchData();
        } else {
          alert(data.error || 'Failed to update sponsorship deal');
        }
      } else {
        const res = await fetch('/api/sponsorship', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formCompany.trim(),
            brandSector: formSector.trim(),
            contactPerson: formPerson.trim(),
            contactEmail: formEmail.trim(),
            contactPhone: formPhone.trim(),
            sponsorshipKind: formKind,
            dealStatus: formStatus,
            pitchedAmountInr: formPitched,
            committedAmountInr: formCommitted,
            receivedAmountInr: formReceived,
            deliverablesSummary: formDeliverables.trim(),
            mouDocumentUrl: formMouUrl.trim() || null,
            paymentProofUrl: formProofUrl.trim() || null,
            operatorName: currentOp?.operatorName,
            operatorRollNo: currentOp?.operatorRollNo,
            operatorType: currentOp?.operatorType,
            remarks: formRemarks.trim() || null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchData();
        } else {
          alert(data.error || 'Failed to create sponsorship deal');
        }
      }
    } catch (err) {
      alert((err as Error).message || 'Error saving deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdvance = async (deal: SponsorshipDeal, nextStatus: DealStatus) => {
    try {
      const res = await fetch(`/api/sponsorship/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealStatus: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? { ...d, dealStatus: nextStatus } : d))
        );
        fetchData();
      }
    } catch {
      // Non-fatal
    }
  };

  const handleToggleVerify = async (deal: SponsorshipDeal) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/sponsorship/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminVerified: !deal.superAdminVerified,
          superAdminNotes: !deal.superAdminVerified
            ? 'Verified by Super Admin against university bank account.'
            : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch {
      // Non-fatal
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the deal for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/sponsorship/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeals((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert((err as Error).message || 'Error deleting');
    }
  };

  const getStatusBadge = (status: DealStatus) => {
    switch (status) {
      case 'PAYMENT_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
          </span>
        );
      case 'MOU_SIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
            <FileText className="w-3 h-3 text-teal-600" /> MoU Signed
          </span>
        );
      case 'VERBALLY_COMMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Handshake className="w-3 h-3 text-blue-600" /> Committed
          </span>
        );
      case 'IN_NEGOTIATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> In Negotiation
          </span>
        );
      case 'CALL_SCHEDULED':
      case 'PITCH_SENT':
      case 'REACHED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <TrendingUp className="w-3 h-3 text-slate-500" /> {DEAL_STATUS_LABELS[status]}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" /> Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Brands */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Brands Reached</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {stats?.totalBrandsReached ?? 0}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {stats?.inNegotiation ?? 0} in active discussion
          </span>
        </div>

        {/* Deals Closed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Partners</span>
            <Handshake className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-teal-700 block">
            {stats?.dealsClosed ?? 0}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            MoUs executed / goods delivered
          </span>
        </div>

        {/* Total Funds Pledged */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pledged Value</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            ₹{((stats?.fundsPledgedInr ?? 0) / 100000).toFixed(2)}L
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            Total committed amount
          </span>
        </div>

        {/* Funds Received */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Funds Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 block">
            ₹{((stats?.fundsReceivedInr ?? 0) / 100000).toFixed(2)}L
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">
            {stats?.collectionPercentage ?? 0}% collection verified
          </span>
        </div>
      </div>

      {/* Main Filter & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Deal Stages</option>
            <option value="REACHED_OUT">Initial Outreach</option>
            <option value="PITCH_SENT">Pitch Sent</option>
            <option value="IN_NEGOTIATION">In Negotiation</option>
            <option value="VERBALLY_COMMITTED">Verbally Committed</option>
            <option value="MOU_SIGNED">MoU Signed</option>
            <option value="PAYMENT_RECEIVED">Payment Received</option>
            <option value="REJECTED">Declined</option>
          </select>

          {/* Kind Filter */}
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Sponsorship Tiers</option>
            {Object.entries(SPONSORSHIP_KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search brand, lead, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {allowEdit && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Pitch New Brand</span>
            </button>
          )}
        </div>
      </div>

      {/* Brand Pipeline Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading corporate sponsorships pipeline...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No brand pitches found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Log new company outreach, contact leads, and manage sponsorship deliverables.
            </p>
            {allowEdit && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Pitch First Brand</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  deal.dealStatus === 'PAYMENT_RECEIVED'
                    ? 'border-emerald-200 shadow-xs'
                    : deal.dealStatus === 'MOU_SIGNED'
                    ? 'border-teal-200 shadow-xs'
                    : 'border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Row: Company & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {SPONSORSHIP_KIND_LABELS[deal.sponsorshipKind]}
                        </span>
                        {getStatusBadge(deal.dealStatus)}
                        {deal.superAdminVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-600" /> Super Admin Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {deal.companyName}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Sector: {deal.brandSector}
                      </span>
                    </div>

                    {allowEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(deal)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit deal details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id, deal.companyName)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Pitched</span>
                      <span className="text-xs font-bold text-slate-700">₹{(deal.pitchedAmountInr).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Committed</span>
                      <span className="text-xs font-bold text-indigo-700">₹{(deal.committedAmountInr).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Received</span>
                      <span className="text-xs font-black text-emerald-700">₹{(deal.receivedAmountInr).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="text-xs text-slate-600 mb-3 space-y-1">
                    <span className="font-bold text-slate-800 block">Promised Deliverables:</span>
                    <p className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                      {deal.deliverablesSummary}
                    </p>
                  </div>

                  {/* Contact Person */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> {deal.contactPerson}
                    </span>
                    {deal.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {deal.contactPhone}
                      </span>
                    )}
                    {deal.contactEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {deal.contactEmail}
                      </span>
                    )}
                  </div>

                  {/* Notes / Super Admin Notes */}
                  {deal.remarks && (
                    <p className="text-[11px] text-slate-500 italic mb-2">
                      Note: {deal.remarks}
                    </p>
                  )}
                  {deal.superAdminNotes && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mb-2 font-medium">
                      Admin: {deal.superAdminNotes}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Actions, Drive Links & Coordinator */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Pitched by:</span>
                    <strong className="text-slate-700">{deal.operatorName}</strong>
                    <span className="text-[10px] text-slate-400">({deal.operatorRollNo})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {deal.mouDocumentUrl && (
                      <a
                        href={deal.mouDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-semibold flex items-center gap-1 hover:bg-teal-100 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>MoU Doc</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </a>
                    )}

                    {deal.paymentProofUrl && (
                      <a
                        href={deal.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>Payment Proof</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </a>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleToggleVerify(deal)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                          deal.superAdminVerified
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {deal.superAdminVerified ? '✓ Verified' : 'Verify Receipt'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pitch / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  Sponsorship Pipeline
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDeal ? 'Update Sponsorship Deal' : 'Pitch New Brand / Company'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Bull, Boat, Domino's"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector / Industry *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beverage, EdTech, Dining"
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Manager Name"
                    value={formPerson}
                    onChange={(e) => setFormPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@brand.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sponsorship Tier / Kind</label>
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as SponsorshipKind)}
                    className="w-full px-3 py-2 font-medium rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.entries(SPONSORSHIP_KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deal Pipeline Stage</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DealStatus)}
                    className="w-full px-3 py-2 font-medium rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.entries(DEAL_STATUS_LABELS).map(([s, label]) => (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pitched Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formPitched}
                    onChange={(e) => setFormPitched(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Committed (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formCommitted}
                    onChange={(e) => setFormCommitted(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formReceived}
                    onChange={(e) => setFormReceived(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Promised Deliverables / Perks *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 2 Standees near main stage, logo printed on 3,000 participant tickets, 1 promotional canopy in courtyard..."
                  value={formDeliverables}
                  onChange={(e) => setFormDeliverables(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Signed MoU Drive URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formMouUrl}
                    onChange={(e) => setFormMouUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Proof Drive URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formProofUrl}
                    onChange={(e) => setFormProofUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Meeting Notes</label>
                <input
                  type="text"
                  placeholder="Optional internal notes, follow-up timeline, or delivery instructions"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDeal ? 'Update Deal' : 'Save Brand Pitch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operator Identity Switcher Modal */}
      <OperatorIdentityModal
        forceOpen={isIdentityModalOpen}
        onClose={() => {
          setIsIdentityModalOpen(false);
          setOperator(getLocalOperator());
        }}
        committeeRole="Sponsorship Committee"
      />
    </div>
  );
}
