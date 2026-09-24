'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Filter, Trophy, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';
import EventCard from '@/components/EventCard';

interface EventCatalogSectionProps {
  initialEvents: InitialEventData[];
}

export default function EventCatalogSection({ initialEvents }: EventCatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'ALL', label: 'All Arenas' },
    { id: 'CULTURAL', label: 'Cultural & Stage' },
    { id: 'INFORMALZ', label: 'Informalz (100% Free)' },
    { id: 'LITERARY', label: 'Literary & Quizzing' },
    { id: 'GAMING', label: 'E-Sports & Gaming' },
  ];

  const filteredEvents = initialEvents.filter((evt) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      evt.title.toLowerCase().includes(q) ||
      evt.category.toLowerCase().includes(q) ||
      (evt.description && evt.description.toLowerCase().includes(q)) ||
      (evt.venue && evt.venue.toLowerCase().includes(q));

    let matchesCategory = true;
    if (selectedCategory === 'CULTURAL') {
      matchesCategory = evt.category.toLowerCase().startsWith('cultural');
    } else if (selectedCategory === 'INFORMALZ') {
      matchesCategory = evt.category.toLowerCase() === 'informalz';
    } else if (selectedCategory === 'LITERARY') {
      matchesCategory = evt.category.toLowerCase() === 'literary';
    } else if (selectedCategory === 'GAMING') {
      matchesCategory = evt.category.toLowerCase() === 'gaming';
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, bands, dance..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Grid of Event Cards */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-400 text-xs space-y-2">
          <p className="font-semibold text-slate-300">No events found matching your filter.</p>
          <p className="text-[11px] text-slate-500">
            Try searching with a different term or choose &quot;All Arenas&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
