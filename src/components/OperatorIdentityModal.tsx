'use client';

import React, { useState, useEffect, useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  User,
  IdCard,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  X,
} from 'lucide-react';

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

// ─── Global Singleton Modal Store ───────────────────────────────────────────

interface ModalStoreState {
  isOpen: boolean;
  committeeRole?: string;
}

let globalStoreState: ModalStoreState = {
  isOpen: false,
  committeeRole: undefined,
};

const storeListeners = new Set<() => void>();

function notifyStore() {
  storeListeners.forEach((listener) => listener());
}

function subscribeToStore(listener: () => void) {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getStoreSnapshot(): ModalStoreState {
  return globalStoreState;
}

/**
 * Triggers opening of the single operator verification modal from anywhere in the app.
 */
export function openOperatorModal(committeeRole?: string) {
  globalStoreState = {
    isOpen: true,
    committeeRole: committeeRole || globalStoreState.committeeRole,
  };
  notifyStore();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('festos_open_operator_modal'));
  }
}

/**
 * Closes the operator modal globally across all instances in a single action.
 */
export function closeOperatorModal() {
  globalStoreState = {
    ...globalStoreState,
    isOpen: false,
  };
  notifyStore();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('festos_close_operator_modal'));
  }
}

interface OperatorIdentityModalProps {
  /** If true, forces the modal open */
  forceOpen?: boolean;
  onClose?: () => void;
  /** Role label to display in the header (e.g. "Sponsorship Committee", "Super Admin") */
  committeeRole?: string;
}

// Module-level lock to ensure EXACTLY ONE portal instance renders into document.body
let activeRendererId: string | null = null;
const rendererListeners = new Set<() => void>();

function notifyRenderers() {
  rendererListeners.forEach((l) => l());
}

