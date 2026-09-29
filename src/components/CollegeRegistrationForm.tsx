'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Calendar,
  ShieldCheck,
  Trophy,
  Phone,
  Mail,
  Camera,
  ChevronRight,
  ShoppingCart,
  PlusCircle,
  Crown,
  FileCheck,
  Receipt,
  Info,
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
  eventDate: string | null;
  participants: ParticipantItem[];
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
    { fullName: '', phone: '', photoUrl: '', isTeamLeader: true },
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

  // Adjust participant slots when event changes
  useEffect(() => {
    if (!activeEvent) return;
    const minSize = activeEvent.minTeamSize || 1;
    setCurrentParticipants((prev) => {
      // Ensure at least minSize slots and entry #1 is team leader
      const slots: ParticipantItem[] = [...prev];
      while (slots.length < minSize) {
        slots.push({ fullName: '', phone: '', photoUrl: '', isTeamLeader: false });
      }
      if (slots.length > 0) {
        slots[0].isTeamLeader = true;
      }
      return slots;
    });
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

    // Validate squad
    const minSize = activeEvent.minTeamSize || 1;
    const maxSize = activeEvent.maxTeamSize || 10;

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
        setErrorMsg(`Participant #${i + 1} (${i === 0 ? 'Team Leader' : 'Member'}) is missing a Name.`);
        return;
      }
      const cleanPhone = p.phone.trim().replace(/\s+/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg(`Participant #${i + 1} (${p.fullName}) must have a valid 10-digit personal mobile number.`);
        return;
      }
    }

    const newSquad: CartSquad = {
      id: `squad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      eventCategory: activeEvent.category,
      eventDate: activeEvent.date || null,
      participants: [...currentParticipants],
    };

    setCartSquads((prev) => [...prev, newSquad]);

    // Reset current squad form
    setCurrentParticipants([{ fullName: '', phone: '', photoUrl: '', isTeamLeader: true }]);
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
      setErrorMsg('Please complete the Delegation In-Charge contact details.');
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

        const { registrationId, orderId, amount, keyId, isMock } = data;

        // If mock transaction
        if (isMock || !keyId || keyId.includes('placeholder')) {
          console.log('⚡ Mock Mode: Simulating Razorpay checkout...');
          const verifyRes = await fetch('/api/verify-college-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId,
              orderId,
              paymentId: `mock_pay_${Date.now()}`,
              signature: 'simulated_mock_signature',
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) throw new Error(verifyData.error || 'Verification failed');
          setSuccessResult({
            registrationId,
            ticketsIssued: verifyData.ticketsIssued,
          });
          return;
        }

        // Live Razorpay Modal
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK failed to load. Please check your connection.');
        }

        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency: 'INR',
          name: "Lingaya's Vidyapeeth • ZEST 2026",
          description: `College Contingent: ${instituteName}`,
          order_id: orderId,
          prefill: {
            name: leaderName,
            email: leaderEmail,
            contact: leaderPhone,
          },
          theme: { color: '#6366f1' },
          handler: async (response: any) => {
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
        });

        rzp.open();
      } catch (err) {
        setErrorMsg((err as Error).message);
      }
    });
  };

  // SUCCESS CONFIRMATION SCREEN
  if (successResult) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in-0 duration-500">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Contingent Registration Confirmed
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Official College Passes Issued!</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Your college delegation has been successfully registered for ZEST 2026. Day-wise QR passes have been generated for all participating students.
            </p>
          </div>
        </div>

        {/* Issued Passes Roster */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Issued Day-Wise Passes</h3>
            </div>
            <span className="text-xs text-slate-400">Total: {successResult.ticketsIssued.length} passes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {successResult.ticketsIssued.map((ticket, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white text-sm">{ticket.fullName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{ticket.phone}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {ticket.festivalDay === 'DAY_2' ? 'Day 2 Pass' : 'Day 1 Pass'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-amber-400">{ticket.ticketCode}</div>
                  {ticket.isReused && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
            >
              Return to Festival Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCheckout} className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Inter-College Delegation Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            College Contingent Registration
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Register your institution&apos;s delegation across multiple cultural and competitive events in one combined checkout. Pass generation is automated and deduplicated day-wise per student.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Institution & Delegation In-Charge */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Institution &amp; Delegation In-Charge</h2>
            <p className="text-xs text-slate-400">Specify your college and the primary contingent coordinator.</p>
          </div>
        </div>

        {/* College Combobox */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select or Add Your Institution <span className="text-rose-400">*</span>
          </label>
          <CollegeCombobox selectedCollege={instituteName} onSelectCollege={setInstituteName} />
        </div>

        {/* Delegation Coordinator Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contingent Leader Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="e.g. Dr. Priya Verma / Rohit Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                placeholder="coordinator@college.edu"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contact Mobile Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Event Squad Builder */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Event Squad to Contingent</h2>
              <p className="text-xs text-slate-400">Select an activity and enter its Team Leader + Members.</p>
            </div>
          </div>

          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Entry #1 = Team Leader
          </span>
        </div>

        {/* Warning Callout for Student Mobile Numbers */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong>Personal Student Numbers Required:</strong> Every participant must enter their own personal 10-digit mobile number. Do <em>NOT</em> enter faculty or coordinator numbers for students. Day-wise entry QR passes are directly tied to each individual student&apos;s phone number.
          </div>
        </div>

        {/* Event Selection Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Competition / Activity <span className="text-rose-400">*</span>
            </label>
            <select
              value={activeEventId}
              onChange={(e) => setActiveEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category}) • {ev.date || 'Fest Day'}
                </option>
              ))}
            </select>
          </div>

          {/* Event Details Card */}
          {activeEvent && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-white">{activeEvent.title}</div>
                <div className="text-slate-400">
                  Team Size: {activeEvent.minTeamSize} - {activeEvent.maxTeamSize} participant(s)
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeEvent.date?.includes('2') || activeEvent.date?.includes('31') ? 'Festival Day 2' : 'Festival Day 1'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Participant Input List (Entry #1 is Leader) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Participants for &quot;{activeEvent.title}&quot;</span>
            <span>{currentParticipants.length} of {activeEvent.maxTeamSize} max</span>
          </div>

          {currentParticipants.map((p, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                idx === 0
                  ? 'bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-slate-950/70 border-slate-800'
              } grid grid-cols-1 sm:grid-cols-12 gap-3 items-center`}
            >
              {/* Badge / Index */}
              <div className="sm:col-span-3 flex items-center gap-2">
                {idx === 0 ? (
                  <span className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Team Leader
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300">
                    Member #{idx + 1}
                  </span>
                )}
              </div>

              {/* Full Name */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder={idx === 0 ? "Team Leader Full Name *" : "Student Full Name *"}
                  value={p.fullName}
                  onChange={(e) => {
                    const copy = [...currentParticipants];
                    copy[idx].fullName = e.target.value;
                    setCurrentParticipants(copy);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Student Phone */}
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
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo Upload & Delete Action */}
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <label className="cursor-pointer p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition">
                  <Camera className={`w-3.5 h-3.5 ${p.photoUrl ? 'text-emerald-400' : ''}`} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(idx, e)}
                    className="hidden"
                  />
                </label>

                {idx > 0 && idx >= (activeEvent.minTeamSize || 1) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentParticipants((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Member Button */}
          {currentParticipants.length < (activeEvent.maxTeamSize || 10) && (
            <button
              type="button"
              onClick={() => {
                setCurrentParticipants((prev) => [
                  ...prev,
                  { fullName: '', phone: '', photoUrl: '', isTeamLeader: false },
                ]);
              }}
              className="w-full py-2 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Another Member to &quot;{activeEvent.title}&quot;</span>
            </button>
          )}

          {/* Push Squad into Cart */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddSquadToCart}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Event Squad to Contingent Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 3: Contingent Cart & Price Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Contingent Cart &amp; Pricing Summary</h2>
              <p className="text-xs text-slate-400">Review all added squads and verified campus entry pricing.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">{cartSquads.length} Event(s) Added</span>
          </div>
        </div>

        {cartSquads.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">Contingent cart is empty</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select an activity in Step 2 above and click &quot;Add Event Squad to Contingent Cart&quot; to queue your delegation entries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Squads in Cart */}
            <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              {cartSquads.map((squad) => (
                <div key={squad.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{squad.eventTitle}</span>
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {squad.eventCategory}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{squad.participants.length} Participant(s)</span>
                      <span>•</span>
                      <span>Leader: {squad.participants[0]?.fullName || 'N/A'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSquad(squad.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pricing Calculation Breakdown */}
            {pricing && (
              <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Contingent Calculation Breakdown
                  </span>
                  {isCalculating && <span className="text-indigo-400 animate-pulse">Calculating...</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Unique Students</div>
                    <div className="text-base font-extrabold text-white">{pricing.totalUniqueParticipants}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Day 1 Passes</div>
                    <div className="text-base font-extrabold text-indigo-300">{pricing.day1ParticipantsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Day 2 Passes</div>
                    <div className="text-base font-extrabold text-indigo-300">{pricing.day2ParticipantsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Quota Used</div>
                    <div className="text-base font-extrabold text-amber-300">{pricing.newQuotaUsed} / 20</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-slate-300">
                  {pricing.day1DiscountedCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 1 Discounted Tier ({pricing.day1DiscountedCount} × ₹100)</span>
                      <span>₹{pricing.day1DiscountedCount * 100}</span>
                    </div>
                  )}
                  {pricing.day1ElevatedCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 1 Post-Quota Rate ({pricing.day1ElevatedCount} × ₹150)</span>
                      <span>₹{pricing.day1ElevatedCount * 150}</span>
                    </div>
                  )}
                  {pricing.day2ParticipantsCount > 0 && (
                    <div className="flex justify-between">
                      <span>Day 2 Standard Rate ({pricing.day2ParticipantsCount} × ₹150)</span>
                      <span>₹{pricing.day2AmountInr}</span>
                    </div>
                  )}
                  {pricing.exceptionsAmountInr > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Event Pricing Exception Surcharges</span>
                      <span>+ ₹{pricing.exceptionsAmountInr}</span>
                    </div>
                  )}

                  {pricing.isFloorApplied && (
                    <div className="flex justify-between text-indigo-400 font-semibold pt-1 border-t border-slate-800/60">
                      <span>Subtotal ₹{pricing.subtotalInr} → Minimum Order Floor Applied</span>
                      <span>₹1,000</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-white">Total Amount Payable</span>
                  <span className="text-xl font-extrabold text-emerald-400">₹{pricing.finalAmountInr}</span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={isSubmitting || cartSquads.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
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
