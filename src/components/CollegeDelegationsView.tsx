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
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-700" />
            Institutions
          </div>
          <div className="text-2xl font-black text-slate-900">{totalInstitutesCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-slate-700" />
            Contingents
          </div>
          <div className="text-2xl font-black text-slate-900">{totalDelegationsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-slate-700" />
            Delegates
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudentsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            Total Revenue
          </div>
          <div className="text-2xl font-black text-emerald-700">₹{totalRevenueAll.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* College Selection Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Select College / Institution
          </label>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={fetchDelegations}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Roster Body */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading College Delegations...</p>
        </div>
      ) : delegations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-900">No College Delegations Registered Yet</div>
          <p className="text-xs text-slate-500">
            When institutes submit registrations via the College Portal, their drilldowns will appear here.
          </p>
        </div>
      ) : activeCollegeData ? (
        <div className="space-y-4">
          {/* Active College Header Banner */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Participating Institution
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{activeCollegeData.instituteName}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span>Unique Attendees: <strong className="text-slate-900">{activeCollegeData.totalUniqueParticipants}</strong></span>
                <span>•</span>
                <span>Contingent Orders: <strong className="text-slate-900">{activeCollegeData.totalRegistrations}</strong></span>
                <span>•</span>
                <span>Paid Revenue: <strong className="text-emerald-700">₹{activeCollegeData.totalRevenueInr}</strong></span>
              </div>
            </div>
          </div>

          {/* Registrations List for this College */}
          <div className="space-y-4">
            {activeCollegeData.registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs"
              >
                {/* Team Leader & Order Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{reg.leaderName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                          Contingent Leader
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {reg.leaderPhone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {reg.leaderEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-700">₹{reg.totalAmountInr}</div>
                      <div className="text-[10px] text-slate-500">
                        {reg.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid Online
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">{reg.paymentStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Events Participated in this Contingent */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Events &amp; Activities Participated ({reg.events.length})
                  </div>

                  <div className="space-y-2.5">
                    {reg.events.map((evRoster) => {
                      const accordionKey = `${reg.id}_${evRoster.eventId}`;
                      const isExpanded = expandedEvents[accordionKey] ?? true;

                      return (
                        <div
                          key={evRoster.eventId}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          {/* Event Accordion Header */}
                          <button
                            type="button"
                            onClick={() => toggleEventAccordion(accordionKey)}
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-slate-900">{evRoster.eventTitle}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {evRoster.eventCategory}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                • {evRoster.eventDate || 'Fest Day'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500">
                                {evRoster.participantsCount} Participant(s)
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Participant Roster */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                              {evRoster.participants.map((p) => (
                                <div
                                  key={p.id}
                                  className={`p-3 flex items-center justify-between text-xs ${
                                    p.isTeamLeader ? 'bg-amber-50/30' : ''
                                  }`}
                                >
                                  {/* Left: Avatar + Details */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 border border-slate-200">
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
                                        <span className="font-semibold text-slate-900">{p.fullName}</span>
                                        {p.isTeamLeader && evRoster.participantsCount > 1 && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5" /> Team Leader
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{p.phone}</span>
                                        <span>•</span>
                                        <span>{evRoster.eventTitle}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Pass Details */}
                                  <div className="text-right space-y-0.5">
                                    <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1 justify-end">
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