export default function OperatorIdentityModal({
  forceOpen = false,
  onClose,
  committeeRole,
}: OperatorIdentityModalProps) {
  const instanceId = useId();
  const [mounted, setMounted] = useState(false);
  const store = useSyncExternalStore<ModalStoreState>(
    subscribeToStore,
    getStoreSnapshot,
    () => ({ isOpen: false, committeeRole: undefined })
  );

  // Form states
  const [operatorType, setOperatorType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Claim primary renderer role
  const [, setRendererVersion] = useState(0);
  useEffect(() => {
    setMounted(true);

    if (!activeRendererId) {
      activeRendererId = instanceId;
      notifyRenderers();
    }

    const onRendererChange = () => setRendererVersion((v) => v + 1);
    rendererListeners.add(onRendererChange);

    return () => {
      rendererListeners.delete(onRendererChange);
      if (activeRendererId === instanceId) {
        activeRendererId = null;
        notifyRenderers();
      }
    };
  }, [instanceId]);

  const isPrimary = activeRendererId === instanceId || activeRendererId === null;

  // React to forceOpen or missing operator on initial mount
  useEffect(() => {
    if (forceOpen) {
      openOperatorModal(committeeRole);
    } else {
      const existing = getLocalOperator();
      if (!existing) {
        openOperatorModal(committeeRole);
      }
    }
  }, [forceOpen, committeeRole]);

  // Pre-fill existing operator details when modal opens
  useEffect(() => {
    if (store.isOpen) {
      const existing = getLocalOperator();
      if (existing) {
        setName(existing.operatorName);
        setRollNo(existing.operatorRollNo);
        setOperatorType(existing.operatorType);
      }
      setError(null);
      setPassword('');
    }
  }, [store.isOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (store.isOpen && isPrimary) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [store.isOpen, isPrimary]);

  // Single press close: immediately hides and unmounts the modal
  const handleClose = () => {
    const existing = getLocalOperator();
    setError(null);
    setPassword('');
    closeOperatorModal();
    onClose?.();

    // If operator login on a new device is cancelled (no existing operator profile),
    // take the user back to the login page
    if (!existing) {
      window.location.href = '/api/auth/logout';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanRollNo = rollNo.trim().toUpperCase();

    if (!cleanName) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!cleanRollNo) {
      setError(
        operatorType === 'STUDENT'
          ? 'Please enter your University Roll Number.'
          : 'Please enter your Faculty / Employee ID.'
      );
      return;
    }
    if (!password) {
      setError(
        `Please enter the ${
          operatorType === 'STUDENT' ? 'Student Desk' : 'Faculty In-Charge'
        } verification password.`
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
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save operator identity.');
      }

      setLocalOperator(data.operator);
      setPassword('');
      closeOperatorModal();
      if (onClose) onClose();
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Only the primary mounted instance renders the single portal to document.body
  if (!mounted || !store.isOpen || !isPrimary) {
    return null;
  }

  const existingOp = getLocalOperator();
  const hasExistingOperator = !!existingOp;
  const roleLabel = store.committeeRole || committeeRole;

  const modalJSX = (
    <>
      <style>{`
        @keyframes festosModalScale {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes festosModalFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      <div
        id="festos-operator-modal-root"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-black/80 backdrop-blur-sm cursor-pointer"
        style={{ animation: 'festosModalFade 0.18s ease-out forwards' }}
        onClick={(e) => {
          // Exactly one press on the tinted black background dismisses the modal
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div
          className="my-auto relative w-full max-w-[430px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden p-5 sm:p-6 max-h-[min(640px,calc(100vh-2.5rem))] sm:max-h-[min(640px,calc(100vh-3.5rem))] flex flex-col cursor-default"
          style={{ animation: 'festosModalScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Icon, Title & Single-Press Close Button */}
          <div className="flex items-start justify-between gap-3 shrink-0 pb-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    {hasExistingOperator ? 'Operator Switch' : 'Mandatory Check-In'}
                  </span>
                  {roleLabel && (
                    <span className="text-[11px] font-bold text-slate-500 truncate max-w-[170px]">
                      {roleLabel}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  {hasExistingOperator ? 'Switch Desk Operator' : 'Desk Operator Verification'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title={hasExistingOperator ? 'Cancel switch and keep current operator' : 'Cancel and return to login'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 py-1 space-y-3.5 flex-1 mt-3 text-xs">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Operator Designation Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Operator Designation
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOperatorType('STUDENT')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    operatorType === 'STUDENT'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Student Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperatorType('FACULTY')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    operatorType === 'FACULTY'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={operatorType === 'STUDENT' ? 'e.g. Rohit Sharma' : 'e.g. Dr. Priya Verma'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Roll No / Faculty ID */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                {operatorType === 'STUDENT' ? 'University Roll Number' : 'Faculty / Employee ID'}
              </label>
              <div className="relative">
                <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder={operatorType === 'STUDENT' ? 'e.g. 21BCSE104' : 'e.g. FAC-882'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Verification Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {operatorType === 'STUDENT' ? 'Student Desk Password' : 'Faculty In-Charge Password'}
                </label>
                <span className="text-[9px] font-semibold text-slate-400">
                  Verified against .env
                </span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={operatorType === 'STUDENT' ? 'Enter student desk password' : 'Enter faculty verification password'}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 7-Day Session Validity Notice */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[10px] font-semibold text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Session persists securely on this device for <strong>7 days</strong>.</span>
            </div>

            {/* Actions: Cancel & Submit */}
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-1/3 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors text-center cursor-pointer"
                title={hasExistingOperator ? 'Cancel switch and keep current operator' : 'Cancel and return to login'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Registering Session...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{hasExistingOperator ? 'Switch & Unlock' : 'Confirm Identity & Unlock'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
}

/**
 * Compact Top Desk Operator Badge with Switch Button
 */
export function OperatorDeskBadge() {
  const [operator, setOperator] = useState<OperatorIdentity | null>(null);

  const loadOperator = () => {
    setOperator(getLocalOperator());
  };

  useEffect(() => {
    loadOperator();
    const handleUpdate = () => loadOperator();
    window.addEventListener('festos_operator_updated', handleUpdate);
    return () => window.removeEventListener('festos_operator_updated', handleUpdate);
  }, []);

  const handleSwitch = () => {
    openOperatorModal();
  };

  if (!operator) {
    return (
      <button
        type="button"
        onClick={() => openOperatorModal()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors animate-pulse cursor-pointer"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Identify Desk Operator</span>
      </button>
    );
  }

  return (
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
  );
}
