'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Trophy,
  MapPin,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

export interface EventSelectorGridProps {
  events: InitialEventData[];
  selectedEventId?: string;
  onSelectEvent: (event: InitialEventData) => void;
  showStepHeader?: boolean;
  stepLabel?: string;
  title?: string;
  subtitle?: string;
  maxHeightClass?: string;
  excludeCategory?: string;
  hideHeader?: boolean;
}

export default function EventSelectorGrid({
  events,
  selectedEventId,
  onSelectEvent,
  showStepHeader = true,
  stepLabel = 'STEP 1 OF 2',
  title = 'Choose Competition or Arena',
  subtitle,
  maxHeightClass = 'max-h-[460px]',
  excludeCategory = 'informalz',
  hideHeader = false,
}: EventSelectorGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter out excluded categories (like Informalz by default for competitive selection)
  const competitiveEvents = useMemo(() => {
    return events.filter((e) => {
      if (excludeCategory && e.category.toLowerCase() === excludeCategory.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [events, excludeCategory]);

  // Extract distinct categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    competitiveEvents.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [competitiveEvents]);

  // Filtered by category and search
  const filteredEvents = useMemo(() => {
    return competitiveEvents.filter((e) => {
      const matchCategory =
        selectedCategory === 'ALL' ||
        e.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch =
        !searchQuery.trim() ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [competitiveEvents, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            {showStepHeader && stepLabel && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8] block mb-0.5">
                {stepLabel}
              </span>
            )}
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {competitiveEvents.length} Competitive Events
            </span>
          </div>
        </div>
      )}

      {/* Category Filter Chips & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none flex-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? 'All Competitive' : cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search event or arena..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${maxHeightClass} overflow-y-auto pr-1`}
      >
        {filteredEvents.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            No competitions match &ldquo;{searchQuery}&rdquo; in this category.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = evt.id === selectedEventId;
            const isSolo = evt.minTeamSize === 1 && evt.maxTeamSize === 1;

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
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
                      {evt.feeAmount === 0 ? 'FREE' : `₹${Math.round(evt.feeAmount / 100)}`}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 leading-snug mb-1">
                    {evt.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">
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
                  <span className="text-slate-500 font-medium truncate pr-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{evt.venue || "Lingaya's Campus"}</span>
                  </span>

                  <span
                    className={`font-semibold shrink-0 flex items-center gap-1 ${
                      isSelected ? 'text-[#1a73e8]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a73e8]" />
                        <span>Selected</span>
                      </>
                    ) : (
                      'Select'
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
