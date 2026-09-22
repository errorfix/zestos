'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Banknote,
  QrCode,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Ticket,
  Printer,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

interface OnSpotFormProps {
  events: InitialEventData[];
}

export default function OnSpotForm({ events }: OnSpotFormProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [leadName, setLeadName] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [leadRollNumber, setLeadRollNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'ONSPOT_CASH' | 'ONSPOT_UPI'>('ONSPOT_CASH');
  const [teamMembers, setTeamMembers] = useState<Array<{ fullName: string; rollNumber: string }>>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedRegistration, setCompletedRegistration] = useState<{
    registrationId: string;
    tickets: Array<{ ticketCode: string; securityHash: string }>;
    eventTitle: string;
    feeCollected: number;
  } | null>(null);

  const [isSubmitting, startTransition] = useTransition();

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const totalCount = 1 + teamMembers.length;
  const requiredAdditional = Math.max(0, (currentEvent?.minTeamSize || 1) - 1);
  const maxAllowedAdditional = (currentEvent?.maxTeamSize || 1) - 1;

  const handleAddMember = () => {
    if (!currentEvent) return;
    if (teamMembers.length < maxAllowedAdditional) {
      setTeamMembers([...teamMembers, { fullName: '', rollNumber: '' }]);
    }
  };

  const handleRemoveMember = (idx: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx: number, field: 'fullName' | 'rollNumber', val: string) => {
    const updated = [...teamMembers];
    updated[idx] = { ...updated[idx], [field]: val };
    setTeamMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentEvent) return;

    if (!leadName.trim()) {
      setErrorMessage('Lead participant name is required.');
      return;
    }

    if (!leadEmail.trim() || !leadEmail.includes('@')) {
      setErrorMessage('A valid email address is required for issuing digital passes.');
      return;
    }

    for (let i = 0; i < requiredAdditional; i++) {
      if (!teamMembers[i]?.fullName.trim()) {
        setErrorMessage(`Team Member #${i + 2} name is strictly required.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/onspot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: currentEvent.id,
            leadName,
            leadEmail,
            paymentMethod,
            teamMembers: teamMembers.filter((m) => m.fullName.trim().length > 0),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'On-spot registration failed');
        }

        setCompletedRegistration(data);
      } catch (err) {
        setErrorMessage((err as Error).message || 'Registration failed');
      }
    });
  };

  const handleResetForNext = () => {
    setLeadName('');
    setLeadEmail('');
    setLeadRollNumber('');
    setTeamMembers([]);
    setCompletedRegistration(null);
    setErrorMessage(null);
  };

  // If completed, show instant pass confirmation with link to ticket page
  if (completedRegistration) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          On-Spot Registration Recorded
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mt-2">
          Passes Issued & Payment Verified
        </h2>

        <p className="text-sm text-slate-600 mt-1">
          Registered for <strong>{completedRegistration.eventTitle}</strong>. Collected{' '}
          <strong className="text-emerald-700">₹{completedRegistration.feeCollected}</strong> via{' '}
          {paymentMethod === 'ONSPOT_CASH' ? 'Cash' : 'Desk UPI'}.
        </p>

        {/* Issued Passes Chips */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Generated Ticket Codes ({completedRegistration.tickets.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {completedRegistration.tickets.map((t) => (
              <span
                key={t.ticketCode}
                className="px-3 py-1.5 rounded-lg text-sm font-mono font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]"
              >
                {t.ticketCode}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/tickets/${completedRegistration.registrationId}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>View & Print Passes</span>
          </Link>

          <button
            onClick={handleResetForNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <span>Next Walk-in Attendee</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Selection Dropdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            1. Select Event for Walk-In Registration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Event
              </label>
              <select
                id="eventSelect"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} (₹{evt.feeAmount / 100})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Entry Fee Required</span>
                <span className="text-xl font-bold text-slate-900">
                  ₹{currentEvent ? currentEvent.feeAmount / 100 : 0}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                {currentEvent?.category}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Participant Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            2. Participant Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leadName" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="leadName"
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Attendee Full Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>

            <div>
              <label htmlFor="leadEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="leadEmail"
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="attendee@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="leadRoll" className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID / Roll Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="leadRoll"
                type="text"
                value={leadRollNumber}
                onChange={(e) => setLeadRollNumber(e.target.value)}
                placeholder="e.g. 22BTECHCS042"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Team Members if allowed */}
        {currentEvent && currentEvent.maxTeamSize > 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  3. Team Members ({totalCount} / {currentEvent.maxTeamSize})
                </h2>
                <p className="text-xs text-slate-500">
                  Required: minimum {currentEvent.minTeamSize} members.
                </p>
              </div>

              {teamMembers.length < maxAllowedAdditional && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              )}
            </div>

            {teamMembers.map((member, idx) => (
              <div key={idx} className="p-3 mb-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 2}
                </span>
                <input
                  type="text"
                  placeholder={`Member #${idx + 2} Full Name`}
                  value={member.fullName}
                  onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMember(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Confirmation Mode */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Payment Verification at Desk
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setPaymentMethod('ONSPOT_CASH')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                paymentMethod === 'ONSPOT_CASH'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Cash Received</h4>
                <p className="text-xs text-slate-500">Collected physical cash at table</p>
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('ONSPOT_UPI')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                paymentMethod === 'ONSPOT_UPI'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Desk UPI QR</h4>
                <p className="text-xs text-slate-500">Scanned desk merchant QR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Button */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900 text-white shadow-lg">
          <div>
            <span className="text-xs text-slate-400 block">Total Due & Collected</span>
            <span className="text-2xl font-extrabold">
              ₹{currentEvent ? currentEvent.feeAmount / 100 : 0}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-2xl text-base font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Issuing Passes...' : 'Confirm & Generate Passes'}
          </button>
        </div>
      </form>
    </div>
  );
}
