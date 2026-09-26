'use client';

import React, { useState, useTransition } from 'react';
import OnSpotForm from '@/components/OnSpotForm';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

interface OnSpotTerminalWrapperProps {
  initialAuthenticated: boolean;
  initialRoleLabel?: string;
  events: InitialEventData[];
}

export default function OnSpotTerminalWrapper({
  initialAuthenticated,
  initialRoleLabel,
  events,
}: OnSpotTerminalWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthenticated);
  const [roleLabel, setRoleLabel] = useState<string>(initialRoleLabel || 'On-Spot Registration Desk');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Please enter the on-spot desk password.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: 'ONSPOT_DESK',
            password: password.trim(),
            rememberMe: true,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setIsAuthenticated(true);
          setRoleLabel(data.user?.roleLabel || 'On-Spot Registration Desk');
          setPassword('');
        } else {
          setErrorMessage(data.error || 'Invalid on-spot desk password. Access denied.');
        }
      } catch (err) {
        setErrorMessage((err as Error).message || 'Authentication service error. Try again.');
      }
    });
  };

  const handleLockTerminal = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Non-fatal
    }
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200 shadow-xl text-center relative overflow-hidden">
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

          {/* Shield Icon Lock */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-[#1a73e8] shadow-inner">
            <Lock className="w-8 h-8 text-[#1a73e8]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>On-Spot Desk Access Control</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Desk Terminal Locked
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Enter the designated On-Spot Desk password to activate the registration terminal.
          </p>

          {errorMessage && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="mt-6 space-y-4 text-left">
            <div>
              <label
                htmlFor="checkinPassword"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                On-Spot Desk Passcode / Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  id="checkinPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter desk password"
                  className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all shadow-xs"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Terminal...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Desk Terminal</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5 border-t border-slate-100 pt-4">
            Confidential on-spot desk checkpoint • Lingaya&apos;s Vidyapeeth Fest Operations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authenticated Desk Banner with Lock Terminal Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            Desk Terminal Authenticated
          </span>
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            • Logged in as <strong className="text-slate-700">{roleLabel}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLockTerminal}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors self-start sm:self-auto border border-red-200"
          title="Securely lock desk terminal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock Terminal</span>
        </button>
      </div>

      {/* On-Spot Registration Form */}
      <OnSpotForm events={events} />
    </div>
  );
}
