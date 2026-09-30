'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  Phone,
  IndianRupee,
  Search,
  Building,
  Check,
  X,
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  purpose: string;
  remarks?: string | null;
  contactPhone?: string | null;
  amountPaise?: number | null;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export default function InfraVendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/infra/vendors');
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingVendor(null);
    setName('');
    setPurpose('');
    setRemarks('');
    setContactPhone('');
    setAmountRupees('');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setName(v.name);
    setPurpose(v.purpose);
    setRemarks(v.remarks || '');
    setContactPhone(v.contactPhone || '');
    setAmountRupees(v.amountPaise ? (v.amountPaise / 100).toString() : '');
    setStatus(v.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !purpose.trim()) return;

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingVendor);
      const url = '/api/infra/vendors';
      const method = isEdit ? 'PATCH' : 'POST';
      const payload = {
        id: editingVendor?.id,
        name,
        purpose,
        remarks,
        contactPhone,
        amountRupees: amountRupees ? Number(amountRupees) : undefined,
        status,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save vendor');
      }

      showToast(`✓ Vendor "${name}" ${isEdit ? 'updated' : 'registered'}`);
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) return;

    try {
      const res = await fetch('/api/infra/vendors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      showToast(`✓ Removed vendor "${vendorName}"`);
      fetchVendors();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.purpose.toLowerCase().includes(search.toLowerCase()) ||
      (v.remarks && v.remarks.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalExpenditure = vendors.reduce((acc, v) => acc + (v.amountPaise || 0), 0) / 100;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-zinc-700" />
              Infrastructure Logistics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Vendor Contracts
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vendor Logistics &amp; Equipment Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Track sound trusses, generators, barricades, lighting contractors, and tenting equipment. Super Admin (CS&amp;IT) and Infra Committee maintain unified visibility.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Vendors</span>
          <span className="text-xl font-black text-slate-900">{vendors.length}</span>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Active Contracts</span>
          <span className="text-xl font-black text-emerald-800">
            {vendors.filter((v) => v.status === 'ACTIVE').length}
          </span>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending / In-Review</span>
          <span className="text-xl font-black text-amber-800">
            {vendors.filter((v) => v.status === 'PENDING').length}
          </span>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Estimated Expenditure</span>
          <span className="text-xl font-black text-blue-900">
            ₹{totalExpenditure.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name, purpose, or remarks..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading vendor records...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No vendor records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add New Vendor&quot; to log stage trusses, sound contractors, acoustic generators, and campus rentals.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Vendor Agency</th>
                  <th className="py-3.5 px-4">Purpose / Deliverable</th>
                  <th className="py-3.5 px-4">Remarks / Specs</th>
                  <th className="py-3.5 px-4">Contract Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                      {v.contactPhone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{v.contactPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {v.purpose}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {v.remarks || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {v.amountPaise ? `₹${(v.amountPaise / 100).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : v.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : v.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id, v.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Delete vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVendor ? 'Edit Vendor Record' : 'Register New Vendor / Contractor'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vendor / Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dynamic Sound & Lightings Pvt Ltd"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Purpose / Equipment Deliverables
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Main Auditorium Audio Trusses & 100kVA Generator"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contract Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Remarks / Timing / Placement Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Load-in starts Day 0 at 4:00 PM, stage side wing installation, diesel fuel included..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Contract Signed / Dispatched)</option>
                  <option value="PENDING">PENDING (Quotation / Negotiation)</option>
                  <option value="COMPLETED">COMPLETED (Delivery &amp; Event Concluded)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
