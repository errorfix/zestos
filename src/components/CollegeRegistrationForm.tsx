'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Phone,
  Mail,
  Camera,
  ShoppingCart,
  PlusCircle,
  Crown,
  Receipt,
  Info,
  User,
  ShieldCheck,
} from 'lucide-react';
import CollegeCombobox from '@/components/CollegeCombobox';
import { InitialEventData } from '@/lib/mockEvents';
import { compressAndStripExif } from '@/lib/imageCompressor';
import { PricingCalculationResult } from '@/lib/collegeDb';

interface CollegeRegistrationFormProps {
  events: InitialEventData[];
}

interface ParticipantItem {
  fullName: string;
  phone: string;
  photoUrl: string;
  isTeamLeader: boolean;
}

interface CartSquad {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventType: string;
  eventDate: string | null;
  participants: ParticipantItem[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function CollegeRegistrationForm({ events }: CollegeRegistrationFormProps) {
  const router = useRouter();

  // Institution & Delegation Contact
  const [instituteName, setInstituteName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');

  // Cart of Event Squads
  const [cartSquads, setCartSquads] = useState<CartSquad[]>([]);

  // Current Squad Form
  const [activeEventId, setActiveEventId] = useState<string>(events[0]?.id || '');
  const [currentParticipants, setCurrentParticipants] = useState<ParticipantItem[]>([
    { fullName: '', phone: '', photoUrl: '', isTeamLeader: false },
  ]);

  // Pricing Calculation State
  const [pricing, setPricing] = useState<PricingCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission State
  const [isSubmitting, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    registrationId: string;
    ticketsIssued: Array<{
      fullName: string;
      phone: string;
      festivalDay: string;
      ticketCode: string;
      isReused: boolean;
    }>;
  } | null>(null);

  // Active event object
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];
  const isTeamEvent = activeEvent ? activeEvent.eventType === 'Team' && (activeEvent.maxTeamSize || 1) > 1 : false;

  // Inject Razorpay checkout script on mount
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

  // Adjust participant slots when event changes
  useEffect(() => {
    if (!activeEvent) return;
    const isTeam = activeEvent.eventType === 'Team' && (activeEvent.maxTeamSize || 1) > 1;

    if (!isTeam) {
      // Individual event: Exactly 1 participant, not designated as a team leader
      setCurrentParticipants([{ fullName: '', phone: '', photoUrl: '', isTeamLeader: false }]);
    } else {
      // Team event: At least minTeamSize, entry #1 is team leader
      const minSize = Math.max(1, activeEvent.minTeamSize || 1);
      setCurrentParticipants((prev) => {
        const slots: ParticipantItem[] = [...prev];
        while (slots.length < minSize) {
          slots.push({ fullName: '', phone: '', photoUrl: '', isTeamLeader: false });
        }
        if (slots.length > 0) {
          slots[0].isTeamLeader = true;
        }
        return slots;
      });
    }
  }, [activeEventId, activeEvent]);

  // Recalculate pricing whenever cart changes or institute changes
  useEffect(() => {
    if (!instituteName.trim() || cartSquads.length === 0) {
      setPricing(null);
      return;
    }

    setIsCalculating(true);
    fetch('/api/college-registration/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instituteName: instituteName.trim(),
        squads: cartSquads.map((s) => ({
          eventId: s.eventId,
          participants: s.participants.map((p) => ({
            fullName: p.fullName,
            phone: p.phone,
            photoUrl: p.photoUrl,
            isTeamLeader: p.isTeamLeader,
          })),
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pricing) {
          setPricing(data.pricing);
        }
      })
      .catch((err) => console.warn('Pricing calculation failed:', err))
      .finally(() => setIsCalculating(false));
  }, [instituteName, cartSquads]);

  // Photo upload handler
  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressAndStripExif(file, { maxWidth: 400, maxHeight: 500, quality: 0.8 });
      setCurrentParticipants((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], photoUrl: compressedDataUrl };
        return copy;
      });
    } catch (err) {
      alert((err as Error).message || 'Failed to compress photo.');
    }
  };

  // Add squad to cart
  const handleAddSquadToCart = () => {
    setErrorMsg(null);

    if (!instituteName.trim()) {
      setErrorMsg('Please select or specify your Institution Name first.');
      return;
    }

    // Validate squad constraints
    const isTeam = activeEvent.eventType === 'Team' && (activeEvent.maxTeamSize || 1) > 1;
    const minSize = isTeam ? activeEvent.minTeamSize || 1 : 1;
    const maxSize = isTeam ? activeEvent.maxTeamSize || 10 : 1;

    if (currentParticipants.length < minSize) {
      setErrorMsg(`"${activeEvent.title}" requires at least ${minSize} participant(s).`);
      return;
    }
    if (currentParticipants.length > maxSize) {
      setErrorMsg(`"${activeEvent.title}" allows a maximum of ${maxSize} participant(s).`);
      return;
    }

    for (let i = 0; i < currentParticipants.length; i++) {
      const p = currentParticipants[i];
      if (!p.fullName.trim()) {
        const roleLabel = isTeam ? (i === 0 ? 'Team Leader' : `Member #${i + 1}`) : 'Participant';
        setErrorMsg(`${roleLabel} is missing a Full Legal Name.`);
        return;
      }
      const cleanPhone = p.phone.trim().replace(/\s+/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg(`Participant "${p.fullName}" must have a valid 10-digit personal contact number.`);
        return;
      }
    }

    const newSquad: CartSquad = {
      id: `squad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      eventCategory: activeEvent.category,
      eventType: activeEvent.eventType,
      eventDate: activeEvent.date || null,
      participants: [...currentParticipants],
    };

    setCartSquads((prev) => [...prev, newSquad]);

    // Reset current squad form
    setCurrentParticipants([{ fullName: '', phone: '', photoUrl: '', isTeamLeader: isTeam }]);
  };

  const handleRemoveSquad = (squadId: string) => {
    setCartSquads((prev) => prev.filter((s) => s.id !== squadId));
  };

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!instituteName.trim()) {
      setErrorMsg('Please select your College / University.');
      return;
    }
    if (!leaderName.trim() || !leaderEmail.trim() || !leaderPhone.trim()) {
      setErrorMsg('Please complete the Delegation Coordinator contact details.');
      return;
    }
    if (cartSquads.length === 0) {
      setErrorMsg('Please add at least one Event Squad to the contingent cart before checking out.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          instituteName: instituteName.trim(),
          leaderName: leaderName.trim(),
          leaderEmail: leaderEmail.trim(),
          leaderPhone: leaderPhone.trim(),
          squads: cartSquads.map((s) => ({
            eventId: s.eventId,
            participants: s.participants.map((p) => ({
              fullName: p.fullName.trim(),
              phone: p.phone.trim(),
              photoUrl: p.photoUrl,
              isTeamLeader: p.isTeamLeader,
            })),
          })),
        };

        const res = await fetch('/api/college-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to initialize contingent checkout.');
        }

        const { registrationId, orderId, amount, isMock, keyId: returnedKeyId } = data;
        const keyId = returnedKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        const canUseLiveModal =
          typeof window !== 'undefined' &&
          window.Razorpay &&
          keyId &&
          !keyId.includes('placeholder') &&
          !isMock;

        if (canUseLiveModal) {
          // Live Razorpay Modal
          const options = {
            key: keyId,
            amount: amount,
            currency: 'INR',
            name: "Lingaya's Vidyapeeth ZEST 2026",
            description: `College Contingent: ${instituteName}`,
            order_id: orderId,
            prefill: {
              name: leaderName,
              email: leaderEmail,
              contact: leaderPhone,
            },
            notes: {
              type: 'COLLEGE_CONTINGENT',
              instituteName,
            },
            theme: { color: '#1a73e8' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async function (response: any) {
              try {
                const verifyRes = await fetch('/api/verify-college-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    registrationId,
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.success) throw new Error(verifyData.error || 'Payment verification failed');
                setSuccessResult({
                  registrationId,
                  ticketsIssued: verifyData.ticketsIssued,
                });
              } catch (vErr) {
                setErrorMsg((vErr as Error).message);
              }
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Test Mode / Staging Simulation
          console.log('⚡ Mock Mode: Simulating Razorpay checkout...');
          const simulatedPaymentId = `pay_col_${Date.now()}`;
          const verifyRes = await fetch('/api/verify-college-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId,
              orderId,
              paymentId: simulatedPaymentId,
              signature: 'simulated_college_signature',
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) throw new Error(verifyData.error || 'Verification failed');
          setSuccessResult({
            registrationId,
            ticketsIssued: verifyData.ticketsIssued,
          });
        }
      } catch (err) {
        setErrorMsg((err as Error).message);
      }
    });
  };

  // SUCCESS CONFIRMATION SCREEN (LIGHT THEME)
  if (successResult) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in-0 duration-500">
        <div className="p-8 rounded-3xl bg-white border border-emerald-200 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Contingent Registration Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Official College Passes Issued!
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
              Your college delegation has been successfully registered for ZEST 2026. Day-wise QR passes have been generated for all participating students.
            </p>
          </div>
        </div>

        {/* Issued Passes Roster */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1a73e8]" />
              <h3 className="text-base font-bold text-slate-900">Issued Day-Wise Passes</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total: {successResult.ticketsIssued.length} Pass(es)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {successResult.ticketsIssued.map((ticket, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{ticket.fullName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{ticket.phone}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1a73e8] border border-blue-200">
                      {ticket.festivalDay === 'DAY_2' ? 'Day 2 Pass' : 'Day 1 Pass'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-800">{ticket.ticketCode}</div>
                  {ticket.isReused && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3 h-3" /> Linked Day Pass
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition shadow-sm"
            >
              Return to Festival Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN REGISTRATION FORM (LIGHT THEME)
  return (
    <form onSubmit={handleCheckout} className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1a73e8] border border-blue-200">
          <Building2 className="w-3.5 h-3.5" />
          Inter-College Delegation Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          College Contingent Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
          Register your institution&apos;s delegation across multiple cultural and competitive events in one combined checkout. Day-wise campus entry passes are automatically issued and deduplicated per student.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Institution & Delegation Coordinator */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center font-bold text-xs border border-blue-200">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Institution &amp; Delegation Coordinator</h2>
            <p className="text-xs text-slate-500">Specify your college and the primary contingent leader.</p>
          </div>
        </div>

        {/* College Combobox */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select or Add Your Institution <span className="text-rose-500">*</span>
          </label>
          <CollegeCombobox selectedCollege={instituteName} onSelectCollege={setInstituteName} />
        </div>

        {/* Delegation Coordinator Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contingent Leader Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="e.g. Dr. Priya Verma / Rohit Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Official Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                placeholder="coordinator@college.edu"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Event Squad Builder */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center font-bold text-xs border border-blue-200">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Activity / Event Entry</h2>
              <p className="text-xs text-slate-500">
                {isTeamEvent
                  ? 'Select team competition and enter Team Leader + Members.'
                  : 'Select individual competition and enter participant details.'}
              </p>
            </div>
          </div>

          {isTeamEvent ? (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Entry #1 = Team Leader
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Individual Event
            </span>
          )}
        </div>

        {/* Warning Callout for Student Mobile Numbers */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs">
          <Info className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
          <div>
            <strong>Personal Student Numbers Required:</strong> Every participant must enter their own personal 10-digit mobile number. Do <em>NOT</em> enter faculty or coordinator numbers for students. Day-wise entry QR passes are directly tied to each student&apos;s phone number.
          </div>
        </div>

        {/* Event Selection Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Competition / Activity <span className="text-rose-500">*</span>
            </label>
            <select
              value={activeEventId}
              onChange={(e) => setActiveEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category}) • {ev.eventType}
                </option>
              ))}
            </select>
          </div>

          {/* Event Details Card */}
          {activeEvent && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">{activeEvent.title}</div>
                <div className="text-slate-500">
                  {isTeamEvent
                    ? `Team Size: ${activeEvent.minTeamSize} - ${activeEvent.maxTeamSize} members`
                    : 'Single Participant Event'}
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#1a73e8] border border-blue-200">
                  {activeEvent.date?.includes('2') || activeEvent.date?.includes('31') ? 'Festival Day 2' : 'Festival Day 1'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Participant Input List */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>
              {isTeamEvent
                ? `Team Roster for "${activeEvent.title}"`
                : `Participant for "${activeEvent.title}"`}
            </span>
            {isTeamEvent && (
              <span>{currentParticipants.length} of {activeEvent.maxTeamSize} max</span>
            )}
          </div>

          {currentParticipants.map((p, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${
                isTeamEvent && idx === 0
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              } grid grid-cols-1 sm:grid-cols-12 gap-3 items-center`}
            >
              {/* Badge / Role Label */}
              <div className="sm:col-span-3 flex items-center gap-2">
                {isTeamEvent ? (
                  idx === 0 ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" /> Team Leader
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-200 text-slate-700">
                      Member #{idx + 1}
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-200 text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3" /> Participant
                  </span>
                )}
              </div>

              {/* Full Legal Name */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder={
                    isTeamEvent
                      ? idx === 0 ? "Team Leader Full Name *" : "Member Full Name *"
                      : "Participant Full Name *"
                  }
                  value={p.fullName}
                  onChange={(e) => {
                    const copy = [...currentParticipants];
                    copy[idx].fullName = e.target.value;
                    setCurrentParticipants(copy);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              {/* Student Mobile */}
              <div className="sm:col-span-3">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Student Mobile *"
                  value={p.phone}
                  onChange={(e) => {
                    const copy = [...currentParticipants];
                    copy[idx].phone = e.target.value.replace(/\D/g, '');
                    setCurrentParticipants(copy);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              {/* Photo Upload & Delete Action */}
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <label className="cursor-pointer p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 transition shadow-2xs">
                  <Camera className={`w-3.5 h-3.5 ${p.photoUrl ? 'text-emerald-600' : ''}`} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(idx, e)}
                    className="hidden"
                  />
                </label>

                {isTeamEvent && idx > 0 && idx >= (activeEvent.minTeamSize || 1) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentParticipants((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Member Button - Only for Team Events! */}
          {isTeamEvent && currentParticipants.length < (activeEvent.maxTeamSize || 10) && (
            <button
              type="button"
              onClick={() => {
                setCurrentParticipants((prev) => [
                  ...prev,
                  { fullName: '', phone: '', photoUrl: '', isTeamLeader: false },
                ]);
              }}
              className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Add Another Member to &quot;{activeEvent.title}&quot;</span>
            </button>
          )}

          {/* Push Squad into Cart */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddSquadToCart}
              className="w-full py-3 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {isTeamEvent ? 'Add Event Team to Contingent Cart' : 'Add Event Entry to Contingent Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 3: Contingent Cart & Price Summary */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center font-bold text-xs border border-blue-200">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contingent Cart &amp; Pricing Summary</h2>
              <p className="text-xs text-slate-500">Review added entries and verified campus entry pricing.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <ShoppingCart className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>{cartSquads.length} Event(s) Added</span>
          </div>
        </div>

        {cartSquads.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50">
            <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Contingent cart is empty</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select an activity in Step 2 above and click &quot;Add Event Entry to Contingent Cart&quot; to queue your delegation entries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Squads in Cart */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              {cartSquads.map((squad) => (
                <div key={squad.id} className="p-4 flex items-center justify-between bg-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{squad.eventTitle}</span>
                      <span className="text-[10px] font-bold text-[#1a73e8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {squad.eventCategory}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        • {squad.eventType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{squad.participants.length} Participant(s)</span>
                      <span>•</span>
                      <span>
                        {squad.eventType === 'Team' && squad.participants.length > 1
                          ? `Team Leader: ${squad.participants[0]?.fullName || 'N/A'}`
                          : `Participant: ${squad.participants[0]?.fullName || 'N/A'}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSquad(squad.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pricing Calculation Breakdown */}
            {pricing && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Contingent Calculation Breakdown
                  </span>
                  {isCalculating && <span className="text-[#1a73e8] font-semibold animate-pulse">Calculating...</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Unique Students</div>
                    <div className="text-lg font-extrabold text-slate-900">{pricing.totalUniqueParticipants}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Day 1 Passes</div>
                    <div className="text-lg font-extrabold text-[#1a73e8]">{pricing.day1ParticipantsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Day 2 Passes</div>
                    <div className="text-lg font-extrabold text-[#1a73e8]">{pricing.day2ParticipantsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Quota Used</div>
                    <div className="text-lg font-extrabold text-amber-700">{pricing.newQuotaUsed} / 20</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-slate-700">
                  {pricing.day1DiscountedCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 1 Discounted Tier ({pricing.day1DiscountedCount} × ₹100)</span>
                      <span className="font-semibold">₹{pricing.day1DiscountedCount * 100}</span>
                    </div>
                  )}
                  {pricing.day1ElevatedCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 1 Post-Quota Rate ({pricing.day1ElevatedCount} × ₹150)</span>
                      <span className="font-semibold">₹{pricing.day1ElevatedCount * 150}</span>
                    </div>
                  )}
                  {pricing.day2ParticipantsCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 2 Standard Rate ({pricing.day2ParticipantsCount} × ₹150)</span>
                      <span className="font-semibold">₹{pricing.day2AmountInr}</span>
                    </div>
                  )}
                  {pricing.exceptionsAmountInr > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Event Pricing Exception Surcharges</span>
                      <span className="font-semibold">+ ₹{pricing.exceptionsAmountInr}</span>
                    </div>
                  )}

                  {pricing.isFloorApplied && (
                    <div className="flex justify-between text-[#1a73e8] font-bold pt-1.5 border-t border-slate-200">
                      <span>Subtotal ₹{pricing.subtotalInr} → Minimum Order Floor Applied</span>
                      <span>₹1,000</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-slate-900">Total Amount Payable</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{pricing.finalAmountInr}</span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={isSubmitting || cartSquads.length === 0}
              className="w-full py-4 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-extrabold text-base shadow-sm flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <span>Processing Contingent Registration...</span>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>
                    Proceed to Delegation Checkout • ₹{pricing ? pricing.finalAmountInr : 1000}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
