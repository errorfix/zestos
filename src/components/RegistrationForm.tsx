'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
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
  Camera,
  Phone,
  Mail,
  GraduationCap,
  User,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { InitialEventData, STAGE_GOOGLE_DRIVE_FOLDER } from '@/lib/mockEvents';
import {
  saveRegistrationDraft,
  loadRegistrationDraft,
  clearRegistrationDraft,
  TeamMemberDraft,
} from '@/lib/storage';
import { compressAndStripExif } from '@/lib/imageCompressor';

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

  // Group informalz into Day 1 vs Day 2
  const informalzDay1 = informalzEvents.filter(
    (e) => (e.date || '').toLowerCase().includes('day 1') || (e.date || '').includes('1')
  );
  const informalzDay2 = informalzEvents.filter(
    (e) => (e.date || '').toLowerCase().includes('day 2') || (e.date || '').includes('2')
  );

  // Determine initial mode (Informalz vs Competitive)
  const [registrationMode, setRegistrationMode] = useState<'COMPETITIVE' | 'INFORMALZ'>(() => {
    const catParam = searchParams.get('category');
    if (catParam?.toLowerCase() === 'informalz') return 'INFORMALZ';
    const match = events.find((e) => e.id === queryEventId);
    return match?.category.toLowerCase() === 'informalz' ? 'INFORMALZ' : 'COMPETITIVE';
  });

  // Informalz Multi-Select State
  const [selectedInformalIds, setSelectedInformalIds] = useState<string[]>(() => {
    const match = events.find((e) => e.id === queryEventId);
    if (match?.category.toLowerCase() === 'informalz') return [match.id];
    return informalzEvents.slice(0, 2).map((e) => e.id);
  });

  const [informalTab, setInformalTab] = useState<'ALL' | 'DAY_1' | 'DAY_2'>('ALL');

  const toggleInformalEvent = (id: string) => {
    setSelectedInformalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllInformal = () => {
    setSelectedInformalIds(informalzEvents.map((e) => e.id));
  };

  const selectDay1Only = () => {
    setSelectedInformalIds(informalzDay1.map((e) => e.id));
  };

  const selectDay2Only = () => {
    setSelectedInformalIds(informalzDay2.map((e) => e.id));
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

  const [trackUploadUrl, setTrackUploadUrl] = useState<string>('');
  const [trackNotes, setTrackNotes] = useState<string>('');

  // ─────────────────────────────────────────────────────────────────────────
  // 4 MANDATORY REGISTRATION COLUMNS + PARTICIPANT PHOTO
  // ─────────────────────────────────────────────────────────────────────────
  const [leadName, setLeadName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [college, setCollege] = useState<string>("Lingaya's Vidyapeeth");
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoCompressing, setPhotoCompressing] = useState<boolean>(false);
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMemberDraft[]>([]);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [draftSavedTimestamp, setDraftSavedTimestamp] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // ─────────────────────────────────────────────────────────────────────────
  // 🎯 LIVE INFORMALZ TIERED DAY PASS PRICING
  // Day 1 events only = ₹150
  // Day 2 events only = ₹150
  // Both Days events = ₹250
  // ─────────────────────────────────────────────────────────────────────────
  const calculateInformalzPricing = () => {
    if (selectedInformalIds.length === 0) {
      return { amount: 0, tier: 'NONE', label: 'Select Activities to Calculate Pass' };
    }

    const selectedEvents = informalzEvents.filter((e) => selectedInformalIds.includes(e.id));
    let hasDay1 = false;
    let hasDay2 = false;

    for (const evt of selectedEvents) {
      const d = (evt.date || '').toLowerCase();
      if (d.includes('day 1') || d.includes('1')) hasDay1 = true;
      if (d.includes('day 2') || d.includes('2')) hasDay2 = true;
      if (!d.includes('day 1') && !d.includes('day 2')) hasDay1 = true; // default
    }

    if (hasDay1 && hasDay2) {
      return {
        amount: 250,
        tier: 'BOTH_DAYS',
        label: 'Both Days All-Access Pass (Oct 30 & Oct 31)',
      };
    } else if (hasDay2) {
      return {
        amount: 150,
        tier: 'DAY_2',
        label: 'Day 2 Pass (Oct 31)',
      };
    } else {
      return {
        amount: 150,
        tier: 'DAY_1',
        label: 'Day 1 Pass (Oct 30)',
      };
    }
  };

  const informalzPricing = calculateInformalzPricing();

  // Calculate live payable amount
  const calculateTotalFee = (): number => {
    if (registrationMode === 'INFORMALZ') {
      return informalzPricing.amount;
    }
    if (!currentEvent) return 0;
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
      if (draft.leadPhone) setLeadPhone(draft.leadPhone);
      if (draft.college) setCollege(draft.college);
      if (draft.photoUrl) setPhotoUrl(draft.photoUrl);
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
          next.push({ fullName: '', rollNumber: '', phone: '', college });
        }
        return next;
      }
      const maxAdditional = Math.max(0, currentEvent.maxTeamSize - 1);
      if (prev.length > maxAdditional) {
        return prev.slice(0, maxAdditional);
      }
      return prev;
    });
  }, [currentEvent, registrationMode, college]);

  // State persistence to localStorage
  useEffect(() => {
    if (selectedEventId || leadName || leadEmail || leadPhone || photoUrl) {
      saveRegistrationDraft({
        eventId: selectedEventId,
        leadName,
        leadEmail,
        leadPhone,
        college,
        photoUrl,
        teamMembers,
      });
    }
  }, [selectedEventId, leadName, leadEmail, leadPhone, college, photoUrl, teamMembers]);

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

  // Handle Photo Upload with EXIF & Metadata Stripping
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoCompressing(true);
    setErrorMessage(null);

    try {
      // Process on HTML5 Canvas: discards EXIF, GPS, camera metadata & compresses to ~35KB
      const compressedDataUrl = await compressAndStripExif(file, {
        maxWidth: 480,
        maxHeight: 600,
        quality: 0.82,
      });

      setPhotoUrl(compressedDataUrl);
      const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
      setPhotoSizeKb(Math.round(approxBytes / 1024));
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to process participant photo.');
    } finally {
      setPhotoCompressing(false);
    }
  };

  const handleDiscardDraft = () => {
    clearRegistrationDraft();
    setLeadName('');
    setLeadPhone('');
    setLeadEmail('');
    setCollege("Lingaya's Vidyapeeth");
    setPhotoUrl('');
    setPhotoSizeKb(null);
    setTrackUploadUrl('');
    setTrackNotes('');
    const requiredAdditional = Math.max(0, (currentEvent?.minTeamSize || 1) - 1);
    setTeamMembers(
      Array.from({ length: requiredAdditional }, () => ({
        fullName: '',
        rollNumber: '',
        phone: '',
        college: "Lingaya's Vidyapeeth",
      }))
    );
    setIsDraftRestored(false);
    setDraftSavedTimestamp(null);
  };

  const handleAddMember = () => {
    if (!currentEvent) return;
    const maxAdditional = currentEvent.maxTeamSize - 1;
    if (teamMembers.length < maxAdditional) {
      setTeamMembers([...teamMembers, { fullName: '', rollNumber: '', phone: '', college }]);
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

  // Unified Checkout Handler for Razorpay Modal & Staging Simulation
  const handleLaunchPayment = async (checkoutPayload: {
    eventId?: string;
    eventIds?: string[];
    leadName: string;
    leadPhone: string;
    leadEmail: string;
    college: string;
    photoUrl: string;
    trackUploadUrl?: string;
    trackNotes?: string;
    teamMembers?: TeamMemberDraft[];
  }) => {
    startTransition(async () => {
      try {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload),
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          let errorMsg = checkoutData.error || 'Failed to initialize checkout';
          if (checkoutData.details) {
            const fieldErrors = Object.keys(checkoutData.details)
              .filter((k) => k !== '_errors' && checkoutData.details[k]?._errors?.length)
              .map((k) => `${k}: ${checkoutData.details[k]._errors.join(', ')}`)
              .join(' | ');
            if (fieldErrors) errorMsg += ` (${fieldErrors})`;
          }
          throw new Error(errorMsg);
        }

        // 1. FREE Event Instant Pass Completion
        if (checkoutData.isFree) {
          clearRegistrationDraft();
          router.push(`/tickets/${checkoutData.registrationId}?autoDownload=true`);
          return;
        }

        const { registrationId, orderId, amount, isMock, keyId: returnedKeyId, eventTitle } =
          checkoutData;

        // 2. Paid Event: Open Live Razorpay or Staging Simulator
        const keyId = returnedKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
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
            description: `Pass Registration: ${eventTitle || 'Fest Entry Pass'}`,
            order_id: orderId,
            prefill: {
              name: checkoutPayload.leadName,
              email: checkoutPayload.leadEmail,
              contact: checkoutPayload.leadPhone,
            },
            notes: {
              college: checkoutPayload.college,
              payerName: checkoutPayload.leadName,
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
                  payerName: checkoutPayload.leadName,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                clearRegistrationDraft();
                // Pass autoDownload=true so passes are automatically saved upon return!
                router.push(`/tickets/${verifyData.registrationId}?autoDownload=true`);
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
              payerName: checkoutPayload.leadName,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            clearRegistrationDraft();
            router.push(`/tickets/${verifyData.registrationId}?autoDownload=true`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate 4 mandatory columns
    if (!leadName.trim()) {
      displayError('Full Name is required.');
      return;
    }
    const cleanPhone = leadPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      displayError('Please enter a valid 10-digit mobile contact number.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leadEmail.trim() || !emailRegex.test(leadEmail)) {
      displayError('Please enter a valid college email address (e.g. name@college.edu).');
      return;
    }
    if (!college.trim()) {
      displayError('College / Institute Name is required.');
      return;
    }
    if (!photoUrl) {
      displayError('Please upload a clear participant photo for your official gate badge ID.');
      return;
    }

    // ───────────────── INFORMALZ SUBMISSION ─────────────────
    if (registrationMode === 'INFORMALZ') {
      if (selectedInformalIds.length === 0) {
        displayError('Please select at least one Informalz event to participate in.');
        return;
      }

      await handleLaunchPayment({
        eventIds: selectedInformalIds,
        leadName: leadName.trim(),
        leadPhone: cleanPhone,
        leadEmail: leadEmail.trim(),
        college: college.trim(),
        photoUrl,
      });
      return;
    }

    // ───────────────── COMPETITIVE SUBMISSION ─────────────────
    if (!currentEvent) {
      displayError('Please select a competition or stage event.');
      return;
    }

    const requiredAdditional = Math.max(0, currentEvent.minTeamSize - 1);
    for (let i = 0; i < requiredAdditional; i++) {
      if (!teamMembers[i]?.fullName.trim()) {
        displayError(`Team Member #${i + 2} name is strictly required for ${currentEvent.title}.`);
        return;
      }
    }

    await handleLaunchPayment({
      eventId: currentEvent.id,
      leadName: leadName.trim(),
      leadPhone: cleanPhone,
      leadEmail: leadEmail.trim(),
      college: college.trim(),
      photoUrl,
      trackUploadUrl: currentEvent.requiresTrackUpload ? trackUploadUrl : undefined,
      trackNotes: currentEvent.requiresTrackUpload ? trackNotes : undefined,
      teamMembers: teamMembers.filter((m) => m.fullName.trim().length > 0),
    });
  };

  const totalPayableInr = calculateTotalFee();

  // Informalz filtered list based on tab
  const displayedInformalz =
    informalTab === 'DAY_1'
      ? informalzDay1
      : informalTab === 'DAY_2'
      ? informalzDay2
      : informalzEvents;

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
          <span>Competitive Arenas</span>
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
          <span>Informalz Day Passes</span>
          <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-extrabold">
            ₹150 / ₹250
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
        {/* 🎯 MODE 1: INFORMALZ MULTI-EVENT WITH DAY PASS PRICING */}
        {/* ========================================================================= */}
        {registrationMode === 'INFORMALZ' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    Informalz Day Pass Engine
                  </span>
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Day 1: ₹150 • Day 2: ₹150 • Both Days: ₹250
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Select Your Informal Games & Activities
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select as many games as you wish! Selecting any event on Day 1 charges <strong>₹150</strong>.
                  Selecting on Day 2 charges <strong>₹150</strong>. Selecting games across both days charges <strong>₹250</strong> flat.
                </p>
              </div>

              {/* Day Filter Pills */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInformalTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    informalTab === 'ALL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  All ({informalzEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInformalTab('DAY_1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    informalTab === 'DAY_1'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  Day 1 ({informalzDay1.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInformalTab('DAY_2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    informalTab === 'DAY_2'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  Day 2 ({informalzDay2.length})
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">Quick selection presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectDay1Only}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  Day 1 Pass (₹150)
                </button>
                <button
                  type="button"
                  onClick={selectDay2Only}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  Day 2 Pass (₹150)
                </button>
                <button
                  type="button"
                  onClick={selectAllInformal}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  Both Days All-Access (₹250)
                </button>
                <button
                  type="button"
                  onClick={clearAllInformal}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Informalz Multi-Select Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {displayedInformalz.map((evt) => {
                const isChecked = selectedInformalIds.includes(evt.id);
                const isDay2 = (evt.date || '').toLowerCase().includes('day 2') || (evt.date || '').includes('2');

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
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-md border ${
                            isDay2
                              ? 'text-purple-700 bg-purple-50 border-purple-200'
                              : 'text-blue-700 bg-blue-50 border-blue-200'
                          }`}
                        >
                          {isDay2 ? 'Day 2 (Oct 31)' : 'Day 1 (Oct 30)'}
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
                        {evt.venue || 'Campus Arena'}
                      </span>
                      <span className="font-semibold text-purple-700">
                        {evt.eventType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Informalz Dynamic Pricing Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
                  Active Pass Selection
                </span>
                <h4 className="text-base font-bold text-white">
                  {informalzPricing.label} ({selectedInformalIds.length} Games Selected)
                </h4>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-purple-200 block">Total Pass Fee</span>
                <span className="text-2xl font-black text-amber-300">
                  ₹{informalzPricing.amount}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 🏆 MODE 2: COMPETITIVE & STAGE EVENTS REGISTRATION */}
        {/* ========================================================================= */}
        {registrationMode === 'COMPETITIVE' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                  Step 1 of 2
                </span>
                <h2 className="text-xl font-bold text-slate-900">Choose Competition or Arena</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 self-start sm:self-auto">
                {competitiveEvents.length} Competitive Events
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
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

            {/* Stage Track Upload Notice if required */}
            {currentEvent?.requiresTrackUpload && (
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-700" />
                    <h4 className="text-sm font-bold text-purple-950">
                      Performance Soundtrack & Backstage Media
                    </h4>
                  </div>
                  <a
                    href={STAGE_GOOGLE_DRIVE_FOLDER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 underline"
                  >
                    <span>Upload to Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="trackUploadUrl"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Cloud / Drive Audio Link
                    </label>
                    <input
                      id="trackUploadUrl"
                      type="url"
                      value={trackUploadUrl}
                      onChange={(e) => setTrackUploadUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="trackNotes"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Track Cues / Song Title
                    </label>
                    <input
                      id="trackNotes"
                      type="text"
                      value={trackNotes}
                      onChange={(e) => setTrackNotes(e.target.value)}
                      placeholder="e.g. Start on stage entry"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* 📋 STEP: 4 MANDATORY REGISTRATION COLUMNS + PARTICIPANT PHOTO */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
              Mandatory Attendee Information
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              Participant Details & Gate Pass Identification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              All official entry passes are cryptographically linked to your photo and identity.
            </p>
          </div>

          {/* 📸 Photo Upload Component with EXIF & Metadata Stripping */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#1a73e8]" />
                <span>
                  Participant Photo ID <span className="text-red-500">*</span>
                </span>
              </label>
              {photoSizeKb && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> EXIF Stripped • {photoSizeKb} KB
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Badge */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt="Participant preview"
                      className="w-24 h-28 object-cover rounded-2xl border-2 border-[#1a73e8] shadow-md bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoSizeKb(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                    <User className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] font-semibold mt-1">Photo Badge</span>
                  </div>
                )}
              </div>

              {/* Uploader Input */}
              <div className="flex-1 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="participantPhoto"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoCompressing}
                  className="w-full p-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  {photoCompressing ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1a73e8]">
                      <span className="w-4 h-4 border-2 border-[#1a73e8]/30 border-t-[#1a73e8] rounded-full animate-spin" />
                      <span>Stripping EXIF metadata & compressing...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:text-[#1a73e8]">
                        <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-[#1a73e8]" />
                        <span>{photoUrl ? 'Replace Photo' : 'Upload Participant Photo'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Camera selfies, ID headshots, or passport photos accepted (auto-compressed & EXIF-cleaned).
                      </p>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 4 Required Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Name */}
            <div>
              <label htmlFor="leadName" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="leadName"
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>

            {/* 2. Contact No */}
            <div>
              <label htmlFor="leadPhone" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Contact No <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="leadPhone"
                type="tel"
                required
                maxLength={10}
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>

            {/* 3. Email ID */}
            <div>
              <label htmlFor="leadEmail" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Email ID <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="leadEmail"
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="student@college.edu.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>

            {/* 4. College Name */}
            <div>
              <label htmlFor="college" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  College Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="college"
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Lingaya's Vidyapeeth / University Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:border-[#1a73e8]"
              />
            </div>
          </div>

          {/* Team Members Roster (Competitive Team Events Only) */}
          {registrationMode === 'COMPETITIVE' &&
            currentEvent &&
            currentEvent.maxTeamSize > 1 && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1a73e8]" />
                      Team Members Roster ({1 + teamMembers.length} / {currentEvent.maxTeamSize})
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Minimum required team size: {currentEvent.minTeamSize} members.
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
                              Required
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs bg-white focus:border-[#1a73e8]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`tm_phone_${idx}`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Contact No <span className="text-slate-400">(Optional)</span>
                          </label>
                          <input
                            id={`tm_phone_${idx}`}
                            type="tel"
                            maxLength={10}
                            value={member.phone || ''}
                            onChange={(e) =>
                              handleMemberChange(idx, 'phone', e.target.value.replace(/\D/g, ''))
                            }
                            placeholder="Mobile number"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs bg-white focus:border-[#1a73e8]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>

        {/* ========================================================================= */}
        {/* 💳 PAYMENT & PASS SUBMISSION CARD */}
        {/* ========================================================================= */}
        <section
          className={`rounded-3xl p-6 sm:p-8 shadow-xl text-white ${
            registrationMode === 'INFORMALZ'
              ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950'
              : 'bg-slate-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
                {registrationMode === 'INFORMALZ'
                  ? 'Informalz Pass Summary'
                  : 'Competition Pass Summary'}
              </span>
              <h3 className="text-2xl font-bold mt-1">
                {registrationMode === 'INFORMALZ'
                  ? informalzPricing.label
                  : currentEvent?.title || 'Event Registration'}
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                Includes official portrait badge passes with instant auto-download and HMAC-SHA256 offline verification.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-sm text-slate-300 block">Total Payable Fee</span>
              <span className="text-3xl font-extrabold text-amber-300">
                ₹{totalPayableInr}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Lingaya&apos;s Vidyapeeth ZEST 2K26 • Instant QR Pass Auto-Download
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (registrationMode === 'INFORMALZ' && selectedInformalIds.length === 0)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 text-amber-300" />
                  <span>Pay ₹{totalPayableInr} & Get Pass</span>
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
