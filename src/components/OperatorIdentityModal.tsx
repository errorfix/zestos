'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, IdCard, CheckCircle2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

export interface OperatorIdentity {
  operatorName: string;
  operatorRollNo: string;
  operatorType: 'STUDENT' | 'FACULTY';
  timestamp: number;
}

const STORAGE_KEY = 'festos_operator_profile';

export function getLocalOperator(): OperatorIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalOperator(op: OperatorIdentity) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(op));
    // Dispatch event so other components update synchronously
    window.dispatchEvent(new Event('festos_operator_updated'));
  } catch {
    // Non-fatal
  }
}

export function clearLocalOperator() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('festos_operator_updated'));
  } catch {
    // Non-fatal
  }
}

interface OperatorIdentityModalProps {
  /** If true, the modal forces itself to open (e.g. on Switch Operator click) */
  forceOpen?: boolean;
  onClose?: () => void;
  /** Role label to display in the header (e.g. "R&I Committee", "Super Admin") */
  committeeRole?: string;
}

export default function OperatorIdentityModal({
  forceOpen = false,
  onClose,
  committeeRole,
}: OperatorIdentityModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operatorType, setOperatorType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if operator already exists in storage or cookie
    const existing = getLocalOperator();
    if (!existing || forceOpen) {
      if (existing && forceOpen) {
        setName(existing.operatorName);
        setRollNo(existing.operatorRollNo);
        setOperatorType(existing.operatorType);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [forceOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanRollNo = rollNo.trim().toUpperCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanRollNo) {
      setError(
        operatorType === 'STUDENT'
          ? 'Please enter your Student Roll Number.'
          : 'Please enter your Faculty Employee ID.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: cleanName,
          operatorRollNo: cleanRollNo,
          operatorType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save operator identity.');
      }

      setLocalOperator(data.operator);
      setIsOpen(false);
      if (onClose) onClose();
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Mandatory Check-In
              </span>
              {committeeRole && (
                <span className="text-[11px] font-bold text-slate-500 truncate">
                  {committeeRole}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Desk Operator Verification
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Enter your official identity before accessing or editing records. All actions are logged to PostgreSQL for university audit trails.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operator Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Operator Designation
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setOperatorType('STUDENT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  operatorType === 'STUDENT'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Student Desk</span>
              </button>
              <button
                type="button"
                onClick={() => setOperatorType('FACULTY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  operatorType === 'FACULTY'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Faculty / Staff</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={operatorType === 'STUDENT' ? 'e.g. Rohit Sharma' : 'e.g. Dr. Priya Verma'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Roll No / Faculty ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {operatorType === 'STUDENT' ? 'University Roll Number' : 'Faculty / Employee ID'}
            </label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder={operatorType === 'STUDENT' ? 'e.g. 21BCSE104' : 'e.g. FAC-882'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              This identifier will be permanently tied to every data mutation made in this session.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Registering Session...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm Identity &amp; Unlock Desk</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Compact Top Desk Operator Badge with Switch Button
 */
export function OperatorDeskBadge() {
  const [operator, setOperator] = useState<OperatorIdentity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadOperator = () => {
    setOperator(getLocalOperator());
  };

  useEffect(() => {
    loadOperator();
    const handleUpdate = () => loadOperator();
    window.addEventListener('festos_operator_updated', handleUpdate);
    return () => window.removeEventListener('festos_operator_updated', handleUpdate);
  }, []);

  const handleSwitch = async () => {
    if (confirm('Switch current desk operator? The incoming operator must identify themselves.')) {
      clearLocalOperator();
      try {
        await fetch('/api/auth/operator', { method: 'DELETE' });
      } catch {
        // Non-fatal
      }
      setModalOpen(true);
    }
  };

  if (!operator) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors animate-pulse"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Identify Desk Operator</span>
        </button>
        <OperatorIdentityModal forceOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-800 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-slate-900">{operator.operatorName}</span>
        <span className="text-[11px] font-mono text-slate-500">({operator.operatorRollNo})</span>
        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
          {operator.operatorType}
        </span>
        <button
          type="button"
          onClick={handleSwitch}
          className="ml-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
          title="Switch active desk operator"
        >
          Switch
        </button>
      </div>

      {modalOpen && (
        <OperatorIdentityModal forceOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
