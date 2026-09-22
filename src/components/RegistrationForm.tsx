'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';
import {
  saveRegistrationDraft,
  loadRegistrationDraft,
  clearRegistrationDraft,
  TeamMemberDraft,
} from '@/lib/storage';

interface RegistrationFormProps {
  events: InitialEventData[];
  initialSelectedEventId?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function RegistrationForm({
  events,
  initialSelectedEventId,
}: RegistrationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('event') || initialSelectedEventId || (events[0]?.id ?? '');

  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId);
  const [leadName, setLeadName] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [leadRollNumber, setLeadRollNumber] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberDraft[]>([]);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [draftSavedTimestamp, setDraftSavedTimestamp] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  // Find currently active event
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Load draft on initial mount
  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (draft) {
      if (draft.eventId && events.some((e) => e.id === draft.eventId)) {
        setSelectedEventId(draft.eventId);
      }
      setLeadName(draft.leadName || '');
      setLeadEmail(draft.leadEmail || '');
      setTeamMembers(draft.teamMembers || []);
      setIsDraftRestored(true);
      setDraftSavedTimestamp(new Date(draft.lastSavedAt).toLocaleTimeString());
    }
  }, [events]);

  // Adjust team members array when event changes to meet minTeamSize requirement
  useEffect(() => {
    if (!currentEvent) return;
    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    setTeamMembers((prev) => {
      // If we currently have fewer members than required minimum
      if (prev.length < requiredAdditional) {
        const next = [...prev];
        while (next.length < requiredAdditional) {
          next.push({ fullName: '', rollNumber: '' });
        }
        return next;
      }
      // If we exceed max allowed additional members
      const maxAdditional = Math.max(0, currentEvent.maxTeamSize - 1);
      if (prev.length > maxAdditional) {
        return prev.slice(0, maxAdditional);
      }
      return prev;
    });
  }, [currentEvent]);

  // Aggressive state persistence to localStorage on every change
  useEffect(() => {
    if (selectedEventId || leadName || leadEmail || teamMembers.length > 0) {
      saveRegistrationDraft({
        eventId: selectedEventId,
        leadName,
        leadEmail,
        teamMembers,
      });
    }
  }, [selectedEventId, leadName, leadEmail, teamMembers]);

  // Inject Razorpay checkout script
  useEffect(() => {
    const scriptId = 'razorpay-checkout-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleDiscardDraft = () => {
    clearRegistrationDraft();
    setLeadName('');
    setLeadEmail('');
    setLeadRollNumber('');
    const requiredAdditional = Math.max(0, (currentEvent?.minTeamSize || 1) - 1);
    setTeamMembers(
      Array.from({ length: requiredAdditional }, () => ({ fullName: '', rollNumber: '' }))
    );
    setIsDraftRestored(false);
    setDraftSavedTimestamp(null);
  };

  const handleAddMember = () => {
    if (!currentEvent) return;
    const maxAdditional = currentEvent.maxTeamSize - 1;
    if (teamMembers.length < maxAdditional) {
      setTeamMembers([...teamMembers, { fullName: '', rollNumber: '' }]);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (!currentEvent) return;
    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    if (teamMembers.length > requiredAdditional) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const handleMemberChange = (index: number, field: keyof TeamMemberDraft, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  // Submission & Payment Checkout Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentEvent) {
      setErrorMessage('Please select an event.');
      return;
    }

    if (!leadName.trim()) {
      setErrorMessage('Lead Attendee Full Name is required.');
      return;
    }

    if (!leadEmail.trim() || !leadEmail.includes('@')) {
      setErrorMessage('A valid college email address is required.');
      return;
    }

    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    for (let i = 0; i < requiredAdditional; i++) {
      if (!teamMembers[i]?.fullName.trim()) {
        setErrorMessage(`Team Member #${i + 2} name is strictly required for this team event.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        // 1. Initialize checkout via Next.js API
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: currentEvent.id,
            leadName,
            leadEmail,
            teamMembers: teamMembers.filter((m) => m.fullName.trim().length > 0),
          }),
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          throw new Error(checkoutData.error || 'Failed to initialize checkout');
        }

        const { registrationId, orderId, amount, isMock } = checkoutData;

        // 2. Open Razorpay Modal or Staging Simulator
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const canUseLiveModal =
          typeof window !== 'undefined' &&
          window.Razorpay &&
          keyId &&
          !keyId.includes('placeholder') &&
          !isMock;

        if (canUseLiveModal) {
          const options = {
            key: keyId,
            amount: amount,
            currency: 'INR',
            name: "Lingaya's Vidyapeeth Fest",
            description: `Pass Registration: ${currentEvent.title}`,
            order_id: orderId,
            prefill: {
              name: leadName,
              email: leadEmail,
            },
            theme: {
              color: '#1a73e8',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async function (response: any) {
              // Verify payment on server
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                clearRegistrationDraft();
                router.push(`/tickets/${verifyData.registrationId}`);
              } else {
                setErrorMessage(verifyData.error || 'Verification failed');
              }
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Instant Dev / Staging Simulation Fallback
          // Simulates payment confirmation and HMAC ticket generation
          const simulatedPaymentId = `pay_sim_${Date.now()}`;
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              paymentId: simulatedPaymentId,
              signature: 'simulated_test_signature',
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            clearRegistrationDraft();
            router.push(`/tickets/${verifyData.registrationId}`);
          } else {
            throw new Error(verifyData.error || 'Payment simulation failed');
          }
        }
      } catch (err) {
        console.error('Registration submission error:', err);
        setErrorMessage((err as Error).message || 'An unexpected error occurred. Please try again.');
      }
    });
  };

  const totalMembersCount = 1 + teamMembers.length;
  const maxAllowedAdditional = (currentEvent?.maxTeamSize || 1) - 1;
  const requiredAdditional = Math.max(0, (currentEvent?.minTeamSize || 1) - 1);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Draft Recovery Notification Banner */}
      {isDraftRestored && (
        <div className="mb-6 p-4 bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl flex items-center justify-between gap-3 text-sm text-[#174ea6] transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#1a73e8] shrink-0" />
            <span>
              <strong>Draft restored:</strong> Your form state was safely recovered from your local session
              {draftSavedTimestamp ? ` (saved at ${draftSavedTimestamp})` : ''}.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#d2e3fc] hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Discard
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Registration Constraint Error</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Event (Google Material Cards) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                Step 1 of 3
              </span>
              <h2 className="text-xl font-bold text-slate-900">Choose Event</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {events.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              const isSolo = evt.minTeamSize === 1 && evt.maxTeamSize === 1;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1a73e8] bg-[#f8faff] shadow-md ring-2 ring-[#1a73e8]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {evt.category}
                      </span>
                      <span className="font-bold text-lg text-slate-900">
                        ₹{evt.feeAmount / 100}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug mb-1">
                      {evt.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {isSolo
                          ? 'Solo (1 Attendee)'
                          : `Team (${evt.minTeamSize} – ${evt.maxTeamSize} members)`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {evt.venue || "Lingaya's Campus"}
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isSelected ? 'text-[#1a73e8]' : 'text-slate-500'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 2: Primary / Lead Attendee Information */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
              Step 2 of 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Primary Attendee & Team Lead
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Passes and payment confirmations will be issued to this email.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="leadName"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="leadName"
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Anuj Kumar"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="leadEmail"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                College / University Email <span className="text-red-500">*</span>
              </label>
              <input
                id="leadEmail"
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="e.g. anuj@lingayas.edu"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="leadRollNumber"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Roll Number / Student ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="leadRollNumber"
                type="text"
                value={leadRollNumber}
                onChange={(e) => setLeadRollNumber(e.target.value)}
                placeholder="e.g. 22BTECHCS042"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
              />
            </div>
          </div>
        </section>

        {/* Step 3: Dynamic Team Member Rows (if maxTeamSize > 1) */}
        {currentEvent && currentEvent.maxTeamSize > 1 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                  Step 3 of 3
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Team Members ({totalMembersCount} / {currentEvent.maxTeamSize})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Required: {currentEvent.minTeamSize} minimum members (Lead + {requiredAdditional} member
                  {requiredAdditional > 1 ? 's' : ''}). Max: {currentEvent.maxTeamSize}.
                </p>
              </div>

              {teamMembers.length < maxAllowedAdditional && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] transition-colors focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Team Member
                </button>
              )}
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
                No additional team members added. Click &quot;Add Team Member&quot; above to expand your team.
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member, idx) => {
                  const isRequired = idx < requiredAdditional;
                  const memberNumber = idx + 2;

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white text-xs font-bold flex items-center justify-center">
                            {memberNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            Team Member #{memberNumber}
                          </span>
                          {isRequired ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-600">
                              Optional
                            </span>
                          )}
                        </div>

                        {!isRequired && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            aria-label={`Remove team member ${memberNumber}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor={`tm_name_${idx}`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Full Name {isRequired && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            id={`tm_name_${idx}`}
                            type="text"
                            required={isRequired}
                            value={member.fullName}
                            onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)}
                            placeholder="e.g. Priya Sharma"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`tm_roll_${idx}`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Roll Number / Student ID <span className="text-slate-400">(Optional)</span>
                          </label>
                          <input
                            id={`tm_roll_${idx}`}
                            type="text"
                            value={member.rollNumber}
                            onChange={(e) => handleMemberChange(idx, 'rollNumber', e.target.value)}
                            placeholder="e.g. 22BTECHCS089"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Final Payment & Submission Summary */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
                Payment Breakdown
              </span>
              <h3 className="text-2xl font-bold mt-1">
                {currentEvent ? currentEvent.title : 'Event Registration'}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Includes digital passes for {totalMembersCount} attendee{totalMembersCount > 1 ? 's' : ''} with offline HMAC QR verification.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-sm text-slate-400 block">Total Payable Fee</span>
              <span className="text-3xl font-extrabold text-white">
                ₹{currentEvent ? currentEvent.feeAmount / 100 : 0}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Razorpay Secured Gateway • 256-bit Cryptographic Tickets</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ₹{currentEvent ? currentEvent.feeAmount / 100 : 0} & Register</span>
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
