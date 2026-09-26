'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
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
    { id: 'INFORMALZ', label: 'Informalz Day Pass' },
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
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, dance, gaming..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Grid of Event Cards */}
      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 bg-white rounded-2xl text-slate-500 text-xs space-y-1">
          <p className="font-semibold text-slate-700">No events found matching your filter.</p>
          <p className="text-[11px] text-slate-400">
            Try a different search term or select &quot;All Arenas&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedCategory === 'INFORMALZ' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 md:p-6 w-full shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Informalz Day Pass Pricing Guide
              </h3>
              <p className="text-sm text-blue-800 mb-3 font-medium">
                Unlock the ultimate fun! Your pass gives you access to multiple events based on the day they are held:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-700">
                <li>
                  <strong className="font-bold text-blue-900">₹150</strong> — Choose any number of events held <strong className="font-bold">only on Day 1</strong>.
                </li>
                <li>
                  <strong className="font-bold text-blue-900">₹150</strong> — Choose any number of events held <strong className="font-bold">only on Day 2</strong>.
                </li>
                <li>
                  <strong className="font-bold text-blue-900">₹250</strong> — Choose events held on <strong className="font-bold">both days</strong> or a combination spanning both days.
                </li>
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
