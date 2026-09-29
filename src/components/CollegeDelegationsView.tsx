'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Crown,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  Image as ImageIcon,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface Participant {
  id: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  isTeamLeader: boolean;
  festivalDay: string | null;
  ticketCode: string | null;
  createdAt: string;
}

interface EventRoster {
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventDate: string | null;
  participantsCount: number;
  participants: Participant[];
}

interface CollegeRegistrationItem {
  id: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  totalAmountInr: number;
  paymentStatus: string;
  paymentMethod: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  events: EventRoster[];
}

interface CollegeDelegation {
  instituteName: string;
  totalRegistrations: number;
  paidRegistrations: number;
  totalRevenueInr: number;
  totalUniqueParticipants: number;
  registrations: CollegeRegistrationItem[];
}

export default function CollegeDelegationsView() {
  const [delegations, setDelegations] = useState<CollegeDelegation[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const fetchDelegations = () => {
    setIsLoading(true);
    fetch('/api/admin/college-registrations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.delegations)) {
          setDelegations(data.delegations);
          // Auto-expand first college if exists
          if (data.delegations.length > 0 && selectedCollege === 'ALL') {
            setSelectedCollege(data.delegations[0].instituteName);
          }
        }
      })
      .catch((err) => console.error('Failed to load college delegations:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDelegations();
  }, []);

  const toggleEventAccordion = (key: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter colleges
  const filteredColleges = delegations.filter((d) =>
    d.instituteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCollegeData = delegations.find((d) => d.instituteName === selectedCollege);

  // Overall metrics across all colleges
  const totalInstitutesCount = delegations.length;
  const totalDelegationsCount = delegations.reduce((acc, d) => acc + d.totalRegistrations, 0);
  const totalStudentsCount = delegations.reduce((acc, d) => acc + d.totalUniqueParticipants, 0);
  const totalRevenueAll = delegations.reduce((acc, d) => acc + d.totalRevenueInr, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Institutions
          </div>
          <div className="text-2xl font-black text-white">{totalInstitutesCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Contingents
          </div>
          <div className="text-2xl font-black text-white">{totalDelegationsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Delegates
          </div>
          <div className="text-2xl font-black text-indigo-300">{totalStudentsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            Total Revenue
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{totalRevenueAll.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* College Selection Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Select College / Institution
          </label>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            {delegations.map((d) => (
              <option key={d.instituteName} value={d.instituteName}>
                {d.instituteName} ({d.totalUniqueParticipants} students • ₹{d.totalRevenueInr})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchDelegations}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Roster Body */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading College Delegations...</p>
        </div>
      ) : delegations.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">No College Delegations Registered Yet</div>
          <p className="text-xs text-slate-500">
            When institutes submit registrations via the College Portal, their drilldowns will appear here.
          </p>
        </div>
      ) : activeCollegeData ? (
        <div className="space-y-4">
          {/* Active College Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Participating Institution
              </span>
              <h3 className="text-xl font-extrabold text-white">{activeCollegeData.instituteName}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span>Unique Attendees: <strong className="text-white">{activeCollegeData.totalUniqueParticipants}</strong></span>
                <span>•</span>
                <span>Contingent Orders: <strong className="text-white">{activeCollegeData.totalRegistrations}</strong></span>
                <span>•</span>
                <span>Paid Revenue: <strong className="text-emerald-400">₹{activeCollegeData.totalRevenueInr}</strong></span>
              </div>
            </div>
          </div>

          {/* Registrations List for this College */}
          <div className="space-y-4">
            {activeCollegeData.registrations.map((reg, regIdx) => (
              <div
                key={reg.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm"
              >
                {/* Team Leader & Order Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{reg.leaderName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Contingent Leader
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {reg.leaderPhone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {reg.leaderEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-400">₹{reg.totalAmountInr}</div>
                      <div className="text-[10px] text-slate-500">
                        {reg.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Paid Online
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">{reg.paymentStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Events Participated in this Contingent */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Events &amp; Activities Participated ({reg.events.length})
                  </div>

                  <div className="space-y-2.5">
                    {reg.events.map((evRoster, evIdx) => {
                      const accordionKey = `${reg.id}_${evRoster.eventId}`;
                      const isExpanded = expandedEvents[accordionKey] ?? true;

                      return (
                        <div
                          key={evRoster.eventId}
                          className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden"
                        >
                          {/* Event Accordion Header */}
                          <button
                            type="button"
                            onClick={() => toggleEventAccordion(accordionKey)}
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-white">{evRoster.eventTitle}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {evRoster.eventCategory}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                • {evRoster.eventDate || 'Fest Day'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-400">
                                {evRoster.participantsCount} Participant(s)
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Participant Roster */}
                          {isExpanded && (
                            <div className="border-t border-slate-800/80 divide-y divide-slate-800/40 bg-slate-950/60">
                              {evRoster.participants.map((p, pIdx) => (
                                <div
                                  key={p.id}
                                  className={`p-3 flex items-center justify-between text-xs ${
                                    p.isTeamLeader ? 'bg-indigo-950/20' : ''
                                  }`}
                                >
                                  {/* Left: Avatar + Details */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                                      {p.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={p.photoUrl}
                                          alt={p.fullName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <ImageIcon className="w-4 h-4" />
                                      )}
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{p.fullName}</span>
                                        {p.isTeamLeader && evRoster.participantsCount > 1 && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5" /> Team Leader
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span>{p.phone}</span>
                                        <span>•</span>
                                        <span>{evRoster.eventTitle}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Pass Details */}
                                  <div className="text-right space-y-0.5">
                                    <div className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                                      <QrCode className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{p.ticketCode || 'Pass Pending'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {p.festivalDay === 'DAY_2' ? 'Day 2 Pass' : 'Day 1 Pass'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
