'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Music,
  ExternalLink,
  Plus,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Mic2,
  Volume2,
  X,
  Filter,
} from 'lucide-react';

export interface StagePerformerRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventType: string;
  venue: string;
  date: string;
  feeAmount: number;
  dayOption?: string | null;
  trackUploadUrl?: string | null;
  trackNotes?: string | null;
  hasTrack: boolean;
  leadName: string;
  leadEmail: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
    fullName: string;
    checkedInAt?: string | null;
  }>;
}

export interface TrackEventOption {
  id: string;
  title: string;
  category: string;
  venue?: string;
  date?: string;
}

interface StageRegistrationsManagerProps {
  apiEndpoint?: string;
  title?: string;
  subtitle?: string;
  allowEdit?: boolean;
}

export default function StageRegistrationsManager({
  apiEndpoint = '/api/stage/tracks',
  title = 'Stage & AV Sound Console',
  subtitle = 'Strict roster of all performers registered for track-required events with live audio cues.',
  allowEdit = true,
}: StageRegistrationsManagerProps) {
  const [registrations, setRegistrations] = useState<StagePerformerRow[]>([]);
  const [trackEvents, setTrackEvents] = useState<TrackEventOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [trackStatusFilter, setTrackStatusFilter] = useState<'ALL' | 'ATTACHED' | 'MISSING'>('ALL');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Manual Track Add / Edit
  const [activeModalReg, setActiveModalReg] = useState<StagePerformerRow | null>(null);
  const [modalTrackUrl, setModalTrackUrl] = useState<string>('');
  const [modalTrackNotes, setModalTrackNotes] = useState<string>('');
  const [isSavingTrack, setIsSavingTrack] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick "+ Manual Performer Track" modal selector
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickSelectedRegId, setQuickSelectedRegId] = useState<string>('');

  useEffect(() => {
    fetchStageTracks();
  }, [apiEndpoint]);

  const fetchStageTracks = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(apiEndpoint);
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
        if (data.trackEvents) {
          setTrackEvents(data.trackEvents);
        }
      }
    } catch (err) {
      console.error('Failed to load stage registrations:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Open Edit Modal for a specific performer
  const handleOpenEditModal = (reg: StagePerformerRow) => {
    setActiveModalReg(reg);
    setModalTrackUrl(reg.trackUploadUrl || '');
    setModalTrackNotes(reg.trackNotes || '');
    setModalError(null);
  };

  const handleCloseModal = () => {
    setActiveModalReg(null);
    setModalTrackUrl('');
    setModalTrackNotes('');
    setModalError(null);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReg) return;

    setIsSavingTrack(true);
    setModalError(null);

    try {
      const res = await fetch('/api/stage/tracks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: activeModalReg.id,
          trackUploadUrl: modalTrackUrl.trim() || null,
          trackNotes: modalTrackNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update track link');
      }

      // Optimistic state update
      setRegistrations((prev) =>
        prev.map((r) => {
          if (r.id === activeModalReg.id) {
            const hasNewTrack = !!(modalTrackUrl.trim() !== '');
            return {
              ...r,
              trackUploadUrl: modalTrackUrl.trim() || null,
              trackNotes: modalTrackNotes.trim() || null,
              hasTrack: hasNewTrack,
            };
          }
          return r;
        })
      );

      setSuccessToast(`Track link updated for ${activeModalReg.leadName}!`);
      setTimeout(() => setSuccessToast(null), 4000);
      handleCloseModal();
    } catch (err) {
      setModalError((err as Error).message || 'Failed to save track.');
    } finally {
      setIsSavingTrack(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyTrackUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered registrations
  const filtered = registrations.filter((r) => {
    const matchesEvent = selectedEventId === 'ALL' || r.eventId === selectedEventId;
    const matchesTrackStatus =
      trackStatusFilter === 'ALL' ||
      (trackStatusFilter === 'ATTACHED' && r.hasTrack) ||
      (trackStatusFilter === 'MISSING' && !r.hasTrack);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.leadName.toLowerCase().includes(q) ||
      r.leadEmail.toLowerCase().includes(q) ||
      r.eventTitle.toLowerCase().includes(q) ||
      (r.trackNotes && r.trackNotes.toLowerCase().includes(q)) ||
      (r.trackUploadUrl && r.trackUploadUrl.toLowerCase().includes(q)) ||
      r.tickets.some((t) => t.ticketCode.toLowerCase().includes(q)) ||
      r.teamMembers.some((m) => m.fullName.toLowerCase().includes(q));

    return matchesEvent && matchesTrackStatus && matchesSearch;
  });

  // Export Cue Sheet to CSV
  const handleExportCueSheet = () => {
    if (registrations.length === 0) return;

    const headers = [
      'Performer / Lead Name',
      'Event Name',
      'Category',
      'Venue',
      'Date/Time',
      'Team Members Count',
      'Track Status',
      'Audio Track URL',
      'Stage AV / Lighting Cues',
      'Ticket Code',
      'Gate Check-in Status',
      'Lead Contact Email',
    ];

    const rows = filtered.map((r) => [
      `"${r.leadName.replace(/"/g, '""')}"`,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.eventCategory}"`,
      `"${r.venue}"`,
      `"${r.date}"`,
      1 + r.teamMembers.length,
      r.hasTrack ? 'TRACK_ATTACHED' : 'TRACK_MISSING',
      `"${(r.trackUploadUrl || '').replace(/"/g, '""')}"`,
      `"${(r.trackNotes || '').replace(/"/g, '""')}"`,
      `"${r.tickets.map((t) => t.ticketCode).join(', ')}"`,
      `"${r.tickets.some((t) => t.status === 'CHECKED_IN') ? 'CHECKED_IN' : 'PENDING'}"`,
      `"${r.leadEmail}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stage_cue_sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attachedCount = registrations.filter((r) => r.hasTrack).length;
  const missingCount = registrations.filter((r) => !r.hasTrack).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Mic2 className="w-3 h-3 text-amber-600" />
              Strictly Track Events ({filtered.length})
            </span>
            <span className="text-xs text-slate-500 font-medium">Stage Audio &amp; Lighting Queue</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchStageTracks(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh track registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <a
            href="https://drive.google.com/drive/folders/1ORiYoFawuMWA0fOST-qfO2uBvEEZxTOE?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
          >
            <Music className="w-3.5 h-3.5 text-amber-700" />
            <span>Stage Google Drive</span>
            <ExternalLink className="w-3 h-3 text-amber-600" />
          </a>

          {allowEdit && (
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Track Add</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCueSheet}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Cue Sheet (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Switcher Tabs */}
      <div className="space-y-3 pt-2">
        {/* Track Status Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTrackStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              trackStatusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Performers ({registrations.length})
          </button>

          <button
            type="button"
            onClick={() => setTrackStatusFilter('ATTACHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              trackStatusFilter === 'ATTACHED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tracks Attached ({attachedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTrackStatusFilter('MISSING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              trackStatusFilter === 'MISSING'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tracks Missing ({missingCount})</span>
          </button>
        </div>

        {/* Search & Event Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search performer, song title, sound cues, ticket code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:border-[#1a73e8]"
            >
              <option value="ALL">All Track Events ({trackEvents.length})</option>
              {trackEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          <Music className="w-6 h-6 text-amber-500 animate-bounce mx-auto mb-2" />
          Loading stage track roster...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs space-y-2">
          <Volume2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No performers found matching this filter.</p>
          <p className="text-[11px] text-slate-400">
            {trackStatusFilter === 'MISSING'
              ? 'Great news! All performers currently registered have submitted audio tracks.'
              : 'Try clearing your search query or selecting "All Track Events".'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Performer / Team</th>
                <th className="py-3 px-3">Event &amp; Venue</th>
                <th className="py-3 px-3 min-w-[260px]">Audio Track &amp; Sound Cues</th>
                <th className="py-3 px-3">Gate Pass</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((reg) => (
                <tr key={reg.id} className="hover:bg-amber-50/20 transition-colors">
                  {/* 1. Performer Details */}
                  <td className="py-3.5 px-3 align-top">
                    <span className="font-bold text-slate-900 block text-sm">{reg.leadName}</span>
                    <span className="text-[11px] text-slate-500 block">{reg.leadEmail}</span>
                    {reg.teamMembers.length > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {reg.teamMembers.length + 1} performers in crew
                      </span>
                    )}
                  </td>

                  {/* 2. Event & Stage Info */}
                  <td className="py-3.5 px-3 align-top">
                    <span className="font-bold text-slate-800 block">{reg.eventTitle}</span>
                    <span className="text-[10px] text-slate-500 block mb-1">
                      {reg.eventCategory}
                    </span>
                    <div className="space-y-0.5 text-[11px] text-slate-600">
                      {reg.venue && (
                        <p className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{reg.venue}</span>
                        </p>
                      )}
                      {reg.date && (
                        <p className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{reg.date}</span>
                        </p>
                      )}
                    </div>
                  </td>

                  {/* 3. Audio Track & Stage Cues */}
                  <td className="py-3.5 px-3 align-top">
                    {reg.hasTrack && reg.trackUploadUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={
                              reg.trackUploadUrl.startsWith('http')
                                ? reg.trackUploadUrl
                                : `https://${reg.trackUploadUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors shadow-2xs"
                          >
                            <Music className="w-3.5 h-3.5 text-amber-700" />
                            <span>Open Audio Track</span>
                            <ExternalLink className="w-3 h-3 text-amber-600" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyTrackUrl(reg.trackUploadUrl!, reg.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Copy track URL"
                          >
                            {copiedId === reg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ready
                          </span>
                        </div>

                        {/* Stage Notes / Sound Cues */}
                        {reg.trackNotes ? (
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                            <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-amber-600" />
                              Audio / Stage Cues:
                            </span>
                            <p className="italic text-slate-800 leading-snug">
                              &quot;{reg.trackNotes}&quot;
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block">
                            No special sound cues provided.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Track Missing / Not Uploaded</span>
                        </div>

                        {allowEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(reg)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-2xs block"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Track Now</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 4. Gate Pass & Check-In */}
                  <td className="py-3.5 px-3 align-top">
                    <div className="space-y-1">
                      {reg.tickets.map((t) => (
                        <div
                          key={t.ticketCode}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                            t.status === 'CHECKED_IN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{t.ticketCode}</span>
                          {t.status === 'CHECKED_IN' ? (
                            <span className="text-[10px] font-bold text-emerald-700">(In Venue)</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">(Gate Pending)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* 5. Row Actions */}
                  <td className="py-3.5 px-3 align-top text-right space-y-1">
                    {allowEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(reg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        title="Edit or add track link"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>{reg.hasTrack ? 'Edit Track' : 'Add Track'}</span>
                      </button>
                    )}

                    <div className="mt-1">
                      <Link
                        href={`/tickets/${reg.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] hover:underline"
                      >
                        <span>Pass</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎵 MODAL: ADD / EDIT PERFORMER TRACK LINK */}
      {/* ========================================================================= */}
      {activeModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Music className="w-3 h-3 text-amber-700" />
                Stage Audio Desk
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {activeModalReg.hasTrack ? 'Update Stage Track & Cues' : 'Manually Add Stage Track'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Performer: <strong className="text-slate-800">{activeModalReg.leadName}</strong> • {activeModalReg.eventTitle}
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveTrack} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Audio Track Link (Google Drive / YouTube / Cloud URL)
                </label>
                <input
                  type="url"
                  required
                  value={modalTrackUrl}
                  onChange={(e) => setModalTrackUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ensure Google Drive permissions are set to &quot;Anyone with the link can view&quot;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sound Cues &amp; Stage AV Instructions
                </label>
                <textarea
                  rows={3}
                  value={modalTrackNotes}
                  onChange={(e) => setModalTrackNotes(e.target.value)}
                  placeholder="e.g. Song title: 'Despacito' • Start at 0:15 after MC introduces performer • Fade out at 3:30 • Stage Lighting: Warm amber spotlight"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingTrack || !modalTrackUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{isSavingTrack ? 'Saving...' : 'Save Track Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 QUICK SELECTOR MODAL: "+ Manual Track Add" */}
      {/* ========================================================================= */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => {
                setIsQuickAddOpen(false);
                setQuickSelectedRegId('');
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                <Plus className="w-3 h-3 text-blue-700" />
                Select Performer
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Manual Track Entry Desk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a registered track-event participant to attach or update their audio track.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Registered Performer
                </label>
                <select
                  value={quickSelectedRegId}
                  onChange={(e) => setQuickSelectedRegId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium focus:border-blue-500"
                >
                  <option value="" disabled>
                    — Choose Performer / Registration —
                  </option>
                  {registrations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.leadName} — {r.eventTitle} ({r.hasTrack ? 'Track Present' : 'Track Missing'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    setQuickSelectedRegId('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!quickSelectedRegId}
                  onClick={() => {
                    const matched = registrations.find((r) => r.id === quickSelectedRegId);
                    if (matched) {
                      setIsQuickAddOpen(false);
                      setQuickSelectedRegId('');
                      handleOpenEditModal(matched);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  <span>Proceed to Track Entry</span>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
