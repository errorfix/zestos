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
  Ticket,
  ArrowRight,
  Music,
  UploadCloud,
  ExternalLink,
  Gift,
  Calendar,
  Check,
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
  const [dayOption, setDayOption] = useState<'SINGLE_DAY' | 'BOTH_DAYS'>('SINGLE_DAY');
  const [trackUploadUrl, setTrackUploadUrl] = useState<string>('');
  const [trackNotes, setTrackNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'ONSPOT_CASH' | 'ONSPOT_UPI' | 'FREE_REGISTRATION'>('ONSPOT_CASH');
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
  const isFreeEvent = currentEvent?.feeAmount === 0 && !currentEvent?.hasDayOptions;
  const calculatedFee = currentEvent?.hasDayOptions
    ? dayOption === 'BOTH_DAYS'
      ? 250
      : 150
    : currentEvent
    ? currentEvent.feeAmount / 100
    : 0;

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

    const effectivePaymentMethod = isFreeEvent ? 'FREE_REGISTRATION' : paymentMethod;

    startTransition(async () => {
      try {
        const res = await fetch('/api/onspot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: currentEvent.id,
            leadName,
            leadEmail,
            paymentMethod: effectivePaymentMethod,
            dayOption: currentEvent.hasDayOptions ? dayOption : undefined,
            trackUploadUrl: currentEvent.requiresTrackUpload && trackUploadUrl.trim() ? trackUploadUrl.trim() : undefined,
            trackNotes: currentEvent.requiresTrackUpload && trackNotes.trim() ? trackNotes.trim() : undefined,
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
    setTrackUploadUrl('');
    setTrackNotes('');
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
          Passes Issued & Entry Confirmed
        </h2>

        <p className="text-sm text-slate-600 mt-1">
          Registered for <strong>{completedRegistration.eventTitle}</strong>. Collected{' '}
          <strong className="text-emerald-700">₹{completedRegistration.feeCollected}</strong> via{' '}
          {isFreeEvent
            ? 'Free Entry Pass'
            : paymentMethod === 'ONSPOT_CASH'
            ? 'Cash'
            : 'Desk UPI'}
          .
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
        {/* 1. Event Selection Dropdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            1. Select Event for Walk-In Registration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Event (31 Catalog Events Available)
              </label>
              <select
                id="eventSelect"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} — {evt.hasDayOptions ? '₹150/₹250' : evt.feeAmount === 0 ? 'FREE' : `₹${evt.feeAmount / 100}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Entry Fee Required</span>
                <span className="text-xl font-bold text-slate-900">
                  {isFreeEvent ? (
                    <span className="text-emerald-600">FREE (₹0)</span>
                  ) : currentEvent?.hasDayOptions ? (
                    <span>₹{calculatedFee}</span>
                  ) : (
                    <span>₹{currentEvent ? currentEvent.feeAmount / 100 : 0}</span>
                  )}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                {currentEvent?.category}
              </span>
            </div>
          </div>

          {/* Day Pass Selection for Individual Cultural / Literary Events */}
          {currentEvent?.hasDayOptions && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1a73e8]" />
                Select Attendance Day Pass
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setDayOption('SINGLE_DAY')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    dayOption === 'SINGLE_DAY'
                      ? 'border-[#1a73e8] bg-blue-50/50 ring-2 ring-[#1a73e8]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${dayOption === 'SINGLE_DAY' ? 'border-[#1a73e8] bg-[#1a73e8]' : 'border-slate-300'}`}>
                      {dayOption === 'SINGLE_DAY' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">Single Day Pass</span>
                      <span className="text-xs text-slate-500">Valid for Day 1 or Day 2</span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-[#1a73e8]">₹150</span>
                </div>

                <div
                  onClick={() => setDayOption('BOTH_DAYS')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    dayOption === 'BOTH_DAYS'
                      ? 'border-[#1a73e8] bg-blue-50/50 ring-2 ring-[#1a73e8]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${dayOption === 'BOTH_DAYS' ? 'border-[#1a73e8] bg-[#1a73e8]' : 'border-slate-300'}`}>
                      {dayOption === 'BOTH_DAYS' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">Both Days Access</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Best Value</span>
                      </div>
                      <span className="text-xs text-slate-500">Full 2-Day Fest Festival Pass</span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-[#1a73e8]">₹250</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Participant Details */}
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

        {/* 3. Dynamic Team Members if allowed */}
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

        {/* 4. Stage Track / Sound & Visual Asset Upload for Stage Events */}
        {currentEvent?.requiresTrackUpload && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/30 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage Track / Audio-Video Media Submission
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct pipeline to sound engineers & backstage audiovisual desk
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                Backstage Dispatch
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  Official Stage Media Google Drive Folder
                </span>
                <span className="text-[11px] text-amber-800">
                  Upload audio/video tracks with naming format: [EventName]_[TeamName/LeadName]
                </span>
              </div>
              <a
                href="https://drive.google.com/drive/folders/1ORiYoFawuMWA0fOST-qfO2uBvEEZxTOE?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm shrink-0 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Open Drive Folder</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Participant Google Drive Link / File Confirmation
                </label>
                <input
                  type="text"
                  value={trackUploadUrl}
                  onChange={(e) => setTrackUploadUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or uploaded filename"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs bg-white focus:border-[#1a73e8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audio / Lighting / Stage Instructions for AV Crew
                </label>
                <textarea
                  rows={2}
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  placeholder="e.g. Song title, starting cue (fade in / instant drop), mic count needed on stage..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs bg-white focus:border-[#1a73e8]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Payment Verification Mode */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Payment Verification at Desk
          </h2>

          {isFreeEvent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Free Campus Event Entry</h4>
                <p className="text-xs text-emerald-800">
                  No payment required for {currentEvent?.category} events. Fast-track digital passes will be issued instantly.
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* 6. Submission Button */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900 text-white shadow-lg">
          <div>
            <span className="text-xs text-slate-400 block">Total Due & Collected</span>
            <span className="text-2xl font-extrabold">
              {isFreeEvent ? '₹0 (FREE)' : `₹${calculatedFee}`}
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
