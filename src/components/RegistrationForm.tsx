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
  CreditCard,
  UploadCloud,
  ExternalLink,
  Music,
  Calendar,
  ShieldCheck,
  Trophy,
  PartyPopper,
  CheckSquare,
  Square,
  MapPin,
  Clock,
} from 'lucide-react';
import { InitialEventData, STAGE_GOOGLE_DRIVE_FOLDER } from '@/lib/mockEvents';
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
  const queryEventId = searchParams.get('event') || initialSelectedEventId || '';

  // Segregate events into Informalz and Competitive
  const informalzEvents = events.filter(
    (e) => e.category.toLowerCase() === 'informalz'
  );
  const competitiveEvents = events.filter(
    (e) => e.category.toLowerCase() !== 'informalz'
  );

  // Determine initial mode (Informalz vs Competitive)
  const [registrationMode, setRegistrationMode] = useState<'COMPETITIVE' | 'INFORMALZ'>(() => {
    const catParam = searchParams.get('category');
    if (catParam?.toLowerCase() === 'informalz') return 'INFORMALZ';
    const match = events.find((e) => e.id === queryEventId);
    return match?.category.toLowerCase() === 'informalz' ? 'INFORMALZ' : 'COMPETITIVE';
  });

  // Informalz Multi-Select State (unlimited participation!)
  const [selectedInformalIds, setSelectedInformalIds] = useState<string[]>(() => {
    const match = events.find((e) => e.id === queryEventId);
    if (match?.category.toLowerCase() === 'informalz') return [match.id];
    return informalzEvents.slice(0, 3).map((e) => e.id);
  });

  const toggleInformalEvent = (id: string) => {
    setSelectedInformalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllInformal = () => {
    setSelectedInformalIds(informalzEvents.map((e) => e.id));
  };

  const clearAllInformal = () => {
    setSelectedInformalIds([]);
  };

  // Competitive State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const match = events.find((e) => e.id === queryEventId);
    if (match && match.category.toLowerCase() !== 'informalz') return match.id;
    return competitiveEvents[0]?.id || events[0]?.id || '';
  });

  const [dayOption, setDayOption] = useState<'SINGLE_DAY' | 'BOTH_DAYS'>('SINGLE_DAY');
  const [trackUploadUrl, setTrackUploadUrl] = useState<string>('');
  const [trackNotes, setTrackNotes] = useState<string>('');
  const [leadName, setLeadName] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [leadRollNumber, setLeadRollNumber] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberDraft[]>([]);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [draftSavedTimestamp, setDraftSavedTimestamp] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSubmitting, startTransition] = useTransition();

  const currentEvent =
    events.find((e) => e.id === selectedEventId) || competitiveEvents[0] || events[0];

  // Distinct competitive categories list
  const competitiveCategories = [
    'ALL',
    'Cultural - Music',
    'Cultural - Dance',
    'Cultural - Theatre',
    'Cultural - Fashion',
    'Literary',
    'Gaming',
  ];

  const filteredCompetitiveEvents = competitiveEvents.filter((e) => {
    if (selectedCategory === 'ALL') return true;
    return e.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Calculate live payable amount for competitive event
  const calculateTotalFee = (): number => {
    if (registrationMode === 'INFORMALZ') return 0;
    if (!currentEvent) return 0;
    if (currentEvent.feeAmount === 0) return 0; // FREE
    if (currentEvent.hasDayOptions) {
      return dayOption === 'BOTH_DAYS' ? 250 : 150;
    }
    return currentEvent.feeAmount / 100;
  };

  // Load draft on mount
  useEffect(() => {
    const draft = loadRegistrationDraft();
    if (draft) {
      if (draft.eventId && events.some((e) => e.id === draft.eventId)) {
        setSelectedEventId(draft.eventId);
        const match = events.find((e) => e.id === draft.eventId);
        if (match?.category.toLowerCase() === 'informalz') {
          setRegistrationMode('INFORMALZ');
          setSelectedInformalIds([draft.eventId]);
        }
      }
      setLeadName(draft.leadName || '');
      setLeadEmail(draft.leadEmail || '');
      setTeamMembers(draft.teamMembers || []);
      setIsDraftRestored(true);
      setDraftSavedTimestamp(new Date(draft.lastSavedAt).toLocaleTimeString());
    }
  }, [events]);

  // Adjust team member slots based on event minTeamSize
  useEffect(() => {
    if (registrationMode === 'INFORMALZ' || !currentEvent) return;
    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    setTeamMembers((prev) => {
      if (prev.length < requiredAdditional) {
        const next = [...prev];
        while (next.length < requiredAdditional) {
          next.push({ fullName: '', rollNumber: '' });
        }
        return next;
      }
      const maxAdditional = Math.max(0, currentEvent.maxTeamSize - 1);
      if (prev.length > maxAdditional) {
        return prev.slice(0, maxAdditional);
      }
      return prev;
    });
  }, [currentEvent, registrationMode]);

  // State persistence to localStorage
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
    setTrackUploadUrl('');
    setTrackNotes('');
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

  const displayError = (msg: string) => {
    setErrorMessage(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // ───────────────── INFORMALZ SUBMISSION ─────────────────
    if (registrationMode === 'INFORMALZ') {
      if (selectedInformalIds.length === 0) {
        setErrorMessage('Please select at least one Informalz event to participate in.');
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

      startTransition(async () => {
        try {
          const checkoutRes = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventIds: selectedInformalIds,
              leadName,
              leadEmail,
              leadRollNumber,
            }),
          });

          const checkoutData = await checkoutRes.json();
          if (!checkoutRes.ok) {
            throw new Error(checkoutData.error || 'Failed to initialize informal registration');
          }

          clearRegistrationDraft();
          const allParam = checkoutData.allRegistrationIds
            ? `?all=${checkoutData.allRegistrationIds.join(',')}`
            : '';
          router.push(`/tickets/${checkoutData.registrationId}${allParam}`);
        } catch (err) {
          setErrorMessage((err as Error).message);
        }
      });
      return;
    }

    // ───────────────── COMPETITIVE SUBMISSION ─────────────────
    if (!currentEvent) {
      displayError('Please select an event.');
      return;
    }

    if (!leadName.trim()) {
      displayError('Lead Attendee Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leadEmail.trim() || !emailRegex.test(leadEmail)) {
      displayError('Please enter a complete and valid college email address (e.g. student@college.edu).');
      return;
    }

    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    for (let i = 0; i < requiredAdditional; i++) {
      if (!teamMembers[i]?.fullName.trim()) {
        displayError(`Team Member #${i + 2} name is strictly required for this team event.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: currentEvent.id,
            leadName,
            leadEmail,
            dayOption: currentEvent.hasDayOptions ? dayOption : undefined,
            trackUploadUrl: currentEvent.requiresTrackUpload ? trackUploadUrl : undefined,
            trackNotes: currentEvent.requiresTrackUpload ? trackNotes : undefined,
            teamMembers: teamMembers.filter((m) => m.fullName.trim().length > 0),
          }),
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          let errorMsg = checkoutData.error || 'Failed to initialize checkout';
          if (checkoutData.details) {
            // Extract the first layer of field errors for display
            const fieldErrors = Object.keys(checkoutData.details)
              .filter(k => k !== '_errors' && checkoutData.details[k]?._errors?.length)
              .map(k => `${k}: ${checkoutData.details[k]._errors.join(', ')}`)
              .join(' | ');
            if (fieldErrors) errorMsg += ` (${fieldErrors})`;
            else errorMsg += ` ${JSON.stringify(checkoutData.details)}`;
          }
          throw new Error(errorMsg);
        }

        // 1. FREE Event Instant Pass Completion
        if (checkoutData.isFree) {
          clearRegistrationDraft();
          const allParam = checkoutData.allRegistrationIds
            ? `?all=${checkoutData.allRegistrationIds.join(',')}`
            : '';
          router.push(`/tickets/${checkoutData.registrationId}${allParam}`);
          return;
        }

        // Lock the form permanently for this instance so user can't double-click if they close the modal
        setIsLocked(true);

        const { registrationId, orderId, amount, isMock } = checkoutData;

        // 2. Paid Event: Open Live Razorpay or Staging Simulator
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
            name: "Lingaya's Vidyapeeth ZEST 2K26",
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
                displayError(verifyData.error || 'Verification failed');
              }
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Staging Simulation
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
            setErrorMessage(verifyData.error || 'Simulation verification failed');
          }
        }
      } catch (error) {
        console.error('Registration submission failed:', error);
        setErrorMessage(
          (error as Error).message ||
            'Something went wrong during checkout. Please verify connection and retry.'
        );
      }
    });
  };

  const totalPayableInr = calculateTotalFee();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top Tab Mode Switcher */}
      <div className="flex p-1.5 bg-slate-200/80 rounded-2xl mb-8 max-w-xl mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setRegistrationMode('COMPETITIVE')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            registrationMode === 'COMPETITIVE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#1a73e8]" />
          <span>Competitive Events</span>
        </button>
        <button
          type="button"
          onClick={() => setRegistrationMode('INFORMALZ')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            registrationMode === 'INFORMALZ'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PartyPopper className="w-4 h-4 text-amber-300" />
          <span>Informalz Hub (Free)</span>
          <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
            No Limits
          </span>
        </button>
      </div>

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

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Registration Notice</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ========================================================================= */}
        {/* 🎯 MODE 1: INFORMALZ MULTI-EVENT REGISTRATION (UNLIMITED PARTICIPATION) */}
        {/* ========================================================================= */}
        {registrationMode === 'INFORMALZ' && (
          <>
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-purple-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Informalz Committee Hub
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      100% FREE • Zero Limits
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Select Your Informal Activities
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose as many activities as you want! A single participant can join <strong>N number of events</strong> with instant entry passes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllInformal}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    Select All ({informalzEvents.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearAllInformal}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Informalz Multi-Select Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {informalzEvents.map((evt) => {
                  const isChecked = selectedInformalIds.includes(evt.id);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => toggleInformalEvent(evt.id)}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                        isChecked
                          ? 'border-purple-600 bg-purple-50/40 shadow-sm ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            100% FREE
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 leading-snug mb-1">
                          {evt.title}
                        </h4>

                        {evt.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {evt.venue || "Campus Grounds"}
                        </span>
                        <span className="font-semibold text-purple-700">
                          {evt.eventType}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informalz Selection Bar */}
              <div className="mt-4 p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between text-xs font-semibold text-purple-900">
                <span>
                  🎉 You have selected <strong>{selectedInformalIds.length}</strong> out of {informalzEvents.length} activities
                </span>
                <span className="text-emerald-700 font-extrabold">
                  Total Fee: ₹0 (FREE)
                </span>
              </div>
            </section>

            {/* Step 2: Attendee Details for Informalz */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Step 2 of 2
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Participant Contact & Passes Info
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your passes for all selected activities will be generated and linked to this contact.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="leadName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Participant Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="leadName"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-purple-600"
                  />
                </div>

                <div>
                  <label htmlFor="leadEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                    College / Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="leadEmail"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="rahul.verma@lingayas.edu.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="leadRollNumber" className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number / Student ID <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="leadRollNumber"
                    type="text"
                    value={leadRollNumber}
                    onChange={(e) => setLeadRollNumber(e.target.value)}
                    placeholder="e.g. 23BTECH045"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-purple-600"
                  />
                </div>
              </div>
            </section>

            {/* Informalz Submit Card */}
            <section className="bg-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-purple-900">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-purple-300">
                    Informalz Passes Summary
                  </span>
                  <h3 className="text-2xl font-bold mt-1">
                    Multi-Activity Pass ({selectedInformalIds.length} Events)
                  </h3>
                  <p className="text-purple-300 text-sm mt-1">
                    No payment required. Digital QR access codes will be issued for all {selectedInformalIds.length} events.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm text-purple-300 block">Total Payable Fee</span>
                  <span className="text-3xl font-extrabold text-emerald-400">
                    100% FREE
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lingaya&apos;s Vidyapeeth ZEST 2K26 • Informalz Committee Pass System</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedInformalIds.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold bg-purple-500 hover:bg-purple-600 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Issuing Free Passes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Claim Free Passes ({selectedInformalIds.length} Events)</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* 🏆 MODE 2: COMPETITIVE & STAGE EVENTS REGISTRATION */}
        {/* ========================================================================= */}
        {registrationMode === 'COMPETITIVE' && (
          <>
            {/* Step 1: Select Event (ZEST 2K26 Filterable Catalog) */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                    Step 1 of 3
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">Choose Competition or Event</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 self-start sm:self-auto">
                  {competitiveEvents.length} Competitive Events
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
                {competitiveCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#1a73e8] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Competitive' : cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                {filteredCompetitiveEvents.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  const isSolo = evt.minTeamSize === 1 && evt.maxTeamSize === 1;
                  const isFree = evt.feeAmount === 0;

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
                          <span className="font-extrabold text-base text-slate-900">
                            {isFree ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                FREE
                              </span>
                            ) : evt.hasDayOptions ? (
                              '₹150 / ₹250'
                            ) : (
                              `₹${evt.feeAmount / 100}`
                            )}
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

                        {evt.prize1 && (
                          <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1.5">
                            <Trophy className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">1st: {evt.prize1}</span>
                          </div>
                        )}
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

              {/* Day Pass Selection for Individual events with ₹150 / ₹250 pricing */}
              {currentEvent?.hasDayOptions && (
                <div className="mt-6 p-5 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-950 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1a73e8]" />
                    Select Event Access Duration
                  </h4>
                  <p className="text-xs text-blue-800 mb-3">
                    For individual competitions, you can choose single-day access or the full both-days pass:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setDayOption('SINGLE_DAY')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        dayOption === 'SINGLE_DAY'
                          ? 'border-[#1a73e8] bg-white shadow-xs'
                          : 'border-blue-200/80 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">Single Day Pass</span>
                        <span className="text-xs text-slate-500">Valid for performance day</span>
                      </div>
                      <span className="font-extrabold text-base text-[#1a73e8]">₹150</span>
                    </div>

                    <div
                      onClick={() => setDayOption('BOTH_DAYS')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        dayOption === 'BOTH_DAYS'
                          ? 'border-[#1a73e8] bg-white shadow-xs'
                          : 'border-blue-200/80 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">Both Days Pass</span>
                        <span className="text-xs text-slate-500">Full festival access (Day 1 & Day 2)</span>
                      </div>
                      <span className="font-extrabold text-base text-[#1a73e8]">₹250</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Stage Audio / Video Track Upload Section */}
            {currentEvent?.requiresTrackUpload && (
              <section className="bg-purple-50/60 rounded-3xl p-6 sm:p-8 border-2 border-purple-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-4 border-b border-purple-200/80">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 mb-2">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      <span>Stage Media Coordination Required</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Audio / Video Track & Backstage Media
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      For <strong>{currentEvent.title}</strong>, performance soundtracks, karaokes, videos, or scripts are routed directly to stage sound technicians.
                    </p>
                  </div>

                  <a
                    href={STAGE_GOOGLE_DRIVE_FOLDER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors shrink-0"
                  >
                    <span>Upload to Official Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="trackUploadUrl"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Google Drive / Cloud Share Link for Track <span className="text-slate-400">(Optional but recommended)</span>
                    </label>
                    <input
                      id="trackUploadUrl"
                      type="url"
                      value={trackUploadUrl}
                      onChange={(e) => setTrackUploadUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or uploaded file link"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-slate-900 text-xs bg-white focus:border-purple-600"
                    />
                    <span className="text-[11px] text-purple-900 mt-1 block">
                      Please ensure your Drive link permission is set to &quot;Anyone with the link can view&quot;.
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="trackNotes"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Song Title / Artist / Cue Instructions
                    </label>
                    <textarea
                      id="trackNotes"
                      rows={2}
                      value={trackNotes}
                      onChange={(e) => setTrackNotes(e.target.value)}
                      placeholder="e.g., Track title: Shape of You, Start sound immediately upon walk-on, lights dim at 02:15."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-slate-900 text-xs bg-white focus:border-purple-600"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Step 2: Attendee Details */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                  Step 2 of 3
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Lead Attendee Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official digital tickets and entry pass cryptography are generated for this contact.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="leadName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="leadName"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
                  />
                </div>

                <div>
                  <label htmlFor="leadEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                    College / Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="leadEmail"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="ananya.sharma@lingayas.edu.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="leadRollNumber" className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number / Student ID <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="leadRollNumber"
                    type="text"
                    value={leadRollNumber}
                    onChange={(e) => setLeadRollNumber(e.target.value)}
                    placeholder="e.g. 23BTECH045"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
                  />
                </div>
              </div>

              {/* Team Members Slots */}
              {currentEvent && currentEvent.maxTeamSize > 1 && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#1a73e8]" />
                        Team Members Roster ({1 + teamMembers.length} / {currentEvent.maxTeamSize})
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Minimum team size for {currentEvent.title} is {currentEvent.minTeamSize}.
                      </p>
                    </div>

                    {1 + teamMembers.length < currentEvent.maxTeamSize && (
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>

                  {teamMembers.map((member, idx) => {
                    const memberNumber = idx + 2;
                    const isRequired = memberNumber <= currentEvent.minTeamSize;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                              {memberNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Team Member #{memberNumber}
                            </span>
                            {isRequired && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                Required Slot
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
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
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
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Final Payment & Submission Summary */}
            <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
                    Payment Summary
                  </span>
                  <h3 className="text-2xl font-bold mt-1">
                    {currentEvent ? currentEvent.title : 'Event Registration'}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Includes official digital entry passes with cryptographic HMAC-SHA256 verification.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm text-slate-400 block">Total Payable Fee</span>
                  <span className="text-3xl font-extrabold text-white">
                    {totalPayableInr === 0 ? (
                      <span className="text-emerald-400">FREE</span>
                    ) : (
                      `₹${totalPayableInr}`
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lingaya&apos;s Vidyapeeth ZEST 2K26 Official Registration Engine</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Registration...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>
                        {totalPayableInr === 0
                          ? 'Confirm Free Registration'
                          : `Pay ₹${totalPayableInr} & Register`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </>
        )}
      </form>
    </div>
  );
}
