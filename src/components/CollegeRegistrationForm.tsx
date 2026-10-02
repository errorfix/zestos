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
  Edit3,
  Sliders,
} from 'lucide-react';
import CollegeCombobox from '@/components/CollegeCombobox';
import EventSelectModal from '@/components/EventSelectModal';
import EditCartSquadModal from '@/components/EditCartSquadModal';
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

export default function CollegeRegistrationForm({ events: initialEvents }: CollegeRegistrationFormProps) {
  const router = useRouter();

  // Dynamic events list (freshly synced from DB if needed)
  const [eventsList, setEventsList] = useState<InitialEventData[]>(initialEvents);

  // Modal State for Event Selection
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Modal State for Editing Squad in Cart
  const [editingSquad, setEditingSquad] = useState<CartSquad | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Institution & Delegation Contact
  const [instituteName, setInstituteName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderPhotoUrl, setLeaderPhotoUrl] = useState('');
  const [leaderPhotoCompressing, setLeaderPhotoCompressing] = useState(false);

  // Cart of Event Squads
  const [cartSquads, setCartSquads] = useState<CartSquad[]>([]);

  // Handler to open squad edit modal
  const handleOpenEditSquad = (squad: CartSquad) => {
    setEditingSquad(squad);
    setIsEditModalOpen(true);
  };

  // Handler to save updated squad
  const handleSaveEditedSquad = (updatedSquad: CartSquad) => {
    setCartSquads((prev) =>
      prev.map((s) => (s.id === updatedSquad.id ? updatedSquad : s))
    );
    setEditingSquad(null);
    setIsEditModalOpen(false);
  };

  // Current Squad Form
  const competitiveList = eventsList.filter((e) => e.category.toLowerCase() !== 'informalz');
  const defaultEvent = competitiveList[0] || eventsList[0];
  const [activeEventId, setActiveEventId] = useState<string>(defaultEvent?.id || '');

  // Helper to initialize correct participant slots based on event min/max team size
  const buildInitialSlots = (evt?: InitialEventData): ParticipantItem[] => {
    if (!evt) return [{ fullName: '', phone: '', photoUrl: '', isTeamLeader: false }];
    const isTeam = evt.minTeamSize > 1 || evt.maxTeamSize > 1 || evt.eventType === 'Team';
    const minSlots = isTeam ? Math.max(2, evt.minTeamSize || 2) : 1;

    const slots: ParticipantItem[] = [];
    for (let i = 0; i < minSlots; i++) {
      slots.push({
        fullName: '',
        phone: '',
        photoUrl: '',
        isTeamLeader: isTeam && i === 0,
      });
    }
    return slots;
  };

  const [currentParticipants, setCurrentParticipants] = useState<ParticipantItem[]>(() =>
    buildInitialSlots(defaultEvent)
  );

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
  const activeEvent = eventsList.find((e) => e.id === activeEventId) || defaultEvent;
  const isTeamEvent = activeEvent
    ? activeEvent.minTeamSize > 1 || activeEvent.maxTeamSize > 1 || activeEvent.eventType === 'Team'
    : false;

  // Refresh live events on mount to ensure real-time consistency with SuperAdmin edits
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setEventsList(data.events);
        }
      })
      .catch((err) => console.warn('Live events fetch fallback:', err));
  }, []);

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

  // Handler when user selects an event from the modal
  const handleSelectEvent = (evt: InitialEventData) => {
    setActiveEventId(evt.id);
    setCurrentParticipants(buildInitialSlots(evt));
    setErrorMsg(null);
  };

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

  const displayError = (msg: string) => {
    setErrorMsg(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Leader photo upload handler
  const handleLeaderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLeaderPhotoCompressing(true);
    setErrorMsg(null);
    try {
      const compressedDataUrl = await compressAndStripExif(file, { maxWidth: 480, maxHeight: 600, quality: 0.82 });
      setLeaderPhotoUrl(compressedDataUrl);
    } catch (err) {
      displayError((err as Error).message || 'Failed to compress contingent leader photo.');
    } finally {
      setLeaderPhotoCompressing(false);
    }
  };

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
      displayError((err as Error).message || 'Failed to compress photo.');
    }
  };

  // Add squad to cart
  const handleAddSquadToCart = () => {
    setErrorMsg(null);

    if (!instituteName.trim()) {
      displayError('Please select or specify your Institution Name first.');
      return;
    }

    if (!activeEvent) {
      displayError('Please select a competition or activity.');
      return;
    }

    // Validate squad constraints
    const isTeam = activeEvent.minTeamSize > 1 || activeEvent.maxTeamSize > 1 || activeEvent.eventType === 'Team';
    const minSize = isTeam ? Math.max(1, activeEvent.minTeamSize || 1) : 1;
    const maxSize = isTeam ? Math.max(minSize, activeEvent.maxTeamSize || 10) : 1;

    if (currentParticipants.length < minSize) {
      displayError(`"${activeEvent.title}" requires at least ${minSize} participant(s).`);
      return;
    }
    if (currentParticipants.length > maxSize) {
      displayError(`"${activeEvent.title}" allows a maximum of ${maxSize} participant(s).`);
      return;
    }

    for (let i = 0; i < currentParticipants.length; i++) {
      const p = currentParticipants[i];
      if (!p.fullName.trim()) {
        const roleLabel = isTeam ? (i === 0 ? 'Team Leader' : `Member #${i + 1}`) : 'Participant';
        displayError(`${roleLabel} is missing a Full Legal Name.`);
        return;
      }
      const cleanPhone = p.phone.trim().replace(/\s+/g, '');
      if (cleanPhone.length < 10) {
        displayError(`Participant "${p.fullName}" must have a valid 10-digit personal contact number.`);
        return;
      }
      if (!p.photoUrl) {
        displayError('Upload pictures of contingent/participant(s)');
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

    // Reset current squad form with the same event requirements
    setCurrentParticipants(buildInitialSlots(activeEvent));
  };

  const handleRemoveSquad = (squadId: string) => {
    setCartSquads((prev) => prev.filter((s) => s.id !== squadId));
  };

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!instituteName.trim()) {
      displayError('Please select your College / University.');
      return;
    }
    if (!leaderName.trim() || !leaderEmail.trim() || !leaderPhone.trim()) {
      displayError('Please complete the Delegation Coordinator contact details.');
      return;
    }
    if (!leaderPhotoUrl) {
      displayError('Upload pictures of contingent/participant(s)');
      return;
    }
    if (cartSquads.length === 0) {
      displayError('Please add at least one Event Squad to the contingent cart before checking out.');
      return;
    }

    // Ensure all participants in cart squads have photos
    for (const squad of cartSquads) {
      for (const p of squad.participants) {
        if (!p.photoUrl) {
          displayError('Upload pictures of contingent/participant(s)');
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          instituteName: instituteName.trim(),
          leaderName: leaderName.trim(),
          leaderEmail: leaderEmail.trim(),
          leaderPhone: leaderPhone.trim(),
          leaderPhotoUrl,
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
            theme: { color: '#0f172a' },
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
        console.error('Contingent checkout failed:', err);
        setErrorMsg((err as Error).message || 'Checkout failed. Please retry.');
      }
    });
  };

  // SUCCESS SCREEN
  if (successResult) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6 animate-in fade-in-50">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900">College Contingent Confirmed!</h2>
          <p className="text-sm text-slate-600">
            {instituteName} has been successfully registered for ZEST 2026.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900">{successResult.registrationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Delegation Coordinator:</span>
            <span className="font-semibold text-slate-900">{leaderName} ({leaderPhone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Events Registered:</span>
            <span className="font-semibold text-slate-900">{cartSquads.length} Competition Squads</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Issued Passes:</span>
            <span className="font-bold text-emerald-600">{successResult.ticketsIssued.length} Student Passes</span>
          </div>
        </div>

        {/* Issued Student Passes List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Participant Passes Generated ({successResult.ticketsIssued.length})
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
            {successResult.ticketsIssued.map((t, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                <div>
                  <div className="font-semibold text-slate-900">{t.fullName}</div>
                  <div className="text-[11px] text-slate-500">{t.phone}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{t.ticketCode}</div>
                  <div className="text-[10px] text-slate-500">
                    {t.festivalDay === 'DAY_2' ? 'Day 2 Pass' : 'Day 1 Pass'}
                    {t.isReused && ' (Reused Pass)'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs text-center"
          >
            Register Another College Contingent
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition text-center"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCheckout} className="space-y-8">
      {/* Event Selection Modal */}
      <EventSelectModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        events={eventsList}
        selectedEventId={activeEventId}
        onSelectEvent={handleSelectEvent}
      />

      {/* Edit Squad Modal */}
      <EditCartSquadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSquad(null);
        }}
        squad={editingSquad}
        event={eventsList.find((e) => e.id === editingSquad?.eventId)}
        onSave={handleSaveEditedSquad}
      />

      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-700" />
            Inter-College Contingent Engine
          </span>
          <span className="text-xs text-slate-500 font-medium">Multi-Event Checkout</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          College Delegation &amp; Contingent Registration
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          Colleges can add multiple activities, teams, and participants in a single order. Campus entry fees follow the festival tiered policy: First 20 student entries from an institute on Oct 30 (Day 1) are <strong>₹100/person</strong>, subsequent entries are <strong>₹150/person</strong>. Oct 31 (Day 2) is <strong>₹150/person</strong>. Minimum delegation checkout is <strong>₹1,000</strong>.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Institution & Delegation Coordinator */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1 items-start">
          {/* Contingent Leader Photo Upload (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Leader Picture <span className="text-rose-500">*</span></span>
              {leaderPhotoUrl && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attached
                </span>
              )}
            </label>

            {leaderPhotoUrl ? (
              <div className="relative p-2.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 flex items-center gap-3">
                <img
                  src={leaderPhotoUrl}
                  alt="Contingent Leader"
                  className="w-14 h-14 rounded-xl object-cover border border-emerald-200 shrink-0 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">Photo Uploaded</span>
                  <label className="cursor-pointer text-[11px] font-semibold text-[#1a73e8] hover:underline block mt-0.5">
                    Change Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLeaderPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaderPhotoUrl('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove picture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer p-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-800 bg-slate-50 hover:bg-white transition flex flex-col items-center justify-center gap-1.5 text-center group">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 group-hover:border-slate-400 flex items-center justify-center text-slate-600 shadow-2xs transition">
                  {leaderPhotoCompressing ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-slate-700" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {leaderPhotoCompressing ? 'Compressing...' : 'Upload Leader Picture *'}
                </span>
                <span className="text-[10px] text-slate-400">Gate Pass & Badge ID</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLeaderPhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 3 Text Inputs: Name, Email, Phone (9 cols) */}
          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Event Squad Builder */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
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
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> Entry #1 = Team Leader
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Individual Event (Single)
            </span>
          )}
        </div>

        {/* Warning Callout for Student Mobile Numbers */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
          <Info className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
          <div>
            <strong>Personal Student Numbers Required:</strong> Every participant must enter their own personal 10-digit mobile number. Do <em>NOT</em> enter faculty or coordinator numbers for students. Day-wise entry QR passes are directly tied to each student&apos;s phone number.
          </div>
        </div>

        {/* Event / Activity Selection Button & Card (Modal Trigger) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Selected Competition / Activity <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="text-xs font-bold text-[#1a73e8] hover:text-[#1557b0] flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Browse All Competitions ({competitiveList.length})</span>
            </button>
          </div>

          {activeEvent ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {activeEvent.category}
                  </span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    {activeEvent.date?.includes('2') || activeEvent.date?.includes('31') ? 'Festival Day 2' : 'Festival Day 1'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{activeEvent.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>
                      {activeEvent.minTeamSize === 1 && activeEvent.maxTeamSize === 1
                        ? 'Solo (1 Attendee)'
                        : `Team (${activeEvent.minTeamSize} – ${activeEvent.maxTeamSize} members)`}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Venue: {activeEvent.venue || "Lingaya's Campus"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Standard Event Fee</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {activeEvent.feeAmount === 0 ? 'FREE' : `₹${Math.round(activeEvent.feeAmount / 100)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Event</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-800 text-slate-600 hover:text-slate-900 transition flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-white"
            >
              <PlusCircle className="w-6 h-6 text-slate-400" />
              <span className="text-sm font-bold">Click here to Select a Competition or Activity</span>
              <span className="text-xs text-slate-400">Choose from Dance, Music, Theatre, Literary, Gaming or Fashion</span>
            </button>
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
              <span>
                {currentParticipants.length} of {activeEvent.maxTeamSize} max (Min: {activeEvent.minTeamSize})
              </span>
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
                      ? idx === 0 ? 'Team Leader Full Name *' : 'Member Full Name *'
                      : 'Participant Full Name *'
                  }
                  value={p.fullName}
                  onChange={(e) => {
                    const copy = [...currentParticipants];
                    copy[idx].fullName = e.target.value;
                    setCurrentParticipants(copy);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
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
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Photo Upload & Delete Action */}
              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <label
                  title={p.photoUrl ? 'Photo uploaded (click to replace)' : 'Upload participant photo *'}
                  className={`cursor-pointer px-2.5 py-1.5 rounded-xl border transition shadow-2xs flex items-center gap-1.5 ${
                    p.photoUrl
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                  }`}
                >
                  <Camera className={`w-3.5 h-3.5 ${p.photoUrl ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold">
                    {p.photoUrl ? 'Photo ✓' : 'Photo *'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(idx, e)}
                    className="hidden"
                  />
                </label>

                {isTeamEvent && idx > 0 && idx >= (activeEvent.minTeamSize || 2) && (
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

          {/* Add Member Button - Only for Team Events that allow more members than currently added! */}
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
              <UserPlus className="w-3.5 h-3.5 text-slate-800" />
              <span>
                Add Another Member ({currentParticipants.length}/{activeEvent.maxTeamSize} max)
              </span>
            </button>
          )}

          {/* Fixed Team Size Notice if min equals max */}
          {isTeamEvent && activeEvent.minTeamSize === activeEvent.maxTeamSize && (
            <div className="text-[11px] text-slate-500 text-center py-1 font-medium">
              Team size for &ldquo;{activeEvent.title}&rdquo; is fixed at exactly {activeEvent.minTeamSize} members.
            </div>
          )}

          {/* Push Squad into Cart */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddSquadToCart}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition"
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
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contingent Cart &amp; Pricing Summary</h2>
              <p className="text-xs text-slate-500">Review added entries and verified campus entry pricing.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <ShoppingCart className="w-3.5 h-3.5 text-slate-800" />
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
                      <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSquad(squad)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                      title="View and edit participant details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">View / Edit Details</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSquad(squad.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                      title="Remove event from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                  {isCalculating && <span className="text-slate-600 font-semibold animate-pulse">Calculating...</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Unique Students</div>
                    <div className="text-lg font-extrabold text-slate-900">{pricing.totalUniqueParticipants}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Day 1 Passes</div>
                    <div className="text-lg font-extrabold text-slate-900">{pricing.day1ParticipantsCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Day 2 Passes</div>
                    <div className="text-lg font-extrabold text-slate-900">{pricing.day2ParticipantsCount}</div>
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
                    <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
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
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-base shadow-xs flex items-center justify-center gap-2 transition"
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
