'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Users,
  UserPlus,
  Trash2,
  Camera,
  AlertCircle,
  Crown,
  Check,
  Calendar,
  MapPin,
  Tag,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';
import { compressAndStripExif } from '@/lib/imageCompressor';

export interface ParticipantItem {
  fullName: string;
  phone: string;
  photoUrl: string;
  isTeamLeader: boolean;
}

export interface CartSquad {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventType: string;
  eventDate: string | null;
  participants: ParticipantItem[];
}

interface EditCartSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  squad: CartSquad | null;
  event?: InitialEventData;
  onSave: (updatedSquad: CartSquad) => void;
}

export default function EditCartSquadModal({
  isOpen,
  onClose,
  squad,
  event,
  onSave,
}: EditCartSquadModalProps) {
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or squad changes
  useEffect(() => {
    if (squad) {
      setParticipants(
        squad.participants.map((p) => ({
          fullName: p.fullName,
          phone: p.phone,
          photoUrl: p.photoUrl,
          isTeamLeader: p.isTeamLeader,
        }))
      );
      setErrorMsg(null);
    }
  }, [squad, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !squad) return null;

  const isTeam =
    (event?.minTeamSize && event.minTeamSize > 1) ||
    (event?.maxTeamSize && event.maxTeamSize > 1) ||
    event?.eventType === 'Team' ||
    squad.eventType === 'Team';

  const minSize = isTeam ? Math.max(1, event?.minTeamSize || 2) : 1;
  const maxSize = isTeam ? Math.max(minSize, event?.maxTeamSize || 10) : 1;

  // Photo upload handler
  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressAndStripExif(file, { maxWidth: 400, maxHeight: 500, quality: 0.8 });
      setParticipants((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], photoUrl: compressedDataUrl };
        return copy;
      });
    } catch (err) {
      alert((err as Error).message || 'Failed to compress photo.');
    }
  };

  const handleAddMember = () => {
    if (participants.length >= maxSize) return;
    setParticipants((prev) => [
      ...prev,
      { fullName: '', phone: '', photoUrl: '', isTeamLeader: false },
    ]);
  };

  const handleRemoveMember = (idx: number) => {
    if (participants.length <= minSize) return;
    setParticipants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setErrorMsg(null);

    if (participants.length < minSize) {
      setErrorMsg(`"${squad.eventTitle}" requires at least ${minSize} participant(s).`);
      return;
    }
    if (participants.length > maxSize) {
      setErrorMsg(`"${squad.eventTitle}" allows a maximum of ${maxSize} participant(s).`);
      return;
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
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
      if (!p.photoUrl) {
        setErrorMsg('Upload pictures of contingent/participant(s)');
        return;
      }
    }

    // Ensure leader flag is consistent
    const updatedParticipants = participants.map((p, idx) => ({
      ...p,
      fullName: p.fullName.trim(),
      phone: p.phone.trim().replace(/\D/g, ''),
      isTeamLeader: isTeam && idx === 0,
    }));

    onSave({
      ...squad,
      participants: updatedParticipants,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                {squad.eventCategory}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                {isTeam ? `Team (${minSize}-${maxSize} Members)` : 'Solo (1 Attendee)'}
              </span>
              {event?.venue && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {event.venue}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Edit Contingent Squad: {squad.eventTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update participant legal names, contact numbers, or photos before checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Participant Form Fields */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {participants.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                {/* Role / Index Indicator */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  {isTeam && idx === 0 ? (
                    <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" />
                      Leader
                    </span>
                  ) : isTeam ? (
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Member #{idx + 1}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Participant
                    </span>
                  )}
                </div>

                {/* Full Legal Name */}
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name *"
                    value={p.fullName}
                    onChange={(e) => {
                      const copy = [...participants];
                      copy[idx].fullName = e.target.value;
                      setParticipants(copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                {/* Student Mobile */}
                <div className="sm:col-span-3">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit Mobile *"
                    value={p.phone}
                    onChange={(e) => {
                      const copy = [...participants];
                      copy[idx].phone = e.target.value.replace(/\D/g, '');
                      setParticipants(copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                {/* Photo Upload & Delete Actions */}
                <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                  <label
                    title={p.photoUrl ? 'Photo uploaded (click to replace)' : 'Upload participant photo *'}
                    className={`cursor-pointer px-2.5 py-1.5 rounded-xl border transition shadow-2xs flex items-center gap-1.5 ${
                      p.photoUrl
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100'
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

                  {isTeam && idx > 0 && participants.length > minSize && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 transition"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Button if below maxSize */}
          {isTeam && participants.length < maxSize && (
            <button
              type="button"
              onClick={handleAddMember}
              className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-800" />
              <span>
                Add Another Member ({participants.length}/{maxSize} max)
              </span>
            </button>
          )}

          {/* Fixed Team Size Notice */}
          {isTeam && minSize === maxSize && (
            <div className="text-[11px] text-slate-500 text-center py-1 font-medium">
              Team size for &ldquo;{squad.eventTitle}&rdquo; is fixed at exactly {minSize} members.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
