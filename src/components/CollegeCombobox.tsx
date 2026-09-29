'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building2, Search, Plus, Check, ChevronDown, Info, X } from 'lucide-react';

interface CollegeComboboxProps {
  selectedCollege: string;
  onSelectCollege: (college: string) => void;
  disabled?: boolean;
}

export default function CollegeCombobox({
  selectedCollege,
  onSelectCollege,
  disabled = false,
}: CollegeComboboxProps) {
  const [colleges, setColleges] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch preloaded + existing registered colleges from API
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/colleges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.colleges)) {
          setColleges(data.colleges);
        }
      })
      .catch((err) => console.warn('Could not load colleges list:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredColleges = colleges.filter((c) =>
    c.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const exactMatchExists = colleges.some(
    (c) => c.trim().toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleSelect = (collegeName: string) => {
    onSelectCollege(collegeName);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleAddNew = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    onSelectCollege(trimmed);
    if (!colleges.includes(trimmed)) {
      setColleges((prev) => [trimmed, ...prev]);
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-2.5" ref={containerRef}>
      {/* Casing Guidance Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950">Institution Selection Guide: </span>
          Please select your college from the directory below or type to search. Ensure the official college name is entered with <strong>proper Upper/Lower case characters</strong> (e.g. <em>&quot;Lingaya&apos;s Vidyapeeth, Faridabad&quot;</em> or <em>&quot;Amity University, Noida&quot;</em>).
        </div>
      </div>

      {/* Selected College Card or Selection Input */}
      {selectedCollege ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Selected Institution
              </div>
              <div className="text-sm font-bold text-slate-900">{selectedCollege}</div>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onSelectCollege('');
                setIsOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              Change
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border ${
              isOpen ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' : 'border-slate-300 hover:border-slate-400'
            } cursor-pointer transition text-sm shadow-xs`}
          >
            <div className="flex items-center gap-2.5 text-slate-500">
              <Building2 className="w-4 h-4 text-[#1a73e8]" />
              <span>Select or search your College / University...</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
              {/* Live Search Input */}
              <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type college name (e.g. Lingaya, Amity, DTU)..."
                  className="w-full bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* College Options List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                {isLoading && (
                  <div className="p-4 text-center text-xs text-slate-500">Loading directory...</div>
                )}

                {!isLoading && filteredColleges.length === 0 && !searchQuery.trim() && (
                  <div className="p-4 text-center text-xs text-slate-400">No colleges found.</div>
                )}

                {/* Filtered Matches */}
                {filteredColleges.map((college) => (
                  <button
                    key={college}
                    type="button"
                    onClick={() => handleSelect(college)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-800 hover:text-[#1a73e8] hover:bg-blue-50 transition flex items-center justify-between group"
                  >
                    <span className="truncate pr-2 font-medium">{college}</span>
                    <Check className="w-3.5 h-3.5 text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                {/* "Add As New" Option */}
                {searchQuery.trim().length > 2 && !exactMatchExists && (
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-[#1a73e8] hover:bg-blue-50 border border-dashed border-blue-200 transition flex items-center gap-2 mt-1"
                  >
                    <Plus className="w-4 h-4 text-[#1a73e8] shrink-0" />
                    <span className="truncate">
                      Add <strong>&quot;{searchQuery.trim()}&quot;</strong> as new institution
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
